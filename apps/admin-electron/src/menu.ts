import { app, BrowserWindow, dialog, Menu, shell, type MenuItemConstructorOptions } from 'electron';
import { autoUpdater } from 'electron-updater';
import { getLogDir, getLogFile, log } from './logger';
import { isVirtualPrinter, loadSettings, saveSettings } from './settings';
import { printTestReceipt } from './printer';

/**
 * 상단 메뉴 — 매장에서 화면이 이상할 때 새로고침하고, 영수증 프린터를 고르고,
 * 문제 원인을 보기 위한 개발자 도구·로그를 연다.
 * 프린터 목록이 바뀌거나 선택을 바꾸면 다시 만든다.
 */
export async function setupAppMenu(win: BrowserWindow, startUrl: string) {
  const rebuild = () => void setupAppMenu(win, startUrl);
  const printers = await win.webContents.getPrintersAsync().catch(() => []);
  const selected = loadSettings().receiptPrinter;

  const printerItems: MenuItemConstructorOptions[] = printers.length
    ? printers.map((printer) => ({
        label: `${printer.displayName || printer.name}${isVirtualPrinter(printer.name) ? ' (가상 프린터·종이 안 나옴)' : ''}${printer.isDefault ? ' · Windows 기본' : ''}`,
        type: 'radio',
        checked: printer.name === selected,
        click: () => {
          saveSettings({ receiptPrinter: printer.name });
          log('INFO', 'receipt printer selected', { name: printer.name });
          rebuild();
        },
      }))
    : [{ label: '연결된 프린터가 없습니다', enabled: false }];

  const menu = Menu.buildFromTemplate([
    {
      label: '설정',
      submenu: [
        {
          label: `영수증 프린터${selected ? '' : ' (선택 안 됨)'}`,
          submenu: [
            ...printerItems,
            { type: 'separator' },
            { label: '프린터 목록 새로고침', click: rebuild },
          ],
        },
        {
          label: '테스트 인쇄',
          enabled: !!selected,
          click: async () => {
            if (!selected) return;
            const result = await printTestReceipt(selected);
            void dialog.showMessageBox(win, {
              type: result.success ? 'info' : 'error',
              message: result.success ? '테스트 인쇄를 보냈습니다.' : '테스트 인쇄에 실패했습니다.',
              detail: result.success ? `프린터: ${selected}` : `${result.message ?? ''}\n프린터: ${selected}`,
            });
          },
        },
      ],
    },
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
              detail: `접속 주소: ${startUrl}\n영수증 프린터: ${selected ?? '선택 안 됨'}\n로그 위치: ${getLogFile()}`,
            }),
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}
