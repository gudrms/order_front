import path from 'path';
import { BrowserWindow, Menu, NativeImage, nativeImage, Notification, shell, Tray } from 'electron';

let tray: Tray | null = null;

export function createTray(win: BrowserWindow): Tray {
  const iconPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');
  let icon: NativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('타코 관리자');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '관리자 열기',
      click: () => {
        win.show();
        win.focus();
      },
    },
    { type: 'separator' },
    {
      label: '공식 사이트',
      click: () => shell.openExternal('https://tacomole.kr'),
    },
    { type: 'separator' },
    {
      label: '종료',
      click: () => {
        tray?.destroy();
        win.destroy();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    win.show();
    win.focus();
  });

  return tray;
}

export function notifyNewOrder(payload: { orderNumber?: string; totalAmount?: number }) {
  if (!Notification.isSupported()) return;
  const notification = new Notification({
    title: '새 주문',
    body: payload.orderNumber
      ? `주문번호 ${payload.orderNumber}${payload.totalAmount ? ` · ${payload.totalAmount.toLocaleString()}원` : ''}`
      : '새 주문이 접수되었습니다.',
    icon: path.join(__dirname, '..', 'assets', 'tray-icon.png'),
    silent: false,
  });
  notification.show();
}

export function notifyStaffCall(payload: { tableNumber?: number; callType?: string }) {
  if (!Notification.isSupported()) return;
  const notification = new Notification({
    title: '직원 호출',
    body: payload.tableNumber
      ? `${payload.tableNumber}번 테이블에서 직원을 호출했습니다.`
      : '직원 호출이 있습니다.',
    icon: path.join(__dirname, '..', 'assets', 'tray-icon.png'),
    urgency: 'critical',
    silent: false,
  });
  notification.show();
}
