/**
 * Electron 开发启动脚本
 * 1. 启动 Vite dev server
 * 2. 等待就绪后启动 Electron
 * 运行: node scripts/electron-dev.cjs
 */
const { spawn, execSync } = require('child_process');
const path = require('path');
const net = require('net');

const ROOT = path.join(__dirname, '..');
const ELECTRON_DIR = path.join(ROOT, 'electron');
const VITE_PORT = 3000;

// 检查端口是否已就绪
function waitForPort(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const sock = new net.Socket();
      sock.setTimeout(1000);
      sock.on('connect', () => { sock.destroy(); resolve(); });
      sock.on('error', () => {
        sock.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(check, 500);
        }
      });
      sock.on('timeout', () => { sock.destroy(); check(); });
      sock.connect(port, '127.0.0.1');
    };
    check();
  });
}

async function main() {
  console.log('🍜 这顿吃什么 - Electron 开发模式\n');

  // 检查 electron 是否已安装
  try {
    require.resolve(path.join(ELECTRON_DIR, 'node_modules', 'electron'));
  } catch {
    console.log('📦 安装 Electron 依赖...');
    execSync('npm install', { cwd: ELECTRON_DIR, stdio: 'inherit' });
  }

  // 启动 Vite
  console.log('🚀 启动 Vite dev server...');
  const vite = spawn('npx', ['vite', '--port', String(VITE_PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: 'pipe',
    shell: true,
  });

  vite.stdout.on('data', (data) => {
    process.stdout.write(data);
  });
  vite.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  // 等待 Vite 就绪
  try {
    await waitForPort(VITE_PORT);
    console.log(`✅ Vite 已就绪: http://localhost:${VITE_PORT}\n`);
  } catch (err) {
    console.error('❌ Vite 启动超时');
    vite.kill();
    process.exit(1);
  }

  // 启动 Electron
  console.log('🖥️  启动 Electron...');
  const electron = spawn(
    path.join(ELECTRON_DIR, 'node_modules', '.bin', 'electron'),
    ['.', '--dev'],
    {
      cwd: ELECTRON_DIR,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, NODE_ENV: 'development' },
    }
  );

  electron.on('close', () => {
    console.log('👋 Electron 已关闭');
    vite.kill();
    process.exit(0);
  });

  // 进程退出时清理
  process.on('SIGINT', () => {
    electron.kill();
    vite.kill();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
