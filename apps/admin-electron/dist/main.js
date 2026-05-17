"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const tray_1 = require("./tray");
const ADMIN_URL = process.env.ADMIN_URL ?? 'https://admin.tacomole.kr';
const isDev = process.env.NODE_ENV === 'development';
let win = null;
function createWindow() {
    win = new electron_1.BrowserWindow({
        width: 1280,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: '타코 관리자',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: false,
    });
    win.loadURL(isDev ? (process.env.ADMIN_DEV_URL ?? 'http://localhost:3003') : ADMIN_URL);
    win.once('ready-to-show', () => win?.show());
    // 창 닫기 → 트레이로 최소화 (앱 종료 아님)
    win.on('close', (event) => {
        if (!electron_1.app.isQuitting) {
            event.preventDefault();
            win?.hide();
        }
    });
    win.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    (0, tray_1.createTray)(win);
    if (!isDev) {
        setupAutoUpdater();
    }
}
function setupAutoUpdater() {
    electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
    electron_updater_1.autoUpdater.on('update-available', () => {
        win?.webContents.send('update-available');
    });
    electron_updater_1.autoUpdater.on('update-downloaded', () => {
        win?.webContents.send('update-downloaded');
    });
}
// IPC: 새 주문 알림
electron_1.ipcMain.on('notify-new-order', (_event, payload) => {
    (0, tray_1.notifyNewOrder)(payload);
    // 창이 숨겨진 상태면 트레이 플래시로 주의 환기
    if (win && !win.isVisible()) {
        win.flashFrame(true);
    }
});
// IPC: 직원 호출 알림
electron_1.ipcMain.on('notify-staff-call', (_event, payload) => {
    (0, tray_1.notifyStaffCall)(payload);
    if (win && !win.isVisible()) {
        win.flashFrame(true);
    }
});
// IPC: 소리 재생 (브라우저 자동재생 차단 우회)
electron_1.ipcMain.on('play-sound', (_event, _type) => {
    // shell.beep()은 시스템 기본음. 커스텀 음원이 필요하면 추후 play-sound 패키지 추가
    electron_1.shell.beep();
});
// IPC: 무음 영수증 출력
electron_1.ipcMain.handle('print-receipt', async () => {
    if (!win)
        return { success: false, message: '창을 찾을 수 없습니다.' };
    return new Promise((resolve) => {
        win.webContents.print({ silent: true, printBackground: false }, (success, errorType) => {
            if (success) {
                resolve({ success: true });
            }
            else {
                resolve({ success: false, message: errorType ?? '출력 실패' });
            }
        });
    });
});
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createWindow();
    else
        win?.show();
});
electron_1.app.on('before-quit', () => {
    electron_1.app.isQuitting = true;
});
