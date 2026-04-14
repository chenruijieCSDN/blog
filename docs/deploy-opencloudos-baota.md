# Nuxt 博客部署说明（OpenCloudOS 9 + 宝塔）

本文对照你之前的「云图库 / AI 智能体」部署习惯，改为适配本仓库：**Nuxt 3 SSR + Prisma + MySQL**。与 Java 项目的主要差异如下。

| 对比项 | 你之前的 Java/Vue 项目 | 本博客 |
|--------|------------------------|--------|
| 运行形态 | Spring Boot + 静态前端 / Docker | **单一 Node 进程**（`nuxt build` 产物） |
| 对外路径 | 常带 `/api`、hash 路由 | **根路径 `/`**，由 Nuxt 同机处理页面与接口 |
| 数据库 | 可选 / 后期启用 | **必须**：文章与标签依赖 MySQL |
| 本机构建上传 | jar + dist 可行 | **不推荐**在 Windows 构建后把 `.output` 拷到 Linux：Prisma 原生模块与路径需与 Linux 一致，**应在服务器上执行 `npm run build`** |

---

## A. 架构（文字版）

```
浏览器 → 宝塔 Nginx（443/HTTPS）→ 反代 http://127.0.0.1:3000 → Node（.output/server/index.mjs）
                                              ↘
                                         MySQL（本机或同区域）
```

- 本项目的接口形如 `/api/posts`、`/api/tags` 等，由 **Nuxt Nitro** 提供，**不需要**再拆一个「只反代 `/api`」给另一端口（除非你刻意把 API 拆出去）。
- 若以后在同一域名下接 WebSocket，可在 `location /` 里保留 `Upgrade` / `Connection`（见下文 Nginx 片段）。

---

## B. 前置准备

### B.1 域名与解析

- 例如：`blog.crj-ai.top` → A 记录指向服务器公网 IP（子域名可自定）。
- 宝塔：**网站** → 添加站点 → 绑定域名 → 稍后申请 SSL。

### B.2 腾讯云安全组

- **对外开放**：`80`、`443`。
- **不要**对公网开放 MySQL `3306`；数据库仅 `127.0.0.1` 访问即可。

### B.3 宝塔：MySQL

1. **数据库** → 创建数据库（如 `blog_db`）与用户，记下用户名、密码。
2. 连接串写入服务器上的 `.env`：

   ```env
   DATABASE_URL="mysql://用户:密码@127.0.0.1:3306/blog_db"
   ```

### B.4 宝塔：Node 版本（重要）

- 必须使用 **Node.js 20 LTS**（建议 **20.10+**）。OpenCloudOS 用 `dnf install nodejs` 往往仍是 **18.x**，会导致 `nuxt` / `postinstall` 报错（例如 `node:util` 没有 `styleText`），或与 lock 解析出的 Nuxt 主版本不一致。
- 推荐用 **nvm** 安装 20，并确认 `node -v` 为 `v20.x` 后再执行 `npm install`：

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v
```

### B.5 代码放到服务器

**推荐（与你文档里「服务器可 git」一致）：**

```bash
cd /www/wwwroot
mkdir -p blog.crj-ai.top && cd blog.crj-ai.top
git clone https://github.com/chenruijieCSDN/blog.git .
```

**若坚持「本机打包、少在服务器构建」：**  
仍须在 **Linux x64** 上执行 `npm install` 与 `npm run build`（可在你本机用 WSL/Docker 打镜像，或上传源码后在服务器构建）。**不要**在 Windows 打完 `.output` 直接拷到 Linux 当最终方案。

---

## C. 环境变量（服务器项目根目录 `.env`）

从仓库复制示例后编辑：

```bash
cp .env.example .env
```

至少保证：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | 宝塔 MySQL 连接串 |
| `ADMIN_PASSWORD` | `/admin` 后台密码 |
| `NUXT_ADMIN_SESSION_SECRET` | 生产环境长随机串 |
| `NUXT_PUBLIC_SITE_URL` | `https://blog.crj-ai.top`（无末尾 `/`，与对外域名一致） |

**不要**把 `.env` 提交到 Git。

---

## D. 构建与启动（服务器）

在项目根目录：

```bash
cd /www/wwwroot/blog.crj-ai.top   # 按你的实际目录改

npm install
npm run db:deploy
npm run build
```

启动（二选一）。

### D.1 PM2（推荐）

```bash
npm i -g pm2
pm2 start .output/server/index.mjs --name blog
pm2 save
pm2 startup
pm2 logs blog --lines 100
```

默认监听 **3000**（以终端输出为准；若不是 3000，下面 Nginx 里的端口改成一致）。

### D.2 宝塔「Node 项目」

- 启动文件选：`.output/server/index.mjs`  
- 项目目录指向仓库根目录  
- 端口填 Nuxt 实际监听端口（多为 3000）

---

## E. 宝塔 Nginx 反向代理 + HTTPS

1. 网站 → 你的站点 → **设置** → **反向代理** → 添加：
   - 代理名称：`nuxt-blog`
   - 目标 URL：`http://127.0.0.1:3000`（端口按实际改）
2. **SSL** → Let’s Encrypt → 申请证书 → 开启 **强制 HTTPS**。

**高级 / 自定义配置里可参考**（与 Java 项目不同：这里是整站反代到 Node）：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    # 若后续有 WebSocket，可保留：
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

**注意：** 不要照搬旧项目「只反代 `/api/`」到 8123 的配置；本博客整站应由 Node 处理。

---

## F. 验证清单

1. `https://你的域名/` 首页 200。
2. `/writing` 列表能打开（依赖数据库有已发布文章）。
3. `/admin` 能打开，用 `ADMIN_PASSWORD` 保存一篇测试文并发布。
4. 服务器：`pm2 status` 中进程为 `online`；`curl -I http://127.0.0.1:3000/` 返回 200。

---

## G. 发布更新（一键习惯）

```bash
cd /www/wwwroot/blog.crj-ai.top
git pull
npm install
npm run db:deploy
npm run build
pm2 restart blog
```

---

## H. 常见问题（对照你之前的排障经验）

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 502 Bad Gateway | Node 未启动 / 端口不是 3000 | `pm2 logs blog`；`ss -lntp` 看端口；改 Nginx `proxy_pass` |
| 页面能开但文章全空 | 库无数据或未迁移 | `npm run db:deploy`；后台发布文章 |
| Prisma 报错 / 连库失败 | `DATABASE_URL` 错、MySQL 未监听本机 | 宝塔里核对库名、用户、密码；URL 用 `127.0.0.1` |
| 管理后台保存失败 | `ADMIN_PASSWORD` 与请求不一致 | 核对 `.env` 与表单密码 |
| 站点 URL / OG / RSS 错 | `NUXT_PUBLIC_SITE_URL` 不是 https 域名 | 改 `.env` 后重新 `build` 并重启 |
| 与旧项目冲突 | 多个站点反代到同一端口 | 每个应用独立端口，Nginx 指向对应端口 |

---

## I. 需要你本地确认的两项（不猜）

1. **最终访问域名**：例如是否使用 `blog.crj-ai.top`（与宝塔站点、SSL、`NUXT_PUBLIC_SITE_URL` 三者一致）。
2. **代码更新方式**：服务器 `git pull` 还是 zip 上传（若 zip，解压后同样执行 `npm install` → `db:deploy` → `build` → `pm2 restart`）。

定好域名后，把 README 里的克隆地址保持为当前仓库即可；本文目录 `/www/wwwroot/你的域名/` 仅作示例，按你宝塔实际路径替换。
