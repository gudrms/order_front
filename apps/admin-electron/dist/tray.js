"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTray = createTray;
exports.notifyNewOrder = notifyNewOrder;
exports.notifyStaffCall = notifyStaffCall;
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
let tray = null;
function createTray(win) {
    const iconPath = path_1.default.join(__dirname, '..', 'assets', 'tray-icon.png');
    let icon;
    try {
        icon = electron_1.nativeImage.createFromPath(iconPath);
        if (icon.isEmpty()) {
            icon = electron_1.nativeImage.createEmpty();
        }
    }
    catch {
        icon = electron_1.nativeImage.createEmpty();
    }
    tray = new electron_1.Tray(icon);
    tray.setToolTip('타코 관리자');
    const contextMenu = electron_1.Menu.buildFromTemplate([
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
            click: () => electron_1.shell.openExternal('https://tacomole.kr'),
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
function notifyNewOrder(payload) {
    if (!electron_1.Notification.isSupported())
        return;
    const notification = new electron_1.Notification({
        title: '새 주문',
        body: payload.orderNumber
            ? `주문번호 ${payload.orderNumber}${payload.totalAmount ? ` · ${payload.totalAmount.toLocaleString()}원` : ''}`
            : '새 주문이 접수되었습니다.',
        icon: path_1.default.join(__dirname, '..', 'assets', 'tray-icon.png'),
        silent: false,
    });
    notification.show();
}
function notifyStaffCall(payload) {
    if (!electron_1.Notification.isSupported())
        return;
    const notification = new electron_1.Notification({
        title: '직원 호출',
        body: payload.tableNumber
            ? `${payload.tableNumber}번 테이블에서 직원을 호출했습니다.`
            : '직원 호출이 있습니다.',
        icon: path_1.default.join(__dirname, '..', 'assets', 'tray-icon.png'),
        urgency: 'critical',
        silent: false,
    });
    notification.show();
}
