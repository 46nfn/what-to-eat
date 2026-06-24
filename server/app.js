/**
 * 这顿吃什么 - 后端服务入口
 * Node.js + Express + MySQL
 */
// 本地开发读 .env，Fly.io 用 secrets（无 .env 文件不报错）
try { require('dotenv').config(); } catch { /* 生产环境无 .env */ }

const express = require('express');
const cors = require('cors');

// 路由模块
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const diaryRoutes = require('./routes/diary');
const communityRoutes = require('./routes/community');

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== 中间件 ====================

// CORS 跨域配置
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ].concat((process.env.CORS_ORIGINS || '').split(',').filter(Boolean)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 解析 JSON 请求体（限制 50MB，因为可能有 base64 图片）
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 请求日志
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toLocaleString('zh-CN')} ${req.method} ${req.path}`);
  next();
});

// ==================== 路由挂载 ====================

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/community', communityRoutes);

// ==================== 健康检查 ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ==================== 404 处理 ====================
app.use((req, res) => {
  res.status(404).json({ code: -1, message: `接口不存在: ${req.method} ${req.path}`, data: null });
});

// ==================== 全局错误处理 ====================
app.use((err, req, res, next) => {
  console.error('❌ 服务器错误:', err);
  res.status(500).json({ code: -1, message: '服务器内部错误', data: null });
});

// ==================== 启动服务 ====================
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('  🍜  这顿吃什么 - 后端服务已启动');
  console.log(`  📡  地址: http://localhost:${PORT}`);
  console.log(`  🌍  环境: ${process.env.NODE_ENV || 'development'}`);
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('  API 端点:');
  console.log(`  ├─ POST /api/auth/register    注册`);
  console.log(`  ├─ POST /api/auth/login       登录`);
  console.log(`  ├─ GET  /api/auth/me          获取当前用户`);
  console.log(`  ├─ GET  /api/user/profile     获取个人资料`);
  console.log(`  ├─ PUT  /api/user/profile     更新个人资料`);
  console.log(`  ├─ PUT  /api/user/password    修改密码`);
  console.log(`  ├─ GET  /api/diary            日记列表`);
  console.log(`  ├─ POST /api/diary            创建日记`);
  console.log(`  ├─ GET  /api/diary/stats      统计数据`);
  console.log(`  ├─ GET  /api/diary/:id        日记详情`);
  console.log(`  ├─ PUT  /api/diary/:id        更新日记`);
  console.log(`  ├─ DELETE /api/diary/:id      删除日记`);
  console.log(`  ├─ GET  /api/community        社区广场`);
  console.log(`  ├─ POST /api/community/:id/like  点赞/取消`);
  console.log(`  └─ POST /api/community/:id/save  收藏/取消`);
  console.log('');
});
