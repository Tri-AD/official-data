const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configure logging for the auto-updater
log.transports.file.level = 'info';
autoUpdater.logger = log;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // Remove native window frame
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    // Hide the default menu bar for a cleaner look
    autoHideMenuBar: true
  });

  // IPC Handlers for custom TitleBar
  ipcMain.on('window-minimize', () => {
    win.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    win.close();
  });

  // Auto-updater events
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
  });
  autoUpdater.on('update-available', (info) => {
    log.info('Update available.');
    // You could send a message to the renderer process here to show a notification
    // win.webContents.send('update_available');
  });
  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.');
  });
  autoUpdater.on('error', (err) => {
    log.info('Error in auto-updater. ' + err);
  });
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    log.info(log_message);
  });
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded');
    // Automatically install and restart the app when the update is downloaded
    autoUpdater.quitAndInstall();
  });

  // In production, load the built index.html
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
    // Check for updates only in production
    autoUpdater.checkForUpdatesAndNotify();
  } else {
    // In development, load the Vite dev server
    win.loadURL('http://127.0.0.1:3000');
    // Open DevTools to help debug white screen issues
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
