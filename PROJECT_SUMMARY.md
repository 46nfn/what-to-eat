# 🍜 「这顿吃什么」项目总结

> 从想法到上线，一个全栈美食记录 & 决策轻社区的诞生全程

---

## 一、这个项目是什么

一个手机/电脑都能用的美食记录社区，核心三件事：

| 功能 | 说明 |
|------|------|
| **🎲 天帮我选** | 随机转盘帮你决定今天吃什么，3D 效果 |
| **🤖 AI 美食对话** | 接 DeepSeek API，根据你的口味/预算/忌口推荐，离线自动降级本地引擎 |
| **📖 美食日记** | 拍照、评分、打标签、标位置，时间线/相册/地图三视图切换 |
| **🌍 社区广场** | 公开日记分享给所有人，点赞收藏互动 |
| **🔐 账号系统** | JWT 登录注册，路由守卫，私密/公开日记分离 |
| **📱 可安装** | PWA 支持，手机/桌面都能装到桌面像 App 一样用 |

一句话：**解决"今天吃啥"的日常问题，记录每个人的美食地图。**

---

## 二、技术架构

### 整体结构

```
用户浏览器 / 手机
       │
       ▼
   Nginx（80 端口，守门员）
       │
       ├─→ /api/*  →  Express 后端（3001 端口）
       │                    │
       │                    └→  MariaDB 数据库
       │
       └─→ 其他请求 →  前端静态文件（Vue3 打包产物）
```

### 技术栈一览

| 层 | 技术 | 干什么的 |
|----|------|---------|
| **前端框架** | Vue 3 + Composition API | 所有页面和交互逻辑 |
| **样式** | TailwindCSS | 美食暖色调，深色模式，不用手写 CSS |
| **构建** | Vite 8 | 极速开发构建 |
| **路由** | Vue Router（Hash 模式） | 页面跳转，登录守卫 |
| **HTTP** | 原生 fetch 封装 | 自己写的请求层，baseURL 空字符串，相对路径 |
| **后端** | Express 4.x | Node.js 框架，处理注册/登录/日记/社区 |
| **鉴权** | JWT（jsonwebtoken） | Token 存在 localStorage，每次请求自动带 |
| **密码加密** | bcryptjs | 10 轮盐哈希，数据库不存明文 |
| **数据库** | MariaDB（MySQL 兼容）| 3 张核心表 |
| **Web 服务器** | Nginx | 前后端统一入口 + 反向代理 |
| **进程守护** | systemd | 后端崩了 3 秒自动重启，开机自启 |
| **PWA** | vite-plugin-pwa + Workbox | 离线缓存，可安装，手机端类原生体验 |
| **AI** | DeepSeek API | 美食推荐对话，离线自动降级本地规则引擎 |
| **桌面端（可选）** | Electron + electron-builder | 打包 Windows .exe 安装包 |
| **部署** | 阿里云轻量服务器 | 2核4G，Alibaba Cloud Linux 3，¥34/月 |

### 数据库设计

```
users                    food_diary              community_interactions
├─ id                   ├─ id                    ├─ id
├─ username             ├─ user_id ──────────────├─ diary_id
├─ password (bcrypt)    ├─ name                  ├─ user_id
├─ nickname             ├─ photos (JSON)         ├─ type (like/save)
├─ avatar               ├─ video                 └─ created_at
├─ bio                  ├─ note
├─ taste_prefs (JSON)   ├─ meal_time
├─ allergies (JSON)     ├─ meal_type
├─ addresses (JSON)     ├─ location (JSON)
├─ budget_range (JSON)  ├─ rating
├─ alt_foods (JSON)     ├─ price
├─ theme                ├─ tags (JSON)
├─ font_size            ├─ ai_tags (JSON)
├─ created_at            ├─ is_public
└─ updated_at            ├─ is_favorite
                         ├─ is_warning
                         ├─ created_at
                         └─ updated_at
```

---

## 三、开发流程——我是怎么做的

### 我的开发方式

```
飞书 nanobot 聊想法
    │
    ▼
豆包生成 AI 提示词
    │
    ▼
Claude Code 调用 DeepSeek 接口执行代码
```

**不是传统的：搜文档 → 看教程 → 自己敲 → 调试**

**而是：说人话 → AI 写代码 → 验证 → 上线**

### 开发时间线

| 阶段 | 内容 | 方式 |
|------|------|------|
| **想法阶段** | "想要一个美食记录 App，有 AI 推荐，有社区" | 飞书 nanobot 聊需求 |
| **原型设计** | 页面布局、配色、功能清单 | 豆包给提示词画原型 |
| **编码实现** | 前端 Vue3 页面 → 后端 Express API → 数据库 | Claude Code 生成代码，我验证 |
| **联调修复** | 代理配置、401 鉴权、isPublic 入库、路径补 /api、社区搜索 undefined bug、他人帖子 404、price DECIMAL 溢出 | Claude Code 排查修复 |
| **部署上线** | 阿里云服务器、MariaDB、Nginx、systemd 进程守护 | Claude Code 指导配通 |

### 踩过的坑

| 坑 | 原因 | 解决 |
|----|------|------|
| `/api/api/` 路径 404 | baseURL 和 endpoint 都写了 /api | baseURL 清空 |
| `/diary/1` 404 | 没加 /api 前缀，Vite 代理不拦截 | 全局补 /api 前缀 |
| StarRating `model` 未定义 | prop 名 `modelValue`，模板写成 `model` | 改为 modelValue |
| 勾选公开但社区查不到 | `{...reactive}` 代理，`URLSearchParams(undefined)` 变 `"undefined"` | 手动构造对象，过滤空参数 |
| 别人帖子点进去 404 | `GET /api/diary/:id` 校验 `user_id` | 改为自己的记录或公开的都放行 |
| 注册 500 崩 | db.js 加了 SSL，MariaDB 本地不支持 | 移除 SSL 配置 |
| 提交日记 `price` 溢出 | `DECIMAL(10,2)` + NaN/sci-notation | 前后端 safeNum 防御 |
| 部署后前端 405/JS 加载失败 | `git pull` 覆盖修复 + dist 没重建 + Nginx 缺 mime.types | 修完就推 GitHub，pull 后 rebuild |

---

## 四、部署上线

### 部署位置

```
服务器：阿里云轻量 2核4G，¥34/月
系统：Alibaba Cloud Linux 3
地址：http://47.107.98.238
域名：chanjie.xyz（¥7/年，审核中，后将配 HTTPS）
```

### 部署步骤复盘

| 步骤 | 做了什么 |
|------|---------|
| 1 | 阿里云买轻量服务器 |
| 2 | 装 Node.js 20 + MariaDB |
| 3 | git clone 代码 |
| 4 | 初始化数据库表 |
| 5 | 写 .env 环境变量 |
| 6 | 配 systemd 进程守护 |
| 7 | 装 Nginx 反代前后端 |
| 8 | 加 mime.types 让 JS 正常加载 |
| 9 | npm run build 构建前端 |
| 10 | 浏览器能开 → 能用 |

### 以后更新代码

```bash
ssh 远程连接
sudo -i
cd /opt/what-to-eat && git pull && npm run build
systemctl restart what-to-eat
```

---

## 五、当前状态 & 待办

### ✅ 已完成

- [x] 注册/登录（JWT + bcrypt）
- [x] 美食记录 CRUD
- [x] 日记时间线/相册/地图三视图
- [x] 社区广场 + 点赞收藏
- [x] AI 美食推荐（DeepSeek + 本地降级）
- [x] 随机转盘
- [x] PWA 可安装
- [x] Electron 桌面打包
- [x] 阿里云服务器部署上线
- [x] systemd 进程守护（崩了自重启）
- [ ] 🔒 HTTPS 加密（等域名审核通过）

### 📋 后续优化

- [ ] 域名审核过 → 配 SSL 证书 → HTTPS
- [ ] 图片改存储对象存储（目前存 base64 显性膨胀）
- [ ] 移动端适配优化
- [ ] 加 UptimeRobot 免费监控
- [ ] 备案（如需要微信访问）

---

## 六、One More Thing

**这个项目证明了一件事：**

> 一个人 + 飞书聊想法 + 豆包出提示词 + Claude Code 写代码 + 阿里云一台服务器 = 一个能用的全栈产品

不需要团队，不需要后端开发，不需要运维，不需要 UI 设计师。**想法 → AI → 产品**，这条链路已经通了。

---

> 📅 创建时间：2026 年 6 月
> 📍 在线地址：http://47.107.98.238
> 🏷️ 域名：chanjie.xyz（审核中）
