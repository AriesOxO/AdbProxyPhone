const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');

  // 添加菜单
  const menu = Menu.buildFromTemplate([
    {
      label: 'Help',
      submenu: [
        {
          label: '查看日志',
          click: () => {
            openLatestLogFile();
          }
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 获取日志目录
const logDir = path.join(__dirname, 'log');

// 打开最新的日志文件
function openLatestLogFile() {
  // 确保日志目录存在
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  // 获取日志目录下所有日志文件
  const logFiles = fs.readdirSync(logDir).filter(file => file.endsWith('.log'));

  if (logFiles.length === 0) {
    console.log('No log files found');
    return;
  }

  // 按日期排序日志文件，获取最新的一个
  const latestLogFile = logFiles.sort().reverse()[0];
  const logFilePath = path.join(logDir, latestLogFile);

  // 使用 shell 打开最新的日志文件
  shell.openPath(logFilePath).then(result => {
    if (result) {
      console.error('Error opening log file:', result);
    }
  });
}
