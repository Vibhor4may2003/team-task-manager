<div align="center">

# Team Task Manager

A full-stack **MERN** monorepo for collaborative projects: JWT authentication, role-based access, Kanban task management, and an operational dashboard.

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

<details>
  <summary>Table of contents</summary>

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local installation (pnpm)](#local-installation-pnpm)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Railway (Railpack)](#railway-railpack)
- [API overview](#api-overview)
- [License](#license)

</details>

## Overview

**Team Task Manager** is a technical-assessment style application that demonstrates enterprise-oriented patterns on the **MERN** stack inside a **pnpm workspace**:

- **JWT authentication** (Bearer tokens) with signup and login.
- **Projects and membership** with **Admin** vs **Member** roles (Admin-only project creation).
- **Kanban board** (`@dnd-kit`) with optimistic status updates against `PATCH /api/tasks/:id/status`.
- **Dashboard** with aggregate metrics: totals, status distribution, completion rate, and overdue tasks (local calendar day, excluding `COMPLETED`).

The repository is structured as `apps/web` (Vite + React) and `apps/api` (Express + Mongoose).

## Architecture

| Layer        | Package    | Responsibility                                      |
| ------------ | ---------- | --------------------------------------------------- |
| Frontend SPA | `@ttm/web` | Router, auth context, Kanban, dashboard, Tailwind |
| Backend API  | `@ttm/api` | REST API, JWT middleware, RBAC, MongoDB models    |

## Tech stack

| Area        | Choices                          |
| ----------- | -------------------------------- |
| Monorepo    | pnpm workspaces                  |
| Frontend    | React 19, Vite 6, React Router 7, Tailwind CSS 4, dnd-kit |
| Backend     | Express 4, Mongoose 8, Zod, bcrypt, jsonwebtoken |
| Data        | MongoDB                          |

## Prerequisites

- **Node.js** 20 or newer (matches `engines` in root `package.json`).
- **pnpm** 9.x (pin aligns with `packageManager` in root `package.json`). Enable via Corepack:

  ```bash
  corepack enable
  corepack prepare pnpm@9.15.4 --activate
  ```

- A running **MongoDB** instance (local or MongoDB Atlas) reachable from the API.

## Local installation (pnpm)

Clone the repository and install dependencies from the **repository root** (where `pnpm-workspace.yaml` lives).

```bash
git clone <your-repo-url> team-task-manager
cd team-task-manager
pnpm install
```

### Environment files

1. Copy the API example env file and fill in secrets:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

2. (Optional) For the web app, if you are **not** using the Vite dev proxy and need an absolute API base, create `apps/web/.env.local`:

   ```bash
   # Example only — leave unset when using Vite proxy to same origin /api
   VITE_API_URL=http://localhost:4000
   ```

### Run in development

From the repository root:

```bash
pnpm dev
```

This runs `apps/web` (Vite, default **http://localhost:5173**) and `apps/api` (Express, default **http://localhost:4000**) in parallel. The Vite dev server proxies `/api` to the API.

- Open the SPA and **sign up** (new users default to **Member**). Promote an Admin in MongoDB if you need to create projects as a non-seeded user.

### Production builds (local smoke test)

```bash
pnpm build
pnpm --filter @ttm/api start      # serves compiled API from apps/api/dist
pnpm --filter @ttm/web run preview # static preview of the built SPA
```

## Environment variables

| Variable | Service | Required | Description |
| -------- | ------- | :------: | ----------- |
| `PORT` | API | **No** | HTTP listen port. Defaults to `4000` when unset. Railway injects `PORT` automatically. |
| `MONGO_URI` | API | **Yes** | MongoDB connection string (e.g. `mongodb://127.0.0.1:27017/team-task-manager` or Atlas SRV URI). |
| `JWT_SECRET` | API | **Yes** | Secret used to sign and verify access tokens. Use a long random value in production. |
| `JWT_EXPIRES_SECONDS` | API | **No** | Access token lifetime in **seconds**. If unset or invalid, tokens default to **7 days** (see `apps/api/src/middleware/auth.ts`). |
| `VITE_API_URL` | Web | **No** | Public origin of the API for browser `fetch` (no trailing slash). **Leave unset** for local dev when using the Vite `/api` proxy. **Set in production** when the API is on a different host than the SPA (e.g. `https://your-api.up.railway.app`). |

> **Production CORS:** `apps/api/src/index.ts` currently allows `http://localhost:5173`. For a split Railway deployment, point CORS at your deployed frontend origin (code change or future env-driven origin) so browsers can call the API with credentials if you enable them later.

## Scripts

| Command | Description |
| ------- | ------------- |
| `pnpm dev` | Run web + API dev servers in parallel. |
| `pnpm build` | Build all workspace packages. |
| `pnpm typecheck` | TypeScript check across workspaces. |
| `pnpm lint` | ESLint across workspaces. |

## Railway (Railpack)

This monorepo ships **two** Railpack config files:

| File | Service |
| ---- | ------- |
| `apps/api/railpack.json` | Backend (`@ttm/api`) |
| `apps/web/railpack.json` | Frontend (`@ttm/web`) |

Both configs assume the **build context is the repository root** so `pnpm install --frozen-lockfile` can resolve the workspace lockfile.

**Recommended Railway setup (two services):**

1. Create a **MongoDB** plugin (or Atlas cluster) and copy the connection string into `MONGO_URI` for the API service.
2. For **each** service, set **Root Directory** to the **repository root** (empty / `.`), not `apps/api` or `apps/web` alone.
3. Set **`RAILPACK_CONFIG_FILE`** on each service to select the correct config (path is **relative to the root directory**):

   | Service | `RAILPACK_CONFIG_FILE` |
   | ------- | ----------------------- |
   | API | `apps/api/railpack.json` |
   | Web | `apps/web/railpack.json` |

4. Set environment variables per the [table above](#environment-variables). For the web service, set **`VITE_API_URL`** to your **public API URL** (Railway HTTPS origin, no trailing slash). Rebuild the web service when this value changes (Vite inlines env at build time).

**Railpack steps (both files):**

- **Install:** `pnpm install --frozen-lockfile`
- **Build:** `pnpm --filter @ttm/<api|web> run build`
- **Start (API):** `node apps/api/dist/index.js`
- **Start (Web):** `pnpm --filter @ttm/web exec vite preview --host 0.0.0.0 --port ${PORT:-4173}` (listens on `0.0.0.0` for the platform; uses Railway `PORT` when set).

## API overview

| Area | Notes |
| ---- | ----- |
| Auth | `POST /api/auth/signup`, `POST /api/auth/login` — Bearer JWT on protected routes. |
| RBAC | `POST /api/projects` requires **Admin**. Other routes enforce project membership or ownership. |
| Tasks | Includes `PATCH /api/tasks/:taskId/status` for Kanban sync. |

Health check: `GET /health` (no auth).

## License

This project is provided for **assessment / portfolio** use. Add a SPDX license (for example `MIT`) if you open-source the repository publicly.
