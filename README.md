# anorha-web

The **Anorha** web presence and internal operations plane — a [next-forge](https://github.com/vercel/next-forge) Turborepo monorepo (pnpm + Turbo) on Vercel. It houses the public marketing site, an internal `/admin` ops dashboard (deny-by-default, with an embedded Langfuse view of the AI agent's traces), a webhooks/payments API, and a desktop Electron shell.

> The git repo is `anorha-web`; the root package is still named `next-forge` (this is a fork of next-forge v5, customized for Anorha).

---

## Monorepo layout

### Apps

| App | Port | Purpose |
|-----|------|---------|
| `apps/app` | 3000 | **Admin / ops dashboard.** Clerk-authenticated. The `/admin` route is **deny-by-default** (gated by `ADMIN_USER_IDS`, returns 404 — not 403 — to non-staff) and embeds the Langfuse LLM-observability dashboard. |
| `apps/web` | 3001 | **Public marketing site.** BaseHub CMS, i18n (next-international), Arcjet rate-limiting. |
| `apps/api` | 3002 | **API.** Stripe + Polar payment webhooks, Svix. No UI. |
| `apps/docs` | 3004 | Documentation (Mintlify). |
| `apps/email` | 3003 | React Email templates + preview (Resend). Dev-time tool. |
| `apps/storybook` | 6006 | Design-system component explorer. |
| `apps/studio` | 3005 | Prisma Studio (direct DB browser). |
| `apps/desktop` | — | Electron shell (`com.anorha.desktop`) wrapping the Next.js app; tray sign-in flow, builds to dmg/nsis/AppImage. |

### Packages

Shared workspace packages under `packages/`:

`auth` (Clerk) · `database` (Prisma + Postgres) · `design-system` (shadcn/ui, Tailwind v4, Geist) · `analytics` (PostHog + GA) · `observability` (Sentry + Logtail) · `payments` (Stripe + Polar) · `notifications` (Knock) · `feature-flags` · `ai` (Vercel AI SDK + OpenAI) · `security` (Arcjet) · `collaboration` (Liveblocks) · `cms` (BaseHub) · `internationalization` · `storage` (Vercel Blob) · `webhooks` (Svix) · `rate-limit` (Upstash) · `seo` · `email` · `next-config` · `testing` · `typescript-config`

---

## Tech stack

- **Next.js 15.3** · **React 19** · **TypeScript 5.8**
- **pnpm 10.11** · **Turborepo 2.5**
- **Clerk** auth · **Prisma 6** over **Postgres** (Supabase/Neon)
- **Tailwind v4** + **shadcn/ui** design system
- Sentry · PostHog · Stripe/Polar · BaseHub · Liveblocks · Arcjet · Resend
- Lint/format via **ultracite** (Biome)

---

## Getting started

### Prerequisites
- Node 20+ and **pnpm 10.11** (`corepack enable`)
- A Postgres database and Clerk app (plus keys for any integrations you exercise)

### Install & run

```bash
pnpm install
pnpm dev                 # turbo dev — runs all apps in parallel
# or a single app:
pnpm dev --filter=app    # just the admin dashboard on :3000
```

### Root scripts

```bash
pnpm dev          # turbo dev (all apps)
pnpm build        # turbo build
pnpm test         # turbo test
pnpm lint         # ultracite lint
pnpm format       # ultracite format
pnpm migrate      # prisma format + generate + db push (in packages/database)
pnpm analyze      # bundle analysis
pnpm clean        # git clean -xdf node_modules
```

---

## Environment

next-forge manages env via `@t3-oss/env-nextjs` with a `keys.ts` per package; each app's `env.ts` composes them. Copy the per-app examples and fill them in:

```
apps/app/.env.example  →  apps/app/.env.local
apps/web/.env.example  →  apps/web/.env.local
apps/api/.env.example  →  apps/api/.env.local
```

Major groups (**names only**): Clerk (`CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_*`), database (`DATABASE_URL`, `DIRECT_URL`), Sentry/BetterStack, PostHog/GA, Stripe + Polar, Knock, Arcjet, Liveblocks, Svix, Resend, BaseHub, Vercel Blob, OpenAI, and the shared URLs (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_API_URL`, …).

**Anorha-specific** (in `apps/app`): `ADMIN_USER_IDS` (comma-separated Clerk user ids for the `/admin` allowlist), `LANGFUSE_DASHBOARD_URL` (the embedded observability view), plus `NEXT_PUBLIC_SUPABASE_*` and `NEXT_PUBLIC_TESTFLIGHT_*`.

---

## What's customized vs. vanilla next-forge

- **`apps/app/.../admin`** — internal ops plane: deny-by-default allowlist (404 to non-staff) with an embedded **Langfuse** dashboard for inspecting the AI agent's traces (one trace per turn, tool-call + model-generation spans).
- **`apps/desktop`** — an Electron app (not part of stock next-forge) wrapping the Next.js app with a tray sign-in flow.
- Anorha branding and a handful of internal data-flow guides under `apps/app/`.

---

## Deployment

Each app deploys to **Vercel** (per-app `vercel.json` handles the monorepo install/build, e.g. `pnpm build --filter=app`). The Electron desktop app is packaged with electron-builder. Set env vars in each Vercel project.

---

## How it fits together

- **[anorha-bknd](https://github.com/danielosagie/anorha-bknd)** — the mobile API; its Langfuse traces are what `/admin` surfaces.
- **[anorha-expo](https://github.com/danielosagie/anorha-expo)** — the React Native app.
- **anorha-tray** — desktop browser-automation agent.

---

Built on [next-forge](https://www.next-forge.com) by Vercel.
