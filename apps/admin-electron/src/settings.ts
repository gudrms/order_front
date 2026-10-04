import fs from 'fs';
import path from 'path';
import { app } from 'electron';

/** 매장 PC마다 다른 설정 (계정이 아니라 이 PC에 저장) — %APPDATA%\타코 관리자\settings.json */
export type AppSettings = {
  /** 주문서를 보낼 영수증 프린터 이름 (webContents.getPrintersAsync의 name) */
  receiptPrinter?: string;
};

function getSettingsFile() {
  return path.join(app.getPath('userData'), 'settings.json');
}

export function loadSettings(): AppSettings {
  try {
    return JSON.parse(fs.readFileSync(getSettingsFile(), 'utf8')) as AppSettings;
  } catch {
    return {};
  }
}

export function saveSettings(patch: Partial<AppSettings>) {
  const next = { ...loadSettings(), ...patch };
  fs.mkdirSync(path.dirname(getSettingsFile()), { recursive: true });
  fs.writeFileSync(getSettingsFile(), JSON.stringify(next, null, 2));
  return next;
}

/** PDF·XPS·OneNote·팩스처럼 종이로 나가지 않는 프린터 — 무음 출력하면 저장 창이 뜬다 */
export function isVirtualPrinter(name: string) {
  return /pdf|xps|onenote|fax|팩스/i.test(name);
}
