/**
 * JWT 鉴权中间件
 * 从 Authorization: Bearer <token> 中解析用户信息
 */
const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, '未提供认证令牌', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, username }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return fail(res, '登录已过期，请重新登录', 401);
    }
    return fail(res, '无效的认证令牌', 401);
  }
};

module.exports = authMiddleware;
