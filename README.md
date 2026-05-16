<div align="center">

# Team Task Manager

A full-stack **MERN** monorepo for collaborative projects: JWT authentication, role-based access (Admin / Member), Kanban task management, and an operational dashboard. Deployable as a **single Railway service** that serves both the REST API and the React SPA.

[![Node.js](https://img.shields.io/badge/node.js-20%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%2FLocal-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-8-880000?logo=mongoose&logoColor=white)](https://mongoosejs.com/)

</div>

## Quick start for evaluators

**Live URL:** https://team-task-manager-production-89f5.up.railway.app

To explore the app:

1. Open the live URL and click **"Create an account"**.
2. Fill in any email + password.
3. To sign up as an **Admin** (full access — create projects, manage members, etc.), type `assessment-admin-2026` into the optional **"Admin code"** field on the signup form.
4. To sign up as a **Member** (restricted access — work on projects an Admin invited you to), leave the **"Admin code"** field empty.
5. After signup you'll land on the Dashboard. Use the **Projects** tab to create projects (Admin) or open boards (everyone). On a board, click **+ New task** to create tasks, drag cards across columns to change status, click a card to edit it.

> **Health check:** `GET /health` returns `{"ok": true}`.

## Overview

**Team Task Manager** is an assessment-style application that demonstrates a clean MERN stack on a `pnpm` workspace:

- **JWT authentication** (Bearer tokens) with signup and login.
- **Projects with team membership** — Admins create projects, owners (or Admins) manage members.
- **Tasks** — anyone with project access can create/edit, assign teammates, and track status on a Kanban board with drag-to-update.
- **Dashboard** with totals, status distribution, completion rate, and overdue tasks (local calendar day, excluding `COMPLETED`).
- **Role-based access** — `Admin` vs `Member` enforced by middleware on every route.

The repo is structured as:

```
apps/
  api/   Express + Mongoose REST API (also serves the built SPA in production)
  web/   Vite + React 19 SPA
```

## Becoming Admin

The assessment requires Admin/Member roles. There are **two ways** to become an Admin:

1. **First signup wins.** When the users collection is empty, the very first signup is automatically promoted to `Admin`. Subsequent signups default to `Member`.
2. **Admin signup code.** If the `ADMIN_SIGNUP_CODE` env var is set on the API, anyone who enters that exact value in the **Admin code (optional)** field on the signup form will be created as `Admin`.

After that, only Admins can create projects (`POST /api/projects`).

## Tech stack

| Area     | Choices                                                       |
| -------- | ------------------------------------------------------------- |
| Monorepo | pnpm workspaces                                               |
| Frontend | React 19, Vite 6, React Router 7, Tailwind CSS 4, dnd-kit     |
| Backend  | Express 4, Mongoose 8, Zod, bcrypt, jsonwebtoken              |
| Data     | MongoDB                                                       |

## Local development

### Prerequisites

- **Node.js** 20+
- **pnpm** 9.x (`corepack enable && corepack prepare pnpm@9.15.4 --activate`)
- A reachable **MongoDB** (local or [Atlas](https://www.mongodb.com/atlas))

### Setup

```bash
git clone <your-repo-url> team-task-manager
cd team-task-manager
pnpm install
cp apps/api/.env.example apps/api/.env
# edit apps/api/.env and set MONGO_URI + JWT_SECRET (and optionally ADMIN_SIGNUP_CODE)
pnpm dev
```

`pnpm dev` runs the API on **http://localhost:4000** and the SPA on **http://localhost:5173**. The Vite dev server proxies `/api` → API.

### Production smoke test (single-service mode)

```bash
pnpm build
node apps/api/dist/index.js
# → API + SPA served from http://localhost:4000
```

The API automatically detects `apps/web/dist/index.html` and serves it as a SPA (all non-`/api/*` GETs fall back to `index.html`).

## Environment variables

| Variable              | Required | Description                                                                                                                                                       |
| --------------------- | :------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGO_URI`           | **Yes**  | MongoDB connection string (Atlas SRV URI or `mongodb://...`).                                                                                                     |
| `JWT_SECRET`          | **Yes**  | Long random string used to sign JWTs.                                                                                                                             |
| `PORT`                | No       | API listen port. Defaults to `4000`. Railway injects `PORT` automatically.                                                                                        |
| `JWT_EXPIRES_SECONDS` | No       | Access token lifetime in seconds. Defaults to **7 days**.                                                                                                         |
| `ADMIN_SIGNUP_CODE`   | No       | If set, signups that submit a matching `adminCode` become `Admin`. The first signup is always Admin regardless.                                                   |
| `CORS_ORIGIN`         | No       | Only needed if you split the deploy into separate services. Comma-separated list of allowed origins. **Leave unset for the recommended single-service deploy.**   |

## Deploying to Railway (recommended: single service)

This repo ships a **root `railpack.json`** that builds both apps and starts the API, which serves the SPA from the same origin. One service, one URL — much simpler to operate.

1. **Provision MongoDB.** Either add the **MongoDB** plugin in your Railway project, or use a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.
2. **Create one Railway service** from this repository.
   - **Branch:** `main`
   - **Root Directory:** empty / `.` (Railpack picks up the root `railpack.json` automatically)
   - **Do not** set `RAILPACK_CONFIG_FILE`; the root config is used by default.
3. **Set environment variables** on that service:
   - `MONGO_URI` — your MongoDB URI.
   - `JWT_SECRET` — a long random string.
   - `ADMIN_SIGNUP_CODE` — your secret promotion code (optional but recommended).
4. **Deploy.** Railway runs the build (`pnpm install` → build web → build api) and then `node apps/api/dist/index.js`. The single public URL serves both the API (`/api/*`, `/health`) and the SPA (everything else).
5. **Sign up.** The first user becomes Admin automatically. Use the Admin code field to promote later signups.

> **Health check:** `GET /health` returns `{"ok": true}`. `GET /` returns the SPA.

## API overview

| Verb     | Path                                       | Auth          | Notes                                       |
| -------- | ------------------------------------------ | ------------- | ------------------------------------------- |
| `POST`   | `/api/auth/signup`                         | public        | Optional `adminCode` field; first user → Admin |
| `POST`   | `/api/auth/login`                          | public        | Returns Bearer JWT                          |
| `GET`    | `/api/users`                               | any user      | Directory for member/assignee pickers       |
| `GET`    | `/api/projects`                            | any user      | Lists projects accessible to the caller     |
| `POST`   | `/api/projects`                            | **Admin**     | Create project                              |
| `GET`    | `/api/projects/:id`                        | member/owner  |                                             |
| `PATCH`  | `/api/projects/:id`                        | owner / Admin | Edit name/description/members               |
| `DELETE` | `/api/projects/:id`                        | owner / Admin | Cascades task deletion                      |
| `GET`    | `/api/projects/:id/tasks`                  | member/owner  |                                             |
| `POST`   | `/api/projects/:id/tasks`                  | member/owner  | Create task                                 |
| `GET`    | `/api/tasks/:id`                           | member/owner  |                                             |
| `PATCH`  | `/api/tasks/:id`                           | member/owner  | Edit title/description/dueDate/assignee/status |
| `PATCH`  | `/api/tasks/:id/status`                    | member/owner  | Used by Kanban drag                         |
| `DELETE` | `/api/tasks/:id`                           | owner / Admin | Delete a task                               |

## Scripts

| Command          | Description                              |
| ---------------- | ---------------------------------------- |
| `pnpm dev`       | Run web + API dev servers in parallel.   |
| `pnpm build`     | Build all workspace packages.            |
| `pnpm typecheck` | TypeScript check across workspaces.      |
| `pnpm lint`      | ESLint across workspaces.                |

## License

Provided for **assessment / portfolio** use.
