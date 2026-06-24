/**
 * 这顿吃什么 - Electron 主进程
 * 创建桌面窗口，加载 Vue 应用
 */
const { app, BrowserWindow, Menu, dialog, shell, session, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');

// 开发模式检测
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

// 保持窗口引用，防止 GC
let mainWindow = null;

// ==================== 自定义协议（解决 file:// CORS 问题） ====================
// 注册 app:// 协议，给应用一个合法 origin，避免 CORS 限制
function registerProtocol() {
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    // 映射到 dist 目录
    let filePath = path.join(__dirname, '..', 'dist', url.pathname.replace(/^\//, ''));
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(__dirname, '..', 'dist', 'index.html');
    }
    return net.fetch('file:///' + filePath.replace(/\\/g, '/'));
  });
}

// 处理 API CORS（对 file:// 或自定义协议加载的页面，放宽跨域限制）
function setupCorsHandler() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'],
        'Access-Control-Allow-Methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      },
    });
  });
}

// ==================== 创建主窗口 ====================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 860,
    minWidth: 380,
    minHeight: 640,
    title: '这顿吃什么 🍜',
    icon: path.join(__dirname, '..', 'public', 'icons', 'icon-512x512.png'),
    backgroundColor: '#FFFAF5',
    show: false, // 先隐藏，ready-to-show 再显示
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,      // 安全：隔离渲染进程
      nodeIntegration: false,      // 安全：不暴露 Node.js
      sandbox: true,
      webSecurity: true,
    },
  });

  // 窗口准备好后显示（避免白屏闪烁）
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // 开发环境自动打开 DevTools
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  // 加载应用
  if (isDev) {
    // 开发模式 → 连接 Vite dev server
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // 生产模式 → 加载打包后的文件
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      // fallback: 没有 dist，显示提示
      mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <html><body style="background:#FFFAF5;font-family:sans-serif;text-align:center;padding:60px 20px;">
        <div style="font-size:64px;">🍜</div>
        <h2>这顿吃什么</h2>
        <p style="color:#9B8B7A;">请先构建前端：</p>
        <pre style="background:#F0E8DC;padding:12px;border-radius:8px;display:inline-block;">cd 项目根目录<br/>npm run build</pre>
        </body></html>
      `));
    }
  }

  // 在默认浏览器中打开外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 窗口关闭
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ==================== 应用菜单 ====================
function createMenu() {
  const template = [
    {
      label: '这顿吃什么',
      submenu: [
        { label: '关于', click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: '关于 这顿吃什么',
            message: '🍜 这顿吃什么 v2.0',
            detail: '美食记录 & 决策轻社区\n\nVue 3 + Express + MySQL 全栈应用',
          });
        }},
        { type: 'separator' },
        { label: '退出', accelerator: 'Alt+F4', click: () => app.quit() },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '刷新' },
        { role: 'forceReload', label: '强制刷新' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        { label: '项目主页', click: () => shell.openExternal('https://github.com') },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ==================== 应用生命周期 ====================
app.whenReady().then(() => {
  registerProtocol();
  setupCorsHandler();
  createMenu();
  createWindow();

  // macOS: 点击 dock 图标重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 防止多实例
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
