const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load dev server if running in development; otherwise load built dist
  const startUrl = process.env.ELECTRON_START_URL || '';
  if (startUrl) {
    mainWindow.loadURL(startUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Optional: remove default menu for a more app-like experience
  mainWindow.removeMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// Example minimal IPC handler (safe wrapper for potential future uses).
ipcMain.handle('app:get-env', async (event, key) => {
  // Expose only specifically allowed keys -- avoid returning sensitive secrets by default
  const allowedKeys = ['NODE_ENV'];
  if (!allowedKeys.includes(key)) return null;
  return process.env[key] || null;
});
