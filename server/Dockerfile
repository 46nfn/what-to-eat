# Fly.io 部署 Dockerfile
FROM node:20-alpine

WORKDIR /app

# 只复制依赖文件，利用 Docker 层缓存
COPY package*.json ./
RUN npm install --production

# 复制其余代码
COPY . .

# Fly.io 自动注入 PORT 环境变量
EXPOSE 3001

CMD ["node", "app.js"]
