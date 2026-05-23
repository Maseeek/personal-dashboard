# Personal Life Dashboard

A premium, interactive, dark-mode personal productivity and health tracking dashboard built with **Next.js 16 (App Router)**, **Tailwind CSS v4**, and custom CSS animations.

---

## Key Modules & Features

1. **Nasdaq-Style Goal Ticker**: A scrolling banner at the top displaying active checklist objectives, styling index items with financial-ticker tags.
2. **Day Ring awake countdown**: SVG progress ring tracking your awake cycle hours. Features a real-time ticking clock and a color spectrum that shifts across HSL values (representing dawn to midnight) as the day progresses. Inline settings allow you to configure your custom awake hours window.
3. **Objectives Checklist**: Interactive checklist with inline editing, task reordering, and a ⚡ Quick Queue priority filter. Includes a **Plan Tomorrow** panel that lets you prepare next-day goals and lock them, ready for single-click migration.
4. **Finances Ledger**: Categorized ledger tracking transactions, calculating net balance, and displaying income/expense summaries with custom category filters.
5. **Fitbit Health Tracker**: Sync simulation dashboard representing steps progress, sleep cycle distributions (Deep/Light/REM stacked visual bar), and average cardio heart rate. Includes manual biometric override inputs.
6. **Google Calendar Schedule**: Time-block organizer sorting daily meetings and highlighting gym workouts/workouts automatically using neon-badge indicators.

---

## Design System

* **Base Canvas Background**: `#050506` deep space.
* **Ambient Lighting Wash**: Two drifting radial gradients (orange wash top-right and cool grey bottom-left) looping continuously on a 36-second CSS animation timeline.
* **Film-Grain Layer**: Fine texturing overlaid on `body::after` using a repeating 3px white dot SVG pattern.
* **Glassmorphic Card Panels**: Backdrops saturation using `backdrop-filter: blur(24px) saturate(1.2)` paired with thin semi-transparent borders (`rgba(255, 255, 255, 0.07)`) and subtle shadow drops.

---

## Getting Started

### Prerequisites
* **Node.js**: The project requires **Node.js v20** or higher (Next.js 16 compiler requirement).

### How to Start the Development Server
Depending on your operating system:

#### Linux
```bash
# Source NVM, load Node 20, and start the development server
. ~/.nvm/nvm.sh && nvm use 20 && npm run dev
```

#### Windows 11
If Node.js v20+ is already active in your command line, run:
```powershell
npm run dev
```
Otherwise, if you use NVM for Windows:
```powershell
nvm use 20
npm run dev
```

The server will spin up and run on [http://localhost:3000](http://localhost:3000).

### Build for Production
To verify and compile the optimized production bundle:

#### Linux
```bash
# Source NVM, load Node 20, and compile the production build
. ~/.nvm/nvm.sh && nvm use 20 && npm run build
```

#### Windows 11
```powershell
npm run build
```

---

## Storage & Persistence Architecture

The dashboard uses a **Local Storage Fallback** design pattern:
* All updates (checklists, ledger entries, day ring settings, calendar appointments, and health parameters) are written to browser local storage.
* If Supabase environment variables are later configured, data hooks will sync state to the cloud. Without env keys, the application remains fully functional locally.
