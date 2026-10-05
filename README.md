# Glass Memo

ブラウザでメモを作成し、カードまたはSABERAグラスのタップでメモを切り替えるシンプルなメモアプリです。

Create notes in your browser and switch between them by tapping the memo card or the SABERA glasses.

## Features / 機能

- メモの追加・編集・削除 / Add, edit, and delete memos
- メモを `localStorage` に保存 / Save memos in `localStorage`
- ブラウザのカードタップで次のメモへ切り替え / Tap the browser card to show the next memo
- Glass側のシングルタップで次のメモへ切り替え / Single-tap the glasses to show the next memo
- 接続中は表示中のメモをSABERAへ送信 / Send the current memo to SABERA when connected
- 初期メモは最初のメモ追加時に置き換え / Replace the starter memo when the first memo is added

## Run / 起動

Serve the files from `localhost` or an HTTPS site. Web Bluetooth does not work when opening `index.html` directly.

`localhost` またはHTTPSでファイルを配信してください。`index.html` を直接開いた場合、Web Bluetoothは利用できません。

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000/> in a Web Bluetooth-compatible browser such as Chrome or Edge.

Web Bluetooth対応ブラウザ（Chrome、Edgeなど）で <http://localhost:8000/> を開きます。

## Usage / 使い方

1. Enter text in 「新しいメモ」 and click 「追加」.
2. Tap the large memo card to move to the next memo.
3. Edit a memo directly in 「メモ一覧」. Changes are saved automatically.
4. Click `×` to delete an individual memo, or 「すべて削除」 to clear all memos.
5. Click 「グラスに接続」 and select the SABERA device.
6. After connecting, a single tap on the glasses changes the memo and sends it to the display.

## SDK / SDKについて

This app imports the browser ES module from [code4fukui/webglass-sdk](https://github.com/code4fukui/webglass-sdk):

```js
import { SaberaClient } from
  "https://code4fukui.github.io/webglass-sdk/sabera.js";
```

It uses `SaberaClient.connect()`, `showScreen(0x47)`, and `sendText()` for display output. The SDK `data` event is used to detect the SABERA single-tap notification.

表示には `SaberaClient.connect()`、`showScreen(0x47)`、`sendText()` を使用しています。SABERAからのシングルタップ通知はSDKの `data` イベントで検知しています。

## Requirements / 必要条件

- SABERA glasses and Bluetooth enabled / SABERAグラスとBluetooth
- Chromium-based browser with Web Bluetooth / Web Bluetooth対応Chromium系ブラウザ
- HTTPS or `localhost` / HTTPSまたは `localhost`

The memo UI can be used without connecting the glasses. Glass integration requires a compatible device and browser.

グラスに接続しなくてもメモ機能は利用できます。Glass連携には対応デバイスと対応ブラウザが必要です。

## Files / ファイル構成

- `index.html` — application markup / 画面構造
- `style.css` — responsive styling / レスポンシブなスタイル
- `app.js` — memo state, storage, and SABERA integration / メモ管理・保存・SABERA連携
