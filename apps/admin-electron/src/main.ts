import path from 'path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import { createTray, notifyNewOrder, notifyStaffCall } from './tray';

const ADMIN_URL = process.env.ADMIN_URL ?? 'https://admin.tacomole.kr';
const isDev = process.env.NODE_ENV === 'development';

let win: BrowserWindow | null = null;

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

  win.loadURL(isDev ? (process.env.ADMIN_DEV_URL ?? 'http://localhost:3003') : ADMIN_URL);

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

  createTray(win);

  if (!isDev) {
    setupAutoUpdater();
  }
}

function setupAutoUpdater() {
  autoUpdater.checkForUpdatesAndNotify();

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
