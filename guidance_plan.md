# Live Personal Life Dashboard - Project Guidance & Stack Discussion

This document serves as the implementation roadmap and design foundation for your personal dashboard. It has been updated to **remove mindfulness tracking completely** (due to Medito API restrictions and a preference against manual widgets) and pivot away from the reference project's single-file Netlify Blobs stack, while **retaining its aesthetic styling and UX ideas** (drifting radial washes, film-grain dot overlay, Nasdaq-style goals ticker, day ring, and todo list structure).

---

## 1. Core Visual Style & Ideas

We are retaining the premium dark-mode styling and features from the reference project, implementing them in our new codebase:
- **Base Background**: `#050506` with two slowly drifting, blurred radial gradients:
  - Warm orange wash: `rgba(224, 118, 88, 0.16)` at top-right (82% / 14%).
  - Cool grey wash: `rgba(180, 180, 200, 0.06)` at bottom-left (18% / 90%).
  - Animated drift over a 36-second loop.
- **Film-Grain Dot Overlay**: A repeating 3px×3px dot tile (white at ~1.4% opacity) placed on `body::after` to add visual texture.
- **Typography**: Sans-serif system stacks (`-apple-system, BlinkMacSystemFont, "Inter"`) and monospace for metrics and clocks (`ui-monospace, "SF Mono"`).
- **Glassmorphic Card Chassis**: Background `rgba(255, 255, 255, 0.04)` with a `backdrop-filter: blur(24px) saturate(1.2)`, border-radius `16px`, and soft shadows.
- **Key UX Features**:
  1. **Nasdaq-Style Goal Ticker**: A scrolling banner displaying active unchecked goals, cycling every 5 seconds.
  2. **Day Ring**: Circular SVG countdown tracker measuring your awake hours (8:00 AM – 12:00 AM) that shifts color across a sun-cycle spectrum.
  3. **To Do List Card**: TODAY progress bar and goal item lists (with reordering, inline edits, and a ⚡ queue toggle) + PLAN TOMORROW locking system.
  4. **Finances Card**: Custom ledger grid tracking expenses/income categories and sums.

---

## 2. Proposed Lightweight Stacks (Discussion)

To make the app lightweight, secure, and capable of retrieving data from Google APIs (Fitbit Air steps/sleep and Google Calendar events), we propose pairing the frontend with **Supabase** (PostgreSQL-as-a-service, free tier, zero database maintenance).

Here are the two main lightweight stack paths for the project:

### Option A: Next.js (App Router) + Tailwind CSS + Supabase (Recommended)
This approach combines a React frontend with serverless API route handlers.
- **Pros**:
  - **Background Syncing**: Next.js serverless route handlers can run cron-triggered background syncs. It can check your Fitbit Air data and Google Calendar events every few hours *even when your browser tab is closed*.
  - **Secure Token Handlers**: API routes securely handle client secrets and OAuth redirects without exposing them to the client.
  - **Easy Deployments**: Simple, zero-config deployment on Vercel.
- **Cons**: Slightly more files than a pure frontend SPA.

### Option B: Vite + React SPA (Single Page Application) + Supabase
This is a pure client-side web application.
- **Pros**:
  - **Minimalist**: Bundles down to plain HTML/JS/CSS assets. Very fast local startup.
  - **Zero Server Setup**: Can be deployed to any static host (Vercel, Netlify, Github Pages).
- **Cons**:
  - **Sync-on-Open Only**: Syncing with Google Health (Fitbit Air) and Google Calendar can only run when you have the dashboard tab open in your browser.
  - **Client-Side Secrets**: Client-side OAuth flows require more care since client secrets cannot be securely used on the browser side (must use PKCE or implicit auth flow).

---

## 3. Preliminary Database Schema (PostgreSQL on Supabase)

Regardless of the stack, we will use a relational schema containing:
* `users`: Basic profile tracking.
* `oauth_credentials`: Caches Google OAuth access and refresh tokens securely.
* `metrics_daily`: Stores Fitbit Air metrics (sleep, steps, average heart rate).
* `calendar_events`: Caches Google Calendar events (extracts gym sessions).
* `financial_transactions`: Logs budget categories, descriptions, amounts, and transaction dates.
* `goals`: Stores the daily check-lists.

---

## 4. Next Steps
1. Align on the stack choice (Option A or Option B).
2. Clean out any temporary files in the project workspace directory to prepare the directory.
3. Scaffold the chosen codebase structure.
