import path from 'path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import { createTray, notifyNewOrder, notifyStaffCall } from './tray';

const ADMIN_URL = process.env.ADMIN_URL ?? 'https://admin.tacomole.kr';
const isDev = process.env.NODE_ENV === 'development';
const START_URL = isDev ? (process.env.ADMIN_DEV_URL ?? 'http://localhost:3003') : ADMIN_URL;
const ALLOWED_ORIGIN = new URL(START_URL).origin;

let win: BrowserWindow | null = null;
let reconnectTimer: ReturnType<typeof setInterval> | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: '타코 관리자',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  win.loadURL(START_URL);

  win.once('ready-to-show', () => win?.show());

  // 창 닫기 → 트레이로 최소화 (앱 종료 아님)
  win.on('close', (event) => {
    if (!(app as AppWithQuit).isQuitting) {
      event.preventDefault();
      win?.hide();
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 메인 프레임이 허용 origin 밖으로 이동하려 하면 차단하고 외부 브라우저로 연다 (XSS/피싱 리다이렉트 방어)
  win.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin !== ALLOWED_ORIGIN) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // 인터넷 장애 등으로 admin 로드 실패 시 오프라인 화면 + 5초 주기 재연결
  win.webContents.on('did-fail-load', (_event, errorCode) => {
    if (errorCode === -3) return; // ERR_ABORTED (내부 취소)
    win?.loadFile(path.join(__dirname, '..', 'assets', 'offline.html'));
    if (!reconnectTimer) {
      reconnectTimer = setInterval(() => win?.loadURL(START_URL), 5000);
    }
  });

  win.webContents.on('did-finish-load', () => {
    const current = win?.webContents.getURL() ?? '';
    // admin 정상 로드(http + 허용 origin)일 때만 재연결 타이머 해제 (offline.html은 file:// 라 유지)
    if (current.startsWith('http') && new URL(current).origin === ALLOWED_ORIGIN && reconnectTimer) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    }
  });

  createTray(win);

  if (!isDev) {
    setupAutoUpdater();
  }
}

function setupAutoUpdater() {
  // 영업 피크타임 강제 다운로드/재시작 방지 — 자동 다운로드를 끄고 사용자 승인 후 진행
  autoUpdater.autoDownload = false;
  autoUpdater.checkForUpdates();

  autoUpdater.on('update-available', () => {
    win?.webContents.send('update-available');
  });

  autoUpdater.on('update-downloaded', () => {
    win?.webContents.send('update-downloaded');
  });
}

// IPC: 새 주문 알림
ipcMain.on('notify-new-order', (_event, payload: { orderNumber?: string; totalAmount?: number }) => {
  notifyNewOrder(payload);
  // 창이 숨겨진 상태면 트레이 플래시로 주의 환기
  if (win && !win.isVisible()) {
    win.flashFrame(true);
  }
});

// IPC: 직원 호출 알림
ipcMain.on('notify-staff-call', (_event, payload: { tableNumber?: number; callType?: string }) => {
  notifyStaffCall(payload);
  if (win && !win.isVisible()) {
    win.flashFrame(true);
  }
});

// IPC: 소리 재생 (브라우저 자동재생 차단 우회)
ipcMain.on('play-sound', (_event, _type: string) => {
  // shell.beep()은 시스템 기본음. 커스텀 음원이 필요하면 추후 play-sound 패키지 추가
  shell.beep();
});

// IPC: 업데이트 수동 다운로드/설치 (렌더러의 승인 UX 연계)
ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

// IPC: 무음 영수증 출력
ipcMain.handle('print-receipt', async () => {
  if (!win) return { success: false, message: '창을 찾을 수 없습니다.' };
  return new Promise<{ success: boolean; message?: string }>((resolve) => {
    win!.webContents.print(
      { silent: true, printBackground: false },
      (success, errorType) => {
        if (success) {
          resolve({ success: true });
        } else {
          resolve({ success: false, message: errorType ?? '출력 실패' });
        }
      }
    );
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  else win?.show();
});

app.on('before-quit', () => {
  (app as AppWithQuit).isQuitting = true;
});

type AppWithQuit = typeof app & { isQuitting: boolean };
