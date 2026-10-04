import { app, BrowserWindow, dialog, Menu, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import { getLogDir, getLogFile, log } from './logger';

/** 상단 메뉴 — 매장에서 화면이 이상할 때 새로고침하고, 문제 원인을 보기 위한 개발자 도구·로그를 연다 */
export function setupAppMenu(win: BrowserWindow, startUrl: string) {
  const menu = Menu.buildFromTemplate([
    {
      label: '보기',
      submenu: [
        { label: '새로고침', accelerator: 'CmdOrCtrl+R', click: () => win.webContents.reload() },
        {
          label: '강력 새로고침 (캐시 무시)',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => win.webContents.reloadIgnoringCache(),
        },
        { type: 'separator' },
        { label: '확대', role: 'zoomIn', accelerator: 'CmdOrCtrl+=' },
        { label: '축소', role: 'zoomOut' },
        { label: '원래 크기', role: 'resetZoom' },
        { type: 'separator' },
        { label: '전체 화면', role: 'togglefullscreen' },
      ],
    },
    {
      label: '도움말',
      submenu: [
        {
          label: '개발자 도구',
          accelerator: 'F12',
          click: () => win.webContents.toggleDevTools(),
        },
        { label: '로그 폴더 열기', click: () => void shell.openPath(getLogDir()) },
        { label: '로그 파일 열기', click: () => void shell.openPath(getLogFile()) },
        { type: 'separator' },
        {
          label: '업데이트 확인',
          click: () => {
            log('INFO', 'manual update check');
            autoUpdater.checkForUpdates().catch((error) => {
              log('ERROR', 'manual update check failed', error);
              void dialog.showMessageBox(win, { type: 'error', message: '업데이트 확인에 실패했습니다.', detail: String(error) });
            });
          },
        },
        {
          label: '버전 정보',
          click: () =>
            void dialog.showMessageBox(win, {
              type: 'info',
              title: '타코 관리자',
              message: `타코 관리자 PC 앱 ${app.getVersion()}`,
              detail: `접속 주소: ${startUrl}\n로그 위치: ${getLogFile()}`,
            }),
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}
