import { SerialPort } from 'serialport';
import { log } from './logger';
import type { PrintResult } from './printer';

/** 이 PC의 COM 포트 목록 (기존 주문 프로그램들이 쓰는 그 포트) */
export async function listSerialPorts(): Promise<string[]> {
  try {
    const ports = await SerialPort.list();
    return ports.map((port) => port.path).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch (error) {
    log('ERROR', 'serial port list failed', error);
    return [];
  }
}

/**
 * COM 포트로 영수증 명령을 직접 보낸다.
 * 다른 주문 프로그램들도 같은 포트를 쓰므로, 출력할 때만 열고 바로 닫는다.
 */
export function printViaSerial(path: string, baudRate: number, data: Buffer): Promise<PrintResult> {
  return new Promise((resolve) => {
    let settled = false;
    const port = new SerialPort({ path, baudRate, autoOpen: false });

    const finish = (result: PrintResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (port.isOpen) port.close(() => resolve(result));
      else resolve(result);
    };

    const timer = setTimeout(() => {
      log('ERROR', 'serial print timeout (10s)', { path, baudRate });
      finish({ success: false, message: `${path} 출력 시간 초과(10초)` });
    }, 10000);

    port.open((openError) => {
      if (openError) {
        log('ERROR', 'serial port open failed', { path, baudRate, message: openError.message });
        const busy = /access denied|busy|in use/i.test(openError.message);
        finish({
          success: false,
          message: busy
            ? `${path}를 다른 프로그램이 쓰고 있습니다. 잠시 후 [출력]을 다시 눌러 주세요.`
            : `${path}를 열 수 없습니다 (${openError.message})`,
        });
        return;
      }
      port.write(data, (writeError) => {
        if (writeError) {
          log('ERROR', 'serial write failed', { path, message: writeError.message });
          finish({ success: false, message: `${path} 출력 실패 (${writeError.message})` });
          return;
        }
        // 버퍼가 프린터로 다 넘어간 뒤에 닫아야 끝부분이 잘리지 않는다
        port.drain(() => {
          log('INFO', 'receipt printed via serial', { path, baudRate, bytes: data.length });
          finish({ success: true });
        });
      });
    });
  });
}
