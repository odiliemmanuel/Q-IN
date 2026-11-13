# Q-In (Queueni) — Frontend

A queue-management workspace for cohorts. Three roles — **Member (`NATIVE`)**, **Admin**, and **Super admin** — with live queue positions, wait estimates, admin tooling and platform analytics.

Built with **Vite + React 19 + TypeScript + Tailwind CSS v4**. Runs entirely in the browser with seeded demo data, so no backend is required to try it.

## Run it

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on port 5173 |
| `npm run build` | Type-check-free production build into `dist/` |
| `npm run preview` | Preview the production build on port 4173 |
| `npm run typecheck` | Run `tsc -b` with zero errors |

Requires Node **18 or newer**.

## Demo accounts

Sign in with any valid email and a password of 6+ characters, or use the one-click demo buttons on the login screen:

| Role | Email | Lands on |
| --- | --- | --- |
| Member | `member@qin.app` | Dashboard, queues, cohorts |
| Admin | `admin@qin.app` | Everything above + admin console |
| Super admin | `super@qin.app` | Everything above + platform overview |

Email verification accepts any 6-digit code (e.g. `123456`). Any new registration starts as a Member and is sent through verification.

## What's inside

- **Auth** — login, register, email verification, password reset (all demo-simulated).
- **Dashboard** — active ticket with live position and estimated wait, cohort shortcuts, recent activity.
- **Queues** — searchable/filterable list, join and leave, queue detail with live line and "next up".
- **Admin console** — queue open/close controls, admin invite/suspend/remove, webhook management with test delivery.
- **Platform (super admin)** — cross-cohort analytics, system health, role distribution, demo-data reset.
- **Settings** — profile, notification preferences, light/dark theme.
- **Persistence** — state is saved to `localStorage` (`qin:*` keys), so refreshes keep your data. Reset from Settings or the super-admin danger zone.

Roles are enforced by route guards in `src/App.tsx`; Members are redirected away from `/app/admin` and `/app/super-admin`.

## Project structure

```
src/
  App.tsx                 routes + role guards
  main.tsx                entry point
  index.css               Tailwind v4 theme, dark variant, motion
  components/
    ui.tsx                Button, Card, Badge, Input, Modal, Toggle, Toaster…
    icons.tsx             inline SVG icon set
    layout/               AppShell, Sidebar, Topbar, NotificationBell
    QueueCard.tsx, Logo.tsx, PageHeader.tsx
  lib/                    types, utils, localStorage helpers
  pages/                  auth/*, Dashboard, Queues, QueueDetail, Cohorts,
                          Admin, SuperAdmin, Settings, NotFound
  stores/                 zustand stores: auth, queue, notifications, ui
```

## Connecting a backend later

The app is backend-ready but currently client-only. When the API and WebSocket services exist, set these in `.env.local` (see `.env.example`):

```bash
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com/ws
```

Copy `.env.example` to `.env.local` and adjust. The values are exposed to the browser by Vite and can be read with `import.meta.env.VITE_API_URL`.

## Deploying to Vercel

The repo includes a `vercel.json` configured for Vite:

- framework: `vite`
- build command: `npm run build`
- output directory: `dist`
- SPA rewrite: every path falls back to `index.html` so client-side routing works

**Via the dashboard:** import the repo, set the root directory to `frontend` (if the app lives in a monorepo), and deploy — the settings above are picked up automatically.

**Via CLI:**

```bash
cd frontend
npx vercel --prod
```

Add `VITE_API_URL` and `VITE_WS_URL` under Project → Settings → Environment Variables when the backend is available, then redeploy.
