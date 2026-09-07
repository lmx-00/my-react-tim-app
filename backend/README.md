# 开心消消乐后端

Node.js + Express + Prisma + PostgreSQL。提供账号、关卡、对局逐步校验和游戏记录。

## 环境

- Node.js 20+
- Docker（用来跑 PostgreSQL）

## 启动

在 `backend/` 目录：

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev
npm run prisma:seed
npm run test
npm run dev
```

如果本机还没装 Docker：先安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)，再执行上面的 `docker compose up -d`。

服务地址：`http://localhost:3001/api/health`

前端开发时，仓库根目录已把 `/api` 代理到 `3001`。前端 `.env` 里是 `VITE_API_BASE_URL=/api`。请求需带：

```
Authorization: Bearer <accessToken>
```

刷新登录：`POST /api/auth/refresh`（Refresh Token 在 HttpOnly Cookie）。

根目录可同时开后端：

```bash
npm run dev:backend
```

## 主要接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 注册并登录 `{ username, password }` |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/refresh` | 刷新 access token |
| POST | `/api/auth/logout` | 退出 |
| GET | `/api/me` | 当前用户和进度 |
| GET | `/api/levels` | 关卡列表（含解锁/星级） |
| GET | `/api/levels/:id` | 关卡详情 |
| POST | `/api/game/sessions` | 开一局 `{ "levelId": 1 }` |
| GET | `/api/game/sessions/:id` | 恢复对局 |
| POST | `/api/game/sessions/:id/move` | 走子 `{ x1, y1, x2, y2 }`（x 为列，y 为行） |
| POST | `/api/game/sessions/:id/quit` | 中途退出 |
| GET | `/api/records` | 对局记录 |
| GET | `/api/stats` | 个人统计 |

走子由服务端规则引擎结算，前端不要自己报分数。
