import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const FRONTEND_DIR = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

// テストスイート全体で同じjsファイルが何度も読み込まれるため、内容をキャッシュして
// 無駄なディスクI/Oを避ける(ファイル内容はテスト実行中に変わらない前提)。
const fileCache = new Map();
function readScriptFile(fileName) {
  if (!fileCache.has(fileName)) {
    fileCache.set(fileName, fs.readFileSync(path.join(FRONTEND_DIR, fileName), "utf-8"));
  }
  return fileCache.get(fileName);
}

// 本番コードはscriptタグでのグローバル読み込み前提(ES Modules未使用)のため、
// jsdomのrunScripts:"dangerously"で実際のブラウザのscriptタグ実行を再現する。
// これによりプロダクションコードを一切変更せずにテストできる。
export function loadScripts(fileNames, { bodyHtml = "", url = "http://localhost/" } = {}) {
  const scripts = fileNames
    .map((name) => readScriptFile(name))
    .map((code) => `<script>${code}</script>`)
    .join("\n");

  const html = `<!doctype html><html><body>${bodyHtml}${scripts}</body></html>`;

  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url,
  });

  return dom;
}

// timeline.js等の画面スクリプトは即時実行(IIFE的)でDOM要素・window.fetch等のモックが
// 先に揃っている必要があるため、既存のdomに対して後から1ファイルずつ実行できるようにする。
export function runScript(dom, fileName) {
  const scriptEl = dom.window.document.createElement("script");
  scriptEl.textContent = readScriptFile(fileName);
  dom.window.document.body.appendChild(scriptEl);
}
