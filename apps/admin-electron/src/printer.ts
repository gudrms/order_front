import { BrowserWindow } from 'electron';
import { log } from './logger';
import { isVirtualPrinter, loadSettings } from './settings';

export type PrintResult = { success: boolean; message?: string };

export const NO_PRINTER_MESSAGE = '영수증 프린터를 선택해 주세요. 상단 메뉴 [설정] → [영수증 프린터]';

/**
 * 출력할 프린터를 정한다. 저장된 영수증 프린터가 우선이고,
 * 없으면 Windows 기본 프린터를 쓰되 PDF 같은 가상 프린터면 쓰지 않는다 (저장 창이 떠서 영업 중 흐름이 끊긴다).
 */
export async function resolveReceiptPrinter(win: BrowserWindow, requested?: string): Promise<string | null> {
  const printers = await win.webContents.getPrintersAsync();
  const saved = requested ?? loadSettings().receiptPrinter;
  if (saved && printers.some((printer) => printer.name === saved)) return saved;
  if (saved) log('WARN', 'saved receipt printer not found', { saved });

  const fallback = printers.find((printer) => printer.isDefault);
  if (fallback && !isVirtualPrinter(fallback.name)) return fallback.name;
  return null;
}

/** 지정한 창의 내용을 프린터로 무음 출력 (15초 응답 없으면 실패) */
export function silentPrint(target: BrowserWindow, deviceName: string): Promise<PrintResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: PrintResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    // 프린터가 응답하지 않을 때 무한 대기 방지
    const timer = setTimeout(() => {
      log('ERROR', 'receipt print timeout (15s)', { deviceName });
      finish({ success: false, message: '출력 시간 초과(15초)' });
    }, 15000);
    target.webContents.print({ silent: true, printBackground: false, deviceName }, (success, errorType) => {
      clearTimeout(timer);
      if (success) log('INFO', 'receipt printed', { deviceName });
      else log('ERROR', 'receipt print failed', { errorType, deviceName });
      finish(success ? { success: true } : { success: false, message: errorType ?? '출력 실패' });
    });
  });
}

/** 프린터 설정 확인용 시험 영수증 (80mm) */
export async function printTestReceipt(deviceName: string): Promise<PrintResult> {
  const page = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @page { size: 80mm auto; margin: 0; }
      body { width: 72mm; margin: 4mm; font-family: 'Malgun Gothic', sans-serif; font-size: 12px; }
      h1 { font-size: 18px; text-align: center; margin: 0 0 8px; }
      hr { border: 0; border-top: 1px dashed #000; }
    </style></head><body>
      <h1>테스트 인쇄</h1>
      <hr><p>타코 관리자 PC 앱</p><p>프린터: ${deviceName.replace(/</g, '&lt;')}</p>
      <p>${new Date().toLocaleString('ko-KR')}</p><hr>
      <p>이 종이가 나오면 주문서도 이 프린터로 출력됩니다.</p>
    </body></html>`;
    await page.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    return await silentPrint(page, deviceName);
  } finally {
    page.destroy();
  }
}
