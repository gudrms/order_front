"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('adminElectron', {
    isElectron: true,
    notifyNewOrder: (payload) => {
        electron_1.ipcRenderer.send('notify-new-order', payload);
    },
    playNewOrderSound: () => {
        electron_1.ipcRenderer.send('play-sound', 'new-order');
    },
    printReceipt: (payload) => {
        return electron_1.ipcRenderer.invoke('print-receipt', payload);
    },
});
// DOM 이벤트 → main process 중계
window.addEventListener('admin:new-order', (event) => {
    const detail = event.detail;
    electron_1.ipcRenderer.send('notify-new-order', detail);
});
window.addEventListener('admin:new-staff-call', (event) => {
    const detail = event.detail;
    electron_1.ipcRenderer.send('notify-staff-call', detail);
});
