# Personal Blog

基于 **Nuxt 3** 的个人博客与作品展示站点：文章存 **MySQL**（Prisma），支持标签、搜索、时间轴、暗色模式、SEO（sitemap / RSS）、后台 Markdown 管理与 Giscus 评论（可选）。

## 技术栈

- [Nuxt 3](https://nuxt.com/) · Vue 3 · TypeScript  
- [Tailwind CSS v4](https://tailwindcss.com/) · [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate)  
- [Prisma](https://www.prisma.io/) + MySQL  
- [Fuse.js](https://fusejs.io/) 全站模糊搜索（`Ctrl/Cmd + K`）  
- [marked](https://marked.js.org/) 正文与后台预览  
- [Three.js](https://threejs.org/) 动态背景（客户端）

## 环境要求

- **Node.js** 20 LTS（**不要用 18**：与本项目依赖与构建脚本不兼容）  
- **MySQL** 5.7+ / 8.x  
- Windows 开发时建议使用 PowerShell（`dev:clean` 脚本依赖）

## 快速开始

### 1. 克隆与安装

```bash
git clone https://github.com/chenruijieCSDN/blog.git
cd blog
npm install
```

### 2. 环境变量

复制示例文件并编辑（**不要**把真实 `.env` 提交到 Git）：

```bash
cp .env.example .env
```

必填项说明见仓库内 [`.env.example`](./.env.example)，至少配置：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | MySQL 连接串，格式 `mysql://用户:密码@主机:3306/数据库名` |
| `ADMIN_PASSWORD` | `/admin` 管理后台密码 |
| `NUXT_PUBLIC_SITE_URL` | 站点根 URL（无末尾斜杠），用于 canonical、OG、RSS、sitemap |
| `NUXT_ADMIN_SESSION_SECRET` | 生产环境务必设为长随机字符串，用于会话签名 |

### 3. 数据库

```bash
npx prisma migrate dev
```

（仅首次本地建库；生产环境用 `npm run db:deploy`。）

### 4. 本地开发

```bash
npm run dev
```

默认会先尝试释放 **8889** 端口再启动 Nuxt（见 [`scripts/dev-clean.ps1`](./scripts/dev-clean.ps1)）。  
若需不经清理直接启动：`npm run dev:raw`。

开发地址一般为：`http://localhost:8889`（若端口被占用，终端会提示实际端口）。

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 清理8889 占用后启动开发服务器 |
| `npm run dev:clean` | 同上（被 `dev` 调用） |
| `npm run dev:raw` | 直接 `nuxt dev --port 8889` |
| `npm run build` | 生产构建（输出 `.output/`） |
| `npm run preview` | 本地预览生产构建 |
| `npm run db:migrate` | 开发环境 Prisma 迁移 |
| `npm run db:deploy` | 生产环境执行迁移 |
| `npm run db:generate` | 仅生成 Prisma Client |

## 生产部署（简要）

1. 服务器安装 Node 20、MySQL，克隆仓库并配置 `.env`。  
2. 安装与迁移、构建：

   ```bash
   npm install
   npm run db:deploy
   npm run build
   ```

3. 使用进程管理器启动 SSR入口：

   ```bash
   node .output/server/index.mjs
   ```

   或使用 PM2等常驻运行；默认监听端口以 Nuxt 输出为准（常见为 **3000**）。  
4. 用 **Nginx / Caddy** 等将 `80` / `443` 反向代理到上述端口，并设置 `NUXT_PUBLIC_SITE_URL` 为公网 HTTPS 地址。

静态导出（`nuxt generate`）**不适用**本项目：文章与 API 依赖服务端与数据库。

## 主要路由

| 路径 | 说明 |
|------|------|
| `/` | 首页 |
| `/writing` | 文章列表 |
| `/writing/[slug]` | 文章详情 |
| `/tags`、`/tags/[tag]` | 标签与筛选 |
| `/timeline` | 时间轴 |
| `/admin` | 文章 CRUD（需 `ADMIN_PASSWORD`） |

## 许可证

私有项目请自行保留版权说明；若开源请在此补充所选许可证。
