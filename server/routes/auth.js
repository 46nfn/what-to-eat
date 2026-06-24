/**
 * 认证路由 - 注册 / 登录
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const pool = require('../config/db');
const { success, fail } = require('../utils/response');
const { handleValidation } = require('../middleware/validate');

const router = express.Router();

// ==================== POST /api/auth/register ====================
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('用户名需要 2-50 个字符')
    .matches(/^[a-zA-Z0-9_一-龥]+$/).withMessage('用户名只能包含中英文、数字和下划线'),
  body('password')
    .isLength({ min: 6, max: 100 }).withMessage('密码需要 6-100 个字符'),
  handleValidation,
], async (req, res) => {
  try {
    const { username, password } = req.body;

    // 检查用户名是否已存在
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return fail(res, '用户名已被注册', 409);
    }

    // bcrypt 加密密码（10 轮盐）
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 插入用户
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    // 签发 JWT
    const token = jwt.sign(
      { userId: result.insertId, username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return success(res, {
      token,
      user: {
        id: result.insertId,
        username,
        nickname: '美食家',
        avatar: '🍜',
        bio: '唯美食与爱不可辜负',
      },
    }, '注册成功', 201);
  } catch (err) {
    console.error('注册失败:', err);
    return fail(res, '服务器错误，请稍后重试', 500);
  }
});

// ==================== POST /api/auth/login ====================
router.post('/login', [
  body('username').trim().notEmpty().withMessage('请输入用户名'),
  body('password').notEmpty().withMessage('请输入密码'),
  handleValidation,
], async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查询用户
    const [rows] = await pool.query(
      'SELECT id, username, password, nickname, avatar, bio, taste_prefs, allergies, addresses, budget_range, alt_foods, theme, font_size, created_at FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return fail(res, '用户名或密码错误', 401);
    }

    const user = rows[0];

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return fail(res, '用户名或密码错误', 401);
    }

    // 签发 JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 不返回密码
    const { password: _, ...userInfo } = user;

    // 解析 JSON 字段
    ['taste_prefs', 'allergies', 'addresses', 'budget_range', 'alt_foods'].forEach(field => {
      if (typeof userInfo[field] === 'string') {
        try { userInfo[field] = JSON.parse(userInfo[field]); } catch { userInfo[field] = null; }
      }
    });

    return success(res, { token, user: userInfo }, '登录成功');
  } catch (err) {
    console.error('登录失败:', err);
    return fail(res, '服务器错误，请稍后重试', 500);
  }
});

// ==================== GET /api/auth/me ====================
// 验证 token 有效性并返回当前用户信息
const authMiddleware = require('../middleware/auth');
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, nickname, avatar, bio, taste_prefs, allergies, addresses, budget_range, alt_foods, theme, font_size, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (rows.length === 0) {
      return fail(res, '用户不存在', 404);
    }

    const user = rows[0];
    ['taste_prefs', 'allergies', 'addresses', 'budget_range', 'alt_foods'].forEach(field => {
      if (typeof user[field] === 'string') {
        try { user[field] = JSON.parse(user[field]); } catch { user[field] = null; }
      }
    });

    return success(res, user);
  } catch (err) {
    console.error('获取用户信息失败:', err);
    return fail(res, '服务器错误', 500);
  }
});

module.exports = router;
