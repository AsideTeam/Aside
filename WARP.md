# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Core commands

All commands assume the project root and `pnpm` as the package manager.

### Setup & database
- Install dependencies:
  - `pnpm install`
- Generate Prisma client (if not already generated or after schema changes):
  - `pnpm exec prisma generate`
  - or `pnpm generate`
- Database migrations & tools:
  - Create / update dev schema with migrations: `pnpm migrate`
  - Push schema without migrations (dev only): `pnpm push`
  - Prisma Studio: `pnpm studio`

### Development
- Run the Electron + Vite dev environment (main, preload, renderer):
  - `pnpm dev`

### Build & packaging
- Build all Electron bundles (main, preload, renderer) with electron-vite:
  - `pnpm build`
- Preview the built renderer with electron-vite’s preview server:
  - `pnpm preview`
- Create unpacked app artifacts with electron-builder:
  - `pnpm pack`
- Create distributable installers (DMG/NSIS/etc.):
  - `pnpm dist`

### Linting, formatting, and type checking
- Type checking (strict TypeScript, no `any`):
  - `pnpm type-check`
- Lint all TypeScript/TSX under `src`:
  - `pnpm lint`
- Lint and auto-fix:
  - `pnpm lint:fix`
- Lint only shared code (cross-process types, IPC, etc.):
  - `pnpm lint:shared`
- Format with Prettier:
  - `pnpm format`

### Tests
There is currently no dedicated test script defined in `package.json`. If you introduce a test runner (e.g., Vitest/Jest), add `test` / `test:watch` scripts and update this section with concrete commands (including how to run a single test file).

---

## High-level architecture

### Process separation & layers
The app follows a strict Electron layering model with four main code areas:

- **Main process (`src/main`)**
  - Owns OS integration (windows, default browser, extensions, updates), filesystem, and database access.
  - Orchestrates app lifecycle, IPC handler registration, and WebContentsView-based tab management.
- **Renderer (`src/renderer`)**
  - Pure UI (React + Tailwind v4) overlay that renders the browser chrome (header, sidebar, settings UI, etc.).
  - Treat this as untrusted; it never directly touches Node, the filesystem, or the database.
- **Preload (`src/preload`)**
  - Narrow security membrane. Exposes a typed `window.electronAPI` surface built on top of IPC.
  - All renderer ↔ main communication goes through this layer.
- **Shared (`src/shared`)**
  - Cross-process contracts: IPC channel names, payload types, shared domain types, logger contracts, validation helpers, and constants.
  - Both main and renderer import from here; implementation lives in their respective trees.

This separation is **strict** and should not be violated when adding new code.

### Lifecycle & startup
Key lifecycle orchestration lives in `src/main/core/lifecycle.ts`:

- `AppLifecycle.bootstrap()` (called from `app.on('ready')`):
  - Validates environment and paths via `@main/config` (`env.ts`, `paths.ts`).
  - Initializes the main logger and connects to SQLite via Prisma (using `database/connection.ts`).
  - Initializes appearance (native theme) via `AppearanceService` before windows/views are created.
  - Creates the main `BrowserWindow` via `MainWindow.create()` in `core/window.ts`.
  - Obtains the overlay UI `WebContents` and initializes the `ViewManager` with it.
  - Leaves IPC registration to `setupIPCHandlers()` (see below) but assumes handlers are registered during bootstrap.
- `AppLifecycle.shutdown()` (called from `app.on('will-quit')`):
  - Cleans up managers (e.g., `ViewManager.destroy()`), services (e.g., `UpdateService`, `AppearanceService`), and database connections.
  - Ensures a clean, logged shutdown path even on errors.

New startup/shutdown concerns should be wired into `AppLifecycle` instead of ad-hoc `app.on(...)` listeners.

### IPC architecture
IPC is strongly typed and centralized. The key pieces are:

- **Channel registry (`src/shared/ipc/channels.ts`)**
  - Defines all IPC channel names grouped by domain (APP, WINDOW, TAB, NAV, VIEW, SETTINGS, EXTENSIONS, DEFAULT_BROWSER, OVERLAY).
  - Exports `IPC_CHANNELS` and `IPCChannelType`; main and renderer must import from here instead of hard-coding strings.
- **Payload types (`src/shared/ipc/payloads.ts`)**
  - Defines request/response interfaces for channels (e.g., `TabCreateRequest`, `NavNavigateRequest`, `SidebarToggleRequest`) and shared wrappers like `IpcResponse<T>`.
  - Renderer and main should use these types in IPC handlers and callers.
- **Validation (`src/shared/validation`)**
  - Zod schemas (`schemas.ts` and related files) validate incoming payloads at runtime.
  - Main handlers call `validateOrThrow(schema, input)` *before* touching `ViewManager` or services.
- **Registry & handlers (`src/main/handlers`)**
  - `IpcRegistry` wraps `ipcMain.handle`/`on` and owns handler registration and disposal.
  - `setupIPCHandlers()` in `handlers/index.ts`:
    - Instantiates a fresh `IpcRegistry`.
    - Registers domain-specific handlers: `AppHandler`, `TabHandler`, `SettingsHandler`, `ExtensionsHandler`, `DefaultBrowserHandler`, `ViewHandler`.
    - Exposes `removeAllIPCHandlers()` for shutdown.
  - Example: `TabHandler` wires TAB-related channels to `ViewManager`, validates inputs via shared Zod schemas, and always returns a `{ success, ... }` shape.

- **Preload contract (`src/preload/index.d.ts`)**
  - Declares the `ElectronAPI` surface exposed as `window.electronAPI` in the renderer.
  - Includes namespaces for `app`, `window`, `tab`, `settings`, `view`, and low-level `invoke/on/off/once` helpers.
  - Any new preload-exposed API must be reflected here so renderer code remains fully typed.

When adding a new cross-process feature:
1. Add a channel constant in `shared/ipc/channels.ts`.
2. Add request/response types in `shared/ipc/payloads.ts` and validation schema(s) in `shared/validation`.
3. Register a handler in `src/main/handlers/*` via `IpcRegistry`, performing validation + logging.
4. Expose a narrow method on `window.electronAPI` via preload.
5. Consume it in the renderer (ideally via a small wrapper in `src/renderer/lib` or a dedicated hook).

### Tab & layout management
The browser’s tab system is modeled around WebContentsView and a custom layout manager:

- **ViewManager (`src/main/managers/viewManager`)**
  - Maintains internal `ViewManagerState` for all tabs, the active tab, the containing `BrowserWindow`, and the overlay UI `WebContents`.
  - Responsible for:
    - Creating/closing/switching/duplicating tabs and restoring recently closed tabs.
    - Managing pinned/favorite tabs and their sections (icon/space/tab).
    - Computing bounds for the active `WebContentsView` based on safe areas reported by the renderer (header/sidebar overlay, etc.).
    - Applying layout via `applyLayout` and ensuring the overlay UI vs content stacking is correct (`ensureUITopmost`, `ensureContentTopmost`).
  - Synchronizes tab snapshots back to the renderer (via TAB.UPDATED events) with a debounce; renderer never reads main-state directly.

- **Renderer tab view (`src/renderer/hooks/tabs/useTabs.ts` and related components)**
  - `useTabs` subscribes to TAB.LIST (via `window.electronAPI.invoke`) and TAB.UPDATED events, maintaining local React state for the visible tabs.
  - Uses runtime guards to validate IPC responses before updating state, logging and resetting on malformed payloads.
  - Tab UI components under `src/renderer/components/browser` render headers, sidebars, and tab lists based on this hook.

- **Layouts & overlay (`src/renderer/layouts`, `src/main/core/overlay`, renderer overlay hooks)**
  - React entry (`src/renderer/app/App.tsx`) chooses between `ZenLayout` and `ChromeLayout` based on settings.
  - The root `<div>` uses `pointer-events-none` so clicks pass through to the underlying `WebContentsView` except where explicitly re-enabled, enabling the “frame-like” overlay behavior.
  - Overlay-related logic (hover hotzones, header/sidebar latch, safe areas) is coordinated via:
    - Main overlay state and helpers in `src/main/core/overlay/*` and `src/main/state/overlayStore.ts`.
    - Renderer hooks in `src/renderer/hooks/overlay/*` that measure hover regions and report them over IPC.

When modifying tab behavior or overlay layout, adjust **both** the main `ViewManager` layer and the renderer overlay to keep geometry and state in sync.

### Persistence & data model
Prisma models live in `prisma/schema.prisma`:

- `History`: visit log with URL, title, favicon, and `visitedAt` timestamps, indexed for recent and URL-based queries.
- `Bookmark`: persisted bookmarks with optional folder hierarchy via a `folder` string; indexed for folder + createdAt queries.
- `AppSetting`: key-value store for application settings (theme, language, homepage, layout mode, etc.).
- `SessionTab`: last-known tab state across sessions, with `section` (`icon` | `space` | `tab`) and `position` to restore pinned and regular tabs.

Main process services under `src/main/services` (e.g., `History`, `SettingsService`, `SettingsStore`, `AppearanceService`, `AdBlock`, `Update`) are responsible for implementing domain logic on top of this schema. New persisted features should usually:
- Extend `schema.prisma` and regenerate the client.
- Add a dedicated service in `src/main/services`.
- Expose operations via typed IPC handlers instead of letting the renderer touch the DB.

### Logging & observability
Logging is centralized via a shared interface and per-process implementations:

- **Shared contracts (`src/shared/logger`)**
  - Exposes `LogLevel` and `ILogger` types only.
  - Both main and renderer implement this interface separately.

- **Main logger (`src/main/utils/logger.ts`)**
  - Implements `ILogger` and writes to `userData/logs/app.log`.
  - In dev, also logs to the terminal with ANSI colors; in prod, focuses on file output.
  - All main code (lifecycle, handlers, services, view manager) should log via this singleton `logger`, not via raw `console.*`.

- **Renderer logger (`src/renderer/lib/logger.ts`)**
  - Implements the same interface for renderer-side logging; can forward or persist logs as needed.

When adding new behavior, prefer structured, contextual logging (messages + metadata) at key boundaries (startup, IPC handlers, service operations) rather than ad-hoc `console.log`.

---

## Project-specific rules for Warp / AI changes

These rules adapt the existing GitHub Copilot and agent prompts for Warp. They should be treated as **hard constraints** when generating or editing code.

### Tech stack constraints
- Electron + Node.js main process, with React + Tailwind v4 in the renderer.
- TypeScript in strict mode:
  - Do **not** introduce `any` (use `unknown` + explicit narrowing when needed).
  - Keep all new code type-safe and compatible with existing strict settings.
- State and persistence:
  - Use SQLite via Prisma (`@prisma/client` + `prisma` tooling).
  - Do not introduce alternative ORMs or databases without an explicit architectural reason.
- Package management:
  - Use `pnpm` for all examples and new scripts.
- Do not introduce alternative SPA frameworks, runtimes, or global state libraries beyond what is already in use (React + Zustand, etc.).

### Security & process boundaries
- Treat **renderer code as untrusted by default**.
- **Main process (`src/main`)**:
  - Owns OS APIs, filesystem, database, window lifecycle, and long-lived privileged tasks.
  - Must **not** depend on renderer internals or hold React state.
  - Business logic belongs in dedicated services (`src/main/services`), not directly in IPC handlers.
- **Renderer (`src/renderer`)**:
  - Must not access Node or Electron APIs directly.
  - Talks only to `window.electronAPI` (preload) and through typed IPC.
- **Preload (`src/preload`)**:
  - Acts as a **security membrane** between renderer and main.
  - Expose the *smallest possible* API surface; avoid generic or dynamic accessors.
  - Keep `ElectronAPI` in `index.d.ts` as the canonical contract; update it together with any new preload-exposed API.
- **BrowserWindow defaults**:
  - Maintain secure `webPreferences` for all windows: `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, `webSecurity: true`, and an explicit `preload` path.
  - If a change appears to require relaxing these, reconsider the design instead.

### IPC design expectations
- Prefer `ipcRenderer.invoke` / `ipcMain.handle` request-response patterns.
- Use `send/on` only for one-way events, not for data-fetching flows.
- Every IPC channel must:
  - Be declared in `shared/ipc/channels.ts`.
  - Have clearly named request/response payload types in `shared/ipc/payloads.ts`.
  - Use Zod validation in main handlers before acting on data.
- If a handler grows complex, extract the heavy logic into a dedicated service and keep handlers focused on:
  1. Validation.
  2. Delegation to services/ViewManager.
  3. Mapping service results into typed IPC responses.

### Architectural style
- Structure main code by **responsibility layer**, not by feature:
  - Keep using the `core/`, `config/`, `database/`, `managers/`, `services/`, `handlers/`, `utils/` layout.
- Renderer code should favor:
  - Hooks (`src/renderer/hooks`) for side effects and IPC orchestration.
  - Presentational components under `src/renderer/components`.
  - Layout-level orchestration in `src/renderer/layouts` and `src/renderer/app`.
- Prefer extending existing layers (e.g., adding a new handler + service) rather than creating parallel ad-hoc modules.

### Logging discipline
- Follow the shared logger abstraction; do not introduce raw `console.log` in new code.
- For main:
  - Use the singleton `logger` from `@main/utils/logger` with structured metadata objects.
- For renderer:
  - Use `@renderer/lib/logger` (or wrap it) instead of direct console usage.
- When adding significant flows (startup branches, IPC handlers, DB operations, layout computations), add informative `info` / `warn` / `error` logs with context.

### Warp-specific generation behavior
- Behave like a **senior Electron engineer**:
  - Respect Electron’s multi-process model and security posture.
  - Optimize for predictability, debuggability, and long-term maintainability over quick hacks.
- When generating answers that include code:
  - Provide a brief reasoning or explanation **before** showing code changes.
  - Include file paths alongside code snippets so humans can locate them quickly.
  - Follow Vite + Tailwind v4 idioms already present in the repo.
  - Prefer minimal, targeted abstractions over premature generalization.

If a requested change conflicts with these rules (e.g., needs insecure webPreferences, generic IPC tunnels, or bypasses services), call that out explicitly and propose a safer alternative.
