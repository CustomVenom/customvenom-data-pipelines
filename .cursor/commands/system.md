# Cursor Handoff Kit

Quick reference for system prompts, workflows, and deployment procedures.

---

### 1) System prompts — /system (ready to paste)

- Page: [SYSTEM_PROMPTS — Cursor (/system ready)](https://www.notion.so/SYSTEM_PROMPTS-Cursor-system-ready-3de9da896e12416ebe7f7046559df9c7?pvs=21)
- Prompts:
    - Ship Fast (edits)
    - Review Spec (deep reasoning)
    - Bulk Rewrite (budget)
    - Long Context (multi-file)
    - General Builder (safe, fast, contract-aware)
- Self-review agent:
    - Self‑Review and Auto‑Update Planner block on the same page
    - Use: new chat → /system → paste → “Review our prompts and propose minimal fixes. Output copy‑ready patches.”

---

### 2) Frontend customization — Handoff message (Tailwind + Radix)

- Page: [Cursor Handoff — Frontend Customization (Tailwind + Radix)](https://www.notion.so/Cursor-Handoff-Frontend-Customization-Tailwind-Radix-45f95ccc1bce403fb66b4b6dd6110c08?pvs=21)
- Plan: Theme tokens → Dark mode → Density toggle → Skeletons → Reason chips clamp → Glossary tooltips
- Acceptance: Tokens flow through, CLS < 0.1, ≤2 chips, accessible tooltips

---

### 3) Release PR comment — Production promotion

Copy-ready comment to paste into the release PR. Merge order + staging checks + promotion commands.

"""

### 🚀 Production Release — Consolidated PR Comment

Summary: Phases 1–3 shipped (rate limiting, combined smokes, stale headers + trim profile, request_id propagation, frontend request_id display). No contract drift.

Merge order

1) PR #7 — Rate limit + combined smokes. [Link][[1]](https://github.com/CustomVenom/customvenom-workers-api/pull/7)

2) PR #8 — Stale headers + trim profile (Workers). [Link][[2]](https://github.com/CustomVenom/customvenom-workers-api/pull/8) · [trim-profile.md](http://trim-profile.md)[[3]](http://trim-profile.md/)

3) PR #9 — request_id in error responses (Workers). [Link][[4]](https://github.com/CustomVenom/customvenom-workers-api/pull/9)

4) PR #17 — request_id display (Frontend). [Link][[5]](https://github.com/CustomVenom/customvenom-frontend/pull/17)

Staging validation (must be true)

- Headers: CORS=*, cache-control has stale-if-error=86400, x-request-id, x-key, x-schema-version, x-last-refresh
- Bodies: /health { ok, schema_version, last_refresh }; /projections has schema_version + last_refresh
- Guardrails: no contract drift; reasons discipline enforced pre-serialization

Promotion commands

Workers

- git tag v1.0.0 -m "Production release: Phases 1–3 complete"
- git push origin v1.0.0
- npm run deploy:production
- node scripts/smokes-combined.mjs https://api.customvenom.com

Frontend

- git tag v1.0.0 -m "Production release: UI features + validation"
- git push origin v1.0.0
- vercel --prod

Manual checks

- Force fallback → expect x-stale: true and UI Stale badge
- Force error → ApiErrorBoundary shows request_id and Copy works

"""

---

### 4) Smokes and validator — copy-ready

- From Manual: [CustomVenom Build Manual — v1](https://www.notion.so/CustomVenom-Build-Manual-v1-d5825d6035204be3afc9782e9d697cad?pvs=21)
- Quick commands

```bash
# Health
curl -fsS "$API_BASE/health" | jq '{ok, schema_version, last_refresh}'
# Projections headers + body
curl -fsSi "$API_BASE/projections?week=2025-06" | sed -n '1,20p'
curl -fsS  "$API_BASE/projections?week=2025-06" | jq '{schema_version, last_refresh}'
```

- **Node scripts** (customvenom-workers-api/scripts/):
  - `smokes-combined.mjs` - Combined health + projections check (recommended)
  - `smoke-health.mjs` - Health endpoint only
  - `smoke-projections.mjs` - Projections endpoint only
  - `smoke-headers.mjs` - Headers verification
  - `validate-golden-week.mjs` - Golden week data validation

- **Usage:**

  ```bash
  # Combined (recommended)
  node scripts/smokes-combined.mjs https://api.customvenom.com
  
  # Or set API_BASE
  export API_BASE=https://api.customvenom.com
  node scripts/smokes-combined.mjs
  ```


---

### 5) Project tasks — where to pull slices

- Master checklist: [Project Tasks — Master Checklist](https://www.notion.so/Project-Tasks-Master-Checklist-972dde601b664c78b261c3d1e9de0719?pvs=21)
- Open tasks — Live and Done — Live views are embedded there and auto-update from the Roadmap.
- Roadmap database (full): [](https://www.notion.so/71c24e8903a84535af18d4714fa6cd92?pvs=21)

---

### 6) Extras (optional)

**Sentry Integration** (✅ Committed to both repos):

- **Frontend:**
  - `sentry.client.config.ts` + `sentry.server.config.ts`
  - `@sentry/nextjs@^8.0.0` installed
  - `tracesSampleRate: 0.0` (off by default)
  - Wired into `src/app/layout.tsx`
  - Docs: `SENTRY_INTEGRATION.md`
  
- **Workers API:**
  - `src/lib/sentry.ts` (edge-optimized, ~20 lines)
  - `@sentry/core` + `@sentry/browser` installed
  - Wired into global error handler
  - `wrangler.toml`: SENTRY_DSN + COMMIT_SHA vars (empty by default)
  - Docs: `SENTRY_INTEGRATION.md`
  - Monitoring guide: `docs/monitoring-setup.md` (Sentry section added)

- **Summary:** `SENTRY_IMPLEMENTATION_SUMMARY.md` (workspace root)
- **Safe:** No events sent without DSN. Sampling at 0.0. Ready to enable on staging first.

**Other Features:**

- Request_id propagation + frontend display: see PR #9 and #17 above
- Trim mode + stale badge: see PR #8 above

---

### 7) Vercel Deployment

**Project:** https://vercel.com/incarcers-projects/customvenom-frontend-fop8  
**Production URL:** https://customvenom-frontend-fop8.vercel.app

**Required Environment Variables:**

- `DATABASE_URL` - PostgreSQL (use Neon.tech free tier)
- `AUTH_SECRET` - Generate: `openssl rand -base64 32`
- `NEXTAUTH_URL` - https://customvenom-frontend-fop8.vercel.app
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (OAuth)
- `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_API_BASE` + `API_BASE` (Workers API URL)
- `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` (leave empty until ready)

**Setup Guide:** `customvenom-frontend/VERCEL_SETUP.md`

**Build Fix Applied:**

```json
"build": "prisma generate && next build",
"postinstall": "prisma generate"
```

**After env vars set:**

1. Run database migration: `npx prisma db push` (with DATABASE_URL)
2. Redeploy in Vercel dashboard
3. Configure Stripe webhook endpoint
4. Update OAuth redirect URIs

---

### TL;DR — One-liners to send to Cursor

- **Prompts:** new chat → /system → paste from SYSTEM_PROMPTS page
- **Frontend slices:** copy "Handoff message" block from Frontend Customization page
- **Release:** paste the "Production Release — Consolidated PR Comment" above into your PR
- **Smokes:** `node scripts/smokes-combined.mjs https://api.customvenom.com`
- **Vercel:** Follow `customvenom-frontend/VERCEL_SETUP.md` for deployment
- **Sentry:** See `SENTRY_INTEGRATION.md` in both repos, or `SENTRY_IMPLEMENTATION_SUMMARY.md` at workspace root
