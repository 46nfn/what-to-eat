# 🍜 这顿吃什么 - 阿里云轻量 ECS 部署指南

> 本文档详细说明如何将「这顿吃什么」后端服务部署到阿里云轻量应用服务器。

---

## 📋 目录

1. [服务器环境准备](#1-服务器环境准备)
2. [安装 Node.js](#2-安装-nodejs)
3. [安装并配置 MySQL](#3-安装并配置-mysql)
4. [部署后端服务](#4-部署后端服务)
5. [配置 PM2 常驻进程](#5-配置-pm2-常驻进程)
6. [配置 Nginx 反向代理](#6-配置-nginx-反向代理)
7. [域名与 HTTPS 配置](#7-域名与-https-配置)
8. [前端部署](#8-前端部署)
9. [日常运维](#9-日常运维)

---

## 1. 服务器环境准备

### 1.1 购买阿里云轻量应用服务器

1. 登录 [阿里云控制台](https://ecs.console.aliyun.com/)
2. 选择「轻量应用服务器」→「创建服务器」
3. 推荐配置：
   - **地域**：选择离用户最近的区域（如华东1·杭州）
   - **镜像**：系统镜像 → Ubuntu 22.04 LTS（或 CentOS 7.9）
   - **套餐**：2核2GB内存起步（约 ¥68/月）
   - **数据盘**：40GB ESSD

### 1.2 服务器安全组配置

在阿里云控制台 → 安全 → 防火墙，开放以下端口：

| 端口 | 协议 | 说明 |
|------|------|------|
| 22   | TCP  | SSH 远程连接 |
| 80   | TCP  | HTTP（用于 Let's Encrypt 验证） |
| 443  | TCP  | HTTPS |
| 3001 | TCP  | 后端 API（可选，Nginx 代理后可关闭） |

### 1.3 SSH 登录服务器

```bash
# 使用阿里云控制台提供的远程连接，或本地终端：
ssh root@<服务器公网IP>

# 首次登录后，建议更新系统
sudo apt update && sudo apt upgrade -y   # Ubuntu
# 或
sudo yum update -y                       # CentOS

# 安装基础工具
sudo apt install -y curl wget git vim build-essential
```

---

## 2. 安装 Node.js

### 2.1 使用 NodeSource 安装 Node.js 20 LTS

```bash
# Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# CentOS
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### 2.2 验证安装

```bash
node --version   # 应显示 v20.x.x
npm --version    # 应显示 10.x.x
```

### 2.3 配置 npm 镜像（可选，加速国内下载）

```bash
npm config set registry https://registry.npmmirror.com
```

---

## 3. 安装并配置 MySQL

### 3.1 安装 MySQL 8.0

```bash
# Ubuntu
sudo apt install -y mysql-server

# CentOS
sudo yum install -y mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld

# 首次启动后获取临时密码（CentOS）
sudo grep 'temporary password' /var/log/mysqld.log
```

### 3.2 安全初始化

```bash
# Ubuntu
sudo mysql_secure_installation

# CentOS（使用临时密码登录后）
sudo mysql_secure_installation
```

安全初始化选项：
```
- VALIDATE PASSWORD COMPONENT: N (密码策略可根据需要选择)
- New password: <设置强密码，如 What2Eat@2024!>
- Remove anonymous users: Y
- Disallow root login remotely: Y
- Remove test database: Y
- Reload privilege tables: Y
```

### 3.3 创建数据库和用户

```bash
# 登录 MySQL
sudo mysql -u root -p
```

在 MySQL 命令行中执行：

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS what_to_eat
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 创建专用用户（替换 your_password 为强密码）
CREATE USER 'eat_user'@'localhost' IDENTIFIED BY 'your_password_here';

-- 授权
GRANT ALL PRIVILEGES ON what_to_eat.* TO 'eat_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

### 3.4 初始化数据表

```bash
# 后续部署代码后执行
cd /opt/what-to-eat/server
node config/initDb.js
```

---

## 4. 部署后端服务

### 4.1 上传代码到服务器

```bash
# 在服务器上创建目录
sudo mkdir -p /opt/what-to-eat
sudo chown $USER:$USER /opt/what-to-eat

# 方法一：使用 git（推荐）
cd /opt
git clone <你的仓库地址> what-to-eat

# 方法二：使用 scp 上传（在本地终端执行）
# scp -r ./server root@<服务器IP>:/opt/what-to-eat/
# scp -r ./dist root@<服务器IP>:/opt/what-to-eat/
```

### 4.2 配置环境变量

```bash
cd /opt/what-to-eat/server

# 编辑 .env 文件
vim .env
```

修改以下配置：

```bash
# 服务器配置
PORT=3001
NODE_ENV=production

# 数据库配置（使用上一步创建的用户和密码）
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=eat_user
DB_PASSWORD=your_password_here
DB_NAME=what_to_eat

# JWT 密钥（⚠️ 务必修改为随机字符串！）
# 生成随机密钥: openssl rand -base64 32
JWT_SECRET=生成的随机密钥
JWT_EXPIRES_IN=7d

# CORS 允许的前端域名（生产环境填写实际域名）
CORS_ORIGINS=https://你的域名.com
```

### 4.3 安装依赖并初始化数据库

```bash
cd /opt/what-to-eat/server
npm install --production
node config/initDb.js
```

看到 `✅ 数据库表初始化完成` 说明成功。

### 4.4 测试运行

```bash
# 先手动启动测试
node app.js

# 看到以下输出说明成功：
# 🍜  这顿吃什么 - 后端服务已启动
# 📡  地址: http://localhost:3001
```

按 `Ctrl+C` 停止，接下来用 PM2 管理进程。

---

## 5. 配置 PM2 常驻进程

### 5.1 安装 PM2

```bash
sudo npm install -g pm2
```

### 5.2 启动应用

```bash
cd /opt/what-to-eat/server
pm2 start app.js --name "what-to-eat-api" --time

# 查看运行状态
pm2 status

# 查看日志
pm2 logs what-to-eat-api
```

### 5.3 设置开机自启

```bash
# 生成启动脚本
pm2 startup

# 根据提示执行输出的 sudo 命令，例如：
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# 保存当前 PM2 进程列表
pm2 save
```

### 5.4 PM2 常用命令

```bash
pm2 status              # 查看所有应用状态
pm2 logs <app-name>     # 查看日志
pm2 restart <app-name>  # 重启应用
pm2 stop <app-name>     # 停止应用
pm2 delete <app-name>   # 删除应用
pm2 monit               # 实时监控面板
pm2 reload all          # 零停机重启所有应用
```

---

## 6. 配置 Nginx 反向代理

### 6.1 安装 Nginx

```bash
# Ubuntu
sudo apt install -y nginx

# CentOS
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6.2 配置站点

创建 Nginx 配置文件：

```bash
sudo vim /etc/nginx/sites-available/what-to-eat
```

写入以下内容：

```nginx
# 后端 API 代理
server {
    listen 80;
    server_name api.你的域名.com;   # 替换为实际域名

    # 日志
    access_log /var/log/nginx/what-to-eat-api.log;
    error_log  /var/log/nginx/what-to-eat-api-error.log;

    # 客户端请求体大小限制（图片 base64 较大）
    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 前端静态文件
server {
    listen 80;
    server_name 你的域名.com;        # 替换为实际域名
    root /opt/what-to-eat/dist;
    index index.html;

    # 日志
    access_log /var/log/nginx/what-to-eat-web.log;
    error_log  /var/log/nginx/what-to-eat-web-error.log;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 256;
}
```

### 6.3 启用站点

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/what-to-eat /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 7. 域名与 HTTPS 配置

### 7.1 域名解析

在域名 DNS 管理中添加 A 记录：

| 记录类型 | 主机记录 | 记录值 | TTL |
|----------|----------|--------|-----|
| A        | @        | 服务器公网IP | 600 |
| A        | api      | 服务器公网IP | 600 |

等待 DNS 生效（通常几分钟）。

### 7.2 使用 Certbot 申请免费 SSL 证书

```bash
# 安装 Certbot
# Ubuntu
sudo apt install -y certbot python3-certbot-nginx

# CentOS
sudo yum install -y certbot python3-certbot-nginx

# 申请证书（自动配置 Nginx）
sudo certbot --nginx -d 你的域名.com -d api.你的域名.com

# 按提示输入邮箱，同意条款
# 选择是否自动重定向 HTTP → HTTPS（推荐选 2：Redirect）
```

### 7.3 证书自动续期

Certbot 默认会自动续期，验证一下：

```bash
# 测试自动续期
sudo certbot renew --dry-run

# 查看定时任务
sudo systemctl status certbot.timer
```

### 7.4 更新环境变量

SSL 配置完成后，更新后端 `.env` 的 CORS 配置：

```bash
# 编辑 /opt/what-to-eat/server/.env
CORS_ORIGINS=https://你的域名.com

# 重启后端
pm2 restart what-to-eat-api
```

---

## 8. 前端部署

### 8.1 构建前端

在本地开发机执行：

```bash
cd E:\aiaiai\这顿吃什么

# 设置生产环境 API 地址
# 编辑 .env 或直接设置环境变量：
# VITE_API_BASE=https://api.你的域名.com

# 构建
npm run build
```

### 8.2 上传到服务器

```bash
# 方法一：scp（本地执行）
scp -r ./dist/* root@<服务器IP>:/opt/what-to-eat/dist/

# 方法二：rsync（增量同步，更快）
rsync -avz --delete ./dist/ root@<服务器IP>:/opt/what-to-eat/dist/
```

### 8.3 生产环境 Vite 配置

在构建前，可在项目根目录创建 `.env.production`：

```bash
# .env.production
VITE_API_BASE=https://api.你的域名.com
```

---

## 9. 日常运维

### 9.1 监控服务状态

```bash
# PM2 实时监控
pm2 monit

# 检查 Nginx
sudo systemctl status nginx

# 检查 MySQL
sudo systemctl status mysql   # Ubuntu
sudo systemctl status mysqld  # CentOS

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

### 9.2 备份数据库

创建备份脚本 `/opt/what-to-eat/deploy/backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/mysql"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u eat_user -p'your_password' what_to_eat | gzip > "$BACKUP_DIR/what_to_eat_$DATE.sql.gz"
# 保留最近7天的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
echo "Backup completed: $DATE"
```

添加定时任务（每天凌晨2点备份）：

```bash
chmod +x /opt/what-to-eat/deploy/backup.sh
crontab -e
# 添加：
0 2 * * * /opt/what-to-eat/deploy/backup.sh >> /var/log/backup.log 2>&1
```

### 9.3 更新部署

```bash
cd /opt/what-to-eat
git pull

# 更新后端
cd server
npm install --production
pm2 restart what-to-eat-api

# 更新前端（本地构建后上传）
# scp -r ./dist/* root@<服务器IP>:/opt/what-to-eat/dist/
```

### 9.4 日志查看

```bash
# PM2 日志
pm2 logs what-to-eat-api --lines 100

# Nginx 日志
sudo tail -f /var/log/nginx/what-to-eat-api.log
sudo tail -f /var/log/nginx/what-to-eat-api-error.log

# MySQL 日志
sudo tail -f /var/log/mysql/error.log
```

### 9.5 故障排查

| 问题 | 检查方法 |
|------|----------|
| 后端无法启动 | `cd /opt/what-to-eat/server && node app.js` |
| 数据库连接失败 | `mysql -u eat_user -p -h 127.0.0.1 what_to_eat` |
| 端口被占用 | `sudo lsof -i :3001` |
| Nginx 502 | 检查后端是否运行：`pm2 status` |
| 证书过期 | `sudo certbot renew` |

---

## 📞 参考链接

- [阿里云轻量应用服务器文档](https://help.aliyun.com/product/120499.html)
- [PM2 官方文档](https://pm2.keymetrics.io/)
- [Nginx 文档](https://nginx.org/en/docs/)
- [Certbot 文档](https://certbot.eff.org/)
- [Node.js 官方文档](https://nodejs.org/docs/latest-v20.x/api/)

---

> 📅 最后更新：2024年 · 适用于 Ubuntu 22.04 / CentOS 7.9+
