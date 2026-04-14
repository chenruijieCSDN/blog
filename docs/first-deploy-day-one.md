# 博客首日上线手记（2026-04-14）

本文记录个人博客**第一次**在服务器上发布、更新与排障的过程，方便以后对照；环境为 **OpenCloudOS + 宝塔 + PM2 + Nginx**，应用为 **Nuxt 3 + Prisma + MySQL**。

| 类型 | 链接 |
|------|------|
| **公网站点** | [https://blog.crj-ai.top](https://blog.crj-ai.top) |
| **源码仓库** | [https://github.com/chenruijieCSDN/blog](https://github.com/chenruijieCSDN/blog) |

---

## 1. 背景与目标

- 代码托管在 [GitHub](https://github.com/chenruijieCSDN/blog)，服务器通过 `git pull` 更新。
- 进程用 **PM2** 托管，配置使用仓库里的 **`ecosystem.config.cjs`**，以便从项目根目录加载 **`.env`**。
- 对外访问地址为 **[https://blog.crj-ai.top](https://blog.crj-ai.top)**（与 `NUXT_PUBLIC_SITE_URL`、宝塔站点域名一致）。

---

## 2. 踩坑一：文档里的路径不能照抄

**现象：** 在终端执行 `cd /path/to/blog` 或 `cd /blog`，提示 `No such file or directory`；随后在 **`/root`** 下执行 `git pull`、`npm install`，全部失败；只有 `pm2 restart blog` 能成功（不依赖当前目录）。

**原因：** `/path/to/blog` 是占位符；Linux 根目录下一般也没有 `/blog`。

**处理：**

1. 用 PM2 查真实项目根目录：

   ```bash
   pm2 describe blog
   ```

   看 **`exec cwd`**，例如：`/www/wwwroot/blog`。

2. 所有构建与 Git 操作都在该目录下执行：

   ```bash
   cd /www/wwwroot/blog
   git pull
   npm install
   npm run db:deploy
   npm run build
   pm2 restart blog --update-env
   ```

---

## 3. 踩坑二：Node 版本告警（EBADENGINE）

**现象：** `npm install` 时出现多条 `EBADENGINE`，例如要求 `^20.19.0`，当前为 `v20.18.1`。

**说明：** 多为依赖声明的引擎范围偏新，**不一定导致安装失败**；本次构建仍能通过。

**建议：** 长期可在服务器把 Node 升到 **20.19+ LTS**，与生态声明一致，减少告警。

---

## 4. 踩坑三：后台「创建文章失败」与接口500

### 4.1 管理密码与运行时环境变量

**现象：** `POST /api/posts/create` 失败；早期响应只有笼统的 **`Failed to create post`**。

**原因（之一）：** 生产环境通过 PM2 把 **`.env`** 注入 **`process.env`**，而部分校验只读了 **`runtimeConfig.adminPassword`**（偏构建期），与线上 **`ADMIN_PASSWORD`** 不一致时会出现异常或难以排查。

**处理（代码侧已改）：** 统一从 **`process.env.ADMIN_PASSWORD`**（及 `NUXT_*` 别名）读取，并与会话密钥逻辑对齐；创建接口对未预期错误打日志并返回 **`data.hint`**。

### 4.2 `GET /api/posts` 返回500 且 `statusMessage` 为空

**现象：** 刷新页面请求 **`/api/posts`**，返回 **`internal server error`**，**`statusMessage`** 为空。

**原因：** 列表接口未捕获 Prisma 异常，生产环境下 Nitro 会吞掉细节。

**处理（代码侧已改）：** 为列表接口增加与创建接口一致的错误处理，返回可读 **`statusMessage`** 与 **`data.hint`**。

### 4.3 管理页看不到详细错误

**现象：** 浏览器里只看到「保存失败」。

**处理（代码侧已改）：** 解析 **`$fetch`** 错误时同时读取响应体里的 **`data.hint`** 与 **`statusMessage`**（注意 `error.data` 是完整 JSON 体，**`hint` 在 `error.data.data.hint`**）。

---

## 5. 踩坑四：`DATABASE_URL` 未注入（503）

**现象：**响应类似：

```text
Environment variable not found: DATABASE_URL
```

**原因：**

- 项目根 **`.env`** 中缺少 **`DATABASE_URL`**；或
- `.env` 里写了 **`export DATABASE_URL=...`**，旧版 PM2 解析把键名读错，变量未进入进程。

**处理：**

1. 在 **`exec cwd`** 对应目录（如 `/www/wwwroot/blog`）编辑 **`.env`**，保证存在：

   ```env
   DATABASE_URL="mysql://用户:密码@127.0.0.1:3306/blog_db"
   ```

2.使用 **`ecosystem.config.cjs`** 启动，并重启：

   ```bash
   pm2 restart blog --update-env
   ```

3. **代码侧加固（已推仓库）：** `ecosystem.config.cjs` 支持去掉行首 **`export `**；`server/utils/prisma.ts` 在缺失 **`DATABASE_URL`** 时尝试从 **`process.cwd()`** 下的 **`.env`** 同步补全。

---

## 6. 踩坑五：Prisma P2022，缺列 `location`

**现象：** 报错 **`P2022`**，提示 **`blog_db.posts.location` does not exist**。

**原因：** 数据库是按**早期迁移**建的表，而 **`schema.prisma`** 已增加 **`location` / `latitude` / `longitude`**，**未执行后续迁移**。

**处理：**

1. 仓库已增加迁移目录：`prisma/migrations/20260414103000_add_posts_location_lat_lng/`。
2. 服务器项目根执行：

   ```bash
   cd /www/wwwroot/blog
   git pull
   npm run db:deploy
   ```

 确认新迁移已应用后再试创建文章。

---

## 7. 安全提醒

- **`.env`** 勿提交到 Git；生产环境 **`ADMIN_PASSWORD`** 必须使用强密码。
- 若在公开对话中泄露过密码，应**立即在服务器修改** **`.env`** 并 **`pm2 restart blog --update-env`**。

---

## 8. 首日推荐「发布更新」命令清单

在 **`pm2 describe blog`** 所示的 **`exec cwd`** 下执行：

```bash
cd /www/wwwroot/blog
git pull
npm install
npm run db:deploy
npm run build
pm2 restart blog --update-env
```

排障时：

```bash
pm2 logs blog --lines 100
```

---

## 9. 相关文档

- 更系统的部署说明见同目录：**[`deploy-opencloudos-baota.md`](./deploy-opencloudos-baota.md)**。
- 数据库与接口约定见：**[`server/database/README.md`](../server/database/README.md)**。
- 本仓库主页：**[github.com/chenruijieCSDN/blog](https://github.com/chenruijieCSDN/blog)**。

---

*文末日期：2026-04-14。*
