import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('adminElectron', {
  isElectron: true,

  notifyNewOrder: (payload: unknown) => {
    ipcRenderer.send('notify-new-order', payload);
  },

  playNewOrderSound: () => {
    ipcRenderer.send('play-sound', 'new-order');
  },

  printReceipt: (payload: unknown) => {
    return ipcRenderer.invoke('print-receipt', payload);
  },

  // 수동 업데이트 — 렌더러가 승인 UI에서 호출
  downloadUpdate: () => {
    ipcRenderer.send('download-update');
  },

  installUpdate: () => {
    ipcRenderer.send('install-update');
  },

  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', callback);
  },

  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', callback);
  },
});

// DOM 이벤트 → main process 중계
window.addEventListener('admin:new-order', (event) => {
  const detail = (event as CustomEvent).detail;
  ipcRenderer.send('notify-new-order', detail);
});

window.addEventListener('admin:new-staff-call', (event) => {
  const detail = (event as CustomEvent).detail;
  ipcRenderer.send('notify-staff-call', detail);
});
