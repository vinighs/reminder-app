const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const dataPath = path.join(app.getPath('userData'), 'reminderData.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Carrega a interface do usuário
  if (process.env.NODE_ENV === 'development') {
    // Em desenvolvimento, carrega a URL do servidor de desenvolvimento Vite
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // Em produção, carrega o arquivo index.html construído
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Oculta o menu e permite mostrar com ALT
  mainWindow.setAutoHideMenuBar(true);
  mainWindow.setMenuBarVisibility(false);
 }

// Load data from file
function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath);
      return JSON.parse(rawData);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  // Return default data if file doesn't exist or there's an error
  return {
    lists: [],
    reminders: []
  };
}

// Save data to file
function saveData(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
}

// Mostrar notificação do sistema
function showNotification(notificationOptions) {
  if (!Notification.isSupported()) {
    console.warn('Notifications are not supported on this system');
    return false;
  }

  try {
    // Definir o caminho do ícone corretamente
    let iconPath;
    if (process.env.NODE_ENV === 'development') {
      iconPath = path.join(__dirname, 'public', 'icon.png');
    } else {
      // Em produção, o ícone deve estar na pasta dist
      iconPath = path.join(__dirname, 'dist', 'icon.png');
    }
    
    console.log('Showing notification with icon path:', iconPath);
    console.log('Notification options:', notificationOptions);

    const notification = new Notification({
      title: notificationOptions.title || 'Lembrete',
      body: notificationOptions.body || '',
      silent: typeof notificationOptions.silent === 'boolean' ? notificationOptions.silent : false,
      timeoutType: 'default',
      urgency: 'normal',
      icon: notificationOptions.icon || iconPath,
      toastXml: notificationOptions.toastXml // Suporte para XML personalizado no Windows
    });

    // Adicionar logs para depuração
    notification.on('show', () => {
      console.log('Notification was shown');
    });

    notification.on('failed', (error) => {
      console.error('Notification failed to show:', error);
    });

    // Tratamento de clique na notificação
    notification.on('click', () => {
      console.log('Notification clicked');
      // Focar na janela principal se existir
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        
        // Enviar um evento para a interface do usuário
        if (notificationOptions.id) {
          mainWindow.webContents.send('notification-clicked', notificationOptions.id);
        }
      }
    });

    notification.show();
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
}

app.on('ready', () => {
  createWindow();

  // Definir o AppUserModelID corretamente para Windows
  // IMPORTANTE: Deve corresponder ao appId no package.json
  app.setAppUserModelId('com.exemplo.lembretes');

  // Set up IPC listeners for data operations
  ipcMain.handle('load-data', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      console.warn('Main window is closed or destroyed, cannot load data.');
      return { lists: [], reminders: [] };
    }
    return loadData();
  });
  
  ipcMain.handle('save-data', async (event, data) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      console.warn('Main window is closed or destroyed, cannot save data.');
      return false;
    }
    return saveData(data);
  });
  
  // Manipulador para mostrar notificações
  ipcMain.handle('show-notification', async (event, notificationData) => {
    console.log('Received notification request:', notificationData);
    return showNotification(notificationData);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});