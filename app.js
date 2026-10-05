import { SaberaClient } from "https://code4fukui.github.io/webglass-sdk/sabera.js";

const STORAGE_KEY = "glass-memo-notes";
const initialMemos = ["今日やることを\nひとつだけ書く"];
let memos = loadMemos();
let showingInitialMemo = !localStorage.getItem(STORAGE_KEY);
let currentIndex = 0;
let sabera = null;
let isConnected = false;

const memoCard = document.querySelector("#memoCard");
const memoText = document.querySelector("#memoText");
const memoIndex = document.querySelector("#memoIndex");
const memoInput = document.querySelector("#memoInput");
const memoCount = document.querySelector("#memoCount");
const memoList = document.querySelector("#memoList");
const syncMessage = document.querySelector("#syncMessage");
const connectButton = document.querySelector("#connectButton");
const connectionLabel = document.querySelector("#connectionLabel");

function loadMemos() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : [...initialMemos];
  } catch {
    return [...initialMemos];
  }
}

function saveMemos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
}

function render() {
  renderViewer();
  renderMemoList();
}

function renderViewer() {
  const memo = memos[currentIndex] ?? "メモがありません";
  memoText.textContent = memo;
  memoIndex.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(memos.length).padStart(2, "0")}`;
  memoCount.textContent = `${memos.length} MEMO${memos.length === 1 ? "" : "S"}`;
}

function renderMemoList() {
  memoList.replaceChildren();
  if (!memos.length) {
    const empty = document.createElement("p");
    empty.className = "memo-list-empty";
    empty.textContent = "メモを追加すると、ここに表示されます";
    memoList.append(empty);
    return;
  }
  memos.forEach((memo, index) => {
    const row = document.createElement("div");
    row.className = "memo-row";

    const editor = document.createElement("textarea");
    editor.rows = 2;
    editor.maxLength = 120;
    editor.value = memo;
    editor.setAttribute("aria-label", `メモ ${index + 1}`);
    editor.addEventListener("focus", () => {
      currentIndex = index;
      renderViewer();
    });
    editor.addEventListener("input", () => {
      memos[index] = editor.value;
      currentIndex = index;
      showingInitialMemo = false;
      saveMemos();
      renderViewer();
    });
    editor.addEventListener("blur", sendCurrentMemo);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.title = "このメモを削除";
    deleteButton.setAttribute("aria-label", `メモ ${index + 1} を削除`);
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", () => deleteMemo(index));

    row.append(editor, deleteButton);
    memoList.append(row);
  });
}

function deleteMemo(index) {
  memos.splice(index, 1);
  if (currentIndex >= memos.length) currentIndex = Math.max(0, memos.length - 1);
  saveMemos();
  render();
  syncMessage.textContent = "メモを削除しました";
  sendCurrentMemo();
}

async function sendCurrentMemo() {
  if (!isConnected) return;
  try {
    await sabera.showScreen(0x47);
    await sabera.sendText(memos[currentIndex]);
    syncMessage.textContent = "グラスに表示しました";
  } catch (error) {
    console.error(error);
    syncMessage.textContent = "グラスへの送信に失敗しました";
  }
}

function nextMemo() {
  if (memos.length < 2) {
    syncMessage.textContent = "メモを追加すると、タップで切り替わります";
    return;
  }
  currentIndex = (currentIndex + 1) % memos.length;
  render();
  sendCurrentMemo();
}

function isGlassSingleTap(detail) {
  if (!detail) return false;
  const bytes = detail instanceof DataView
    ? new Uint8Array(detail.buffer, detail.byteOffset, detail.byteLength)
    : detail instanceof ArrayBuffer
    ? new Uint8Array(detail)
    : detail instanceof Uint8Array
    ? detail
    : null;
  // SABERA input notification: command 0x82, TLV type 1, key 1 = single tap.
  return Boolean(bytes && bytes.length >= 9 && bytes[0] === 1 && bytes[1] === 0x82 &&
    bytes[2] === 0x80 && bytes[5] === 1 && bytes[6] === 1 && bytes[7] === 0 &&
    bytes[8] === 1);
}

function handleGlassData(event) {
  if (!isGlassSingleTap(event.detail)) return;
  nextMemo();
  syncMessage.textContent = "グラスのタップで切り替えました";
}

function addMemo() {
  const value = memoInput.value.trim();
  if (!value) return;
  if (showingInitialMemo) {
    memos = [];
    showingInitialMemo = false;
  }
  memos.push(value);
  currentIndex = memos.length - 1;
  memoInput.value = "";
  saveMemos();
  render();
  syncMessage.textContent = "追加しました。カードをタップして切り替え";
  sendCurrentMemo();
}

async function connectGlass() {
  if (isConnected) {
    await sabera.disconnect();
    isConnected = false;
    document.body.classList.remove("connected");
    connectionLabel.textContent = "グラスに接続";
    syncMessage.textContent = "グラスとの接続を解除しました";
    return;
  }
  try {
    connectButton.disabled = true;
    connectionLabel.textContent = "接続中…";
    sabera = new SaberaClient();
    sabera.addEventListener("data", handleGlassData);
    await sabera.connect();
    isConnected = true;
    document.body.classList.add("connected");
    connectionLabel.textContent = "接続済み";
    syncMessage.textContent = "タップしたメモをグラスに表示します";
    await sendCurrentMemo();
  } catch (error) {
    console.error(error);
    sabera = null;
    connectionLabel.textContent = "グラスに接続";
    syncMessage.textContent = "接続できませんでした。対応ブラウザを確認してください";
  } finally {
    connectButton.disabled = false;
  }
}

memoCard.addEventListener("click", nextMemo);
document.querySelector("#addButton").addEventListener("click", addMemo);
memoInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") addMemo();
});
document.querySelector("#clearButton").addEventListener("click", () => {
  if (!confirm("すべてのメモを削除しますか？")) return;
  memos = [];
  showingInitialMemo = false;
  currentIndex = 0;
  saveMemos();
  render();
  syncMessage.textContent = "メモを削除しました";
});
connectButton.addEventListener("click", connectGlass);

render();
