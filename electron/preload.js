/**
 * 这顿吃什么 - Electron 预加载脚本
 * 安全暴露有限的 API 给渲染进程
 */
const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 平台信息
  platform: process.platform,
  isElectron: true,

  // 窗口控制
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // 打开外部链接
  openExternal: (url) => shell.openExternal(url),

  // 通知
  showNotification: (title, body) => {
    new Notification(title, { body });
  },

  // 应用版本
  version: process.env.npm_package_version || '2.0.0',
});

// 日志到主进程
console.log('🍜 Electron preload: 这顿吃什么 桌面版已就绪');
