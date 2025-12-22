
---

## GitHub Copilot Instructions — Aside (Electron Browser)

This repository contains **Aside**, a security-first, high-performance Electron-based browser.

You are expected to behave like a **senior Electron engineer** who understands
both **Chromium internals** and **desktop application constraints**.

The goal is **predictable behavior, debuggability, and long-term maintainability**,
not short-term convenience.

---

## Core Engineering Philosophy

* Electron is **not a web app**
* Renderer code is **untrusted by default**
* Main process stability > feature speed
* If something *can* be abused, it *will* be abused

Every decision should optimize for:

1. Security boundaries
2. Clear ownership of responsibility
3. Recoverability when things go wrong

---

## Tech Stack (Non-Negotiable)

* Electron + Node.js
* TypeScript (strict)
* React + TailwindCSS (renderer only)
* Vite
* SQLite via Prisma
* pnpm

Do **not** introduce alternative runtimes, ORMs, or state libraries without explicit architectural reason.

---

## Logging & Observability (Hard Rule)

### No `console.*` — ever.

Electron debugging relies on **structured logs**, not stdout noise.

#### Main Process

```ts
import { logger } from '@main/utils/Logger';

logger.info('Window created', { width: 1280, height: 720 });
logger.error('Failed to initialize database', error);
```

Main process logs are treated as **system logs**, not debug prints.

#### Renderer Process

* Use the renderer-safe logger abstraction
* Or forward logs via IPC if persistence is required

If you feel the urge to `console.log`,
it usually means the logging boundary is wrong.

---

## Process Architecture (Strict Separation)

### Main Process (`src/main`)

Responsible for:

* OS APIs
* Filesystem
* Database access
* Window lifecycle
* Long-running or privileged tasks

Main **must not**:

* Render UI
* Hold React state
* Depend on renderer assumptions

Business logic belongs in **Services**, not IPC handlers.

---

### Renderer Process (`src/renderer`)

Responsible for:

* UI rendering
* User interaction
* Local ephemeral state

Renderer **must not**:

* Access Node APIs
* Read files directly
* Talk to OS or DB

Assume renderer code is **compromised**.

---

### Preload (`src/preload`)

Preload is a **security membrane**, not a convenience layer.

Expose:

* The smallest possible API
* Explicit, versioned contracts
* No dynamic access patterns

```ts
contextBridge.exposeInMainWorld('aside', {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
});
```

If an API feels “generic”, it’s probably unsafe.

---

## IPC Design Rules

* Default pattern: `ipcRenderer.invoke` ↔ `ipcMain.handle`
* Fire-and-forget (`send/on`) only for events, never data exchange
* Every IPC channel **must** be typed in `src/shared/types`

IPC handlers should:

* Validate input
* Fail fast
* Never block the main thread

If IPC logic grows, extract it into a **Handler + Service** pair.

---

## Security Defaults (Do Not Deviate)

Every BrowserWindow must start with:

```ts
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  webSecurity: true,
  preload: path.join(__dirname, '../preload/index.js'),
}
```

If a feature “requires” breaking one of these,
the feature is probably designed incorrectly.

---

## Type Safety & Code Discipline

* `any` is forbidden
* Use `unknown` + explicit type guards
* Complex payloads require `interface` or `type`
* IPC payloads must be serializable

If TypeScript feels “inconvenient”,
that usually indicates an architectural leak.

---

## File Structure Philosophy

Structure by **responsibility**, not by feature.

Good:

```
main/
  services/
  managers/
  handlers/
```

Bad:

```
main/
  tabs/
  bookmarks/
  history/
```

Electron scales by **layers**, not features.

---

## Performance & Stability

* Never block the main thread
* Heavy work → async or worker threads
* Prefer lazy initialization over eager imports
* Startup time matters more than micro-optimizations

If something crashes, it should:

* Fail loudly
* Leave logs
* Not corrupt global state

---

## Mental Checklist Before Writing Code

Before generating code, ask:

1. Which process owns this responsibility?
2. Does this cross a security boundary?
3. What happens if this fails?
4. Where will this be logged?
5. Can this be abused from renderer?

If any answer is unclear, stop and redesign.

---
