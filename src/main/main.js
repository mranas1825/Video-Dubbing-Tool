const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;

function getPythonPath() {
  const possiblePaths = [
    path.join(__dirname, '../../venv/Scripts/python.exe'),
    path.join(process.cwd(), 'venv/Scripts/python.exe'),
    path.join(process.resourcesPath, 'venv/Scripts/python.exe'),
    path.join(process.resourcesPath, 'app.asar.unpacked/venv/Scripts/python.exe')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return 'python';
}


function getScriptPath(scriptName) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'python', scriptName);
  }
  return path.join(__dirname, '../../python', scriptName);
}

function scanFolderForVideos(folderPath) {
  const videoFiles = [];
  const validExts = ['.mp4', '.mov', '.mkv', '.avi', '.webm'];

  function scanDir(dir) {
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          scanDir(fullPath);
        } else if (validExts.includes(path.extname(item.name).toLowerCase())) {
          videoFiles.push(fullPath);
        }
      }
    } catch (e) {
      console.error(`Error scanning directory ${dir}:`, e);
    }
  }

  if (folderPath && fs.existsSync(folderPath)) {
    const stat = fs.statSync(folderPath);
    if (stat.isDirectory()) {
      scanDir(folderPath);
    } else {
      const parentDir = path.dirname(folderPath);
      scanDir(parentDir);
      folderPath = parentDir;
    }
  }

  return { folderPath, videoFiles };
}

function createWindow() {
  const iconPath = path.join(__dirname, '../renderer/assets/logo.jpg');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: 'hiddenBorder',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#0B0E14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Native file picker handlers for full D: drive access
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    defaultPath: 'D:\\',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Video Files (*.mp4, *.mov, *.mkv, *.avi, *.webm)', extensions: ['mp4', 'mov', 'mkv', 'avi', 'webm'] }
    ]
  });
  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    defaultPath: 'D:\\',
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return scanFolderForVideos(result.filePaths[0]);
});

// Get all video files in the containing folder of a single file
ipcMain.handle('get-folder-contents', async (event, filePath) => {
  if (!filePath) return null;
  return scanFolderForVideos(filePath);
});

// Download video link via Python yt-dlp bridge
ipcMain.handle('download-video-link', async (event, url) => {
  return new Promise((resolve, reject) => {
    const pythonExe = getPythonPath();
    const scriptPath = getScriptPath('downloader.py');

    if (mainWindow) {
      mainWindow.webContents.send('log-update', {
        type: 'info',
        text: `Launching yt-dlp downloader via Python: "${pythonExe}" Script: "${scriptPath}"`
      });
    }

    const proc = spawn(pythonExe, [scriptPath, '--url', url]);

    proc.on('error', (err) => {
      const errText = `Failed to spawn downloader process (${pythonExe}): ${err.message}`;
      if (mainWindow) mainWindow.webContents.send('log-update', { type: 'error', text: errText });
      reject(err);
    });

    let output = '';
    let errorMsg = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
      if (mainWindow) mainWindow.webContents.send('log-update', { type: 'info', text: data.toString().trim() });
    });

    proc.stderr.on('data', (data) => {
      errorMsg += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output.trim().split('\n').pop());
          resolve(result);
        } catch (e) {
          resolve({ success: true, message: 'Download finished', raw: output });
        }
      } else {
        reject(new Error(errorMsg || 'yt-dlp download failed'));
      }
    });
  });
});

// Run dubbing pipeline process
ipcMain.handle('run-pipeline-task', async (event, taskData) => {
  return new Promise((resolve, reject) => {
    const pythonExe = getPythonPath();
    const scriptPath = getScriptPath('backend_bridge.py');

    // Create a temporary JSON config file to prevent Windows command line escaping bugs
    const tempConfigDir = path.join(app.getPath('userData'), 'temp_configs');
    if (!fs.existsSync(tempConfigDir)) fs.mkdirSync(tempConfigDir, { recursive: true });
    const configFilePath = path.join(tempConfigDir, `task_${taskData.id || Date.now()}.json`);
    fs.writeFileSync(configFilePath, JSON.stringify(taskData, null, 2), 'utf8');

    if (mainWindow) {
      mainWindow.webContents.send('log-update', {
        type: 'info',
        text: `Executing task "${taskData.id}" on Python: "${pythonExe}" Config: "${configFilePath}"`
      });
    }

    const proc = spawn(pythonExe, [scriptPath, '--config', configFilePath]);

    proc.on('error', (err) => {
      const errText = `Failed to spawn dubbing pipeline process (${pythonExe}): ${err.message}`;
      if (mainWindow) mainWindow.webContents.send('log-update', { type: 'error', text: errText });
      reject(err);
    });


    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line.trim());
          if (parsed.type === 'progress') {
            if (mainWindow) mainWindow.webContents.send('task-progress', parsed);
          } else if (parsed.type === 'log') {
            if (mainWindow) mainWindow.webContents.send('log-update', parsed);
          }
        } catch (e) {
          if (mainWindow) mainWindow.webContents.send('log-update', { type: 'info', text: line.trim() });
        }
      }
    });

    proc.stderr.on('data', (data) => {
      const errStr = data.toString().trim();
      if (!errStr) return;
      const isWarning = errStr.includes('UserWarning') || errStr.includes('Warning:') || errStr.includes('symlinks by default') || errStr.includes('HF_TOKEN');
      if (mainWindow) {
        mainWindow.webContents.send('log-update', {
          type: isWarning ? 'info' : 'error',
          text: errStr
        });
      }
    });


    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({ success: false, code });
      }
    });
  });
});

ipcMain.handle('open-file', async (event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    await shell.openPath(filePath);
    return true;
  }
  return false;
});

// Settings & Presets Persistence
const getSettingsFilePath = () => path.join(app.getPath('userData'), 'settings.json');
const getPresetsFilePath = () => path.join(app.getPath('userData'), 'presets.json');

ipcMain.handle('get-settings', async () => {
  const file = getSettingsFilePath();
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
});

ipcMain.handle('save-settings', async (event, settings) => {
  fs.writeFileSync(getSettingsFilePath(), JSON.stringify(settings, null, 2), 'utf8');
  return true;
});

ipcMain.handle('get-presets', async () => {
  const file = getPresetsFilePath();
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      return [];
    }
  }
  return [];
});

ipcMain.handle('save-preset', async (event, preset) => {
  const file = getPresetsFilePath();
  let presets = [];
  if (fs.existsSync(file)) {
    try {
      presets = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      presets = [];
    }
  }
  presets = presets.filter(p => p.name !== preset.name);
  presets.push(preset);
  fs.writeFileSync(file, JSON.stringify(presets, null, 2), 'utf8');
  return presets;
});

ipcMain.handle('fetch-elevenlabs-voice', async (event, { apiKey, voiceId }) => {
  const https = require('https');
  return new Promise((resolve) => {
    if (!voiceId || !voiceId.trim()) {
      return resolve({ success: false, error: 'Voice ID cannot be empty.' });
    }
    const cleanId = voiceId.trim();

    const fetchDirect = () => {
      const options = {
        hostname: 'api.elevenlabs.io',
        path: `/v1/voices/${cleanId}`,
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      };
      if (apiKey && apiKey.trim()) {
        options.headers['xi-api-key'] = apiKey.trim();
      }

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode === 200) {
              resolve({ success: true, voice: data });
            } else if (res.statusCode === 401 && !apiKey) {
              fetchPublicList();
            } else if (res.statusCode === 401) {
              resolve({ success: false, error: 'Invalid API Key — check your ElevenLabs account.' });
            } else if (res.statusCode === 404) {
              resolve({ success: false, error: `Invalid Voice ID '${cleanId}' — voice not found.` });
            } else if (res.statusCode === 402) {
              resolve({ success: false, error: 'ElevenLabs credits exhausted for this account.' });
            } else {
              resolve({ success: false, error: data.detail?.message || `ElevenLabs API error (HTTP ${res.statusCode})` });
            }
          } catch (e) {
            resolve({ success: false, error: `Failed to parse response: ${e.message}` });
          }
        });
      });

      req.on('error', (err) => resolve({ success: false, error: `Network error: ${err.message}` }));
      req.end();
    };

    const fetchPublicList = () => {
      const options = {
        hostname: 'api.elevenlabs.io',
        path: `/v1/voices`,
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      };
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            const voices = data.voices || [];
            const found = voices.find(v => v.voice_id === cleanId);
            if (found) {
              resolve({ success: true, voice: found });
            } else {
              resolve({ success: false, error: `Voice ID '${cleanId}' not found in public library. Please enter your ElevenLabs API Key to fetch private cloned voices.` });
            }
          } catch (e) {
            resolve({ success: false, error: `Failed to parse voices list: ${e.message}` });
          }
        });
      });
      req.on('error', (err) => resolve({ success: false, error: `Network error: ${err.message}` }));
      req.end();
    };

    fetchDirect();
  });
});

ipcMain.handle('validate-api-key', async (event, { service, apiKey }) => {
  const https = require('https');
  return new Promise((resolve) => {
    if (!apiKey || !apiKey.trim()) {
      return resolve({ success: false, error: 'API key is empty.' });
    }
    const key = apiKey.trim();

    if (service === 'elevenlabs') {
      const req = https.request({
        hostname: 'api.elevenlabs.io',
        path: '/v1/user/subscription',
        method: 'GET',
        headers: { 'xi-api-key': key }
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const data = JSON.parse(body);
              const used = data.character_count || 0;
              const limit = data.character_limit || 10000;
              const percent = Math.min(100, Math.round((used / (limit || 1)) * 100));
              resolve({
                success: true,
                usage: { used, limit, percent }
              });
            } catch (e) {
              resolve({ success: true, usage: null });
            }
          } else if (res.statusCode === 401) {
            resolve({ success: false, error: 'Invalid ElevenLabs API Key.' });
          } else if (res.statusCode === 402) {
            resolve({ success: false, error: 'ElevenLabs quota exhausted.' });
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode} Error` });
          }
        });
      });
      req.on('error', err => resolve({ success: false, error: err.message }));
      req.end();
    } else if (service === 'groq') {
      const req = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/models',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${key}` }
      }, (res) => {
        if (res.statusCode === 200) {
          resolve({ success: true });
        } else if (res.statusCode === 401) {
          resolve({ success: false, error: 'Invalid Groq API Key.' });
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode} Error` });
        }
      });
      req.on('error', err => resolve({ success: false, error: err.message }));
      req.end();
    } else if (service === 'claude') {
      const req = https.request({
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }, (res) => {
        if (res.statusCode === 200 || res.statusCode === 400) {
          resolve({ success: true });
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          resolve({ success: false, error: 'Invalid Claude API Key.' });
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode} Error` });
        }
      });
      req.on('error', err => resolve({ success: false, error: err.message }));
      req.write(JSON.stringify({ model: 'claude-3-5-haiku-20241022', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }));
      req.end();
    } else {
      resolve({ success: false, error: 'Unknown service.' });
    }
  });
});

