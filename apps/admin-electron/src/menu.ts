import { app, BrowserWindow, dialog, Menu, shell, type MenuItemConstructorOptions } from 'electron';
import { autoUpdater } from 'electron-updater';
import { getLogDir, getLogFile, log } from './logger';
import { BAUD_RATES, DEFAULT_BAUD_RATE, isVirtualPrinter, loadSettings, saveSettings } from './settings';
import { printTestReceipt, type PrintResult } from './printer';
import { buildEscPosReceipt, sampleReceipt } from './receipt';
import { listSerialPorts, printViaSerial } from './serialPrinter';

/**
 * 상단 메뉴 — 매장에서 화면이 이상할 때 새로고침하고, 주문서 출력 방식·프린터를 고르고,
 * 문제 원인을 보기 위한 개발자 도구·로그를 연다.
 * 프린터·포트 목록이 바뀌거나 선택을 바꾸면 다시 만든다.
 */
export async function setupAppMenu(win: BrowserWindow, startUrl: string) {
  const rebuild = () => void setupAppMenu(win, startUrl);
  const printers = await win.webContents.getPrintersAsync().catch(() => []);
  const serialPorts = await listSerialPorts();
  const settings = loadSettings();
  const selectedPrinter = settings.receiptPrinter;
  const isSerial = settings.printMode === 'serial';
  const baudRate = settings.baudRate ?? DEFAULT_BAUD_RATE;
  const outputLabel = isSerial
    ? `COM 포트 ${settings.serialPort ?? '(선택 안 됨)'} · ${baudRate}`
    : `Windows 프린터 ${selectedPrinter ?? '(선택 안 됨)'}`;

  const choose = (patch: Parameters<typeof saveSettings>[0], message: string) => () => {
    saveSettings(patch);
    log('INFO', message, patch);
    rebuild();
  };

  const printerItems: MenuItemConstructorOptions[] = printers.length
    ? printers.map((printer) => ({
        label: `${printer.displayName || printer.name}${isVirtualPrinter(printer.name) ? ' (가상 프린터·종이 안 나옴)' : ''}${printer.isDefault ? ' · Windows 기본' : ''}`,
        type: 'radio',
        checked: printer.name === selectedPrinter,
        click: choose({ receiptPrinter: printer.name }, 'receipt printer selected'),
      }))
    : [{ label: '연결된 프린터가 없습니다', enabled: false }];

  const serialItems: MenuItemConstructorOptions[] = serialPorts.length
    ? serialPorts.map((portPath) => ({
        label: portPath,
        type: 'radio',
        checked: portPath === settings.serialPort,
        click: choose({ serialPort: portPath }, 'serial port selected'),
      }))
    : [{ label: 'COM 포트가 없습니다', enabled: false }];

  const runTestPrint = async () => {
    let result: PrintResult;
    if (isSerial) {
      if (!settings.serialPort) return;
      result = await printViaSerial(settings.serialPort, baudRate, buildEscPosReceipt(sampleReceipt()));
    } else {
      if (!selectedPrinter) return;
      result = await printTestReceipt(selectedPrinter);
    }
    const lines = [
      result.success ? '' : result.message ?? '',
      `출력: ${outputLabel}`,
      isSerial ? '종이가 안 나오거나 글자가 깨지면 통신 속도를 기존 프로그램과 같게 바꿔 보세요.' : '',
    ].filter(Boolean);
    void dialog.showMessageBox(win, {
      type: result.success ? 'info' : 'error',
      message: result.success ? '테스트 인쇄를 보냈습니다.' : '테스트 인쇄에 실패했습니다.',
      detail: lines.join('\n'),
    });
  };

  const menu = Menu.buildFromTemplate([
    {
      label: '설정',
      submenu: [
        {
          label: `출력 방식: ${isSerial ? 'COM 포트 직접' : 'Windows 프린터'}`,
          submenu: [
            {
              label: 'COM 포트 직접 (기존 주문 프로그램과 같은 방식, 드라이버 불필요)',
              type: 'radio',
              checked: isSerial,
              click: choose({ printMode: 'serial' }, 'print mode selected'),
            },
            {
              label: 'Windows 프린터 (드라이버가 설치된 프린터)',
              type: 'radio',
              checked: !isSerial,
              click: choose({ printMode: 'windows' }, 'print mode selected'),
            },
          ],
        },
        { type: 'separator' },
        {
          label: `COM 포트${settings.serialPort ? `: ${settings.serialPort}` : ' (선택 안 됨)'}`,
          enabled: isSerial,
          submenu: [...serialItems, { type: 'separator' }, { label: '포트 목록 새로고침', click: rebuild }],
        },
        {
          label: `통신 속도: ${baudRate}`,
          enabled: isSerial,
          submenu: BAUD_RATES.map((rate) => ({
            label: String(rate),
            type: 'radio' as const,
            checked: rate === baudRate,
            click: choose({ baudRate: rate }, 'baud rate selected'),
          })),
        },
        {
          label: `영수증 프린터${selectedPrinter ? '' : ' (선택 안 됨)'}`,
          enabled: !isSerial,
          submenu: [...printerItems, { type: 'separator' }, { label: '프린터 목록 새로고침', click: rebuild }],
        },
        { type: 'separator' },
        {
          label: '테스트 인쇄',
          enabled: isSerial ? !!settings.serialPort : !!selectedPrinter,
          click: () => void runTestPrint(),
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
              detail: `접속 주소: ${startUrl}\n출력: ${outputLabel}\n로그 위치: ${getLogFile()}`,
            }),
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}
