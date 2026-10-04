import path from 'path';
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import { createTray, notifyNewOrder, notifyStaffCall } from './tray';
import { log } from './logger';
import { setupAppMenu } from './menu';

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
      // 트레이에 숨어 있어도 새 주문 확인(주기 조회)과 알람이 멈추지 않게 한다
      backgroundThrottling: false,
      // 클릭 없이도 알림음을 낼 수 있게 한다 (브라우저 자동재생 제한 해제)
      autoplayPolicy: 'no-user-gesture-required',
    },
    show: false,
  });

  log('INFO', `app start v${app.getVersion()}`, { url: START_URL });
  setupAppMenu(win, START_URL);
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
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return; // ERR_ABORTED (내부 취소)
    log('WARN', 'page load failed', { errorCode, errorDescription, url: validatedURL });
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

  // 화면(렌더러) 쪽 경고·에러와 멈춤·비정상 종료를 로그에 남긴다
  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (level >= 2) log(level >= 3 ? 'ERROR' : 'WARN', `[renderer] ${message}`, { source: sourceId, line });
  });
  win.webContents.on('render-process-gone', (_event, details) => log('ERROR', 'renderer process gone', details));
  win.on('unresponsive', () => log('WARN', 'window unresponsive'));

  createTray(win);

  if (!isDev) {
    setupAutoUpdater();
  }
}

function setupAutoUpdater() {
  // 영업 피크타임 강제 다운로드/재시작 방지 — 자동 다운로드를 끄고 사용자 승인 후 진행
  autoUpdater.autoDownload = false;
  autoUpdater.checkForUpdates();

  // 관리자 웹에는 업데이트 안내 화면이 없어 앱이 직접 물어본다 (영업 중 강제 재시작이 없도록 매번 승인)
  autoUpdater.on('error', (error) => log('ERROR', 'auto update failed', error));
  autoUpdater.on('update-available', async (info) => {
    log('INFO', 'update available', { version: info.version });
    win?.webContents.send('update-available');
    const { response } = await dialog.showMessageBox({
      type: 'info',
      title: '타코 관리자 업데이트',
      message: `새 버전(${info.version})이 있습니다. 지금 받을까요?`,
      detail: '받는 동안에도 계속 사용할 수 있습니다. 설치는 다 받은 뒤 다시 물어봅니다.',
      buttons: ['지금 받기', '나중에'],
      defaultId: 0,
      cancelId: 1,
    });
    if (response === 0) void autoUpdater.downloadUpdate();
  });

  autoUpdater.on('update-downloaded', async (info) => {
    log('INFO', 'update downloaded', { version: info.version });
    win?.webContents.send('update-downloaded');
    const { response } = await dialog.showMessageBox({
      type: 'info',
      title: '타코 관리자 업데이트',
      message: `새 버전(${info.version})을 설치할 준비가 됐습니다.`,
      detail: '지금 재시작하면 설치됩니다. [나중에]를 누르면 앱을 종료할 때 자동으로 설치됩니다.',
      buttons: ['재시작하여 설치', '나중에'],
      defaultId: 1,
      cancelId: 1,
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });
}

// IPC: 새 주문 알림
ipcMain.on('notify-new-order', (_event, payload: { orderNumber?: string; totalAmount?: number }) => {
  log('INFO', 'new order alert', payload);
  notifyNewOrder(payload);
  // 트레이에 숨어 있거나 최소화돼 있으면 창을 앞으로 띄워 접수를 놓치지 않게 한다
  if (win) {
    if (win.isMinimized()) win.restore();
    if (!win.isVisible()) win.show();
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

// IPC: 사용 가능한 프린터 목록 (다중 프린터 환경 타겟팅용)
ipcMain.handle('get-printers', async () => {
  if (!win) return [];
  return win.webContents.getPrintersAsync();
});

// IPC: 무음 영수증 출력 (특정 프린터 지정 + 15초 타임아웃)
ipcMain.handle('print-receipt', async (_event, options?: { deviceName?: string }) => {
  if (!win) return { success: false, message: '창을 찾을 수 없습니다.' };
  return new Promise<{ success: boolean; message?: string }>((resolve) => {
    let settled = false;
    const finish = (result: { success: boolean; message?: string }) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    // 프린터가 응답하지 않을 때 무한 대기 방지
    const timer = setTimeout(
      () => {
        log('ERROR', 'receipt print timeout (15s)');
        finish({ success: false, message: '출력 시간 초과(15초)' });
      },
      15000
    );
    win!.webContents.print(
      { silent: true, printBackground: false, deviceName: options?.deviceName },
      (success, errorType) => {
        clearTimeout(timer);
        if (success) log('INFO', 'receipt printed', { deviceName: options?.deviceName ?? '(기본 프린터)' });
        else log('ERROR', 'receipt print failed', { errorType, deviceName: options?.deviceName ?? '(기본 프린터)' });
        finish(success ? { success: true } : { success: false, message: errorType ?? '출력 실패' });
      }
    );
  });
});

process.on('uncaughtException', (error) => log('ERROR', 'uncaught exception', error));
process.on('unhandledRejection', (reason) => log('ERROR', 'unhandled rejection', reason));

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
