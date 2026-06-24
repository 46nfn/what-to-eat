-- ============================================
-- 这顿吃什么 - 数据库初始化脚本
-- 运行方式: node config/initDb.js
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名，登录用',
  `password` VARCHAR(255) NOT NULL COMMENT 'bcrypt 加密密码',
  `nickname` VARCHAR(50) DEFAULT '美食家' COMMENT '昵称',
  `avatar` VARCHAR(10) DEFAULT '🍜' COMMENT '头像 emoji',
  `bio` VARCHAR(200) DEFAULT '唯美食与爱不可辜负' COMMENT '个性签名',
  `taste_prefs` JSON COMMENT '口味偏好数组',
  `allergies` JSON COMMENT '忌口/过敏数组',
  `addresses` JSON COMMENT '常用地址数组 [{name, address}]',
  `budget_range` JSON COMMENT '预算范围 [min, max]',
  `alt_foods` JSON COMMENT '备选食物清单数组',
  `theme` VARCHAR(20) DEFAULT 'light' COMMENT '主题偏好',
  `font_size` VARCHAR(10) DEFAULT 'medium' COMMENT '字体大小',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 美食日记表
CREATE TABLE IF NOT EXISTS `food_diary` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '所属用户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '食物名称',
  `photos` JSON COMMENT '照片 base64/dataURL 数组',
  `video` VARCHAR(500) COMMENT '视频路径',
  `note` TEXT COMMENT '备注/笔记',
  `meal_time` DATETIME COMMENT '用餐时间',
  `meal_type` VARCHAR(20) DEFAULT 'lunch' COMMENT '餐段: breakfast/lunch/dinner/supper',
  `location` JSON COMMENT '位置信息 {name, address, lat, lng}',
  `rating` DECIMAL(2,1) DEFAULT 0 COMMENT '评分 0-5',
  `price` DECIMAL(10,2) DEFAULT 0 COMMENT '价格',
  `tags` JSON COMMENT '手动标签数组',
  `ai_tags` JSON COMMENT 'AI 自动标签数组',
  `is_public` TINYINT(1) DEFAULT 1 COMMENT '是否公开到社区',
  `is_favorite` TINYINT(1) DEFAULT 0 COMMENT '是否收藏',
  `is_warning` TINYINT(1) DEFAULT 0 COMMENT '是否避雷',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  -- PlanetScale 不支持 FOREIGN KEY，引用完整性由应用层保证
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_meal_time` (`meal_time`),
  INDEX `idx_is_public` (`is_public`),
  INDEX `idx_user_favorite` (`user_id`, `is_favorite`),
  INDEX `idx_user_warning` (`user_id`, `is_warning`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='美食日记表';

-- 社区互动表（点赞/收藏）
CREATE TABLE IF NOT EXISTS `community_interactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `diary_id` INT NOT NULL COMMENT '美食日记ID',
  `user_id` INT NOT NULL COMMENT '互动用户ID',
  `type` ENUM('like', 'save') NOT NULL COMMENT '互动类型: like=点赞, save=收藏',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '互动时间',
  -- PlanetScale 不支持 FOREIGN KEY，引用完整性由应用层保证
  UNIQUE KEY `uk_diary_user_type` (`diary_id`, `user_id`, `type`),
  INDEX `idx_diary_id` (`diary_id`),
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='社区互动表';
