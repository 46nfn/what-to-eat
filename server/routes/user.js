/**
 * 用户路由 - 个人信息管理
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const pool = require('../config/db');
const { success, fail } = require('../utils/response');
const { handleValidation } = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 所有用户路由都需要登录
router.use(authMiddleware);

// ==================== GET /api/user/profile ====================
router.get('/profile', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, username, nickname, avatar, bio, taste_prefs, allergies, addresses,
              budget_range, alt_foods, theme, font_size, created_at, updated_at
       FROM users WHERE id = ?`,
      [req.user.userId]
    );

    if (rows.length === 0) {
      return fail(res, '用户不存在', 404);
    }

    const user = rows[0];
    // 解析 JSON 字段
    ['taste_prefs', 'allergies', 'addresses', 'budget_range', 'alt_foods'].forEach(field => {
      if (typeof user[field] === 'string') {
        try { user[field] = JSON.parse(user[field]); } catch { user[field] = null; }
      }
    });

    return success(res, user);
  } catch (err) {
    console.error('获取个人资料失败:', err);
    return fail(res, '服务器错误', 500);
  }
});

// ==================== PUT /api/user/profile ====================
router.put('/profile', [
  body('nickname').optional().trim().isLength({ min: 1, max: 50 }).withMessage('昵称需要 1-50 个字符'),
  body('avatar').optional().trim().isLength({ max: 10 }).withMessage('头像格式不正确'),
  body('bio').optional().trim().isLength({ max: 200 }).withMessage('签名最多 200 个字符'),
  handleValidation,
], async (req, res) => {
  try {
    const allowedFields = ['nickname', 'avatar', 'bio', 'taste_prefs', 'allergies', 'addresses', 'budget_range', 'alt_foods', 'theme', 'font_size'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`\`${field}\` = ?`);
        // JSON 字段序列化
        if (['taste_prefs', 'allergies', 'addresses', 'budget_range', 'alt_foods'].includes(field)) {
          values.push(JSON.stringify(req.body[field]));
        } else {
          values.push(req.body[field]);
        }
      }
    }

    if (updates.length === 0) {
      return fail(res, '没有需要更新的字段');
    }

    values.push(req.user.userId);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // 返回更新后的用户信息
    const [rows] = await pool.query(
      'SELECT id, username, nickname, avatar, bio, taste_prefs, allergies, addresses, budget_range, alt_foods, theme, font_size, updated_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    const user = rows[0];
    ['taste_prefs', 'allergies', 'addresses', 'budget_range', 'alt_foods'].forEach(field => {
      if (typeof user[field] === 'string') {
        try { user[field] = JSON.parse(user[field]); } catch { user[field] = null; }
      }
    });

    return success(res, user, '个人资料已更新');
  } catch (err) {
    console.error('更新个人资料失败:', err);
    return fail(res, '服务器错误', 500);
  }
});

// ==================== PUT /api/user/password ====================
router.put('/password', [
  body('oldPassword').notEmpty().withMessage('请输入原密码'),
  body('newPassword').isLength({ min: 6, max: 100 }).withMessage('新密码需要 6-100 个字符'),
  handleValidation,
], async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // 验证原密码
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.userId]);
    if (rows.length === 0) return fail(res, '用户不存在', 404);

    const isMatch = await bcrypt.compare(oldPassword, rows[0].password);
    if (!isMatch) {
      return fail(res, '原密码错误', 401);
    }

    // 更新密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.userId]);

    return success(res, null, '密码已更新');
  } catch (err) {
    console.error('修改密码失败:', err);
    return fail(res, '服务器错误', 500);
  }
});

module.exports = router;
