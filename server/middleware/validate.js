/**
 * 输入验证中间件（基于 express-validator）
 */
const { validationResult } = require('express-validator');
const { fail } = require('../utils/response');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msgs = errors.array().map(e => e.msg);
    return fail(res, msgs.join('; '), 422);
  }
  next();
};

module.exports = { handleValidation };
