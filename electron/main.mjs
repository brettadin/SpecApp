import path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import * as nodeGeminiService from '../services/nodeGeminiService.mjs';
import Store from 'electron-store';

const store = new Store();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  const startUrl = process.env.ELECTRON_START_URL || '';
  if (startUrl) {
    mainWindow.loadURL(startUrl);
    // In development mode, open DevTools automatically for debugging
    mainWindow.webContents.openDevTools({ mode: 'right' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.removeMenu();

  mainWindow.on('closed', () => mainWindow = null);

  // Log renderer console messages to the main process console for easier debugging
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levelName = ['log', 'warn', 'error'][Math.max(0, Math.min(level, 2))] || 'log';
    console[levelName](`[renderer] ${message} (source: ${sourceId}:${line})`);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Renderer failed to load ${validatedURL}: [${errorCode}] ${errorDescription}`);
  });
}

// In development, disable hardware acceleration to avoid GPU driver-related renderer crashes
if (process.env.ELECTRON_START_URL) {
  try {
    app.disableHardwareAcceleration();
    app.commandLine.appendSwitch('disable-gpu');
    console.info('Electron GPU acceleration disabled for dev mode');
  } catch (e) {
    console.warn('Unable to disable GPU acceleration', e);
  }
}

// Log uncaught errors in the main process to aid diagnosis
process.on('uncaughtException', (err) => {
  console.error('Main process uncaughtException:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Main process unhandledRejection:', reason);
});

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!mainWindow) createWindow(); });

// IPC: Gemini spectral fetch
ipcMain.handle('gemini:fetchSpectralData', async (event, query) => {
  try {
    return await nodeGeminiService.fetchSpectralData(query);
  } catch (err) {
    return { error: err.message || String(err) };
  }
});

ipcMain.handle('gemini:analyzeSpectra', async (event, datasets) => {
  try {
    return await nodeGeminiService.analyzeSpectra(datasets);
  } catch (err) {
    return { error: err.message || String(err) };
  }
});

// Keep getEnv for convenience but do not return sensitive secrets
ipcMain.handle('app:get-env', async (event, key) => {
  const allowedKeys = ['NODE_ENV'];
  if (!allowedKeys.includes(key)) return null;
  return process.env[key] || null;
});

ipcMain.handle('app:store:get', async (event, key) => {
  return store.get(key);
});

ipcMain.handle('app:store:set', async (event, key, value) => {
  store.set(key, value);
  return true;
});
