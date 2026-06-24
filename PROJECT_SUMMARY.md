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

### 前端踩过的坑

| 问题 | 表现 | 原因 | 修复 |
|------|------|------|------|
| **StarRating 控制台报 `model` 未定义** | 选中评分没反应，控制台黄色警告 | prop 名叫 `modelValue`，模板里写成了 `model` | 模板统一改为 `modelValue` |
| **日记请求 `/diary/1` 404** | 日记详情、编辑、删除全崩 | 请求路径少了 `/api` 前缀，Vite/Nginx 代理只拦 `/api/*` | `useRecords.js` 6 处全部补 `/api` 前缀 |
| **社区广场空荡荡** | 明明有公开日记但列表空的，搜索才有结果 | `URLSearchParams` 把 `undefined` 序列化成字符串 `"undefined"`，后端 LIKE 匹配啥也搜不到 | `api/index.js` 全局过滤 `undefined/null` 参数 |
| **勾选"公开分享"不生效** | 社区查不到自己刚发的日记 | `{...form}` 展开 Vue reactive 代理，checkbox 值被吞掉或变字符串 | `RecordPage.vue` 手动逐字段构造 + `!!` 显式布尔转换 |
| **别人帖子点进去"记录不存在"** | 社区广场能列出来但点进去 404 | 后端 `GET /api/diary/:id` 校验了 `user_id`，不是自己发的就拒绝 | 改为：自己的记录 OR 公开记录都放行，返回 `isOwner` 前端据此隐藏编辑按钮 |
| **`/api/api/` 路径重复** | 注册登录 404 | `baseURL='/api'` + `endpoint='/api/auth'` = `/api/api/auth` | baseURL 清空为空字符串 |
| **注册/登录成功但没 token** | 注册完又退回登录页，日记存不了 | `useAuth.js` 的 `saveAuth()` 没校验 `data.token` 是否存在就写入 | 加 token 为空拒绝 + 存储后同步验证 + try-catch 兜底 |
| **提交日记 `price` 字段 500** | 创建日记失败 | 用户空输入或粘贴超大数字，`DECIMAL(10,2)` 溢出 | 前后端各加 `safeNum(v, max)` 防御 |
| **上线后浏览器 JS 报 `MIME type text/plain`** | 页面白屏，控制台红色报模块加载失败 | Nginx 主配置漏了 `include mime.types`，`.js` 文件被当文本返回 | 补 `include /etc/nginx/mime.types` |
| **上线后"应用未能加载，请本地 npm run dev"** | 浏览器显示开发提示页面 | `.env.production` 里 `VITE_API_BASE=__FLY_IO_URL__` 是占位符，请求全打到假地址 | 清空为 `VITE_API_BASE=`，走相对路径 |
| **创建日记 `POST /diary` 405** | 网络面板红色 405 | dist/ 是旧的，没重建，还是老代码的 `/diary` 路径 | `git pull` 拉新代码后必须 `npm run build` 重建前端 |

### 前端崩了速查

> 原则：**前端问题 90% 是 dist 没重建**，先跑 `npm run build` 再看。

| 现象 | 最可能原因 | 修复 |
|------|-----------|------|
| 页面白屏，控制台 `MIME type text/plain` | Nginx 缺 mime.types | `grep 'mime.types' /etc/nginx/nginx.conf`，没有就补 |
| "应用未能加载，请本地 npm run dev" | `VITE_API_BASE` 填了假地址 | `grep VITE_API_BASE .env.production`，应为空 |
| 接口 405 Method Not Allowed | dist 是旧代码，路径没 `/api` 前缀 | `git pull && npm run build` |
| 某功能改了但线上没反应 | 浏览器缓存了旧 JS | `Ctrl+Shift+R` 强制刷新 |
| 社区广场空的 | 确认有 `is_public=1` 数据 + 前端参数不传 `undefined` | 已修，`git pull` 即可 |

### 后端崩了速查

> 线上后端本身是稳定的（systemd 守护 + 崩溃自重启），以下为部署期间遇到的踩坑记录，以后再蹦直接查这个表。

| 报错关键字 | 原因 | 修复命令 |
|-----------|------|---------|
| `HANDSHAKE_NO_SSL_SUPPORT` | db.js 配了 SSL，MariaDB 本地不支持 | 确保 `db.js` 没有 `ssl:` 那行；已推 GitHub 修了，`git pull` 不会再覆盖 |
| `EADDRINUSE :::3001` | 旧 node 进程残留占端口 | `systemctl stop what-to-eat; kill $(lsof -t -i:3001) 2>/dev/null; systemctl start what-to-eat` |
| git pull 卡住不动 | `.env` 冲突（本地和仓库都有） | `git fetch origin master && git reset --hard origin/master` |
| `MODULE_NOT_FOUND mysql2/promise` | `npm install` 没跑 | `cd /opt/what-to-eat/server && npm install` |
| env 变量丢失 | 连接断开后没 `tee .env` 重写 | `tee /opt/what-to-eat/server/.env` 粘 10 行进去，按 Ctrl+D |

**核心原则：** 代码 bug 修完后第一时间推到 GitHub，别再手改服务器文件。`git reset --hard` 拉最新代码 + `npm run build` 重建前端 + `systemctl restart what-to-eat` 重启后端，三步走。

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

### 日常维护命令速查

```bash
# 后端挂了？
systemctl restart what-to-eat

# 后端活着没？
curl http://localhost:3001/api/health

# 看报错
journalctl -u what-to-eat -n 10 --no-pager

# 前端改了什么需要生效？
cd /opt/what-to-eat && git pull && npm run build

# 三大服务状态全查
systemctl status mariadb nginx what-to-eat
```

### 更新代码（以后用这个）

```bash
ssh 远程连接
sudo -i
cd /opt/what-to-eat && git pull && npm run build
systemctl restart what-to-eat
```

---

## 五、改进路线图

### 优先级 P0：安全 & 基础（上线前必做）

| 改进 | 说明 |
|------|------|
| 🔒 **HTTPS** | 域名审核过就配，没 HTTPS 没人敢注册 |
| 📱 **移动端适配** | 照片上传、评分组件、社区瀑布流在小屏上的体验完善 |
| 🔑 **密码重置** | "忘记密码"——没有这个功能，密码丢了永久登不了 |
| ❌ **注销用户** | 用户有权删除自己的账号和数据 |

### 优先级 P1：体验打磨

| 改进 | 说明 |
|------|------|
| 🎨 **排版顺眼** | 字体大小、间距、卡片圆角统一，中文排版对齐，移动端 readability |
| 📷 **图片存储改造** | 当前 base64 塞数据库会爆炸 → 接 Cloudflare R2（免费 10GB）存 URL |
| 🏠 **首页空状态** | 新用户注册完看到空白——加引导："写第一条日记""看大家都在吃什么" |
| ⏳ **加载状态** | 统一每个页面的 loading/empty/error 三态，网络慢时也不慌 |
| 💬 **错误提示人性化** | 把 `console.warn` 技术报错改成用户能懂的中文："用户名已存在"而非"服务器错误" |
| 📜 **用户守则** | 社区友好风气、维护权益、禁止恶意内容、举报机制 |

### 优先级 P2：功能深化

| 改进 | 说明 |
|------|------|
| 🍳 **识别经典菜** | 用户记录一道经典菜（如宫保鸡丁）→ AI 自动补全：制作方法 + 历史由来 + 所属菜系文化，借美食传播中华文化 |
| 🥗 **健康饮食 AI 守护** | 根据日记记录分析营养结构 → 提醒偏食/热量超标 → 给出均衡建议，AI 守护健康生活 |
| 📍 **地址定位完善** | 精确地图选址 + 餐厅数据库匹配 + "附近热门""我常去的"标签 |
| 🤖 **AI 对话增强** | "帮我从最近日记排个名""生成本周美食报告" |
| 💬 **社区评论** | 不仅是点赞收藏，能留言交流 |
| 📊 **数据可视化** | 本周菜系饼图、评分趋势、花费统计——用户留存的钩子 |
| 🔔 **通知** | PWA 浏览器通知：有人点赞了你的日记 |

### 优先级 P3：增长 & 传播

| 改进 | 说明 |
|------|------|
| 📤 **分享卡片** | 分享到朋友圈生成带照片+评分+二维码的图片 |
| 👥 **邀请机制** | 朋友通过链接注册，双方拿徽章 |
| 🖥️ **产品介绍页** | 单页网站介绍 App（不是现在就做，等产品打磨到敢推给朋友时再做）|

### 产品介绍页（后续计划）

等核心功能打磨完毕，可以做一个单页介绍站：

- **结构**：App 名称 + 一句话 + 三张截图轮播 → 三个功能卡片（转盘/AI/社区）→ 底部打开链接
- **技术**：一个纯 HTML + Tailwind CDN 就够，或直接在现有 Vue 项目加 `/about` 路由
- **托管**：同一台服务器另一个路径，零额外成本
- **域名**：chanjie.xyz 够用，不用再买

---

## 六、当前状态

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
- [ ] ❌ 注销用户
- [ ] 📜 用户守则
- [ ] 🍳 经典菜识别 + 中华文化
- [ ] 🥗 健康饮食 AI 守护
- [ ] 📍 地址定位完善
- [ ] 🎨 排版优化

---

## 七、One More Thing

**这个项目证明了一件事：**

> 一个人 + 飞书聊想法 + 豆包出提示词 + Claude Code 写代码 + 阿里云一台服务器 = 一个能用的全栈产品

不需要团队，不需要后端开发，不需要运维，不需要 UI 设计师。**想法 → AI → 产品**，这条链路已经通了。

---

> 📅 创建时间：2026 年 6 月
> 📍 在线地址：http://47.107.98.238
> 🏷️ 域名：chanjie.xyz（审核中）
