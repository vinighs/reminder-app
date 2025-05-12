const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Para ipcService.js
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),

  // Para notificationService.js
  showMainNotification: (notificationData) => ipcRenderer.invoke('show-notification', notificationData),

  // Para o processo principal enviar 'notification-clicked' de volta ao renderizador
  // Exemplo: mainWindow.webContents.send('notification-clicked', id); em main.js
  onNotificationClicked: (callback) => {
    const handler = (_event, id) => callback(id);
    ipcRenderer.on('notification-clicked', handler);
    // Retorna uma função para remover o listener (limpeza)
    return () => ipcRenderer.removeListener('notification-clicked', handler);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script has been loaded and electronAPI exposed.');
});
