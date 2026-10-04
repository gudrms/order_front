import fs from 'fs';
import path from 'path';
import { app } from 'electron';

/** 매장 PC마다 다른 설정 (계정이 아니라 이 PC에 저장) — %APPDATA%\타코 관리자\settings.json */
export type AppSettings = {
  /**
   * 출력 방식. windows = Windows에 설치된 프린터(드라이버 필요),
   * serial = COM 포트로 직접 (드라이버 없이 기존 주문 프로그램들과 같은 방식)
   */
  printMode?: 'windows' | 'serial';
  /** windows 방식: 주문서를 보낼 프린터 이름 (webContents.getPrintersAsync의 name) */
  receiptPrinter?: string;
  /** serial 방식: COM 포트 (예: COM1) */
  serialPort?: string;
  /** serial 방식: 통신 속도 */
  baudRate?: number;
};

export const DEFAULT_BAUD_RATE = 9600;
export const BAUD_RATES = [9600, 19200, 38400, 57600, 115200];

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
