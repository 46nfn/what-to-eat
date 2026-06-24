/**
 * 美食日记路由 - CRUD 操作
 * 所有接口需要登录，数据绑定到当前用户
 */
const express = require('express');
const { body, query } = require('express-validator');
const pool = require('../config/db');
const { success, fail } = require('../utils/response');
const { handleValidation } = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 所有日记路由都需要登录
router.use(authMiddleware);

// 解析 JSON 字段的辅助函数
const parseJsonFields = (record) => {
  ['photos', 'tags', 'ai_tags', 'location'].forEach(field => {
    if (typeof record[field] === 'string') {
      try { record[field] = JSON.parse(record[field]); } catch { record[field] = null; }
    }
  });
  return record;
};

// ==================== GET /api/diary ====================
// 获取当前用户的美食日记列表
router.get('/', async (req, res) => {
  try {
    const { type, page = 1, limit = 50, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE d.user_id = ?';
    const params = [req.user.userId];

    // 筛选收藏
    if (type === 'favorite') {
      whereClause += ' AND d.is_favorite = 1';
    }
    // 筛选避雷
    else if (type === 'warning') {
      whereClause += ' AND d.is_warning = 1';
    }

    // 搜索
    if (search) {
      whereClause += ' AND (d.name LIKE ? OR d.note LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // 查询总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM food_diary d ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询列表
    const [rows] = await pool.query(
      `SELECT d.* FROM food_diary d ${whereClause}
       ORDER BY d.meal_time DESC, d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return success(res, {
      list: rows.map(parseJsonFields),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('获取日记列表失败:', err);
    return fail(res, '服务器错误', 500);
  }
});

// ==================== GET /api/diary/stats ====================
// 获取当前用户的统计数据
router.get('/stats', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_count,
         SUM(CASE WHEN is_favorite = 1 THEN 1 ELSE 0 END) as favorite_count,
         SUM(CASE WHEN is_warning = 1 THEN 1 ELSE 0 END) as warning_count
       FROM food_diary WHERE user_id = ?`,
      [req.user.userId]
    );

    const stats = rows[0];
    return success(res, {
      total: stats.total || 0,
      public: stats.public_count || 0,
      favorites: stats.favorite_count || 0,
      warnings: stats.warning_count || 0,
    });
  } catch (err) {
    console.error('获取统计数据失败:', err);
    return fail(res, '服务器错误', 500);
  }
});

// ==================== GET /api/diary/:id ====================
// 获取单条日记详情（自己的记录或公开记录均可查看）
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, u.nickname, u.avatar
       FROM food_diary d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return fail(res, '记录不存在', 404);
    }

    const record = rows[0];
    // 判断是否为记录所有者
    const isOwner = record.user_id === req.user.userId;

    // 允许访问条件：是自己的记录 OR 公开分享的记录
    if (!isOwner && !record.is_public) {
      return fail(res, '记录不存在', 404);
    }

    return success(res, {
      ...parseJsonFields(record),
      isOwner,
      author: isOwner ? undefined : { nickname: record.nickname, avatar: record.avatar },
    });
  } catch (err) {
    console.error('获取日记详情失败:', err);
    return fail(res, '服务器错误', 500);
  }
});

// ==================== POST /api/diary ====================
// 创建新日记
router.post('/', [
  body('name').trim().notEmpty().withMessage('请输入食物名称'),
  handleValidation,
], async (req, res) => {
  try {
    const {
      name, photos, video, note, mealTime, mealType,
      location, rating, price, tags, aiTags,
      isPublic, isFavorite, isWarning,
    } = req.body;

    // 安全数值转换，防止 DECIMAL 溢出
    const safeNum = (v, max) => {
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0) return 0
      return Math.min(n, max)
    }

    const [result] = await pool.query(
      `INSERT INTO food_diary
       (user_id, name, photos, video, note, meal_time, meal_type, location, rating, price, tags, ai_tags, is_public, is_favorite, is_warning)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.userId,
        name,
        photos ? JSON.stringify(photos) : null,
        video || null,
        note || '',
        mealTime ? new Date(mealTime) : new Date(),
        mealType || 'lunch',
        location ? JSON.stringify(location) : null,
        safeNum(rating, 5),
        safeNum(price, 99999999.99),
        tags ? JSON.stringify(tags) : null,
        aiTags ? JSON.stringify(aiTags) : null,
        isPublic !== undefined ? (isPublic ? 1 : 0) : 1,
        isFavorite ? 1 : 0,
        isWarning ? 1 : 0,
      ]
    );

    // 返回创建的记录
    const [rows] = await pool.query('SELECT * FROM food_diary WHERE id = ?', [result.insertId]);
    return success(res, parseJsonFields(rows[0]), '记录已创建', 201);
  } catch (err) {
    console.error('创建日记失败:', err);
    return fail(res, '服务器错误', 500);
  }
});

// ==================== PUT /api/diary/:id ====================
// 更新日记（仅本人）
router.put('/:id', async (req, res) => {
  try {
    // 确认是本人的记录
    const [existing] = await pool.query(
      'SELECT id FROM food_diary WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    if (existing.length === 0) {
      return fail(res, '记录不存在或无权编辑', 404);
    }

    const allowedFields = [
      'name', 'photos', 'video', 'note', 'meal_time', 'meal_type',
      'location', 'rating', 'price', 'tags', 'ai_tags',
      'is_public', 'is_favorite', 'is_warning',
    ];
    const jsonFields = ['photos', 'tags', 'ai_tags', 'location'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      // 映射 camelCase 到 snake_case
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
      const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

      let value = req.body[field] !== undefined ? req.body[field] : req.body[camelField];

      if (value !== undefined) {
        updates.push(`\`${dbField}\` = ?`);
        if (jsonFields.includes(field) && value !== null) {
          values.push(JSON.stringify(value));
        } else if (['is_public', 'is_favorite', 'is_warning'].includes(field)) {
          values.push(value ? 1 : 0);
        } else if (dbField === 'meal_time' && value) {
          values.push(new Date(value));
        } else {
          values.push(value);
        }
      }
    }

    if (updates.length === 0) {
      return fail(res, '没有需要更新的字段');
    }

    values.push(req.params.id);
    await pool.query(
      `UPDATE food_diary SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // 返回更新后的记录
    const [rows] = await pool.query('SELECT * FROM food_diary WHERE id = ?', [req.params.id]);
    return success(res, parseJsonFields(rows[0]), '记录已更新');
  } catch (err) {
    console.error('更新日记失败:', err);
    return fail(res, '服务器错误', 500);
  }
});

// ==================== DELETE /api/diary/:id ====================
// 删除日记（仅本人）
router.delete('/:id', async (req, res) => {
  try {
    const [existing] = await pool.query(
      'SELECT id FROM food_diary WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    if (existing.length === 0) {
      return fail(res, '记录不存在或无权删除', 404);
    }

    await pool.query('DELETE FROM food_diary WHERE id = ?', [req.params.id]);
    return success(res, null, '记录已删除');
  } catch (err) {
    console.error('删除日记失败:', err);
    return fail(res, '服务器错误', 500);
  }
});

module.exports = router;
