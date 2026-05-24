# Runco OS — Operational CRM

A premium, dual-themed CRM dashboard for RunCoGrowth. Drag-and-drop pipeline, role-based tasks, realtime sync, contacts directory, admin panel, and analytics — all in one Next.js app.

## Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: SQLite for dev (zero setup), Postgres-ready for prod
- **ORM**: Prisma
- **Auth**: NextAuth (email + password, JWT sessions)
- **UI**: Tailwind CSS + Radix primitives + shadcn-style components
- **Drag & drop**: dnd-kit
- **State**: Zustand
- **Realtime**: Server-Sent Events
- **Email**: Nodemailer (console transport in dev, SMTP in prod)

## Prerequisites

- Node.js 18.18+ (Node 20 LTS recommended; tested on Node 22)
- npm 9+

That's it. SQLite is bundled, so you don't need to install Postgres locally.

## Quick start

From the project root:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client and create the SQLite dev database
npm run db:push

# 3. Seed sample data (admin + sales user, 6 stages, 9 sample deals, 5 tasks)
npm run db:seed

# 4. Start the dev server
npm run dev
```

Then open http://localhost:3000 in your browser. You'll be redirected to `/login`.

### Demo accounts

| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| Admin | abhay@runcogrowth.com    | Admin@123  |
| User  | sales@runcogrowth.com    | User@123   |

The admin sees all data and can manage users; the regular user only sees deals and tasks they're assigned to or created.

## Available scripts

| Command              | What it does                                                |
|----------------------|-------------------------------------------------------------|
| `npm run dev`        | Start the Next.js dev server on port 3000                   |
| `npm run dev:clean`  | Wipe `.next` cache and start dev (use if styles look broken)|
| `npm run build`      | Production build (do not run while `dev` is running)        |
| `npm run start`      | Start the production server (after `build`)                 |
| `npm run lint`       | ESLint                                                      |
| `npm run db:push`    | Apply schema to the database                                |
| `npm run db:seed`    | Seed users / stages / sample deals / sample tasks           |
| `npm run db:studio`  | Open Prisma Studio (GUI for browsing/editing the DB)        |
| `npm run db:reset`   | Drop everything and reseed (irreversible)                   |
| `npm run clean`      | Delete the `.next` build cache                              |

### Inspecting the database

The fastest way to see what's in the DB is Prisma Studio. In a second terminal:

```bash
npm run db:studio
```

It opens at http://localhost:5555 with editable tables for User, Deal, Stage, Task, StageNote, Notification, ActivityLog, and the rest. Edits write back to the DB instantly. Stop with `Ctrl+C`.

## Environment variables

A working `.env` is committed for local dev. Copy `.env.example` to `.env` if you want to start from scratch.

| Variable          | Required | Purpose                                                                 |
|-------------------|----------|-------------------------------------------------------------------------|
| `DATABASE_URL`    | yes      | `file:./dev.db` for SQLite, or a Postgres connection string for prod     |
| `NEXTAUTH_URL`    | yes      | App URL — `http://localhost:3000` in dev, `https://os.runcogrowth.com` in prod |
| `NEXTAUTH_SECRET` | yes      | Random string. Generate with `openssl rand -base64 32`                  |
| `SMTP_HOST`       | optional | If unset, emails are logged to the dev terminal instead of sent         |
| `SMTP_PORT`       | optional | e.g. `587` for STARTTLS, `465` for TLS                                  |
| `SMTP_USER`       | optional | SMTP username                                                           |
| `SMTP_PASS`       | optional | SMTP password / API key                                                 |
| `EMAIL_FROM`      | optional | Default from-address, e.g. `Runco OS <noreply@runcogrowth.com>`         |

## Features

- **Login** — work email + password, persistent JWT sessions, role-based redirects
- **Pipeline (Kanban)** — six stages (Prospects → Closed Lost), drag-and-drop with optimistic updates and realtime sync, per-deal click-to-open detail modal
- **Per-stage descriptions** — click `+` on any card to add stage-specific notes (`"Prospects stage description"`, `"Lead stage description"`, etc.). Notes survive stage moves and can be deleted from the modal
- **Stage list dialog** — click any column header to see a searchable list of all deals in that stage with company/contact/email and quick-open
- **Tasks** — board (4 status columns) and list view, priority + due date + assignee, role-gated CRUD
- **Profile** — premium layout with avatar/role/employment details, editable in-place, avatar color picker
- **Contacts directory** — auto-aggregated from deals, dedupe by company × contact, stage filter, click-through to detail dialog with all related deals
- **Admin panel** (admin only) — user management with create/edit/delete/password reset, activity feed with filters, analytics tab
- **Analytics** — pipeline stage distribution, task status/priority breakdowns, 14-day timeline chart, per-user breakdown
- **Notifications** — bell in the topbar with unread badge and popover; auto-fires on deal assignment, stage moves, task assignment, status changes, user creation, password reset
- **Email** — branded welcome and password-reset emails when admins create or reset users (logged to console in dev, sent via SMTP in prod)
- **Realtime sync** — SSE channel keeps every connected user's pipeline, tasks, and notifications in sync without polling
- **Light + Dark themes** — toggle from the top-bar; defaults to dark

## Project structure

```
src/
├── app/
│   ├── (app)/                  # protected routes (require auth)
│   │   ├── pipeline/
│   │   ├── tasks/
│   │   ├── contacts/
│   │   ├── profile/
│   │   ├── analytics/
│   │   ├── admin/
│   │   └── layout.tsx          # shared sidebar + topbar + realtime bridge
│   ├── api/                    # API routes (Next.js route handlers)
│   │   ├── auth/[...nextauth]/
│   │   ├── deals/
│   │   ├── tasks/
│   │   ├── contacts/
│   │   ├── notifications/
│   │   ├── analytics/
│   │   ├── profile/
│   │   ├── admin/users/
│   │   └── events/             # Server-Sent Events stream
│   ├── login/
│   └── layout.tsx              # root layout, fonts, theme provider
├── components/
│   ├── app-shell/              # sidebar, topbar, notifications bell
│   ├── brand/                  # Runco wordmark logo
│   ├── pipeline/               # board, columns, cards, modal
│   ├── tasks/                  # board, list view, dialog
│   ├── contacts/
│   ├── admin/
│   ├── analytics/
│   ├── profile/
│   ├── ui/                     # shadcn-style primitives
│   ├── providers.tsx           # SessionProvider + ThemeProvider + Toaster
│   └── realtime-bridge.tsx     # SSE client mounted in app shell
├── lib/                        # prisma, auth, session, realtime, email, dto, utils
├── stores/                     # Zustand stores (pipeline, tasks, notifications)
├── types/                      # shared types
└── middleware.ts               # auth + role gating

prisma/
├── schema.prisma               # full data model
├── seed.ts                     # sample data
└── dev.db                      # SQLite dev database (gitignored)
```

## Deployment notes

To run on `os.runcogrowth.com` (or any other domain):

1. Provision a Postgres database (Supabase, Railway, Neon, RDS, etc.).
2. In `prisma/schema.prisma`, change the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set production env vars on your host:
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_URL=https://os.runcogrowth.com
   NEXTAUTH_SECRET=<openssl rand -base64 32>
   SMTP_HOST=...
   SMTP_PORT=...
   SMTP_USER=...
   SMTP_PASS=...
   EMAIL_FROM=Runco OS <noreply@runcogrowth.com>
   ```
4. Run migrations and seed the workspace:
   ```bash
   npx prisma migrate deploy
   npm run db:seed   # creates the bootstrap admin
   ```
5. Build and start:
   ```bash
   npm run build
   npm run start
   ```
6. Point your DNS A/CNAME at the server.
7. Make sure your reverse proxy (nginx, Caddy, Cloudflare) doesn't buffer responses on `/api/events` — the SSE response sets `X-Accel-Buffering: no`, which most proxies respect.

## Troubleshooting

**Login page is unstyled / shows raw HTML**
The `.next` dev cache occasionally serves stale CSS hashes on Windows. Stop the dev server, run `npm run dev:clean`, hard-refresh the browser.

**`Error: Cannot find module './682.js'`**
You ran `npm run build` while `npm run dev` was still running. They share the `.next` folder. Stop dev, `npm run clean`, restart dev.

**Can't sign in with the demo accounts**
Run `npm run db:seed` again. If you've changed schema, run `npm run db:reset` (wipes everything) then `npm run db:seed`.

**Emails aren't arriving**
In dev, no SMTP is configured by default — emails are logged in the dev terminal. Set `SMTP_*` env vars and restart to send real emails.

**Realtime updates don't show up across browsers**
Sign in as different users in each browser/tab (incognito works). The realtime bridge filters out events triggered by the same user that's logged in to avoid double-applying.

## License

Internal RunCoGrowth project.
