/**
 * Electron 打包脚本
 * 1. 构建 Vue 前端 (npm run build)
 * 2. 安装 Electron 依赖
 * 3. 使用 electron-builder 打包为 Windows exe
 * 运行: node scripts/build-electron.cjs
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const ELECTRON_DIR = path.join(ROOT, 'electron');
const DIST_DIR = path.join(ROOT, 'dist');
const RELEASE_DIR = path.join(ELECTRON_DIR, 'release');

console.log('═══════════════════════════════════════');
console.log('  🍜  这顿吃什么 - Electron 打包');
console.log('═══════════════════════════════════════\n');

// Step 1: 构建前端
console.log('📦 Step 1/4: 构建 Vue 前端...');
try {
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
} catch (err) {
  console.error('❌ 前端构建失败');
  process.exit(1);
}

// 验证 dist 存在
if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.error('❌ dist/index.html 不存在，构建可能失败');
  process.exit(1);
}
console.log('✅ 前端构建完成\n');

// Step 2: 生成图标
console.log('🎨 Step 2/4: 生成 PWA 图标...');
try {
  execSync('node scripts/generate-icons.cjs', { cwd: ROOT, stdio: 'inherit' });
} catch {
  console.log('⚠️  图标生成跳过（可能已存在）');
}
console.log('');

// Step 3: 安装 Electron 依赖
console.log('📦 Step 3/4: 安装 Electron 依赖...');
try {
  execSync('npm install', { cwd: ELECTRON_DIR, stdio: 'inherit' });
} catch (err) {
  console.error('❌ Electron 依赖安装失败');
  process.exit(1);
}
console.log('✅ Electron 依赖已就绪\n');

// Step 4: 打包
console.log('🔨 Step 4/4: 打包 Electron 应用...');
const builderArgs = [
  '--config', path.join(ELECTRON_DIR, 'package.json'),
  '--dir',  // 先打包为目录（更快），去掉 --dir 可打包为安装程序
];

try {
  // 使用 npx electron-builder
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  execSync(
    `"${path.join(ELECTRON_DIR, 'node_modules', '.bin', 'electron-builder')}" --config "${path.join(ELECTRON_DIR, 'package.json')}" --win portable`,
    { cwd: ELECTRON_DIR, stdio: 'inherit' }
  );
} catch (err) {
  console.error('\n⚠️  首次打包可能需要下载 Electron 二进制文件（~150MB），请确保网络畅通');
  console.error('如果下载失败，可设置镜像: set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/');
  process.exit(1);
}

console.log('\n═══════════════════════════════════════');
console.log('  ✅ 打包完成！');
console.log(`  输出目录: ${RELEASE_DIR}`);
console.log('═══════════════════════════════════════\n');
