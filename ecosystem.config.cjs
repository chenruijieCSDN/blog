/**
 * PM2 配置：从项目根目录加载 .env，保证 Prisma / Nuxt 能读到 DATABASE_URL 等变量。
 * 用法：cd /www/wwwroot/blog && pm2 start ecosystem.config.cjs
 */
const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    let trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed.toLowerCase().startsWith("export ")) {
      trimmed = trimmed.slice(7).trim();
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const cwd = __dirname;
const fileEnv = loadEnvFile(path.join(cwd, ".env"));

module.exports = {
  apps: [
    {
      name: "blog",
      cwd,
      script: ".output/server/index.mjs",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        ...fileEnv,
      },
    },
  ],
};
