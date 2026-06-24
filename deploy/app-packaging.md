# 🍜 这顿吃什么 — APP 化打包指南

> 两套方案将 Vue 网页应用封装为可独立运行的应用：**PWA 渐进式安装** + **Electron 桌面客户端**

---

## 📋 方案对比

| 特性 | 方案1: PWA | 方案2: Electron |
|------|-----------|----------------|
| 安装方式 | 浏览器访问 → 添加到桌面 | 下载 exe → 安装 |
| 平台支持 | iOS/Android/Windows/Mac/Linux | Windows/Mac/Linux |
| 离线支持 | ✅ Service Worker 缓存 | ✅ 完整离线 |
| 后台通知 | 有限（需 HTTPS） | ✅ 系统通知 |
| 文件体积 | ~300KB | ~150MB（含 Chromium） |
| 更新方式 | 自动（浏览器刷新） | 下载新安装包 |
| 开发复杂度 | 低（纯 Web 增强） | 中（Electron 封装） |
| 推荐场景 | 手机用户、轻量使用 | 桌面重度使用、离线优先 |

---

## 方案1: PWA 渐进式 Web 应用

### 原理

浏览器加载网页后，Service Worker 缓存全部静态资源。用户可「添加到桌面」获得类原生 APP 体验。

**已完成配置：**
- `public/manifest.json` — PWA 元数据（图标、名称、启动方式）
- `vite.config.js` — vite-plugin-pwa（自动生成 workbox Service Worker）
- `src/components/PwaInstallPrompt.vue` — 安装/更新提示 UI
- `scripts/generate-icons.cjs` — 图标生成脚本

### 1.1 生成图标

```bash
# 一键生成所有尺寸 PNG 图标（纯 JS，零依赖）
node scripts/generate-icons.cjs
```

输出到 `public/icons/`：72×72 ~ 512×512 共 8 个尺寸 + 快捷方式图标。

> 💡 部署前建议替换为真实 app 图标：用设计工具导出 512×512 PNG，覆盖 `public/icons/` 即可。

### 1.2 构建 PWA

```bash
npm run build
```

构建输出：

```
dist/
├── index.html
├── manifest.webmanifest     ← PWA 清单（自动生成）
├── sw.js                    ← Service Worker（workbox，41条预缓存）
├── workbox-f641ca17.js      ← workbox 运行时
├── registerSW.js            ← SW 注册脚本
├── icons/                   ← PWA 图标
└── assets/                  ← Vue 资源
```

### 1.3 部署到 HTTPS 服务器

PWA 要求 HTTPS（除 localhost 外），部署到阿里云 ECS 后自动生效（参考 `deploy/aliyun-deploy.md` 第7节 Let's Encrypt）。

```bash
# 上传 dist 到服务器
scp -r dist/* root@<服务器IP>:/opt/what-to-eat/dist/

# 重启 Nginx
sudo systemctl restart nginx
```

### 1.4 用户安装

1. **手机浏览器**打开 `https://你的域名.com`
2. Chrome/Safari 会自动弹出「添加到主屏幕」提示
3. 或在浏览器菜单选择「安装应用」

**桌面 Chrome/Edge：**
1. 访问网址后，地址栏右侧出现安装图标 ⬇️
2. 点击 →「安装」→ 桌面出现独立窗口应用

### 1.5 离线体验

Service Worker 缓存策略：
- **静态资源**：Precache（构建时预缓存所有 JS/CSS/HTML）
- **API 请求**：Network First（在线返回最新，离线回退缓存）
- **图片**：Cache First（优先缓存，加速加载）

离线时 API 返回兜底 JSON：`{ code: -1, message: "离线模式，数据不可用" }`

### 1.6 iOS 专属配置

`index.html` 已包含：

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="这顿吃什么" />
<link rel="apple-touch-icon" sizes="192x192" href="./icons/icon-192x192.png" />
```

### 1.7 PWA 测试

```bash
# 开发环境测试（localhost 允许非 HTTPS PWA）
npm run dev
# 打开 http://localhost:3000
# Chrome DevTools → Application → Service Workers
# → Manifest 可查看 PWA 状态
```

---

## 方案2: Electron 桌面客户端

### 原理

Electron 封装一个独立的 Chromium 浏览器窗口，加载 Vue 打包文件，通过 `electron-builder` 打包为 Windows `.exe` 安装程序。

**文件结构：**

```
electron/
├── package.json      ← Electron 依赖 + electron-builder 配置
├── main.js           ← 主进程（窗口创建、菜单、CORS 处理）
├── preload.js        ← 预加载脚本（安全暴露 API 给渲染进程）
├── release/          ← 打包输出目录（自动生成）
└── build/            ← 构建资源（图标等）
```

### 2.1 一键打包

```bash
# Windows（推荐）
npm run electron:build

# 或分步执行：
npm run build                          # 1. 构建前端到 dist/
node scripts/generate-icons.cjs        # 2. 生成 PWA 图标
cd electron && npm install             # 3. 安装 Electron 依赖
cd electron && npx electron-builder    # 4. 打包
```

### 2.2 首次配置

如果打包遇到 Electron 二进制下载慢，设置镜像：

```bash
# Windows (CMD)
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

# Windows (PowerShell)
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"

# Mac/Linux
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
```

### 2.3 打包输出

默认输出到 `electron/release/`：

```
release/
├── 这顿吃什么-2.0.0-setup.exe      ← NSIS 安装程序
├── win-unpacked/                    ← 便携版目录
│   └── 这顿吃什么.exe
└── builder-effective-config.yaml    ← 构建日志
```

### 2.4 安装程序特性

- ✅ 桌面快捷方式
- ✅ 开始菜单快捷方式
- ✅ 用户可选安装目录
- ✅ 简体中文安装界面
- ✅ 应用图标
- ✅ 单实例锁（防止重复打开）

### 2.5 开发模式

```bash
# 同时启动 Vite + Electron，支持热更新
npm run electron:dev
```

Vite dev server 启动后，Electron 窗口自动打开并加载 `http://localhost:3000`。

### 2.6 Electron 关键配置说明

**main.js 核心逻辑：**

```javascript
// 1. 自定义 app:// 协议 → 给应用合法 origin，绕过 file:// CORS 限制
protocol.handle('app', ...)

// 2. CORS 头处理 → API 请求不受跨域限制
session.defaultSession.webRequest.onHeadersReceived(...)

// 3. 单实例锁 → 防止多开
app.requestSingleInstanceLock()

// 4. 安全配置 → contextIsolation + sandbox
webPreferences: {
  contextIsolation: true,
  nodeIntegration: false,
}
```

**preload.js 暴露的 API（`window.electronAPI`）：**

```javascript
window.electronAPI = {
  platform: 'win32',        // 平台信息
  isElectron: true,         // Electron 环境标识
  openExternal(url),        // 外部浏览器打开链接
  showNotification(t, b),   // 系统通知
  version: '2.0.0',         // 应用版本
}
```

### 2.7 手动打包命令速查

```bash
# Windows 便携版（解压即用）
cd electron
npx electron-builder --win portable

# Windows NSIS 安装程序
cd electron
npx electron-builder --win nsis

# Windows + Mac
cd electron
npx electron-builder --win --mac

# 所有平台
cd electron
npx electron-builder --win --mac --linux
```

---

## 📦 完整构建流程

从零开始一键构建两种 APP：

```bash
cd E:\aiaiai\这顿吃什么

# ====== 公共步骤 ======
npm install                          # 安装前端依赖
node scripts/generate-icons.cjs      # 生成图标

# ====== 方案1: PWA ======
npm run build                        # 构建 → dist/
# 部署 dist/ 到 HTTPS 服务器即可

# ====== 方案2: Electron ======
npm run electron:build               # 构建前端 + 打包 exe
# 输出: electron/release/这顿吃什么-2.0.0-setup.exe
```

---

## 🔧 配置文件速查

| 文件 | 用途 |
|------|------|
| `public/manifest.json` | PWA 应用清单（备用，构建时 vite-plugin-pwa 生成新版） |
| `public/sw.js` | 自定义 Service Worker（手动版，PWA 插件版会自动覆盖） |
| `public/icons/` | PWA 图标目录 |
| `vite.config.js` | Vite + PWA 插件配置 |
| `electron/main.js` | Electron 主进程 |
| `electron/preload.js` | Electron 预加载脚本 |
| `electron/package.json` | Electron 依赖 + electron-builder 配置 |
| `scripts/generate-icons.cjs` | 图标生成脚本 |
| `scripts/electron-dev.cjs` | Electron 开发启动脚本 |
| `scripts/build-electron.cjs` | Electron 构建打包脚本 |
| `src/components/PwaInstallPrompt.vue` | PWA 安装/更新提示 UI |

---

## 🌐 部署时序

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   开发者电脑   │     │  阿里云 ECS   │     │   用户设备    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ npm run build │────→│ scp dist/    │────→│ Chrome 访问  │
│              │     │ nginx 代理   │     │ → 安装 PWA  │
│ npm run       │     │              │     │              │
│ electron:build│────→│ 提供 exe 下载 │────→│ 双击安装 exe │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

> 📅 最后更新：2024年 · 适用于 Windows 11 / macOS / Linux
