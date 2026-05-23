<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Personal Dashboard Project Guidelines

These rules dictate how this codebase is structured and styled. Read these guidelines before writing any page, component, utility, or database operation.

## 1. Directory Structure

- **`app/`**: Next.js App Router root.
- **`app/components/`**: All UI components. Make them modular, reusable, and cleanly typed.
- **`app/utils/`**: Utilities for sync, local storage backup, and mathematical operations.
- **`app/api/`**: Mock serverless endpoints simulating external API integrations.
- **`supabase_schema.sql`**: Database layout reference.

## 2. Aesthetic Design System

This app requires a highly polished, premium, modern dark UI. Do not use generic tailwind colors. Use these spec-defined classes and tokens:

- **Background styling**: 
  - Base background color: `#050506`
  - Two drifting radial gradients in `app/layout.tsx` or global CSS:
    - Orange wash: `rgba(224, 118, 88, 0.16)` top-right
    - Cool grey wash: `rgba(180, 180, 200, 0.06)` bottom-left
    - Drift animation: slow loop (e.g. 36s duration, shifting positions slightly).
  - Dot overlay: repeating 3px x 3px dot tile (white at 1.4% opacity).
- **Card Chassis**:
  - Background: `rgba(255, 255, 255, 0.04)` (or Tailwind `bg-white/4`)
  - Border: `rgba(255, 255, 255, 0.08)` (or Tailwind `border-white/8`)
  - Filter: `backdrop-blur-[24px] saturate-[1.2]`
  - Corner radius: `rounded-2xl` (16px)
- **Typography**:
  - System sans-serif for general text.
  - Monospace for metric values, counts, charts, and clocks.

## 3. Data Integration & Local Storage Fallback Pattern

To enable standalone local development and robust network error tolerance, the dashboard uses a **Local Storage Fallback** paradigm.
- All dashboard writes (todo state, ledger additions, goal modifications) must write to Local Storage first (or in tandem with Supabase).
- Data hooks should attempt to sync with Supabase if the client is configured with env keys; if keys are missing or requests fail, the dashboard must fall back to Local Storage state seamlessly.
- **Mock APIs**: Fitbit steps/sleep and Google Calendar events are served from `/api/fitbit` and `/api/calendar` as mock endpoints. Do not make direct fetch calls to the public Fitbit or Google APIs unless explicitly configured.

## 4. Coding Practices

- **Next.js 16 Rules**: Follow any version guidelines found in `node_modules/next/dist/docs/`.
- **Tailwind CSS v4**: Utilize native CSS variables and v4 syntax conventions. Do not load legacy Tailwind configurations.
- **Types**: All components and state objects must have strong TypeScript interfaces.

## 5. Development & Build Commands

- **Node.js Version**: The project requires Node.js v20+. The system default may be v18, which will cause Next.js build failures.
- **Command Prefix**: Always prefix development and build commands by sourcing `nvm` to use node 20:
  ```bash
  . ~/.nvm/nvm.sh && nvm use 20 && npm run dev
  ```
  ```bash
  . ~/.nvm/nvm.sh && nvm use 20 && npm run build
  ```

## 6. Antigravity Agent Guidelines & Optimization

- **MCP Tools**: When local development is running (`npm run dev`), invoke tools on the `next-devtools` MCP server (e.g. `get_errors`, `get_routes`, `get_page_metadata`) to monitor server state, diagnose runtime issues, or trace routing.
- **Local Skills**: Refer to [skills/glassmorphism/SKILL.md](file:///home/maciek/Documents/personal-dashboard/skills/glassmorphism/SKILL.md) and [skills/data-sync/SKILL.md](file:///home/maciek/Documents/personal-dashboard/skills/data-sync/SKILL.md) before writing styling or data fetching hooks. Use these files as developer instruction guides.
- **Task Tracking**: Track implementation progress in the workspace `task.md` file. Always update tasks to completed `[x]` as soon as verification succeeds.
- **File Edits**: Prefer `replace_file_content` for localized edits, and keep codebase edits focused to preserve clean git diffs.
