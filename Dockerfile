# 第一阶段：构建
FROM node:22-slim AS builder
WORKDIR /app

# 配置 apt 阿里云镜像源
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# 配置 npm 国内镜像源
RUN npm config set registry https://registry.npmmirror.com

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# 第二阶段：运行
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# 配置 apt 阿里云镜像源并安装编译工具
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# 配置 npm 国内镜像源
RUN npm config set registry https://registry.npmmirror.com

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

# 强制从源码重新编译 better-sqlite3，确保原生模块与当前环境兼容
RUN npm rebuild better-sqlite3 --build-from-source

EXPOSE 3000

CMD ["npm", "start"]
