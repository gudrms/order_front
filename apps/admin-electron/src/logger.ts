import fs from 'fs';
import path from 'path';
import { app } from 'electron';

/**
 * 매장 PC에서 문제가 생겼을 때 원인을 볼 수 있도록 파일에 로그를 남긴다.
 * 위치: %APPDATA%\타코 관리자\logs\main.log (메뉴 [도움말] → [로그 폴더 열기])
 * 5MB를 넘으면 main.old.log로 넘기고 새로 쓴다.
 */
const MAX_BYTES = 5 * 1024 * 1024;

export function getLogDir() {
  return app.getPath('logs');
}

export function getLogFile() {
  return path.join(getLogDir(), 'main.log');
}

function rotateIfNeeded(file: string) {
  try {
    if (fs.statSync(file).size > MAX_BYTES) {
      fs.renameSync(file, path.join(path.dirname(file), 'main.old.log'));
    }
  } catch {
    // 파일이 아직 없으면 무시
  }
}

export function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, detail?: unknown) {
  const line = `[${new Date().toISOString()}] [${level}] ${message}${
    detail === undefined ? '' : ` ${detail instanceof Error ? detail.stack ?? detail.message : JSON.stringify(detail)}`
  }\n`;
  try {
    const file = getLogFile();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    rotateIfNeeded(file);
    fs.appendFileSync(file, line);
  } catch {
    // 로그 실패가 앱 동작을 막으면 안 된다
  }
  if (level === 'ERROR') console.error(line.trim());
  else console.log(line.trim());
}
