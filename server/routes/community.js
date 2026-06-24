/**
 * 社区路由 - 公开分享 / 互动（点赞、收藏）
 */
const express = require('express');
const { query } = require('express-validator');
const pool = require('../config/db');
const { success, fail } = require('../utils/response');
const { handleValidation } = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 解析 JSON 字段
const parseJsonFields = (record) => {
  ['photos', 'tags', 'ai_tags', 'location'].forEach(field => {
    if (typeof record[field] === 'string') {
      try { record[field] = JSON.parse(record[field]); } catch { record[field] = null; }
    }
  });
  return record;
};

// ==================== GET /api/community ====================
// 获取公开的美食日记（社区广场）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = "WHERE d.is_public = 1";
    const params = [];

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

    // 查询列表，关联用户信息和互动数
    const [rows] = await pool.query(
      `SELECT d.*, u.nickname, u.avatar,
        (SELECT COUNT(*) FROM community_interactions WHERE diary_id = d.id AND type = 'like') as like_count,
        (SELECT COUNT(*) FROM community_interactions WHERE diary_id = d.id AND type = 'save') as save_count
       FROM food_diary d
       JOIN users u ON d.user_id = u.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // 如果用户已登录，标记当前用户是否已点赞/收藏
    const userId = req.headers.authorization
      ? (() => {
          try {
            const jwt = require('jsonwebtoken');
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded.userId;
          } catch { return null; }
        })()
      : null;

    let interactionMap = {};
    if (userId) {
      const [interactions] = await pool.query(
        'SELECT diary_id, type FROM community_interactions WHERE diary_id IN (SELECT id FROM food_diary d ' + whereClause + ') AND user_id = ?',
        [...params, userId]
      );
      interactions.forEach(i => {
        if (!interactionMap[i.diary_id]) interactionMap[i.diary_id] = {};
        interactionMap[i.diary_id][i.type] = true;
      });
    }

    const list = rows.map(r => ({
      ...parseJsonFields(r),
      likeCount: r.like_count || 0,
      saveCount: r.save_count || 0,
      isLiked: interactionMap[r.id]?.like || false,
      isSaved: interactionMap[r.id]?.save || false,
      author: { nickname: r.nickname, avatar: r.avatar },
    }));

    return success(res, {
      list,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('获取社区列表失败:', err);
    return fail(res, '服务器错误', 500);
  }
});

// ==================== 需要登录的互动接口 ====================
router.use(authMiddleware);

// ==================== POST /api/community/:diaryId/like ====================
// 切换点赞
router.post('/:diaryId/like', async (req, res) => {
  try {
    const { diaryId } = req.params;
    const userId = req.user.userId;

    // 检查日记是否存在且公开
    const [diary] = await pool.query(
      'SELECT id, is_public FROM food_diary WHERE id = ?',
      [diaryId]
    );
    if (diary.length === 0) {
      return fail(res, '记录不存在', 404);
    }
    if (!diary[0].is_public) {
      return fail(res, '该记录未公开', 400);
    }

    // 检查是否已点赞
    const [existing] = await pool.query(
      'SELECT id FROM community_interactions WHERE diary_id = ? AND user_id = ? AND type = ?',
      [diaryId, userId, 'like']
    );

    let liked;
    if (existing.length > 0) {
      // 取消点赞
      await pool.query('DELETE FROM community_interactions WHERE id = ?', [existing[0].id]);
      liked = false;
    } else {
      // 点赞
      await pool.query(
        'INSERT INTO community_interactions (diary_id, user_id, type) VALUES (?, ?, ?)',
        [diaryId, userId, 'like']
      );
      liked = true;
    }

    // 获取最新点赞数
    const [countResult] = await pool.query(
      "SELECT COUNT(*) as count FROM community_interactions WHERE diary_id = ? AND type = 'like'",
      [diaryId]
    );

    return success(res, {
      liked,
      likeCount: countResult[0].count,
    }, liked ? '已点赞' : '已取消点赞');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return fail(res, '请勿重复操作', 409);
    }
    console.error('点赞操作失败:', err);
    return fail(res, '服务器错误', 500);
  }
});

// ==================== POST /api/community/:diaryId/save ====================
// 切换收藏（社区广场收藏别人分享的美食）
router.post('/:diaryId/save', async (req, res) => {
  try {
    const { diaryId } = req.params;
    const userId = req.user.userId;

    // 检查日记是否存在且公开
    const [diary] = await pool.query(
      'SELECT id, is_public FROM food_diary WHERE id = ?',
      [diaryId]
    );
    if (diary.length === 0) {
      return fail(res, '记录不存在', 404);
    }
    if (!diary[0].is_public) {
      return fail(res, '该记录未公开', 400);
    }

    // 检查是否已收藏
    const [existing] = await pool.query(
      'SELECT id FROM community_interactions WHERE diary_id = ? AND user_id = ? AND type = ?',
      [diaryId, userId, 'save']
    );

    let saved;
    if (existing.length > 0) {
      await pool.query('DELETE FROM community_interactions WHERE id = ?', [existing[0].id]);
      saved = false;
    } else {
      await pool.query(
        'INSERT INTO community_interactions (diary_id, user_id, type) VALUES (?, ?, ?)',
        [diaryId, userId, 'save']
      );
      saved = true;
    }

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as count FROM community_interactions WHERE diary_id = ? AND type = 'save'",
      [diaryId]
    );

    return success(res, {
      saved,
      saveCount: countResult[0].count,
    }, saved ? '已收藏' : '已取消收藏');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return fail(res, '请勿重复操作', 409);
    }
    console.error('收藏操作失败:', err);
    return fail(res, '服务器错误', 500);
  }
});

module.exports = router;
