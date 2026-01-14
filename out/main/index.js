import { app, nativeTheme, WebContentsView, screen, BrowserWindow, session, webContents, shell, ipcMain, protocol } from "electron";
import Store from "electron-store";
import { existsSync, mkdirSync, appendFileSync, promises } from "node:fs";
import path, { join, dirname } from "node:path";
import { createStore } from "zustand/vanilla";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2["DEBUG"] = "debug";
  LogLevel2["INFO"] = "info";
  LogLevel2["WARN"] = "warn";
  LogLevel2["ERROR"] = "error";
  return LogLevel2;
})(LogLevel || {});
class MainLogger {
  logFilePath;
  isDev;
  constructor() {
    this.isDev = !app.isPackaged;
    const logDir = join(app.getPath("userData"), "logs");
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
    this.logFilePath = join(logDir, "app.log");
  }
  /**
   * Transport: 실제 로그를 파일과 콘솔에 출력
   */
  write(level, message, meta) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    const logLine = `[${timestamp}] [${this.getLevelString(level)}] ${message}${metaStr}`;
    if (this.isDev) {
      const color = this.getColor(level);
      console.log(`${color}${logLine}\x1B[0m`);
    }
    try {
      appendFileSync(this.logFilePath, logLine + "\n", "utf-8");
    } catch (e) {
      console.error("Log file write failed:", e);
    }
  }
  getLevelString(level) {
    const levelMap = {
      [LogLevel.DEBUG]: "DEBUG",
      [LogLevel.INFO]: "INFO ",
      [LogLevel.WARN]: "WARN ",
      [LogLevel.ERROR]: "ERROR"
    };
    return levelMap[level];
  }
  getColor(level) {
    const colorMap = {
      [LogLevel.DEBUG]: "\x1B[90m",
      // gray
      [LogLevel.INFO]: "\x1B[36m",
      // cyan
      [LogLevel.WARN]: "\x1B[33m",
      // yellow
      [LogLevel.ERROR]: "\x1B[31m"
      // red
    };
    return colorMap[level];
  }
  debug(message, meta) {
    this.write(LogLevel.DEBUG, message, meta);
  }
  info(message, meta) {
    this.write(LogLevel.INFO, message, meta);
  }
  warn(message, meta) {
    this.write(LogLevel.WARN, message, meta);
  }
  error(message, error, meta) {
    const errorObj = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error;
    this.write(LogLevel.ERROR, message, { ...meta, error: errorObj });
  }
  getContext() {
    return "main";
  }
  setLevel(level) {
  }
}
const logger = new MainLogger();
const APP_NAME = "Aside";
process.env.NODE_ENV === "development";
process.env.NODE_ENV === "production";
app.name = APP_NAME.toLowerCase();
class Env {
  /** 개발 모드 여부 */
  static isDev = !app.isPackaged;
  /** 프로덕션 모드 여부 */
  static isProd = app.isPackaged;
  /** 로그 레벨: dev='debug', prod='error' */
  static logLevel = this.isDev ? "debug" : "error";
  /** 로그 파일 출력 활성화 (항상 활성화) */
  static enableLogFile = true;
  /** 콘솔 출력 활성화: dev=true, prod=false */
  static enableConsole = this.isDev;
  /** 데이터 디렉토리 (사용자 데이터 저장 위치) */
  static dataDir = app.getPath("userData");
  /** 앱 이름 (window 제목, 메뉴 등에서 사용) */
  static appName = APP_NAME;
  /** 앱 버전 (package.json의 version) */
  static appVersion = app.getVersion();
  /**
   * 싱글톤 검증 (인스턴스화 방지)
   */
  constructor() {
    throw new Error("Env is a singleton. Do not instantiate.");
  }
}
function validateEnv() {
  if (!app.isReady()) {
    throw new Error("[Env] app must be ready before validation");
  }
  if (!Env.dataDir) {
    throw new Error("[Env] userData path is empty");
  }
  logger.info("[Env] Environment initialized", {
    mode: Env.isDev ? "DEVELOPMENT" : "PRODUCTION",
    app: `${Env.appName} v${Env.appVersion}`,
    dataDir: Env.dataDir,
    logLevel: Env.logLevel
  });
}
class Paths {
  /**
   * 데이터 루트 디렉토리
   * @returns ~/.local/share/Aside (Linux), ~/Library/Application Support/Aside (macOS), AppData/Local/Aside (Windows)
   */
  static root() {
    return Env.dataDir;
  }
  /**
   * SQLite 데이터베이스 파일 경로
   * @returns {dataDir}/database/app.db
   */
  static database() {
    return join(this.root(), "database", "app.db");
  }
  /**
   * 로그 파일 디렉토리
   * @returns {dataDir}/logs
   */
  static logsDir() {
    return join(this.root(), "logs");
  }
  /**
   * 메인 로그 파일 경로
   * @returns {dataDir}/logs/main.log
   */
  static mainLog() {
    return join(this.logsDir(), "main.log");
  }
  /**
   * 에러 로그 파일 경로 (심각한 에러만)
   * @returns {dataDir}/logs/error.log
   */
  static errorLog() {
    return join(this.logsDir(), "error.log");
  }
  /**
   * 캐시 디렉토리
   * @returns {dataDir}/cache
   */
  static cacheDir() {
    return join(this.root(), "cache");
  }
  /**
   * 세션 데이터 디렉토리 (탭 세션, 히스토리 등 복구용)
   * @returns {dataDir}/session
   */
  static sessionDir() {
    return join(this.root(), "session");
  }
  /**
   * 모든 경로를 로그 (디버깅용)
   */
  static printAll() {
    logger.info("Directory structure", {
      root: this.root(),
      database: this.database(),
      logsDir: this.logsDir(),
      mainLog: this.mainLog(),
      errorLog: this.errorLog(),
      cache: this.cacheDir(),
      session: this.sessionDir()
    });
  }
  /**
   * 싱글톤 검증 (인스턴스화 방지)
   */
  constructor() {
    throw new Error("Paths is a singleton. Do not instantiate.");
  }
}
const initialState = {
  focused: true,
  headerOpen: false,
  sidebarOpen: false,
  headerLatched: false,
  sidebarLatched: false,
  isDragging: false
};
const overlayStore = createStore((set, get) => ({
  ...initialState,
  setFocused: (focused) => set({ focused }),
  setHeaderOpen: (open) => set({ headerOpen: open }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setHeaderLatched: (latched) => set({ headerLatched: latched }),
  setSidebarLatched: (latched) => set({ sidebarLatched: latched }),
  setDragging: (dragging) => set({ isDragging: dragging }),
  toggleHeaderLatched: () => {
    const next = !get().headerLatched;
    set({ headerLatched: next });
    return next;
  },
  toggleSidebarLatched: () => {
    const next = !get().sidebarLatched;
    set({ sidebarLatched: next });
    return next;
  },
  resetOpen: () => set({ headerOpen: false, sidebarOpen: false })
}));
z.object({});
z.object({});
z.object({});
z.object({});
z.object({});
z.object({});
z.boolean();
z.object({
  timestamp: z.number()
});
const OverlayLatchChangedEventSchema = z.object({
  latched: z.boolean(),
  timestamp: z.number()
});
z.object({
  zone: z.enum(["header", "sidebar"]),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  timestamp: z.number()
});
const OverlayContentPointerEventSchema = z.object({
  kind: z.enum(["mouseDown", "mouseUp"]),
  timestamp: z.number()
});
const OverlayHoverMetricsSchema = z.object({
  sidebarRightPx: z.number().finite().optional(),
  headerBottomPx: z.number().finite().optional(),
  titlebarHeightPx: z.number().finite().optional(),
  dpr: z.number().positive().finite(),
  timestamp: z.number()
});
z.object({
  url: z.string().min(1),
  timestamp: z.number()
});
z.object({
  url: z.string().min(1),
  canGoBack: z.boolean(),
  canGoForward: z.boolean(),
  timestamp: z.number()
});
const ViewResizeSchema = z.object({
  left: z.number().int().nonnegative(),
  top: z.number().int().nonnegative()
});
const ViewNavigateSchema = z.object({
  url: z.string().min(1, "URL cannot be empty").max(2048, "URL exceeds maximum length").refine(
    (url) => {
      try {
        const parsed = new URL(url);
        const allowedProtocols = ["http:", "https:", "about:"];
        return allowedProtocols.includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    {
      message: "Invalid URL format or unsupported protocol"
    }
  )
});
const TabCreateSchema = z.object({
  url: z.string().min(1, "URL cannot be empty").max(2048, "URL exceeds maximum length").refine(
    (url) => {
      try {
        const parsed = new URL(url);
        const allowedProtocols = ["http:", "https:", "about:"];
        return allowedProtocols.includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    {
      message: "Invalid URL format or unsupported protocol"
    }
  )
});
const TabCloseSchema = z.object({
  tabId: z.string().min(1, "Tab ID cannot be empty").max(64, "Tab ID too long").regex(/^tab-[a-zA-Z0-9-]+$/, "Invalid Tab ID format")
});
const TabSwitchSchema = z.object({
  tabId: z.string().min(1, "Tab ID cannot be empty").max(64, "Tab ID too long").regex(/^tab-[a-zA-Z0-9-]+$/, "Invalid Tab ID format")
});
z.object({});
z.object({});
z.object({
  tabId: z.string().min(1, "Tab ID cannot be empty").max(64, "Tab ID too long").regex(/^tab-[a-zA-Z0-9-]+$/, "Invalid Tab ID format")
});
z.object({
  tabId: z.string().min(1, "Tab ID cannot be empty").max(64, "Tab ID too long").regex(/^tab-[a-zA-Z0-9-]+$/, "Invalid Tab ID format"),
  pinned: z.boolean()
});
z.object({
  tabId: z.string().min(1, "Tab ID cannot be empty").max(64, "Tab ID too long").regex(/^tab-[a-zA-Z0-9-]+$/, "Invalid Tab ID format"),
  newIndex: z.number().int().nonnegative()
});
const TabMoveSectionSchema = z.object({
  tabId: z.string().min(1, "Tab ID cannot be empty").max(64, "Tab ID too long").regex(/^tab-[a-zA-Z0-9-]+$/, "Invalid Tab ID format"),
  targetType: z.enum(["icon", "space", "tab"])
});
const TabReorderWithinSectionSchema = z.object({
  tabId: z.string().min(1, "Tab ID cannot be empty").max(64, "Tab ID too long").regex(/^tab-[a-zA-Z0-9-]+$/, "Invalid Tab ID format"),
  position: z.number().int().nonnegative("Position must be non-negative")
});
const TabReorderIconSchema = z.object({
  fromIndex: z.number().int().nonnegative(),
  toIndex: z.number().int().nonnegative()
});
z.object({
  tabId: z.string().min(1, "Tab ID cannot be empty").max(64, "Tab ID too long").regex(/^tab-[a-zA-Z0-9-]+$/, "Invalid Tab ID format")
});
z.object({});
z.object({});
function validateOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }
  return result.data;
}
const DEFAULT_SETTINGS = {
  theme: "dark",
  layoutMode: "zen",
  searchEngine: "google",
  homepage: "https://www.google.com",
  showHomeButton: true,
  showBookmarksBar: false,
  fontSize: "medium",
  customFontSize: 14,
  pageZoom: "100",
  blockThirdPartyCookies: true,
  continueSession: true,
  language: "ko",
  savePasswords: false,
  savePaymentInfo: false,
  saveAddresses: false,
  doNotTrack: true,
  blockAds: false,
  // Downloads
  downloadDirectory: "",
  downloadAskWhereToSave: false,
  downloadOpenAfterSave: false,
  // Accessibility
  accessibilityHighContrast: false,
  accessibilityReduceMotion: false,
  // System
  systemHardwareAcceleration: true,
  systemBackgroundApps: false,
  // Extensions
  extensionsEnabled: false,
  extensionsDirectory: "",
  // Default Browser
  defaultBrowserPromptOnStartup: true
};
class SettingsStore {
  static instance = null;
  store;
  constructor() {
    this.store = new Store({
      name: "settings",
      defaults: DEFAULT_SETTINGS,
      // Schema validation
      schema: {
        theme: {
          type: "string",
          enum: ["light", "dark", "system"],
          default: "dark"
        },
        layoutMode: {
          type: "string",
          enum: ["zen", "chrome"],
          default: "zen"
        },
        searchEngine: {
          type: "string",
          enum: ["google", "bing", "duckduckgo", "naver"],
          default: "google"
        },
        homepage: {
          type: "string",
          format: "uri",
          default: "https://www.google.com"
        },
        showHomeButton: {
          type: "boolean",
          default: true
        },
        showBookmarksBar: {
          type: "boolean",
          default: false
        },
        fontSize: {
          type: "string",
          enum: ["small", "medium", "large", "xlarge"],
          default: "medium"
        },
        customFontSize: {
          type: "number",
          minimum: 8,
          maximum: 24,
          default: 14
        },
        pageZoom: {
          type: "string",
          default: "100"
        },
        blockThirdPartyCookies: {
          type: "boolean",
          default: true
        },
        continueSession: {
          type: "boolean",
          default: true
        },
        language: {
          type: "string",
          enum: ["ko", "en", "ja"],
          default: "ko"
        },
        savePasswords: {
          type: "boolean",
          default: false
        },
        savePaymentInfo: {
          type: "boolean",
          default: false
        },
        saveAddresses: {
          type: "boolean",
          default: false
        },
        doNotTrack: {
          type: "boolean",
          default: true
        },
        blockAds: {
          type: "boolean",
          default: false
        },
        // Downloads
        downloadDirectory: {
          type: "string",
          default: ""
        },
        downloadAskWhereToSave: {
          type: "boolean",
          default: false
        },
        downloadOpenAfterSave: {
          type: "boolean",
          default: false
        },
        // Accessibility
        accessibilityHighContrast: {
          type: "boolean",
          default: false
        },
        accessibilityReduceMotion: {
          type: "boolean",
          default: false
        },
        // System
        systemHardwareAcceleration: {
          type: "boolean",
          default: true
        },
        systemBackgroundApps: {
          type: "boolean",
          default: false
        },
        // Extensions
        extensionsEnabled: {
          type: "boolean",
          default: false
        },
        extensionsDirectory: {
          type: "string",
          default: ""
        },
        // Default Browser
        defaultBrowserPromptOnStartup: {
          type: "boolean",
          default: true
        }
      },
      // Migrations for version upgrades
      migrations: {
        ">=0.1.0": (store) => {
          if (!store.has("language")) {
            store.set("language", "ko");
          }
        }
      },
      // Migration 로그
      beforeEachMigration: (_store, context) => {
        logger.info(
          `[SettingsStore] Migrating from ${context.fromVersion} → ${context.toVersion}`
        );
      }
    });
    logger.info("[SettingsStore] Initialized", {
      path: this.store.path
    });
  }
  /**
   * Singleton 인스턴스 반환
   */
  static getInstance() {
    if (!this.instance) {
      this.instance = new SettingsStore();
    }
    return this.instance;
  }
  /**
   * 모든 설정값 조회
   */
  getAll() {
    try {
      return this.store.store;
    } catch (error) {
      logger.error("[SettingsStore] Failed to get all settings:", error);
      return DEFAULT_SETTINGS;
    }
  }
  /**
   * 특정 설정값 조회
   */
  get(key) {
    try {
      return this.store.get(key);
    } catch (error) {
      logger.error("[SettingsStore] Failed to get setting:", error, { key });
      return DEFAULT_SETTINGS[key];
    }
  }
  /**
   * 설정값 업데이트
   */
  set(key, value) {
    try {
      this.store.set(key, value);
      logger.info("[SettingsStore] Setting updated", { key, value });
      return true;
    } catch (error) {
      logger.error("[SettingsStore] Failed to set setting:", error, { key, value });
      return false;
    }
  }
  /**
   * 여러 설정값 한 번에 업데이트
   */
  setMultiple(updates) {
    try {
      Object.entries(updates).forEach(([key, value]) => {
        this.store.set(key, value);
      });
      logger.info("[SettingsStore] Multiple settings updated", {
        count: Object.keys(updates).length
      });
      return true;
    } catch (error) {
      logger.error("[SettingsStore] Failed to set multiple settings:", error);
      return false;
    }
  }
  /**
   * 설정값 삭제
   */
  delete(key) {
    try {
      this.store.delete(key);
      logger.info("[SettingsStore] Setting deleted", { key });
      return true;
    } catch (error) {
      logger.error("[SettingsStore] Failed to delete setting:", error, { key });
      return false;
    }
  }
  /**
   * 모든 설정값 초기화
   */
  reset() {
    try {
      this.store.clear();
      logger.info("[SettingsStore] All settings reset to defaults");
      return true;
    } catch (error) {
      logger.error("[SettingsStore] Failed to reset settings:", error);
      return false;
    }
  }
  /**
   * 설정 파일 경로 반환
   */
  getPath() {
    return this.store.path;
  }
  /**
   * 설정값 변경 감지
   */
  onChange(key, callback) {
    return this.store.onDidChange(key, callback);
  }
  /**
   * 모든 설정값 변경 감지
   */
  onAnyChange(callback) {
    return this.store.onDidAnyChange(callback);
  }
}
function toNativeThemeSource(theme) {
  switch (theme) {
    case "light":
      return "light";
    case "dark":
      return "dark";
    case "system":
    default:
      return "system";
  }
}
async function withDebugger(webContents2, fn) {
  if (webContents2.isDestroyed()) return;
  try {
    webContents2.debugger.attach("1.3");
  } catch (error) {
    logger.warn("[AppearanceService] Failed to attach debugger (CDP emulation disabled for this webContents)", {
      id: webContents2.id,
      error: String(error)
    });
    return;
  }
  try {
    await fn();
  } catch (error) {
    logger.warn("[AppearanceService] CDP command failed", {
      id: webContents2.id,
      error: String(error)
    });
  } finally {
    try {
      webContents2.debugger.detach();
    } catch {
    }
  }
}
class AppearanceService {
  static initialized = false;
  static unsubscribers = [];
  static initialize() {
    if (this.initialized) return;
    this.initialized = true;
    const store = SettingsStore.getInstance();
    this.applyNativeTheme(store.get("theme"));
    this.unsubscribers.push(
      store.onChange("theme", (value) => {
        const theme = value === "light" || value === "dark" || value === "system" ? value : store.get("theme");
        this.applyNativeTheme(theme);
      })
    );
  }
  static applyNativeTheme(theme) {
    try {
      nativeTheme.themeSource = toNativeThemeSource(theme);
      logger.info("[AppearanceService] Applied nativeTheme.themeSource", { themeSource: nativeTheme.themeSource });
    } catch (error) {
      logger.error("[AppearanceService] Failed to apply native theme", error);
    }
  }
  static async applyToWebContents(webContents2) {
    const store = SettingsStore.getInstance();
    const theme = store.get("theme");
    await withDebugger(webContents2, async () => {
      if (theme === "system") {
        await webContents2.debugger.sendCommand("Emulation.setEmulatedMedia", { media: "", features: [] });
        return;
      }
      await webContents2.debugger.sendCommand("Emulation.setEmulatedMedia", {
        media: "",
        features: [{ name: "prefers-color-scheme", value: theme }]
      });
    });
  }
  static dispose() {
    for (const unsub of this.unsubscribers) {
      try {
        unsub();
      } catch {
      }
    }
    this.unsubscribers = [];
    this.initialized = false;
  }
}
function ensureUITopmost({
  contentWindow,
  uiWebContents,
  lastReorderTarget,
  setLastReorderTarget,
  logger: logger2
}) {
  try {
    const contentView = contentWindow.getContentView();
    const uiId = uiWebContents.id;
    const top = contentView.children[contentView.children.length - 1];
    const topWcId = top.webContents?.id;
    const isUiAlreadyTopmost = topWcId === uiId;
    if (lastReorderTarget === "ui" && isUiAlreadyTopmost) return;
    const uiView = contentView.children.find((child) => {
      const maybe = child;
      return maybe.webContents?.id === uiId;
    });
    if (uiView) {
      contentView.addChildView(uiView);
      setLastReorderTarget("ui");
    }
  } catch (error) {
    logger2.error("[ViewManager] Failed to reorder UI view", error);
  }
}
function ensureContentTopmost({
  contentWindow,
  activeTabId,
  tabs,
  lastReorderTarget,
  setLastReorderTarget,
  logger: logger2
}) {
  try {
    const tabData = tabs.get(activeTabId);
    if (!tabData) return;
    const contentView = contentWindow.getContentView();
    const top = contentView.children[contentView.children.length - 1];
    const isActiveAlreadyTopmost = top === tabData.view;
    if (lastReorderTarget === "content" && isActiveAlreadyTopmost) return;
    contentView.addChildView(tabData.view);
    setLastReorderTarget("content");
  } catch (error) {
    logger2.error("[ViewManager] Failed to reorder content view", error);
  }
}
function dumpContentViewTree({
  reason,
  contentWindow,
  uiWebContents,
  logger: logger2
}) {
  try {
    const contentView = contentWindow.getContentView();
    const uiId = uiWebContents?.id;
    const children = contentView.children.map((child, index) => {
      const ctor = child.constructor?.name;
      const maybe = child;
      const wcId = maybe.webContents?.id;
      let bounds = null;
      try {
        bounds = child.getBounds?.() ?? null;
      } catch {
        bounds = null;
      }
      return {
        index,
        type: ctor ?? "Unknown",
        isUiWebContents: uiId ? wcId === uiId : false,
        webContentsId: wcId ?? null,
        isContentRoot: false,
        bounds
      };
    });
    logger2.info("[ViewManager] ContentView tree", {
      reason,
      windowId: contentWindow.id,
      uiWebContentsId: uiId ?? null,
      childCount: children.length,
      children
    });
  } catch (error) {
    logger2.error("[ViewManager] Failed to dump content view tree", error);
  }
}
function computeExternalActiveBounds(args) {
  const { contentWindow, safeArea, logger: logger2 } = args;
  const contentBounds = contentWindow.getBounds();
  const { width, height } = contentBounds;
  logger2.debug("[📐 MAIN] Content Window actual bounds:", {
    x: contentBounds.x,
    y: contentBounds.y,
    width: contentBounds.width,
    height: contentBounds.height
  });
  const bleed = 0;
  const externalActiveBounds = {
    x: safeArea.left,
    y: safeArea.top,
    width: Math.max(0, width - safeArea.left + bleed),
    height: Math.max(0, height - safeArea.top + bleed)
  };
  logger2.debug("[📐 MAIN] Calculated bounds from safe-area (with bleed):", {
    contentWindow: { w: width, h: height },
    safeArea,
    bleed,
    calculatedBounds: externalActiveBounds
  });
  return externalActiveBounds;
}
function applyLayout({
  contentWindow,
  tabs,
  externalActiveBounds,
  logger: logger2
}) {
  const { width, height } = contentWindow.getBounds();
  const defaultBounds = {
    x: 0,
    y: 0,
    width,
    height: Math.max(0, height)
  };
  const activeBounds = externalActiveBounds ?? defaultBounds;
  logger2.debug("[MAIN LAYOUT] Applying bounds:", {
    contentWindow: { w: width, h: height },
    externalBounds: externalActiveBounds,
    finalBounds: activeBounds,
    usingExternal: !!externalActiveBounds
  });
  const hiddenBounds = { x: 0, y: 0, width: 0, height: 0 };
  const boundsEqual = (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
  for (const [, tabData] of tabs) {
    const current = tabData.view.getBounds();
    if (tabData.isActive) {
      if (tabData.url.startsWith("about:")) {
        if (!boundsEqual(current, hiddenBounds)) tabData.view.setBounds(hiddenBounds);
        logger2.debug("[ViewManager] Layout: hiding WebView for about page", { url: tabData.url });
      } else {
        if (!boundsEqual(current, activeBounds)) tabData.view.setBounds(activeBounds);
      }
    } else {
      if (!boundsEqual(current, hiddenBounds)) tabData.view.setBounds(hiddenBounds);
    }
  }
}
const DEFAULT_MAX_RECENT_CLOSED = 10;
function createInitialViewManagerState() {
  return {
    tabs: /* @__PURE__ */ new Map(),
    activeTabId: null,
    contentWindow: null,
    uiWebContents: null,
    isInitializing: false,
    lastReorderTarget: null,
    lastSafeArea: null,
    externalActiveBounds: null,
    recentlyClosed: [],
    settingsUnsubscribers: []
  };
}
function getTabSection(tab) {
  if (tab.isFavorite) return "icon";
  if (tab.isPinned) return "space";
  return "tab";
}
function setPinned(args) {
  const { tabs, tabId, pinned, logger: logger2 } = args;
  const tab = tabs.get(tabId);
  if (!tab) {
    logger2.warn("[ViewManager] Tab not found for pin", { tabId });
    return;
  }
  tab.isPinned = pinned;
  if (pinned) {
    tab.isFavorite = false;
  }
  logger2.info("[ViewManager] Tab pin status changed", { tabId, pinned });
}
function moveTabToSection(args) {
  const { tabs, tabId, targetType, logger: logger2 } = args;
  const tab = tabs.get(tabId);
  if (!tab) {
    logger2.warn("[ViewManager] Tab not found for move-section", { tabId });
    return;
  }
  const previousType = getTabSection(tab);
  switch (targetType) {
    case "icon":
      tab.isFavorite = true;
      tab.isPinned = false;
      logger2.info("[ViewManager] Tab moved to icon section", { tabId, previousType });
      break;
    case "space":
      tab.isFavorite = false;
      tab.isPinned = true;
      logger2.info("[ViewManager] Tab moved to space section", { tabId, previousType });
      break;
    case "tab":
      tab.isFavorite = false;
      tab.isPinned = false;
      logger2.info("[ViewManager] Tab moved to tab section", { tabId, previousType });
      break;
  }
}
function reorderTab(args) {
  const { tabs, tabId, targetId, logger: logger2 } = args;
  const allTabs = Array.from(tabs.entries());
  const fromIndex = allTabs.findIndex(([id]) => id === tabId);
  const toIndex = allTabs.findIndex(([id]) => id === targetId);
  if (fromIndex === -1 || toIndex === -1) {
    logger2.warn("[ViewManager] Invalid tab IDs for reorder", { tabId, targetId });
    return;
  }
  const [movedTab] = allTabs.splice(fromIndex, 1);
  allTabs.splice(toIndex, 0, movedTab);
  tabs.clear();
  allTabs.forEach(([id, data]) => {
    tabs.set(id, data);
  });
  logger2.info("[ViewManager] Tab reordered", { tabId, targetId, fromIndex, toIndex });
}
function reorderTabWithinSection(args) {
  const { tabs, tabId, position, logger: logger2 } = args;
  const tab = tabs.get(tabId);
  if (!tab) {
    logger2.warn("[ViewManager] Tab not found for reorder", { tabId });
    return;
  }
  const section = getTabSection(tab);
  const sectionTabs = Array.from(tabs.entries()).filter(([, data]) => {
    return getTabSection(data) === section;
  });
  const currentIndex = sectionTabs.findIndex(([id]) => id === tabId);
  if (currentIndex === -1 || position < 0 || position >= sectionTabs.length) {
    logger2.warn("[ViewManager] Invalid position for reorder", {
      tabId,
      position,
      sectionLength: sectionTabs.length
    });
    return;
  }
  const [movedEntry] = sectionTabs.splice(currentIndex, 1);
  sectionTabs.splice(position, 0, movedEntry);
  const allTabs = Array.from(tabs.entries());
  const newTabs = [];
  const iconTabs = allTabs.filter(([, data]) => getTabSection(data) === "icon");
  const spaceTabs = allTabs.filter(([, data]) => getTabSection(data) === "space");
  const normalTabs = allTabs.filter(([, data]) => getTabSection(data) === "tab");
  switch (section) {
    case "icon":
      newTabs.push(...sectionTabs);
      newTabs.push(...spaceTabs);
      newTabs.push(...normalTabs);
      break;
    case "space":
      newTabs.push(...iconTabs);
      newTabs.push(...sectionTabs);
      newTabs.push(...normalTabs);
      break;
    case "tab":
      newTabs.push(...iconTabs);
      newTabs.push(...spaceTabs);
      newTabs.push(...sectionTabs);
      break;
  }
  tabs.clear();
  newTabs.forEach(([id, data]) => {
    tabs.set(id, data);
  });
  logger2.info("[ViewManager] Tab reordered within section", { tabId, position, currentIndex });
}
function getTabsSnapshot(tabs) {
  return Array.from(tabs.values()).map(({ id, url, title, isActive, isPinned, isFavorite, favicon }) => ({
    id,
    url,
    title,
    isActive,
    isPinned,
    isFavorite,
    favicon
  }));
}
function syncTabsToRenderer(args) {
  const { uiWebContents, tabs, activeTabId, logger: logger2 } = args;
  if (!uiWebContents) return;
  const state = {
    tabs: getTabsSnapshot(tabs),
    activeTabId
  };
  try {
    uiWebContents.send("tabs:updated", state);
    logger2.debug("[ViewManager] Synced to renderer", { tabCount: state.tabs.length });
  } catch (error) {
    logger2.error("[ViewManager] Failed to sync to renderer:", error);
  }
}
const IPC_CHANNELS = {
  // ===== APP 영역 =====
  APP: {
    /** 앱이 준비됨 (모든 초기화 완료) */
    READY: "app:ready",
    /** 앱 종료 요청 */
    QUIT: "app:quit",
    /** 앱 재시작 요청 */
    RESTART: "app:restart",
    /** 앱 상태 조회 */
    STATE: "app:state",
    /** 앱 정보 조회 (이름/버전/경로 등) */
    GET_INFO: "app:get-info"
  },
  // ===== WINDOW 영역 (Renderer에서 Main으로 요청) =====
  WINDOW: {
    /** 윈도우 최소화 */
    MINIMIZE: "window:minimize",
    /** 윈도우 최대화/복원 토글 */
    MAXIMIZE: "window:maximize",
    /** 윈도우 닫기 */
    CLOSE: "window:close"
  },
  // ===== TAB 영역 (탭 관리 - Request/Response) =====
  TAB: {
    /** 새 탭 생성 (Request: URL, Response: tabId) */
    CREATE: "tab:create",
    /** 탭 닫기 (Request: tabId) */
    CLOSE: "tab:close",
    /** 탭 전환 (Request: tabId) */
    SWITCH: "tab:switch",
    /** 탭 URL 변경 (Request: tabId, url) */
    UPDATE_URL: "tab:update-url",
    /** 탭 목록 조회 */
    LIST: "tab:list",
    /** 활성 탭 ID 조회 */
    ACTIVE: "tab:active",
    /** 현재 탭 네비게이션 */
    NAVIGATE: "tab:navigate",
    /** 뒤로 가기 */
    BACK: "tab:back",
    /** 앞으로 가기 */
    FORWARD: "tab:forward",
    /** 새로고침 */
    RELOAD: "tab:reload",
    /** 탭 복제 (현재 URL과 같은 새 탭 생성) */
    DUPLICATE: "tab:duplicate",
    /** 탭 고정/해제 (Space 섹션에 표시) */
    PIN: "tab:pin",
    /** 다른 탭 모두 닫기 */
    CLOSE_OTHERS: "tab:close-others",
    /** 모든 탭 닫기 */
    CLOSE_ALL: "tab:close-all",
    /** 닫은 탭 복원 */
    RESTORE: "tab:restore",
    /** 섹션 간 이동 (Icon/Space/Tab) */
    MOVE_SECTION: "tab:move-section",
    /** 같은 섹션 내 탭 순서 변경 (Request: tabId, position) */
    REORDER: "tab:reorder",
    /** Icon 순서 변경 (Request: fromIndex, toIndex) */
    REORDER_ICON: "tab:reorder-icon",
    /** [Event] 탭 목록 업데이트 (Main → Renderer) */
    UPDATED: "tabs:updated"
  },
  // ===== NAVIGATION 영역 (브라우징 네비게이션) =====
  NAV: {
    /** URL로 이동 (Request: url) */
    NAVIGATE: "nav:navigate",
    /** 뒤로 가기 */
    BACK: "nav:back",
    /** 앞으로 가기 */
    FORWARD: "nav:forward",
    /** 새로고침 */
    RELOAD: "nav:reload",
    /** [Event] 네비게이션 상태 변경 (뒤/앞 가능 여부 변경) */
    STATE_CHANGED: "nav:state-changed"
  },
  // ===== SIDEBAR 영역 =====
  SIDEBAR: {
    /** 사이드바 토글 (확장/축소) */
    TOGGLE: "sidebar:toggle"
  },
  // ===== VIEW 영역 (WebContentsView 관리 - Zen Layout) =====
  VIEW: {
    /** WebContentsView 크기/위치 조절 (Request: bounds) */
    RESIZE: "view:resize",
    /** WebContentsView로 네비게이션 (Request: url) */
    NAVIGATE: "view:navigate",
    /** Settings 페이지 열림/닫힘 토글 */
    SETTINGS_TOGGLED: "view:settings-toggled",
    /** [Event] WebContentsView 로드 완료 */
    LOADED: "view:loaded",
    /** [Event] WebContentsView 네비게이션 완료 */
    NAVIGATED: "view:navigated"
  },
  // ===== SETTINGS 영역 =====
  SETTINGS: {
    GET_ALL: "settings:get-all",
    GET: "settings:get",
    UPDATE: "settings:update",
    UPDATE_MULTIPLE: "settings:update-multiple",
    RESET: "settings:reset",
    /** 설정 파일 경로 조회 */
    GET_PATH: "settings:get-path"
  },
  // ===== EXTENSIONS 영역 =====
  EXTENSIONS: {
    /** 확장 상태 조회 */
    GET_STATUS: "extensions:get-status",
    /** 확장(재)로드 */
    RELOAD: "extensions:reload"
  },
  // ===== DEFAULT BROWSER 영역 =====
  DEFAULT_BROWSER: {
    /** 기본 브라우저 상태 조회 */
    GET_STATUS: "default-browser:get-status",
    /** 기본 브라우저로 설정 시도 */
    SET_DEFAULT: "default-browser:set-default",
    /** OS 기본 앱 설정 화면 열기 */
    OPEN_SYSTEM_SETTINGS: "default-browser:open-system-settings"
  },
  // ===== OVERLAY 영역 (UI overlay latch/toggles) =====
  OVERLAY: {
    TOGGLE_HEADER_LATCH: "overlay:toggle-header-latch",
    TOGGLE_SIDEBAR_LATCH: "overlay:toggle-sidebar-latch",
    SET_INTERACTIVE: "overlay:set-interactive",
    /** Renderer가 실측한 hover hotzone(사이드바/헤더/titlebar) 업데이트 */
    UPDATE_HOVER_METRICS: "overlay:update-hover-metrics",
    /** [Event] Ghost 상태에서 edge hover 감지 (Main → Renderer) */
    EDGE_HOVER: "overlay:edge-hover",
    /** [Event] WebView에서 마우스 다운/업 발생 (Main → Renderer) */
    CONTENT_POINTER: "overlay:content-pointer",
    DEBUG: "overlay:debug"
  }
};
function attachTabEvents(args) {
  const { tabId, view, getTabData, getUiWebContents, syncToRenderer, createTab: createTab2, logger: logger2 } = args;
  view.webContents.on("before-input-event", (_event, input) => {
    try {
      const uiWebContents = getUiWebContents();
      if (!uiWebContents) return;
      if (input.type !== "mouseDown" && input.type !== "mouseUp") return;
      const payload = OverlayContentPointerEventSchema.parse({
        kind: input.type,
        timestamp: Date.now()
      });
      uiWebContents.send(IPC_CHANNELS.OVERLAY.CONTENT_POINTER, payload);
    } catch {
    }
  });
  view.webContents.on("page-title-updated", (_event, title) => {
    const tabData = getTabData(tabId);
    if (tabData) {
      tabData.title = title;
      logger2.info("[ViewManager] Tab title updated", { tabId, title });
      syncToRenderer();
    }
  });
  view.webContents.on("did-navigate", (_event, url) => {
    const tabData = getTabData(tabId);
    if (tabData) {
      tabData.url = url;
      logger2.info("[ViewManager] Tab URL changed", { tabId, url });
      syncToRenderer();
      const uiWebContents = getUiWebContents();
      if (uiWebContents && tabData.isActive) {
        uiWebContents.send("view:navigated", {
          url,
          canGoBack: view.webContents.navigationHistory.canGoBack(),
          canGoForward: view.webContents.navigationHistory.canGoForward(),
          timestamp: Date.now()
        });
      }
    }
  });
  view.webContents.on("did-navigate-in-page", (_event, url) => {
    const tabData = getTabData(tabId);
    if (tabData) {
      tabData.url = url;
      syncToRenderer();
      const uiWebContents = getUiWebContents();
      if (uiWebContents && tabData.isActive) {
        uiWebContents.send("view:navigated", {
          url,
          canGoBack: view.webContents.navigationHistory.canGoBack(),
          canGoForward: view.webContents.navigationHistory.canGoForward(),
          timestamp: Date.now()
        });
      }
    }
  });
  view.webContents.setWindowOpenHandler(({ url }) => {
    logger2.info("[ViewManager] Intercepted window.open", { url });
    void createTab2(url);
    return { action: "deny" };
  });
  view.webContents.on("page-favicon-updated", (_event, favicons) => {
    const tabData = getTabData(tabId);
    if (tabData && favicons.length > 0) {
      tabData.favicon = favicons[0];
      logger2.debug("[ViewManager] Tab favicon updated", { tabId, favicon: favicons[0] });
      syncToRenderer();
    }
  });
  view.webContents.on("did-finish-load", () => {
    const tabData = getTabData(tabId);
    if (!tabData) return;
    const uiWebContents = getUiWebContents();
    if (uiWebContents && tabData.isActive) {
      uiWebContents.send("view:loaded", {
        url: view.webContents.getURL(),
        timestamp: Date.now()
      });
    }
  });
  logger2.info("[ViewManager] Tab event listeners attached", { tabId });
}
async function navigateActiveTab(args) {
  const { tabs, activeTabId, url, applyAppearance, syncToRenderer, logger: logger2 } = args;
  if (!activeTabId) {
    logger2.warn("[ViewManager] No active tab to navigate");
    return;
  }
  const tabData = tabs.get(activeTabId);
  if (!tabData) {
    logger2.warn("[ViewManager] Active tab not found");
    return;
  }
  try {
    if (url.startsWith("about:")) {
      const aboutPage = url.replace("about:", "");
      switch (aboutPage) {
        case "preferences":
        case "settings":
          tabData.url = url;
          tabData.title = "Settings";
          tabData.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
          logger2.info("[ViewManager] Navigating to settings page", { tabId: activeTabId });
          syncToRenderer();
          return;
        default:
          logger2.warn("[ViewManager] Unknown about page:", { page: aboutPage });
          return;
      }
    }
    applyAppearance(tabData);
    void tabData.view.webContents.loadURL(url).catch((err) => {
      logger2.error("[ViewManager] loadURL error", { url, error: err });
    });
    tabData.url = url;
    logger2.info("[ViewManager] Navigate started", { url });
    syncToRenderer();
  } catch (error) {
    logger2.error("[ViewManager] Navigate failed:", { error, url });
    throw error;
  }
}
function goBack(args) {
  const { tabs, activeTabId, logger: logger2 } = args;
  if (!activeTabId) return;
  const tabData = tabs.get(activeTabId);
  if (tabData?.view.webContents.navigationHistory.canGoBack()) {
    tabData.view.webContents.navigationHistory.goBack();
    logger2.info("[ViewManager] Go back", { tabId: activeTabId });
  }
}
function goForward(args) {
  const { tabs, activeTabId, logger: logger2 } = args;
  if (!activeTabId) return;
  const tabData = tabs.get(activeTabId);
  if (tabData?.view.webContents.navigationHistory.canGoForward()) {
    tabData.view.webContents.navigationHistory.goForward();
    logger2.info("[ViewManager] Go forward", { tabId: activeTabId });
  }
}
function reload(args) {
  const { tabs, activeTabId, logger: logger2 } = args;
  if (!activeTabId) return;
  const tabData = tabs.get(activeTabId);
  if (tabData) {
    tabData.view.webContents.reload();
    logger2.info("[ViewManager] Reload", { tabId: activeTabId });
  }
}
async function createTab(args) {
  const {
    contentWindow,
    tabs,
    url,
    zoomSetting,
    applyZoom,
    setupTabEvents,
    applyAppearance,
    dumpTree,
    logger: logger2
  } = args;
  logger2.info("[ViewManager] Creating new tab...", { url });
  const view = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      sandbox: true
    }
  });
  view.setBackgroundColor("#00000000");
  applyZoom(view.webContents, zoomSetting);
  const tabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const tabData = {
    id: tabId,
    view,
    url,
    title: "New Tab",
    isActive: false,
    isPinned: false,
    isFavorite: false
  };
  tabs.set(tabId, tabData);
  const contentView = contentWindow.getContentView();
  try {
    if (contentView.children.includes(view)) {
      contentView.removeChildView(view);
    }
  } catch {
  }
  contentView.addChildView(view);
  dumpTree?.("after-add-tab-view");
  view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
  setupTabEvents(tabId, view);
  applyAppearance(view.webContents);
  void view.webContents.loadURL(url).catch((err) => {
    logger2.error("[ViewManager] Failed to load URL in tab", { tabId, url, error: err });
  });
  logger2.info("[ViewManager] Tab created (loading in background)", { tabId, url });
  return tabId;
}
function switchTab(args) {
  const { tabs, activeTabId, tabId, applyZoomToActive, layout, syncToRenderer, logger: logger2 } = args;
  const tabData = tabs.get(tabId);
  if (!tabData) {
    logger2.warn("[ViewManager] Tab not found", { tabId });
    return activeTabId;
  }
  if (activeTabId) {
    const prevTab = tabs.get(activeTabId);
    if (prevTab) {
      prevTab.isActive = false;
      prevTab.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    }
  }
  tabData.isActive = true;
  applyZoomToActive(tabData);
  layout();
  logger2.info("[ViewManager] Tab switched", { tabId });
  syncToRenderer();
  return tabId;
}
function closeTab(args) {
  const {
    tabs,
    activeTabId,
    contentWindow,
    tabId,
    recentlyClosed,
    maxRecentClosed,
    switchTab: switchTab2,
    setActiveTabId,
    syncToRenderer,
    logger: logger2
  } = args;
  const tabData = tabs.get(tabId);
  if (!tabData) {
    logger2.warn("[ViewManager] Tab not found", { tabId });
    return;
  }
  try {
    recentlyClosed.push({
      id: tabData.id,
      url: tabData.url,
      title: tabData.title,
      timestamp: Date.now(),
      isPinned: tabData.isPinned
    });
    if (recentlyClosed.length > maxRecentClosed) {
      recentlyClosed.shift();
    }
    if (contentWindow) {
      contentWindow.getContentView().removeChildView(tabData.view);
    }
    tabData.view.webContents.close();
    tabs.delete(tabId);
    if (activeTabId === tabId) {
      const remainingTabId = Array.from(tabs.keys())[0];
      if (remainingTabId) {
        switchTab2(remainingTabId);
      } else {
        setActiveTabId(null);
      }
    }
    logger2.info("[ViewManager] Tab closed", { tabId });
    syncToRenderer();
  } catch (error) {
    logger2.error("[ViewManager] Tab close failed:", error);
  }
}
async function duplicateTab(args) {
  const { tabs, tabId, createTab: createTab2, logger: logger2 } = args;
  const tab = tabs.get(tabId);
  if (!tab) {
    throw new Error("Tab not found");
  }
  const newTabId = await createTab2(tab.url);
  logger2.info("[ViewManager] Tab duplicated", { originalId: tabId, newId: newTabId });
  return newTabId;
}
function closeOtherTabs(args) {
  const { tabs, keepTabId, closeTab: closeTab2, logger: logger2 } = args;
  const tabsToClose = Array.from(tabs.keys()).filter((id) => id !== keepTabId);
  for (const tabId of tabsToClose) {
    closeTab2(tabId);
  }
  logger2.info("[ViewManager] Closed other tabs", { kept: keepTabId, closed: tabsToClose.length });
}
async function closeAllTabs(args) {
  const { tabs, closeTab: closeTab2, createTab: createTab2, homepage, logger: logger2 } = args;
  const allTabIds = Array.from(tabs.keys());
  for (const tabId of allTabIds) {
    closeTab2(tabId);
  }
  if (tabs.size === 0) {
    await createTab2(homepage);
  }
  logger2.info("[ViewManager] Closed all tabs");
}
async function restoreClosedTab(args) {
  const { recentlyClosed, createTab: createTab2, setPinned: setPinned2, logger: logger2 } = args;
  if (recentlyClosed.length === 0) {
    logger2.warn("[ViewManager] No recently closed tabs to restore");
    return null;
  }
  const closedTab = recentlyClosed.pop();
  if (!closedTab) return null;
  const newTabId = await createTab2(closedTab.url);
  if (closedTab.isPinned) {
    setPinned2(newTabId, true);
  }
  logger2.info("[ViewManager] Restored closed tab", { url: closedTab.url, newId: newTabId });
  return newTabId;
}
function disposeSettingsSubscriptions(unsubs) {
  for (const unsub of unsubs) {
    try {
      unsub();
    } catch {
    }
  }
}
function applyThemeToAllTabs(args) {
  const { tabs, applyAppearance } = args;
  for (const tab of tabs.values()) {
    applyAppearance(tab);
  }
}
function reloadAllNonAboutTabs(args) {
  const { tabs, logger: logger2 } = args;
  for (const tab of tabs.values()) {
    if (tab.url.startsWith("about:")) continue;
    try {
      tab.view.webContents.reload();
    } catch (error) {
      logger2.warn("[ViewManager] Failed to reload tab after language change", { error: String(error) });
    }
  }
}
function getZoomFactorFromSetting(value) {
  const percent = Number.parseInt(value, 10);
  if (Number.isNaN(percent)) return 1;
  const clamped = Math.min(500, Math.max(25, percent));
  return clamped / 100;
}
function applyPageZoomToWebContents(webContents2, zoomSetting, logger2) {
  try {
    const factor = getZoomFactorFromSetting(zoomSetting);
    webContents2.setZoomFactor(factor);
    logger2.debug("[ViewManager] Applied page zoom", { factor, zoomSetting });
  } catch (error) {
    logger2.warn("[ViewManager] Failed to apply page zoom", { error: String(error), zoomSetting });
  }
}
function applyPageZoomToAllTabs(tabs, zoomSetting, logger2) {
  for (const tab of tabs.values()) {
    applyPageZoomToWebContents(tab.view.webContents, zoomSetting, logger2);
  }
}
class ViewManager {
  static state = createInitialViewManagerState();
  static MAX_RECENT_CLOSED = DEFAULT_MAX_RECENT_CLOSED;
  static syncTimer = null;
  static SYNC_DEBOUNCE_MS = 16;
  static scheduleSyncToRenderer() {
    if (this.syncTimer) return;
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      this.syncToRenderer();
    }, this.SYNC_DEBOUNCE_MS);
  }
  static async initialize(contentWindow, uiWebContents) {
    if (this.state.contentWindow) {
      logger.warn("[ViewManager] Already initialized. Skipping.");
      return;
    }
    if (this.state.isInitializing) {
      throw new Error("[ViewManager] Initialization already in progress");
    }
    this.state.isInitializing = true;
    try {
      logger.info("[ViewManager] Initializing...");
      this.state.contentWindow = contentWindow;
      this.state.uiWebContents = uiWebContents;
      const settingsStore = SettingsStore.getInstance();
      const initialZoom = settingsStore.get("pageZoom");
      applyPageZoomToAllTabs(this.state.tabs, initialZoom, logger);
      this.state.settingsUnsubscribers.push(
        settingsStore.onChange("pageZoom", (newValue) => {
          const zoomSetting = typeof newValue === "string" ? newValue : settingsStore.get("pageZoom");
          applyPageZoomToAllTabs(this.state.tabs, zoomSetting, logger);
        })
      );
      this.state.settingsUnsubscribers.push(
        settingsStore.onChange("theme", () => {
          applyThemeToAllTabs({
            tabs: this.state.tabs,
            applyAppearance: (tab) => {
              void AppearanceService.applyToWebContents(tab.view.webContents);
            }
          });
        })
      );
      this.state.settingsUnsubscribers.push(
        settingsStore.onChange("language", () => {
          reloadAllNonAboutTabs({ tabs: this.state.tabs, logger });
        })
      );
      this.dumpContentViewTree("after-initialize");
      this.state.contentWindow.on("resize", () => {
        this.layout();
      });
      const homepage = settingsStore.get("homepage");
      const homeTabId = await this.createTab(homepage);
      logger.info("[ViewManager] Home tab created", { tabId: homeTabId });
      this.switchTab(homeTabId);
      this.layout();
      logger.info("[ViewManager] Layout applied");
      this.dumpContentViewTree("after-layout");
      logger.info("[ViewManager] Initialization completed");
    } catch (error) {
      logger.error("[ViewManager] Initialization failed:", error);
      throw error;
    } finally {
      this.state.isInitializing = false;
    }
  }
  static async createTab(url) {
    if (!this.state.contentWindow) {
      throw new Error("[ViewManager] Not initialized. Call initialize() first.");
    }
    try {
      const settingsStore = SettingsStore.getInstance();
      const zoomSetting = settingsStore.get("pageZoom");
      const tabId = await createTab({
        contentWindow: this.state.contentWindow,
        tabs: this.state.tabs,
        url,
        zoomSetting,
        applyZoom: (wc, setting) => applyPageZoomToWebContents(wc, setting, logger),
        setupTabEvents: (id, view) => this.setupTabEvents(id, view),
        applyAppearance: (wc) => {
          void AppearanceService.applyToWebContents(wc);
        },
        dumpTree: process.env.ASIDE_VIEW_TREE_DEBUG === "1" ? (reason) => this.dumpContentViewTree(reason) : void 0,
        logger
      });
      return tabId;
    } catch (error) {
      logger.error("[ViewManager] Tab creation failed:", error);
      throw error;
    }
  }
  static switchTab(tabId) {
    const settingsStore = SettingsStore.getInstance();
    const next = switchTab({
      tabs: this.state.tabs,
      activeTabId: this.state.activeTabId,
      tabId,
      applyZoomToActive: (tab) => applyPageZoomToWebContents(tab.view.webContents, settingsStore.get("pageZoom"), logger),
      layout: () => this.layout(),
      syncToRenderer: () => this.scheduleSyncToRenderer(),
      logger
    });
    this.state.activeTabId = next;
  }
  static setActiveViewBounds(safeArea) {
    if (!this.state.contentWindow) {
      logger.warn("[ViewManager] contentWindow not available; ignoring safe-area");
      return;
    }
    if (this.state.lastSafeArea && this.state.lastSafeArea.left === safeArea.left && this.state.lastSafeArea.top === safeArea.top) {
      return;
    }
    this.state.lastSafeArea = safeArea;
    const nextBounds = computeExternalActiveBounds({
      contentWindow: this.state.contentWindow,
      safeArea,
      logger
    });
    const prev = this.state.externalActiveBounds;
    if (prev && prev.x === nextBounds.x && prev.y === nextBounds.y && prev.width === nextBounds.width && prev.height === nextBounds.height) {
      return;
    }
    this.state.externalActiveBounds = nextBounds;
    this.layout();
  }
  static closeTab(tabId) {
    closeTab({
      tabs: this.state.tabs,
      activeTabId: this.state.activeTabId,
      contentWindow: this.state.contentWindow,
      tabId,
      recentlyClosed: this.state.recentlyClosed,
      maxRecentClosed: this.MAX_RECENT_CLOSED,
      switchTab: (nextTabId) => this.switchTab(nextTabId),
      setActiveTabId: (next) => {
        this.state.activeTabId = next;
      },
      syncToRenderer: () => this.scheduleSyncToRenderer(),
      logger
    });
  }
  static getTabs() {
    return getTabsSnapshot(this.state.tabs);
  }
  static getActiveTabId() {
    return this.state.activeTabId;
  }
  static setPinned(tabId, pinned) {
    setPinned({ tabs: this.state.tabs, tabId, pinned, logger });
    this.scheduleSyncToRenderer();
  }
  static reorderTab(tabId, targetId) {
    reorderTab({ tabs: this.state.tabs, tabId, targetId, logger });
    this.scheduleSyncToRenderer();
  }
  static reorderTabWithinSection(tabId, position) {
    reorderTabWithinSection({ tabs: this.state.tabs, tabId, position, logger });
    this.scheduleSyncToRenderer();
  }
  static reorderIcon(fromIndex, toIndex) {
    logger.info("[ViewManager] Icon reordered", { fromIndex, toIndex });
  }
  static moveTabToSection(tabId, targetType) {
    moveTabToSection({ tabs: this.state.tabs, tabId, targetType, logger });
    this.scheduleSyncToRenderer();
  }
  static async duplicateTab(tabId) {
    return duplicateTab({
      tabs: this.state.tabs,
      tabId,
      createTab: (url) => this.createTab(url),
      logger
    });
  }
  static closeOtherTabs(keepTabId) {
    closeOtherTabs({
      tabs: this.state.tabs,
      keepTabId,
      closeTab: (id) => this.closeTab(id),
      logger
    });
  }
  static closeAllTabs() {
    const homepage = SettingsStore.getInstance().get("homepage");
    void closeAllTabs({
      tabs: this.state.tabs,
      closeTab: (id) => this.closeTab(id),
      createTab: (url) => this.createTab(url),
      homepage,
      logger
    });
  }
  static async restoreClosedTab() {
    return restoreClosedTab({
      recentlyClosed: this.state.recentlyClosed,
      createTab: (url) => this.createTab(url),
      setPinned: (id, pinned) => this.setPinned(id, pinned),
      logger
    });
  }
  static getRecentlyClosed() {
    return [...this.state.recentlyClosed];
  }
  static async navigate(url) {
    await navigateActiveTab({
      tabs: this.state.tabs,
      activeTabId: this.state.activeTabId,
      url,
      applyAppearance: (tab) => {
        void AppearanceService.applyToWebContents(tab.view.webContents);
      },
      syncToRenderer: () => this.scheduleSyncToRenderer(),
      logger
    });
  }
  static goBack() {
    goBack({ tabs: this.state.tabs, activeTabId: this.state.activeTabId, logger });
  }
  static goForward() {
    goForward({ tabs: this.state.tabs, activeTabId: this.state.activeTabId, logger });
  }
  static reload() {
    reload({ tabs: this.state.tabs, activeTabId: this.state.activeTabId, logger });
  }
  static destroy() {
    logger.info("[ViewManager] Destroying all tabs...");
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    disposeSettingsSubscriptions(this.state.settingsUnsubscribers);
    this.state.settingsUnsubscribers = [];
    for (const [tabId] of this.state.tabs) {
      try {
        this.closeTab(tabId);
      } catch (error) {
        logger.error("[ViewManager] Error closing tab:", { tabId, error });
      }
    }
    this.state.tabs.clear();
    this.state.activeTabId = null;
    this.state.contentWindow = null;
    this.state.uiWebContents = null;
    logger.info("[ViewManager] All tabs destroyed");
  }
  static hideActiveView() {
    if (!this.state.activeTabId) return;
    const tabData = this.state.tabs.get(this.state.activeTabId);
    if (tabData && this.state.contentWindow) {
      tabData.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      logger.info("[ViewManager] Active view hidden", { tabId: this.state.activeTabId });
    }
  }
  static showActiveView() {
    if (!this.state.activeTabId) return;
    const tabData = this.state.tabs.get(this.state.activeTabId);
    if (tabData) {
      this.layout();
      logger.info("[ViewManager] Active view shown", { tabId: this.state.activeTabId });
    }
  }
  static layout() {
    if (!this.state.contentWindow) return;
    applyLayout({
      contentWindow: this.state.contentWindow,
      tabs: this.state.tabs,
      externalActiveBounds: this.state.externalActiveBounds,
      logger
    });
  }
  static syncToRenderer() {
    syncTabsToRenderer({
      uiWebContents: this.state.uiWebContents,
      tabs: this.state.tabs,
      activeTabId: this.state.activeTabId,
      logger
    });
  }
  static setupTabEvents(tabId, view) {
    attachTabEvents({
      tabId,
      view,
      getTabData: (id) => this.state.tabs.get(id),
      getUiWebContents: () => this.state.uiWebContents,
      syncToRenderer: () => this.scheduleSyncToRenderer(),
      createTab: (url) => this.createTab(url),
      logger
    });
  }
  static ensureUITopmost() {
    if (!this.state.contentWindow || !this.state.uiWebContents) return;
    ensureUITopmost({
      contentWindow: this.state.contentWindow,
      uiWebContents: this.state.uiWebContents,
      lastReorderTarget: this.state.lastReorderTarget,
      setLastReorderTarget: (next) => {
        this.state.lastReorderTarget = next;
      },
      logger
    });
  }
  static ensureContentTopmost() {
    if (!this.state.contentWindow || !this.state.activeTabId) return;
    ensureContentTopmost({
      contentWindow: this.state.contentWindow,
      activeTabId: this.state.activeTabId,
      tabs: this.state.tabs,
      lastReorderTarget: this.state.lastReorderTarget,
      setLastReorderTarget: (next) => {
        this.state.lastReorderTarget = next;
      },
      logger
    });
  }
  static dumpContentViewTree(reason) {
    if (!this.state.contentWindow) return;
    dumpContentViewTree({
      reason,
      contentWindow: this.state.contentWindow,
      uiWebContents: this.state.uiWebContents,
      logger
    });
  }
}
function mergeHoverMetrics(current, incoming) {
  if (!Number.isFinite(incoming.dpr) || incoming.dpr <= 0 || !Number.isFinite(incoming.timestamp)) {
    return { kind: "invalid" };
  }
  if (!current) {
    return {
      kind: "initial",
      next: { ...incoming, timestamp: incoming.timestamp || Date.now() }
    };
  }
  const next = { ...current };
  if (incoming.sidebarRightPx !== void 0 && Number.isFinite(incoming.sidebarRightPx)) {
    next.sidebarRightPx = Math.max(0, incoming.sidebarRightPx);
  }
  if (incoming.headerBottomPx !== void 0 && Number.isFinite(incoming.headerBottomPx)) {
    next.headerBottomPx = Math.max(0, incoming.headerBottomPx);
  }
  if (incoming.titlebarHeightPx !== void 0 && Number.isFinite(incoming.titlebarHeightPx)) {
    next.titlebarHeightPx = Math.max(0, incoming.titlebarHeightPx);
  }
  next.dpr = incoming.dpr;
  next.timestamp = incoming.timestamp || Date.now();
  return { kind: "update", next };
}
const DEFAULT_SIDEBAR_WIDTH = 288;
const DEFAULT_HEADER_HEIGHT = 56;
function computeEdgeOverlayState({
  relativeX,
  relativeY,
  currentState,
  headerLatched,
  sidebarLatched,
  metrics,
  edgeThreshold
}) {
  const sidebarWidth = metrics?.sidebarRightPx ?? DEFAULT_SIDEBAR_WIDTH;
  const headerHeight = metrics?.headerBottomPx ?? DEFAULT_HEADER_HEIGHT;
  let shouldOpenSidebar = false;
  let shouldCloseSidebar = false;
  if (!sidebarLatched) {
    if (relativeX <= edgeThreshold) {
      shouldOpenSidebar = true;
    }
    if (currentState.sidebarOpen && relativeX > sidebarWidth) {
      shouldCloseSidebar = true;
    }
  }
  let shouldOpenHeader = false;
  let shouldCloseHeader = false;
  if (!headerLatched) {
    if (relativeY <= edgeThreshold) {
      shouldOpenHeader = true;
    }
    if (currentState.headerOpen && relativeY > headerHeight) {
      shouldCloseHeader = true;
    }
  }
  if (shouldOpenSidebar && shouldOpenHeader) {
    shouldOpenSidebar = false;
  }
  const finalSidebarOpen = sidebarLatched || (shouldOpenSidebar || currentState.sidebarOpen && !shouldCloseSidebar);
  const finalHeaderOpen = headerLatched || (shouldOpenHeader || currentState.headerOpen && !shouldCloseHeader);
  const mouseInSidebar = finalSidebarOpen && relativeX <= sidebarWidth;
  const mouseInHeader = finalHeaderOpen && relativeY <= headerHeight;
  return {
    nextState: { headerOpen: finalHeaderOpen, sidebarOpen: finalSidebarOpen },
    mouseInSidebar,
    mouseInHeader,
    dimensions: { sidebarWidth, headerHeight, edgeThreshold },
    triggers: {
      shouldOpenSidebar,
      shouldCloseSidebar,
      shouldOpenHeader,
      shouldCloseHeader
    }
  };
}
const TRACKING_INTERVAL_MS = 16;
const MAX_METRICS_AGE_MS = 3e4;
const STATE_UPDATE_THROTTLE_MS = 16;
const WINDOW_ADJUST_THROTTLE_MS = 32;
const WINDOW_ADJUST_DEBOUNCE_MS = 100;
class OverlayController {
  // ===== Window References =====
  static uiWindow = null;
  static contentWindow = null;
  static uiWebContents = null;
  static cleanupFns = [];
  // ===== State =====
  static currentState = { headerOpen: false, sidebarOpen: false };
  static hoverMetrics = null;
  static cachedWindowBounds = null;
  // ===== Flags =====
  static isWindowMoving = false;
  static isWindowResizing = false;
  // ===== Timers & Tracking =====
  static hoverTrackingTimer = null;
  static lastStateUpdateTime = 0;
  static focusDebounceTimer = null;
  static FOCUS_DEBOUNCE_MS = 75;
  // Debounce blur events during view reordering
  // (Removed: no longer using hysteresis timestamps)
  /**
   * ⭐ Zen 방식: Window가 이동할 때 호출 (moved 이벤트)
   * Main Process가 window 위치를 즉시 업데이트하여 좌표계 불일치 해결
   */
  static onWindowMoved(bounds) {
    this.cachedWindowBounds = bounds;
    this.isWindowMoving = true;
    setTimeout(() => {
      this.isWindowMoving = false;
      this.lastStateUpdateTime = 0;
    }, WINDOW_ADJUST_DEBOUNCE_MS);
  }
  static onWindowResized(bounds) {
    this.cachedWindowBounds = bounds;
    this.isWindowResizing = true;
    setTimeout(() => {
      this.isWindowResizing = false;
      this.lastStateUpdateTime = 0;
    }, WINDOW_ADJUST_DEBOUNCE_MS);
    try {
      ;
      (this.uiWebContents ?? this.uiWindow?.webContents)?.send("window:resized", { timestamp: Date.now() });
    } catch {
    }
  }
  static updateHoverMetrics(metrics) {
    const result = mergeHoverMetrics(this.hoverMetrics, metrics);
    if (result.kind === "invalid") {
      logger.warn("[OverlayController] Invalid dpr or timestamp, skipping");
      return;
    }
    this.hoverMetrics = result.next;
    if (result.kind === "initial") {
      logger.info("[OverlayController] Initial metrics received");
    }
  }
  // Latch state (pinned)
  static getHeaderLatched() {
    return overlayStore.getState().headerLatched;
  }
  static getSidebarLatched() {
    return overlayStore.getState().sidebarLatched;
  }
  static toggleHeaderLatched() {
    const latched = overlayStore.getState().toggleHeaderLatched();
    this.broadcastLatch("header:latch-changed", latched);
    return latched;
  }
  static toggleSidebarLatched() {
    const latched = overlayStore.getState().toggleSidebarLatched();
    this.broadcastLatch("sidebar:latch-changed", latched);
    return latched;
  }
  static broadcastLatch(channel, latched) {
    try {
      const payload = OverlayLatchChangedEventSchema.parse({ latched, timestamp: Date.now() });
      (this.uiWebContents ?? this.uiWindow?.webContents)?.send(channel, payload);
    } catch {
    }
  }
  /**
   * Attach controller to windows
   */
  static attach({ uiWindow, contentWindow, uiWebContents }) {
    if (this.uiWindow === uiWindow && this.contentWindow === contentWindow && this.uiWebContents === (uiWebContents ?? null)) return;
    this.dispose();
    this.uiWindow = uiWindow;
    this.contentWindow = contentWindow;
    this.uiWebContents = uiWebContents ?? null;
    this.setupFocusTracking();
    this.setupKeyboardShortcuts();
    logger.info("[OverlayController] Attached (Arc/Zen style)");
  }
  static dispose() {
    this.stopGlobalMouseTracking();
    if (this.focusDebounceTimer) {
      clearTimeout(this.focusDebounceTimer);
      this.focusDebounceTimer = null;
    }
    for (const fn of this.cleanupFns.splice(0)) {
      try {
        fn();
      } catch {
      }
    }
    this.uiWindow = null;
    this.contentWindow = null;
    this.uiWebContents = null;
  }
  /**
   * Arc 스타일 Step 1: Window Focus Tracking
   * - blur되면 즉시 닫힘 (최우선 조건)
   */
  static setupFocusTracking() {
    if (!this.uiWindow || !this.contentWindow) return;
    const uiWindow = this.uiWindow;
    const contentWindow = this.contentWindow;
    const computeFocused = () => {
      try {
        return Boolean(uiWindow.isFocused() || contentWindow.isFocused());
      } catch {
        return false;
      }
    };
    const broadcastFocus = (focused) => {
      if (this.focusDebounceTimer) {
        clearTimeout(this.focusDebounceTimer);
        this.focusDebounceTimer = null;
      }
      if (!focused) {
        this.focusDebounceTimer = setTimeout(() => {
          const actuallyFocused = computeFocused();
          if (!actuallyFocused) {
            overlayStore.getState().setFocused(false);
            this.stopGlobalMouseTracking();
            try {
              const target = this.uiWebContents ?? uiWindow.webContents;
              target.send("window:focus-changed", false);
            } catch {
            }
            this.closeNonLatchedOverlays();
          } else {
            overlayStore.getState().setFocused(true);
            this.startGlobalMouseTracking();
            try {
              const target = this.uiWebContents ?? uiWindow.webContents;
              target.send("window:focus-changed", true);
            } catch {
            }
          }
          this.focusDebounceTimer = null;
        }, this.FOCUS_DEBOUNCE_MS);
      } else {
        overlayStore.getState().setFocused(true);
        this.startGlobalMouseTracking();
        try {
          const target = this.uiWebContents ?? uiWindow.webContents;
          target.send("window:focus-changed", true);
        } catch {
        }
      }
    };
    const onAnyFocusBlur = () => {
      broadcastFocus(computeFocused());
    };
    uiWindow.on("focus", onAnyFocusBlur);
    uiWindow.on("blur", onAnyFocusBlur);
    contentWindow.on("focus", onAnyFocusBlur);
    contentWindow.on("blur", onAnyFocusBlur);
    this.cleanupFns.push(() => {
      uiWindow.removeListener("focus", onAnyFocusBlur);
      uiWindow.removeListener("blur", onAnyFocusBlur);
      contentWindow.removeListener("focus", onAnyFocusBlur);
      contentWindow.removeListener("blur", onAnyFocusBlur);
    });
    broadcastFocus(computeFocused());
  }
  /**
   * Arc 스타일 Step 2+3: Global Mouse Tracking
   * - 마우스가 window bounds 밖이면 즉시 닫힘
   * - hover zone 판정 (edge hotzone)
   */
  static startGlobalMouseTracking() {
    if (!this.uiWindow || !this.contentWindow) return;
    if (this.hoverTrackingTimer) return;
    this.hoverTrackingTimer = setInterval(() => this.trackMouseAndUpdateState(), TRACKING_INTERVAL_MS);
  }
  static stopGlobalMouseTracking() {
    if (this.hoverTrackingTimer) {
      clearInterval(this.hoverTrackingTimer);
      this.hoverTrackingTimer = null;
    }
  }
  static trackMouseAndUpdateState() {
    if (!this.uiWindow || !this.contentWindow) return;
    const windowFocused = overlayStore.getState().focused;
    if (!windowFocused) {
      this.closeNonLatchedOverlays();
      return;
    }
    const { x: mouseX, y: mouseY } = screen.getCursorScreenPoint();
    const bounds = this.cachedWindowBounds || this.uiWindow.getBounds();
    const isAdjusting = this.isWindowMoving || this.isWindowResizing;
    const insideWindow = mouseX >= bounds.x && mouseX < bounds.x + bounds.width && mouseY >= bounds.y && mouseY < bounds.y + bounds.height;
    if (!insideWindow) {
      this.closeNonLatchedOverlays();
      return;
    }
    const metricsAgeMs = this.hoverMetrics ? Date.now() - this.hoverMetrics.timestamp : Number.POSITIVE_INFINITY;
    if (!Number.isFinite(metricsAgeMs) || metricsAgeMs > MAX_METRICS_AGE_MS) {
      this.hoverMetrics = null;
    }
    const relativeX = Math.max(0, Math.floor(mouseX - bounds.x));
    const relativeY = Math.max(0, Math.floor(mouseY - bounds.y));
    const { headerLatched, sidebarLatched } = overlayStore.getState();
    const metrics = this.hoverMetrics;
    const EDGE_THRESHOLD = 10;
    if (!headerLatched && !sidebarLatched && !this.currentState.headerOpen && !this.currentState.sidebarOpen && relativeX > EDGE_THRESHOLD && relativeY > EDGE_THRESHOLD) {
      ViewManager.ensureContentTopmost();
      return;
    }
    const calc = computeEdgeOverlayState({
      relativeX,
      relativeY,
      currentState: this.currentState,
      headerLatched,
      sidebarLatched,
      metrics,
      edgeThreshold: EDGE_THRESHOLD
    });
    const finalHeaderOpen = calc.nextState.headerOpen;
    const finalSidebarOpen = calc.nextState.sidebarOpen;
    const mouseInSidebar = calc.mouseInSidebar;
    const mouseInHeader = calc.mouseInHeader;
    if (finalHeaderOpen || finalSidebarOpen || headerLatched || sidebarLatched || mouseInSidebar || mouseInHeader) {
      ViewManager.ensureUITopmost();
    } else {
      ViewManager.ensureContentTopmost();
    }
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastStateUpdateTime;
    const throttleMs = isAdjusting ? WINDOW_ADJUST_THROTTLE_MS : STATE_UPDATE_THROTTLE_MS;
    const shouldUpdate = this.currentState.headerOpen !== finalHeaderOpen || this.currentState.sidebarOpen !== finalSidebarOpen;
    if (shouldUpdate && (timeSinceLastUpdate >= throttleMs || this.lastStateUpdateTime === 0)) {
      this.lastStateUpdateTime = now;
      this.currentState = { headerOpen: finalHeaderOpen, sidebarOpen: finalSidebarOpen };
      this.broadcastOverlayState(this.currentState);
    }
  }
  /**
   * Arc 핵심: focus=false OR insideWindow=false일 때 호출
   * latch되지 않은 overlay는 즉시 닫음
   */
  static closeNonLatchedOverlays() {
    const { headerLatched, sidebarLatched } = overlayStore.getState();
    const newState = {
      headerOpen: headerLatched,
      sidebarOpen: sidebarLatched
    };
    if (this.currentState.headerOpen !== newState.headerOpen || this.currentState.sidebarOpen !== newState.sidebarOpen) {
      this.currentState = newState;
      this.broadcastOverlayState(newState);
    }
    if (!newState.headerOpen && !newState.sidebarOpen) {
      ViewManager.ensureContentTopmost();
    }
  }
  static broadcastOverlayState(state) {
    if (!this.uiWindow) return;
    const timestamp = Date.now();
    try {
      const target = this.uiWebContents ?? this.uiWindow.webContents;
      target.send(state.headerOpen ? "header:open" : "header:close", { timestamp });
      target.send(state.sidebarOpen ? "sidebar:open" : "sidebar:close", { timestamp });
    } catch {
    }
  }
  /**
   * Keyboard shortcuts - contentWindow에서 처리
   */
  static setupKeyboardShortcuts() {
    if (!this.contentWindow) return;
    const contentWindow = this.contentWindow;
    const onBeforeInput = (event, input) => {
      if (input.type !== "keyDown") return;
      const key = (input.key || "").toLowerCase();
      const mod = Boolean(
        input.control || input.meta
      );
      if (mod && key === "l") {
        event.preventDefault();
        this.toggleHeaderLatched();
      }
      if (mod && key === "b") {
        event.preventDefault();
        this.toggleSidebarLatched();
      }
      if (key === "escape") {
        const { headerLatched, sidebarLatched } = overlayStore.getState();
        if (headerLatched || sidebarLatched) {
          event.preventDefault();
          overlayStore.getState().setHeaderLatched(false);
          overlayStore.getState().setSidebarLatched(false);
          this.broadcastLatch("header:latch-changed", false);
          this.broadcastLatch("sidebar:latch-changed", false);
        }
      }
    };
    contentWindow.webContents.on("before-input-event", onBeforeInput);
    this.cleanupFns.push(() => {
      try {
        contentWindow.webContents.removeListener("before-input-event", onBeforeInput);
      } catch {
      }
    });
  }
}
class MainWindow {
  // NOTE: Zen/Arc 스타일 오버레이를 위해 2-윈도우 구조를 사용
  // - contentWindow: WebContentsView(웹페이지) 전용
  // - uiWindow: React UI(투명 오버레이) 전용
  // NOTE(2026-01): 2-윈도우는 macOS에서 드래그 중 미세 지연/드리프트가 발생해
  // UI(header)와 WebContentsView가 “따로 노는” 느낌이 생긴다.
  // 따라서 단일 BrowserWindow를 생성하고, ViewManager/OverlayController API 호환을 위해
  // uiWindow/contentWindow가 동일 인스턴스를 참조하도록 한다.
  static uiWindow = null;
  static contentWindow = null;
  static isCreating = false;
  /**
   * MainWindow 생성
   *
   * 프로세스:
   * 1. 창 인스턴스 생성 (크기, 위치, preload 스크립트)
   * 2. URL 로드 (개발: localhost:5173, 배포: file://)
   * 3. DevTools 자동 열기 (개발 모드)
   * 4. 창 닫기 → 앱 종료 연결
   *
   * @returns 생성된 BrowserWindow 인스턴스
   * @throws 이미 생성 중이면 예외
   */
  static async create() {
    if (this.uiWindow && this.contentWindow) {
      logger.warn("[MainWindow] Windows already exist. Returning existing instance.");
      return this.uiWindow;
    }
    if (this.isCreating) {
      throw new Error("[MainWindow] Window creation already in progress");
    }
    this.isCreating = true;
    try {
      logger.info("[MainWindow] Creating main window...");
      const { x, y, width, height } = screen.getPrimaryDisplay().bounds;
      const isMacOS = process.platform === "darwin";
      const macTrafficLights = { x: 12, y: 11 };
      const uiWindowOptions = {
        x,
        y,
        width,
        height,
        minWidth: 800,
        minHeight: 600,
        frame: false,
        // macOS: customButtonsOnHover (Arc/Zen 스타일)
        // - Native traffic lights가 hover 시에만 자동으로 나타남
        // - 커스텀 버튼 대신 진짜 macOS 신호등 사용
        ...isMacOS ? {
          titleBarStyle: "customButtonsOnHover",
          trafficLightPosition: macTrafficLights
        } : {},
        // 단일 윈도우 모드에서는 투명 윈도우가 “아무것도 안 보이는” 상태를 만들기 쉽다.
        // (overlay-mode CSS가 background를 transparent로 만들 수 있음)
        // 따라서 macOS에서도 기본은 불투명으로 유지한다.
        transparent: false,
        hasShadow: false,
        // theme.css --color-bg-primary: rgb(3, 7, 18)
        // Native view resize 지연으로 생기는 빈 영역(white flash)을 테마 배경색으로 숨긴다.
        backgroundColor: "#030712",
        // 바닥창 위에 붙어서 같이 움직이도록
        webPreferences: {
          preload: join(__dirname, "../preload/index.cjs"),
          contextIsolation: true,
          sandbox: Env.isDev ? false : true,
          nodeIntegration: false,
          webSecurity: true
        },
        show: false
      };
      this.uiWindow = new BrowserWindow(uiWindowOptions);
      this.contentWindow = this.uiWindow;
      logger.info("[MainWindow] Windows created", {
        width,
        height,
        platform: process.platform
      });
      this.setupWindowEvents();
      let didShow = false;
      const showMain = () => {
        try {
          if (didShow) return;
          if (!this.uiWindow) return;
          this.uiWindow.show();
          this.uiWindow.focus();
          OverlayController.attach({
            uiWindow: this.uiWindow,
            contentWindow: this.uiWindow,
            uiWebContents: this.uiWindow.webContents
          });
          didShow = true;
          logger.info("[MainWindow] Main window shown (single-window)");
        } catch (error) {
          logger.error("[MainWindow] Failed to show windows:", error);
        }
      };
      this.uiWindow.once("ready-to-show", showMain);
      const startUrl = this.getStartUrl();
      await this.uiWindow.loadURL(startUrl);
      logger.info("[MainWindow] UI URL loaded (base webContents)", { url: startUrl });
      setTimeout(() => {
        try {
          if (!this.uiWindow) return;
          if (didShow) return;
          if (!this.uiWindow.isVisible()) {
            logger.warn("[MainWindow] ready-to-show fallback triggered; forcing show");
            showMain();
          }
        } catch (error) {
          logger.error("[MainWindow] Fallback show failed:", error);
        }
      }, 1200);
      if (Env.isDev) {
        this.uiWindow.webContents.openDevTools({ mode: "detach" });
        logger.info("[MainWindow] DevTools opened (dev mode, detached)");
      }
      return this.uiWindow;
    } catch (error) {
      logger.error("[MainWindow] Creation failed:", error);
      this.uiWindow = null;
      this.contentWindow = null;
      throw error;
    } finally {
      this.isCreating = false;
    }
  }
  /**
   * MainWindow 인스턴스 반환
   *
   * @returns BrowserWindow 또는 null
   */
  static getWindow() {
    return this.uiWindow;
  }
  static getWebContents() {
    return this.uiWindow?.webContents ?? null;
  }
  static getUiOverlayWebContents() {
    return this.getWebContents();
  }
  /** 바닥(Content) 윈도우 반환 (WebContentsView 호스팅) */
  static getContentWindow() {
    return this.contentWindow;
  }
  /**
   * MainWindow 파괴
   *
   * 명시적으로 호출하지 말 것 (창 닫기 → 자동 정리)
   * - 이벤트 리스너 정리
   * - 메모리 해제
   */
  static destroy() {
    OverlayController.dispose();
    const win = this.uiWindow;
    if (win) {
      win.removeAllListeners();
      win.webContents?.removeAllListeners();
      win.destroy();
    }
    this.uiWindow = null;
    this.contentWindow = null;
    logger.info("[MainWindow] Windows destroyed and cleaned up");
  }
  /**
   * React 앱 URL 결정
   *
   * 개발: http://localhost:5173 (Vite dev server)
   * 배포: file:///path/to/dist/index.html
   *
   * @returns 로드할 URL
   */
  static getStartUrl() {
    if (Env.isDev) {
      return "http://localhost:5173/";
    }
    const rendererDist = join(__dirname, "../../renderer/index.html");
    return `file://${rendererDist}`;
  }
  /**
   * 창 이벤트 설정
   *
   * 핵심: CSS의 -webkit-app-region: drag가 OS 수준에서 창 이동 처리
   * - moved: 드래그 완료 후 (OverlayController 호버 판정 업데이트)
   * - resized: 창 크기 변경 시 [브라우저 View만 크기 맞춤]
   */
  static setupWindowEvents() {
    if (!this.uiWindow || !this.contentWindow) return;
    const syncBoundsAfterMove = () => {
      if (!this.uiWindow) return;
      const bounds = this.uiWindow.getBounds();
      OverlayController.onWindowMoved(bounds);
    };
    const syncResize = () => {
      if (!this.uiWindow || !this.contentWindow) return;
      const bounds = this.uiWindow.getBounds();
      OverlayController.onWindowResized(bounds);
    };
    this.uiWindow.on("moved", syncBoundsAfterMove);
    this.uiWindow.on("resized", syncResize);
    this.uiWindow.on("closed", () => {
      logger.info("[MainWindow] UI window closed");
      try {
        OverlayController.dispose();
        this.uiWindow = null;
        this.contentWindow = null;
      } finally {
        if (process.platform !== "darwin") {
          app.quit();
        }
      }
    });
    logger.info("[MainWindow] Event listeners attached (single-window)");
  }
}
class UpdateService {
  static isCheckingUpdate = false;
  static updateCheckInterval = null;
  // ✅ ID 저장
  /**
   * Update Service 초기화
   *
   * 프로세스:
   * 1. 초기 업데이트 확인
   * 2. 주기적 확인 스케줄 설정 (24시간마다)
   */
  static initialize() {
    logger.info("[UpdateService] Initializing...");
    try {
      void this.checkForUpdates();
      this.updateCheckInterval = setInterval(() => {
        void this.checkForUpdates();
      }, 24 * 60 * 60 * 1e3);
      logger.info("[UpdateService] Initialization completed");
    } catch (error) {
      logger.error("[UpdateService] Initialization failed:", error);
    }
  }
  /**
   * Update Service 정리 (종료 시 호출)
   *
   * - 주기 타이머 해제
   * - 리소스 정리
   */
  static cleanup() {
    logger.info("[UpdateService] Cleaning up...");
    try {
      if (this.updateCheckInterval) {
        clearInterval(this.updateCheckInterval);
        this.updateCheckInterval = null;
        logger.info("[UpdateService] Update check interval cleared");
      }
    } catch (error) {
      logger.error("[UpdateService] Cleanup failed:", error);
    }
  }
  /**
   * 업데이트 확인
   */
  static async checkForUpdates() {
    if (this.isCheckingUpdate) {
      logger.warn("[UpdateService] Update check already in progress");
      return;
    }
    this.isCheckingUpdate = true;
    try {
      logger.info("[UpdateService] Checking for updates...");
      logger.info("[UpdateService] Update check completed");
    } catch (error) {
      logger.error("[UpdateService] Update check failed:", error);
    } finally {
      this.isCheckingUpdate = false;
    }
  }
  /**
   * 즉시 업데이트 확인
   */
  static async checkNow() {
    logger.info("[UpdateService] Immediate update check requested");
    await this.checkForUpdates();
  }
  /**
   * 업데이트 정지
   */
  static stop() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
    logger.info("[UpdateService] Update service stopped");
  }
}
class FsHelper {
  /**
   * 디렉토리 생성 (없으면 생성, 있으면 무시)
   *
   * @param dirPath - 생성할 디렉토리 경로
   */
  static async ensureDir(dirPath) {
    try {
      await promises.mkdir(dirPath, { recursive: true });
      logger.debug("[FsHelper] Directory ensured", { path: dirPath });
    } catch (error) {
      logger.error("[FsHelper] ensureDir failed:", error);
      throw error;
    }
  }
  /**
   * 파일 읽기
   *
   * @param filePath - 읽을 파일 경로
   * @returns 파일 내용
   */
  static async readFile(filePath) {
    try {
      const content = await promises.readFile(filePath, "utf-8");
      logger.debug("[FsHelper] File read", { path: filePath });
      return content;
    } catch (error) {
      logger.error("[FsHelper] readFile failed:", error);
      throw error;
    }
  }
  /**
   * 파일 쓰기
   *
   * @param filePath - 쓸 파일 경로
   * @param content - 파일 내용
   */
  static async writeFile(filePath, content) {
    try {
      await this.ensureDir(dirname(filePath));
      await promises.writeFile(filePath, content, "utf-8");
      logger.debug("[FsHelper] File written", { path: filePath });
    } catch (error) {
      logger.error("[FsHelper] writeFile failed:", error);
      throw error;
    }
  }
  /**
   * 파일 삭제
   *
   * @param filePath - 삭제할 파일 경로
   */
  static async deleteFile(filePath) {
    try {
      await promises.unlink(filePath);
      logger.debug("[FsHelper] File deleted", { path: filePath });
    } catch (error) {
      logger.error("[FsHelper] deleteFile failed:", error);
      throw error;
    }
  }
  /**
   * 경로 존재 여부 확인
   *
   * @param path - 확인할 경로
   * @returns 존재하면 true
   */
  static async pathExists(path2) {
    try {
      await promises.access(path2);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * 디렉토리 내용 읽기
   *
   * @param dirPath - 읽을 디렉토리 경로
   * @returns 파일/폴더 이름 배열
   */
  static async readDir(dirPath) {
    try {
      const entries = await promises.readdir(dirPath);
      logger.debug("[FsHelper] Directory read", { path: dirPath, count: entries.length });
      return entries;
    } catch (error) {
      logger.error("[FsHelper] readDir failed:", error);
      throw error;
    }
  }
}
const RETRY_CONFIG = {
  maxAttempts: 5,
  initialDelayMs: 1e3,
  maxDelayMs: 8e3,
  backoffMultiplier: 2
};
let prismaInstance = null;
let isConnecting = false;
let connectionAttempt = 0;
function calculateBackoffDelay(attempt) {
  const delay2 = RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
  return Math.min(delay2, RETRY_CONFIG.maxDelayMs);
}
function delay(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
async function connectWithRetry(dbPath) {
  if (prismaInstance) {
    logger.info("[Database] Using existing connection");
    return prismaInstance;
  }
  if (isConnecting) {
    logger.warn("[Database] Connection in progress, waiting...");
    let attempts = 0;
    while (isConnecting && attempts < 30) {
      await delay(100);
      attempts++;
    }
    if (prismaInstance) return prismaInstance;
  }
  isConnecting = true;
  connectionAttempt = 0;
  if (dbPath) {
    try {
      await FsHelper.ensureDir(dirname(dbPath));
    } catch (error) {
      logger.error("[Database] Failed to prepare database path", error, { dbPath });
      throw error;
    }
  }
  const dbFilePath = dbPath || process.env.DATABASE_URL?.replace("file:", "");
  if (!dbFilePath) {
    isConnecting = false;
    throw new Error("[Database] Database path is not set");
  }
  try {
    while (connectionAttempt < RETRY_CONFIG.maxAttempts) {
      connectionAttempt++;
      try {
        logger.info("[Database] Connection attempt", {
          attempt: connectionAttempt,
          maxAttempts: RETRY_CONFIG.maxAttempts
        });
        const adapter = new PrismaBetterSqlite3({ url: dbFilePath });
        prismaInstance = new PrismaClient({
          adapter,
          log: ["warn", "error"]
        });
        await prismaInstance.$queryRaw`SELECT 1`;
        logger.info("[Database] Connection successful");
        return prismaInstance;
      } catch (error) {
        logger.error("[Database] Connection failed", error);
        if (prismaInstance) {
          await prismaInstance.$disconnect().catch(() => {
          });
          prismaInstance = null;
        }
        if (connectionAttempt >= RETRY_CONFIG.maxAttempts) {
          throw new Error(
            `[Database] Failed to connect after ${connectionAttempt} attempts`
          );
        }
        const backoffDelay = calculateBackoffDelay(connectionAttempt);
        logger.info("[Database] Retrying", {
          attempt: connectionAttempt,
          delayMs: backoffDelay
        });
        await delay(backoffDelay);
      }
    }
    throw new Error("[Database] Connection exhausted all retries");
  } finally {
    isConnecting = false;
  }
}
async function disconnectWithCleanup() {
  try {
    if (prismaInstance) {
      logger.info("[Database] Disconnecting...");
      await prismaInstance.$disconnect();
      prismaInstance = null;
      connectionAttempt = 0;
      logger.info("[Database] Disconnected");
    }
  } catch (error) {
    logger.error("[Database] Disconnect failed:", error);
    prismaInstance = null;
  }
}
class AppLifecycle {
  static state = "idle";
  /**
   * 현재 생명주기 상태 반환
   */
  static getState() {
    return this.state;
  }
  /**
   * 앱 부팅 단계 (app.on('ready'))
   *
   * 순서:
   * 1. 환경 검증 (Env 초기화 확인)
   * 2. 경로 설정 검증
   * 3. Logger 초기화 (파일 출력)
   * 4. Database 초기화 (Prisma 연결)
   * 5. Managers 초기화 (ViewManager, AppState 등)
   * 6. Services 초기화 (필요한 비즈니스 로직)
   * 7. IPC Handlers 등록
   * 8. Main Window 생성 및 표시
   * 9. Ready 상태로 전환
   */
  static async bootstrap() {
    if (this.state !== "idle") {
      throw new Error(
        `[AppLifecycle] Cannot bootstrap from state: ${this.state}. Expected: idle`
      );
    }
    this.state = "bootstrapping";
    logger.info("Bootstrap started");
    try {
      logger.info("Step 1/8: Validating environment");
      validateEnv();
      logger.info("Step 2/8: Verifying paths");
      Paths.printAll();
      logger.info("Step 3/8: Logger ready");
      logger.info("Step 4/8: Connecting to database...");
      await connectWithRetry(Paths.database());
      logger.info("Step 4/8: Database connected");
      AppearanceService.initialize();
      logger.info("Step 5/8: Initializing ViewManager");
      const mainWindow = await MainWindow.create();
      const uiWebContents = MainWindow.getUiOverlayWebContents();
      if (!uiWebContents) {
        throw new Error("[AppLifecycle] UI webContents not available");
      }
      await ViewManager.initialize(mainWindow, uiWebContents);
      logger.info("Step 5/8: ViewManager initialized");
      logger.info("Step 6/8: Services initialized");
      logger.info("Step 7/8: IPC handlers registered");
      logger.info("Step 8/8: Main window already created");
      this.state = "ready";
      logger.info("Bootstrap completed. App is ready");
    } catch (error) {
      this.state = "idle";
      logger.error("Bootstrap failed", error);
      throw error;
    }
  }
  /**
   * 앱 종료 단계 (app.on('will-quit'))
   *
   * 순서:
   * 1. Managers 정리 (ViewManager destroy, 메모리 해제)
   * 2. Services 정리 (타이머 등록 해제)
   * 3. Database 연결 종료
   * 4. Logger 종료 (파일 버퍼 플러시)
   * 5. 상태 전환
   */
  static async shutdown() {
    if (this.state !== "ready") {
      logger.warn(`[AppLifecycle] Shutdown called from state: ${this.state}. Continuing anyway.`);
    }
    this.state = "shutting-down";
    logger.info("[AppLifecycle] Shutdown started...");
    try {
      logger.info("[AppLifecycle] Step 1/4: ViewManager destroyed");
      logger.info("[AppLifecycle] Step 1/4: Destroying ViewManager");
      UpdateService.cleanup();
      AppearanceService.dispose();
      logger.info("[AppLifecycle] Step 2/4: Services cleaned up");
      await disconnectWithCleanup();
      logger.info("[AppLifecycle] Step 3/4: Database disconnected");
      logger.info("[AppLifecycle] Step 4/4: Logger flushed");
      this.state = "shutdown";
      logger.info("[AppLifecycle] Shutdown completed. Clean exit.");
    } catch (error) {
      logger.error("[AppLifecycle] Shutdown error:", error);
      throw error;
    }
  }
  /**
   * 싱글톤 검증 (인스턴스화 방지)
   */
  constructor() {
    throw new Error("AppLifecycle is a singleton. Do not instantiate.");
  }
}
class AdBlockService {
  static adPatterns = [
    // 공통 광고 네트워크
    /ad[svertizing]*\.google\./i,
    /ads\.g\.doubleclick\.net/i,
    /googlesyndication\.com/i,
    /adclick\./i,
    /ads\.facebook\.com/i,
    /ads\.linkedin\.com/i,
    /ads\.twitter\.com/i,
    /bat\.bing\.com/i,
    /pagead\d+\.googlesyndication\.com/i,
    /analytics\.google\.com/i
  ];
  /**
   * AdBlock Service 초기화
   */
  static initialize() {
    logger.info("[AdBlockService] Initializing with", {
      patterns: this.adPatterns.length
    });
  }
  /**
   * URL이 광고인지 확인
   *
   * @param url - 확인할 URL
   * @returns 광고이면 true
   */
  static isAdURL(url) {
    try {
      return this.adPatterns.some((pattern) => pattern.test(url));
    } catch (error) {
      logger.error("[AdBlockService] URL check failed:", error);
      return false;
    }
  }
  /**
   * 패턴 추가
   */
  static addPattern(pattern) {
    this.adPatterns.push(pattern);
    logger.info("[AdBlockService] Pattern added", { pattern: pattern.source });
  }
  /**
   * 패턴 초기화
   */
  static resetPatterns() {
    this.adPatterns = [];
    this.initialize();
    logger.info("[AdBlockService] Patterns reset");
  }
}
const CHROME_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
class SessionManager {
  /**
   * Session 초기 설정
   */
  static setup() {
    logger.info("[SessionManager] Setting up session...");
    try {
      const defaultSession = session.defaultSession;
      if (!defaultSession) {
        throw new Error("[SessionManager] Default session not available");
      }
      defaultSession.setUserAgent(CHROME_USER_AGENT);
      logger.info("[SessionManager] User-Agent set to Chrome");
      const settingsStore = SettingsStore.getInstance();
      AdBlockService.initialize();
      let doNotTrack = settingsStore.get("doNotTrack");
      let blockAds = settingsStore.get("blockAds");
      let blockThirdPartyCookies = settingsStore.get("blockThirdPartyCookies");
      let language = settingsStore.get("language");
      const languageHeader = () => {
        switch (language) {
          case "ko":
            return "ko-KR,ko;q=0.9,en;q=0.8";
          case "ja":
            return "ja-JP,ja;q=0.9,en;q=0.8";
          case "en":
          default:
            return "en-US,en;q=0.9";
        }
      };
      const spellCheckerLanguages = () => {
        switch (language) {
          case "ko":
            return ["ko-KR", "en-US"];
          case "ja":
            return ["ja-JP", "en-US"];
          case "en":
          default:
            return ["en-US"];
        }
      };
      const getTopLevelHost = (webContentsId) => {
        if (typeof webContentsId !== "number") return null;
        try {
          const wc = webContents.fromId(webContentsId);
          if (!wc) return null;
          const url = wc.getURL();
          if (!url) return null;
          return new URL(url).hostname;
        } catch {
          return null;
        }
      };
      const isThirdParty = (requestUrl, topLevelHost) => {
        if (!topLevelHost) return false;
        try {
          const host = new URL(requestUrl).hostname;
          return host !== topLevelHost;
        } catch {
          return false;
        }
      };
      defaultSession.webRequest.onBeforeRequest((details, callback) => {
        if (blockAds && AdBlockService.isAdURL(details.url)) {
          callback({ cancel: true });
          return;
        }
        callback({});
      });
      defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        const requestHeaders = { ...details.requestHeaders ?? {} };
        if (doNotTrack) {
          requestHeaders["DNT"] = "1";
        } else {
          delete requestHeaders["DNT"];
        }
        requestHeaders["Accept-Language"] = languageHeader();
        if (blockThirdPartyCookies) {
          const topHost = getTopLevelHost(details.webContentsId);
          if (isThirdParty(details.url, topHost)) {
            delete requestHeaders["Cookie"];
            delete requestHeaders["cookie"];
          }
        }
        callback({ requestHeaders });
      });
      try {
        defaultSession.setSpellCheckerLanguages(spellCheckerLanguages());
        logger.info("[SessionManager] Spellchecker languages set", { languages: spellCheckerLanguages() });
      } catch (error) {
        logger.warn("[SessionManager] Failed to set spellchecker languages", { error: String(error) });
      }
      settingsStore.onChange("doNotTrack", (v) => {
        doNotTrack = typeof v === "boolean" ? v : settingsStore.get("doNotTrack");
        logger.info("[SessionManager] doNotTrack changed", { doNotTrack });
      });
      settingsStore.onChange("blockAds", (v) => {
        blockAds = typeof v === "boolean" ? v : settingsStore.get("blockAds");
        logger.info("[SessionManager] blockAds changed", { blockAds });
      });
      settingsStore.onChange("blockThirdPartyCookies", (v) => {
        blockThirdPartyCookies = typeof v === "boolean" ? v : settingsStore.get("blockThirdPartyCookies");
        logger.info("[SessionManager] blockThirdPartyCookies changed", { blockThirdPartyCookies });
      });
      settingsStore.onChange("language", (v) => {
        language = typeof v === "string" ? v : settingsStore.get("language");
        logger.info("[SessionManager] language changed", { language });
        try {
          defaultSession.setSpellCheckerLanguages(spellCheckerLanguages());
          logger.info("[SessionManager] Spellchecker languages updated", { languages: spellCheckerLanguages() });
        } catch (error) {
          logger.warn("[SessionManager] Failed to update spellchecker languages", { error: String(error) });
        }
      });
      defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const responseHeaders = { ...details.responseHeaders ?? {} };
        if (blockThirdPartyCookies) {
          const topHost = getTopLevelHost(details.webContentsId);
          if (isThirdParty(details.url, topHost)) {
            delete responseHeaders["Set-Cookie"];
            delete responseHeaders["set-cookie"];
          }
        }
        if (Env.isDev && details.url.startsWith("http://localhost:5173/")) {
          responseHeaders["Cache-Control"] = ["no-store"];
          delete responseHeaders["ETag"];
          delete responseHeaders["etag"];
        }
        callback({ responseHeaders });
      });
      if (Env.isDev) {
        logger.info("[SessionManager] Dev cache disabled for Vite (localhost:5173)");
      }
      defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
        logger.info("[SessionManager] Permission request", { permission });
        const allowedPermissions = [
          "clipboard-read",
          "clipboard-sanitized-write",
          "geolocation",
          "notifications"
        ];
        callback(allowedPermissions.includes(permission));
      });
      logger.info("[SessionManager] Session setup completed");
    } catch (error) {
      logger.error("[SessionManager] Setup failed:", error);
      throw error;
    }
  }
}
class AppState {
  static state = {
    isTrayMode: false,
    isWindowMinimized: false,
    isWindowMaximized: false,
    lastActiveTabId: null
  };
  /**
   * 트레이 모드 설정
   */
  static setIsTrayMode(value) {
    this.state.isTrayMode = value;
    logger.info("[AppState] Tray mode changed", { isTrayMode: value });
  }
  /**
   * 트레이 모드 여부 반환
   */
  static getIsTrayMode() {
    return this.state.isTrayMode;
  }
  /**
   * 창 최소화 상태 설정
   */
  static setIsWindowMinimized(value) {
    this.state.isWindowMinimized = value;
    logger.info("[AppState] Window minimized state changed", { isWindowMinimized: value });
  }
  /**
   * 창 최소화 상태 반환
   */
  static getIsWindowMinimized() {
    return this.state.isWindowMinimized;
  }
  /**
   * 창 최대화 상태 설정
   */
  static setIsWindowMaximized(value) {
    this.state.isWindowMaximized = value;
    logger.info("[AppState] Window maximized state changed", { isWindowMaximized: value });
  }
  /**
   * 창 최대화 상태 반환
   */
  static getIsWindowMaximized() {
    return this.state.isWindowMaximized;
  }
  /**
   * 마지막 활성 탭 ID 설정
   */
  static setLastActiveTabId(tabId) {
    this.state.lastActiveTabId = tabId;
    logger.info("[AppState] Last active tab changed", { tabId });
  }
  /**
   * 마지막 활성 탭 ID 반환
   */
  static getLastActiveTabId() {
    return this.state.lastActiveTabId;
  }
  /**
   * 전체 상태 반환 (디버깅용)
   */
  static getState() {
    return { ...this.state };
  }
  /**
   * 상태 리셋 (앱 시작 시)
   */
  static reset() {
    this.state = {
      isTrayMode: false,
      isWindowMinimized: false,
      isWindowMaximized: false,
      lastActiveTabId: null
    };
    logger.info("[AppState] State reset");
  }
}
function setupAppHandlers(registry2) {
  logger.info("[AppHandler] Setting up handlers...");
  registry2.handle(IPC_CHANNELS.APP.QUIT, async () => {
    try {
      logger.info("[AppHandler] app:quit requested");
      app.quit();
      return { success: true };
    } catch (error) {
      logger.error("[AppHandler] app:quit failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.APP.RESTART, async () => {
    try {
      logger.info("[AppHandler] app:restart requested");
      app.relaunch();
      app.quit();
      return { success: true };
    } catch (error) {
      logger.error("[AppHandler] app:restart failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.WINDOW.MINIMIZE, async () => {
    try {
      logger.info("[AppHandler] window:minimize requested");
      const window = MainWindow.getWindow();
      if (!window) {
        throw new Error("Window not found");
      }
      window.minimize();
      AppState.setIsWindowMinimized(true);
      return { success: true };
    } catch (error) {
      logger.error("[AppHandler] window:minimize failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.WINDOW.MAXIMIZE, async () => {
    try {
      logger.info("[AppHandler] window:maximize requested");
      const window = MainWindow.getWindow();
      if (!window) {
        throw new Error("Window not found");
      }
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
      AppState.setIsWindowMaximized(!AppState.getIsWindowMaximized());
      return { success: true };
    } catch (error) {
      logger.error("[AppHandler] window:maximize failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.WINDOW.CLOSE, async () => {
    try {
      logger.info("[AppHandler] window:close requested");
      const window = MainWindow.getWindow();
      if (!window) {
        throw new Error("Window not found");
      }
      window.close();
      return { success: true };
    } catch (error) {
      logger.error("[AppHandler] window:close failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.APP.STATE, async () => {
    try {
      logger.info("[AppHandler] app:state requested");
      const appState = AppState.getState();
      const tabs = ViewManager.getTabs();
      const activeTabId = ViewManager.getActiveTabId();
      const state = {
        ...appState,
        tabs,
        activeTabId
      };
      return { success: true, state };
    } catch (error) {
      logger.error("[AppHandler] app:state failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.APP.GET_INFO, async () => {
    try {
      const info = {
        name: Env.appName,
        version: Env.appVersion,
        userDataDir: Env.dataDir
      };
      return { success: true, info };
    } catch (error) {
      logger.error("[AppHandler] app:get-info failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.OVERLAY.TOGGLE_HEADER_LATCH, async () => {
    try {
      const latched = OverlayController.toggleHeaderLatched();
      return { success: true, latched };
    } catch (error) {
      logger.error("[AppHandler] overlay:toggle-header-latch failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.OVERLAY.TOGGLE_SIDEBAR_LATCH, async () => {
    try {
      const latched = OverlayController.toggleSidebarLatched();
      return { success: true, latched };
    } catch (error) {
      logger.error("[AppHandler] overlay:toggle-sidebar-latch failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.OVERLAY.SET_INTERACTIVE, async (_event, payload) => {
    try {
      const parsed = z.object({ interactive: z.boolean() }).safeParse(payload);
      if (!parsed.success) {
        return { success: false, error: "Invalid payload" };
      }
      const isDragging = !parsed.data.interactive;
      overlayStore.getState().setDragging(isDragging);
      logger.debug("[AppHandler] overlay:set-interactive", { interactive: parsed.data.interactive, isDragging });
      return { success: true };
    } catch (error) {
      logger.error("[AppHandler] overlay:set-interactive failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.OVERLAY.DEBUG, async (_event, payload) => {
    try {
      logger.debug("[OverlayDebug]", { payload });
      return { success: true };
    } catch (error) {
      logger.error("[AppHandler] overlay:debug failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.OVERLAY.UPDATE_HOVER_METRICS, async (_event, payload) => {
    try {
      const parsed = OverlayHoverMetricsSchema.safeParse(payload);
      if (!parsed.success) {
        logger.warn("[AppHandler] ❌ Zod validation failed for hover metrics", { error: parsed.error.message, payload });
        return { success: false, error: parsed.error.message };
      }
      OverlayController.updateHoverMetrics(parsed.data);
      return { success: true };
    } catch (error) {
      logger.error("[AppHandler] overlay:update-hover-metrics failed:", error);
      return { success: false, error: String(error) };
    }
  });
  logger.info("[AppHandler] Handlers setup completed");
}
function getDevProtocolArgs() {
  if (app.isPackaged) return null;
  const mainArg = process.argv[1];
  if (!mainArg) return null;
  return { execPath: process.execPath, args: [path.resolve(mainArg)] };
}
class DefaultBrowserService {
  static instance = null;
  static getInstance() {
    if (!this.instance) this.instance = new DefaultBrowserService();
    return this.instance;
  }
  constructor() {
  }
  getStatus() {
    const devArgs = getDevProtocolArgs();
    const http = devArgs ? app.isDefaultProtocolClient("http", devArgs.execPath, devArgs.args) : app.isDefaultProtocolClient("http");
    const https = devArgs ? app.isDefaultProtocolClient("https", devArgs.execPath, devArgs.args) : app.isDefaultProtocolClient("https");
    return { http, https };
  }
  setDefault() {
    try {
      const devArgs = getDevProtocolArgs();
      const httpOk = devArgs ? app.setAsDefaultProtocolClient("http", devArgs.execPath, devArgs.args) : app.setAsDefaultProtocolClient("http");
      const httpsOk = devArgs ? app.setAsDefaultProtocolClient("https", devArgs.execPath, devArgs.args) : app.setAsDefaultProtocolClient("https");
      logger.info("[DefaultBrowserService] setDefault attempted", { httpOk, httpsOk });
      return { success: httpOk && httpsOk, status: this.getStatus() };
    } catch (error) {
      logger.error("[DefaultBrowserService] setDefault failed", error);
      return { success: false, error: String(error), status: this.getStatus() };
    }
  }
  async openSystemSettings() {
    try {
      const url = process.platform === "darwin" ? "x-apple.systempreferences:com.apple.preference.general" : process.platform === "win32" ? "ms-settings:defaultapps" : null;
      if (!url) {
        return { success: false, error: "Unsupported platform" };
      }
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      logger.error("[DefaultBrowserService] openSystemSettings failed", error);
      return { success: false, error: String(error) };
    }
  }
}
const defaultBrowserService = DefaultBrowserService.getInstance();
function setupDefaultBrowserHandlers(registry2) {
  logger.info("[DefaultBrowserHandler] Registering IPC handlers");
  registry2.handle(IPC_CHANNELS.DEFAULT_BROWSER.GET_STATUS, async () => {
    try {
      const status = defaultBrowserService.getStatus();
      return { success: true, status };
    } catch (error) {
      logger.error("[DefaultBrowserHandler] get-status failed", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.DEFAULT_BROWSER.SET_DEFAULT, async () => {
    return defaultBrowserService.setDefault();
  });
  registry2.handle(IPC_CHANNELS.DEFAULT_BROWSER.OPEN_SYSTEM_SETTINGS, async () => {
    return await defaultBrowserService.openSystemSettings();
  });
}
class ExtensionsService {
  static instance = null;
  loadedExtensionIds = /* @__PURE__ */ new Set();
  store = SettingsStore.getInstance();
  static getInstance() {
    if (!this.instance) this.instance = new ExtensionsService();
    return this.instance;
  }
  constructor() {
  }
  async getStatus() {
    const enabled = this.store.get("extensionsEnabled");
    const directory = this.store.get("extensionsDirectory");
    const loaded = session.defaultSession.getAllExtensions().filter((ext) => this.loadedExtensionIds.has(ext.id)).map((ext) => ({ id: ext.id, name: ext.name, version: ext.version }));
    return { enabled, directory, loaded };
  }
  async reload() {
    try {
      await this.unloadAll();
      const enabled = this.store.get("extensionsEnabled");
      const directory = this.store.get("extensionsDirectory");
      if (!enabled) {
        logger.info("[ExtensionsService] Extensions disabled; nothing to load");
        return { success: true, loadedCount: 0 };
      }
      if (!directory) {
        logger.info("[ExtensionsService] No extensions directory set");
        return { success: true, loadedCount: 0 };
      }
      const loadedCount = await this.loadAllFromDirectory(directory);
      return { success: true, loadedCount };
    } catch (error) {
      logger.error("[ExtensionsService] Reload failed", error);
      return { success: false, error: String(error), loadedCount: 0 };
    }
  }
  async unloadAll() {
    const ids = Array.from(this.loadedExtensionIds);
    this.loadedExtensionIds.clear();
    for (const id of ids) {
      try {
        session.defaultSession.removeExtension(id);
        logger.info("[ExtensionsService] Extension removed", { id });
      } catch (error) {
        logger.warn("[ExtensionsService] Failed to remove extension", { id, error: String(error) });
      }
    }
  }
  async loadAllFromDirectory(directory) {
    let entries;
    try {
      entries = await promises.readdir(directory, { withFileTypes: true });
    } catch (error) {
      logger.warn("[ExtensionsService] Cannot read extensions directory", { directory, error: String(error) });
      return 0;
    }
    const candidates = entries.filter((e) => e.isDirectory()).map((e) => path.join(directory, e.name));
    let loadedCount = 0;
    for (const extensionPath of candidates) {
      const manifestPath = path.join(extensionPath, "manifest.json");
      try {
        await promises.access(manifestPath);
      } catch {
        continue;
      }
      try {
        const ext = await session.defaultSession.loadExtension(extensionPath, {
          allowFileAccess: true
        });
        this.loadedExtensionIds.add(ext.id);
        loadedCount += 1;
        logger.info("[ExtensionsService] Extension loaded", {
          id: ext.id,
          name: ext.name,
          version: ext.version
        });
      } catch (error) {
        logger.warn("[ExtensionsService] Failed to load extension", {
          extensionPath,
          error: String(error)
        });
      }
    }
    return loadedCount;
  }
}
const extensionsService = ExtensionsService.getInstance();
function setupExtensionsHandlers(registry2) {
  logger.info("[ExtensionsHandler] Registering IPC handlers");
  registry2.handle(IPC_CHANNELS.EXTENSIONS.GET_STATUS, async () => {
    try {
      const status = await extensionsService.getStatus();
      return { success: true, status };
    } catch (error) {
      logger.error("[ExtensionsHandler] get-status failed", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.EXTENSIONS.RELOAD, async () => {
    return await extensionsService.reload();
  });
}
function setupTabHandlers(registry2) {
  logger.info("[TabHandler] Setting up handlers...");
  registry2.handle(IPC_CHANNELS.TAB.CREATE, async (_event, input) => {
    try {
      const { url } = validateOrThrow(TabCreateSchema, input);
      logger.info("[TabHandler] tab:create requested", { url });
      const tabId = await ViewManager.createTab(url);
      ViewManager.switchTab(tabId);
      logger.info("[TabHandler] tab:create success", { tabId });
      return { success: true, tabId };
    } catch (error) {
      logger.error("[TabHandler] tab:create failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.TAB.CLOSE, async (_event, input) => {
    try {
      const { tabId } = validateOrThrow(TabCloseSchema, input);
      logger.info("[TabHandler] tab:close requested", { tabId });
      ViewManager.closeTab(tabId);
      logger.info("[TabHandler] tab:close success", { tabId });
      return { success: true };
    } catch (error) {
      logger.error("[TabHandler] tab:close failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.TAB.SWITCH, async (_event, input) => {
    try {
      const { tabId } = validateOrThrow(TabSwitchSchema, input);
      logger.info("[TabHandler] tab:switch requested", { tabId });
      ViewManager.switchTab(tabId);
      AppState.setLastActiveTabId(tabId);
      logger.info("[TabHandler] tab:switch success", { tabId });
      return { success: true };
    } catch (error) {
      logger.error("[TabHandler] tab:switch failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.TAB.LIST, async () => {
    try {
      logger.debug("[TabHandler] tab:list requested");
      const tabs = ViewManager.getTabs();
      return { success: true, tabs };
    } catch (error) {
      logger.error("[TabHandler] tab:list failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.TAB.ACTIVE, async () => {
    try {
      logger.info("[TabHandler] tab:active requested");
      const tabId = ViewManager.getActiveTabId();
      return { success: true, tabId };
    } catch (error) {
      logger.error("[TabHandler] tab:active failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.TAB.NAVIGATE, async (_event, input) => {
    try {
      const { url } = validateOrThrow(TabCreateSchema, input);
      logger.info("[TabHandler] tab:navigate requested", { url });
      await ViewManager.navigate(url);
      logger.info("[TabHandler] tab:navigate success", { url });
      return { success: true };
    } catch (error) {
      logger.error("[TabHandler] tab:navigate failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.TAB.BACK, async () => {
    try {
      logger.info("[TabHandler] tab:back requested");
      ViewManager.goBack();
      return { success: true };
    } catch (error) {
      logger.error("[TabHandler] tab:back failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.TAB.FORWARD, async () => {
    try {
      logger.info("[TabHandler] tab:forward requested");
      ViewManager.goForward();
      return { success: true };
    } catch (error) {
      logger.error("[TabHandler] tab:forward failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.TAB.RELOAD, async () => {
    try {
      logger.info("[TabHandler] tab:reload requested");
      ViewManager.reload();
      return { success: true };
    } catch (error) {
      logger.error("[TabHandler] tab:reload failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.TAB.REORDER, async (_event, input) => {
    try {
      const { tabId, position } = validateOrThrow(TabReorderWithinSectionSchema, input);
      logger.info("[TabHandler] tab:reorder requested", { tabId, position });
      ViewManager.reorderTabWithinSection(tabId, position);
      return { success: true };
    } catch (error) {
      logger.error("[TabHandler] tab:reorder failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.TAB.REORDER_ICON, async (_event, input) => {
    try {
      const { fromIndex, toIndex } = validateOrThrow(TabReorderIconSchema, input);
      logger.info("[TabHandler] tab:reorder-icon requested", { fromIndex, toIndex });
      ViewManager.reorderIcon(fromIndex, toIndex);
      return { success: true };
    } catch (error) {
      logger.error("[TabHandler] tab:reorder-icon failed:", error);
      return { success: false, error: String(error) };
    }
  });
  registry2.handle(IPC_CHANNELS.TAB.MOVE_SECTION, async (_event, input) => {
    try {
      const { tabId, targetType } = validateOrThrow(TabMoveSectionSchema, input);
      logger.info("[TabHandler] tab:move-section requested", { tabId, targetType });
      ViewManager.moveTabToSection(tabId, targetType);
      return { success: true };
    } catch (error) {
      logger.error("[TabHandler] tab:move-section failed:", error);
      return { success: false, error: String(error) };
    }
  });
  logger.info("[TabHandler] Handlers setup completed");
}
class SettingsService {
  static instance = null;
  store;
  constructor() {
    this.store = SettingsStore.getInstance();
    this.setupChangeListeners();
  }
  /**
   * Singleton 인스턴스 반환
   */
  static getInstance() {
    if (!this.instance) {
      this.instance = new SettingsService();
    }
    return this.instance;
  }
  /**
   * 모든 설정값 조회
   */
  getAllSettings() {
    logger.info("[SettingsService] Getting all settings");
    return this.store.getAll();
  }
  /**
   * 특정 설정값 조회
   */
  getSetting(key) {
    logger.info("[SettingsService] Getting setting", { key });
    return this.store.get(key);
  }
  /**
   * 설정값 업데이트 (검증 포함)
   */
  updateSetting(key, value) {
    try {
      const validationError = this.validateSetting(key, value);
      if (validationError) {
        logger.warn("[SettingsService] Validation failed", { key, error: validationError });
        return { success: false, error: validationError };
      }
      const success = this.store.set(key, value);
      if (!success) {
        return { success: false, error: "Failed to save setting" };
      }
      logger.info("[SettingsService] Setting updated successfully", { key });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("[SettingsService] Failed to update setting:", error, { key });
      return { success: false, error: errorMessage };
    }
  }
  /**
   * 여러 설정값 한 번에 업데이트
   */
  updateMultipleSettings(updates) {
    try {
      for (const [key, value] of Object.entries(updates)) {
        const validationError = this.validateSetting(
          key,
          value
        );
        if (validationError) {
          return { success: false, error: `${key}: ${validationError}` };
        }
      }
      const success = this.store.setMultiple(updates);
      if (!success) {
        return { success: false, error: "Failed to save settings" };
      }
      logger.info("[SettingsService] Multiple settings updated successfully");
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("[SettingsService] Failed to update multiple settings:", error);
      return { success: false, error: errorMessage };
    }
  }
  /**
   * 설정값 삭제
   */
  deleteSetting(key) {
    try {
      const success = this.store.delete(key);
      if (!success) {
        return { success: false, error: "Failed to delete setting" };
      }
      logger.info("[SettingsService] Setting deleted", { key });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("[SettingsService] Failed to delete setting:", error, { key });
      return { success: false, error: errorMessage };
    }
  }
  /**
   * 모든 설정값 초기화
   */
  resetAllSettings() {
    try {
      const success = this.store.reset();
      if (!success) {
        return { success: false, error: "Failed to reset settings" };
      }
      logger.info("[SettingsService] All settings reset");
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("[SettingsService] Failed to reset settings:", error);
      return { success: false, error: errorMessage };
    }
  }
  /**
   * 설정 파일 경로 반환
   */
  getSettingsPath() {
    return this.store.getPath();
  }
  /**
   * 설정값 유효성 검증
   */
  validateSetting(key, value) {
    if (value === void 0 || value === null) {
      return "Value cannot be undefined or null";
    }
    switch (key) {
      case "homepage":
        if (typeof value === "string") {
          try {
            new URL(value);
          } catch {
            return "Invalid URL format";
          }
        }
        break;
      case "downloadDirectory":
        if (typeof value !== "string") {
          return "Download directory must be a string";
        }
        if (value.length > 512) {
          return "Download directory is too long";
        }
        if (value.includes("\0")) {
          return "Download directory contains invalid characters";
        }
        break;
      case "systemHardwareAcceleration":
      case "systemBackgroundApps":
      case "accessibilityHighContrast":
      case "accessibilityReduceMotion":
      case "extensionsEnabled":
      case "defaultBrowserPromptOnStartup":
        if (typeof value !== "boolean") {
          return "Value must be a boolean";
        }
        break;
      case "extensionsDirectory":
        if (typeof value !== "string") {
          return "Extensions directory must be a string";
        }
        if (value.length > 512) {
          return "Extensions directory is too long";
        }
        if (value.includes("\\0")) {
          return "Extensions directory contains invalid characters";
        }
        break;
      case "pageZoom":
        if (typeof value === "string") {
          const zoom = parseInt(value, 10);
          if (isNaN(zoom) || zoom < 25 || zoom > 500) {
            return "Page zoom must be between 25% and 500%";
          }
        }
        break;
      case "theme":
        if (!["light", "dark", "system"].includes(value)) {
          return "Invalid theme value";
        }
        break;
      case "searchEngine":
        if (!["google", "bing", "duckduckgo", "naver"].includes(value)) {
          return "Invalid search engine";
        }
        break;
      case "fontSize":
        if (!["small", "medium", "large", "xlarge"].includes(value)) {
          return "Invalid font size";
        }
        break;
      case "language":
        if (!["ko", "en", "ja"].includes(value)) {
          return "Invalid language";
        }
        break;
    }
    return null;
  }
  /**
   * 설정 변경 리스너 설정
   */
  setupChangeListeners() {
    this.store.onAnyChange((newValue, oldValue) => {
      if (!newValue || !oldValue) return;
      logger.info("[SettingsService] Settings changed", {
        changes: this.getChangedKeys(oldValue, newValue)
      });
    });
    this.store.onChange("theme", (newTheme) => {
      logger.info("[SettingsService] Theme changed", { theme: newTheme });
    });
  }
  /**
   * 변경된 키 목록 반환
   */
  getChangedKeys(oldValue, newValue) {
    const changed = [];
    for (const key in newValue) {
      if (oldValue[key] !== newValue[key]) {
        changed.push(key);
      }
    }
    return changed;
  }
}
const settingsService = SettingsService.getInstance();
function setupSettingsHandlers(registry2) {
  logger.info("[SettingsHandler] Registering IPC handlers");
  registry2.handle(IPC_CHANNELS.VIEW.SETTINGS_TOGGLED, async (_event, input) => {
    try {
      const { isOpen } = input;
      if (isOpen) {
        ViewManager.hideActiveView();
        logger.info("[SettingsHandler] Settings page opened - view hidden");
      } else {
        ViewManager.showActiveView();
        logger.info("[SettingsHandler] Settings page closed - view shown");
      }
      return true;
    } catch (error) {
      logger.error("[SettingsHandler] Failed to toggle settings:", error);
      throw error;
    }
  });
  registry2.handle(IPC_CHANNELS.SETTINGS.GET_ALL, async () => {
    try {
      const settings = settingsService.getAllSettings();
      logger.info("[SettingsHandler] Settings retrieved");
      return settings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("[SettingsHandler] Failed to get settings:", { error: errorMessage });
      throw new Error(`Failed to get settings: ${errorMessage}`);
    }
  });
  registry2.handle(IPC_CHANNELS.SETTINGS.GET, async (_event, key) => {
    try {
      if (!key) {
        throw new Error("Setting key is required");
      }
      const value = settingsService.getSetting(key);
      logger.info("[SettingsHandler] Setting retrieved", { key });
      return value;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("[SettingsHandler] Failed to get setting:", { key, error: errorMessage });
      throw new Error(`Failed to get setting: ${errorMessage}`);
    }
  });
  registry2.handle(
    IPC_CHANNELS.SETTINGS.UPDATE,
    async (_event, { key, value }) => {
      try {
        if (!key) {
          throw new Error("Setting key is required");
        }
        if (value === void 0) {
          throw new Error("Setting value is required");
        }
        const result = settingsService.updateSetting(key, value);
        if (!result.success) {
          throw new Error(result.error || "Failed to update setting");
        }
        logger.info("[SettingsHandler] Setting updated", { key });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("[SettingsHandler] Failed to update setting:", { key, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }
  );
  registry2.handle(IPC_CHANNELS.SETTINGS.UPDATE_MULTIPLE, async (_event, updates) => {
    try {
      if (!updates || Object.keys(updates).length === 0) {
        throw new Error("Updates object is required");
      }
      const result = settingsService.updateMultipleSettings(updates);
      if (!result.success) {
        throw new Error(result.error || "Failed to update settings");
      }
      logger.info("[SettingsHandler] Multiple settings updated");
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("[SettingsHandler] Failed to update multiple settings:", {
        error: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  });
  registry2.handle(IPC_CHANNELS.SETTINGS.RESET, async () => {
    try {
      const result = settingsService.resetAllSettings();
      if (!result.success) {
        throw new Error(result.error || "Failed to reset settings");
      }
      logger.info("[SettingsHandler] Settings reset to defaults");
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("[SettingsHandler] Failed to reset settings:", { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  });
  registry2.handle(IPC_CHANNELS.SETTINGS.GET_PATH, async () => {
    try {
      const path2 = settingsService.getSettingsPath();
      return { success: true, path: path2 };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("[SettingsHandler] Failed to get settings path:", { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  });
  logger.info("[SettingsHandler] IPC handlers registered successfully");
}
function setupViewHandlers(registry2) {
  logger.info("[ViewHandler] Setting up handlers...");
  const RESIZE_BATCH_MS = 16;
  let pendingBounds = null;
  let lastAppliedBounds = null;
  let resizeTimer = null;
  const sameBounds = (a, b) => {
    if (!a || !b) return false;
    return a.left === b.left && a.top === b.top;
  };
  const flushResize = () => {
    resizeTimer = null;
    const next = pendingBounds;
    pendingBounds = null;
    if (!next) return;
    if (sameBounds(lastAppliedBounds, next)) return;
    lastAppliedBounds = next;
    try {
      ViewManager.setActiveViewBounds(next);
    } catch (error) {
      logger.error("[ViewHandler] view:resize flush failed:", error);
    }
  };
  registry2.on(IPC_CHANNELS.VIEW.RESIZE, (_event, bounds) => {
    try {
      const parsed = ViewResizeSchema.safeParse(bounds);
      if (!parsed.success) {
        logger.warn("[ViewHandler] VIEW.RESIZE validation failed:", { error: parsed.error });
        return;
      }
      if (sameBounds(pendingBounds, bounds) || sameBounds(lastAppliedBounds, bounds)) return;
      pendingBounds = bounds;
      if (!resizeTimer) {
        resizeTimer = setTimeout(flushResize, RESIZE_BATCH_MS);
      }
    } catch (error) {
      logger.error("[ViewHandler] view:resize failed:", error);
    }
  });
  registry2.handle(IPC_CHANNELS.VIEW.NAVIGATE, async (_event, input) => {
    try {
      const parsed = ViewNavigateSchema.safeParse(input);
      if (!parsed.success) return { success: false, error: "Invalid url" };
      const { url } = parsed.data;
      await ViewManager.navigate(url);
      return { success: true, url };
    } catch (error) {
      logger.error("[ViewHandler] view:navigate failed:", error);
      return { success: false, error: String(error) };
    }
  });
  logger.info("[ViewHandler] Handlers setup completed");
}
class IpcRegistry {
  handledChannels = /* @__PURE__ */ new Set();
  onListeners = /* @__PURE__ */ new Map();
  handle(channel, handler) {
    ipcMain.handle(channel, handler);
    this.handledChannels.add(channel);
  }
  on(channel, listener) {
    ipcMain.on(channel, listener);
    const set = this.onListeners.get(channel) ?? /* @__PURE__ */ new Set();
    set.add(listener);
    this.onListeners.set(channel, set);
  }
  dispose() {
    for (const channel of this.handledChannels) {
      try {
        ipcMain.removeHandler(channel);
      } catch {
      }
    }
    this.handledChannels.clear();
    for (const [channel, listeners] of this.onListeners.entries()) {
      for (const listener of listeners) {
        try {
          ipcMain.removeListener(channel, listener);
        } catch {
        }
      }
    }
    this.onListeners.clear();
  }
}
let registry = null;
function setupIPCHandlers() {
  logger.info("[IPC] Setting up all handlers...");
  try {
    if (registry) {
      logger.warn("[IPC] Registry already exists; disposing old handlers first");
      registry.dispose();
    }
    registry = new IpcRegistry();
    setupAppHandlers(registry);
    logger.info("[IPC] App handlers registered");
    setupTabHandlers(registry);
    logger.info("[IPC] Tab handlers registered");
    setupSettingsHandlers(registry);
    logger.info("[IPC] Settings handlers registered");
    setupExtensionsHandlers(registry);
    logger.info("[IPC] Extensions handlers registered");
    setupDefaultBrowserHandlers(registry);
    logger.info("[IPC] Default browser handlers registered");
    setupViewHandlers(registry);
    logger.info("[IPC] View handlers registered");
    logger.info("[IPC] All handlers setup completed");
  } catch (error) {
    logger.error("[IPC] Handler setup failed:", error);
    throw error;
  }
}
function removeAllIPCHandlers() {
  logger.info("[IPC] Removing all handlers...");
  try {
    if (registry) {
      registry.dispose();
      registry = null;
    }
    logger.info("[IPC] All handlers removed (registry disposed)");
  } catch (error) {
    logger.error("[IPC] Handler removal failed:", error);
  }
}
function setupProtocolHandlers() {
  logger.info("[ProtocolHandler] Setting up protocol handlers...");
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "app",
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true
      }
    }
  ]);
  logger.info("[ProtocolHandler] Protocol handlers setup completed");
}
function setupNavigationInterceptors() {
  logger.info("[ProtocolHandler] Setting up navigation interceptors...");
  app.on("web-contents-created", (_event, contents) => {
    contents.on("will-navigate", (event, url) => {
      logger.debug("[ProtocolHandler] will-navigate:", { url });
      if (url.startsWith("about:settings") || url.startsWith("chrome://settings")) {
        event.preventDefault();
        logger.info("[ProtocolHandler] Blocked about:settings, redirecting to app:settings");
        const ui = MainWindow.getWebContents();
        if (ui) {
          ui.send("navigate-to-settings");
        } else {
          logger.warn("[ProtocolHandler] UI webContents not available for settings navigation");
        }
        return;
      }
      if (url.startsWith("chrome://") || url.startsWith("about:")) {
        if (url === "about:blank") {
          return;
        }
        event.preventDefault();
        logger.warn("[ProtocolHandler] Blocked Chrome internal page:", { url });
        return;
      }
    });
    contents.setWindowOpenHandler((details) => {
      const { url } = details;
      if (url.startsWith("about:") || url.startsWith("chrome://")) {
        if (url !== "about:blank") {
          logger.warn("[ProtocolHandler] Blocked window.open to:", { url });
          return { action: "deny" };
        }
      }
      return { action: "allow" };
    });
  });
  logger.info("[ProtocolHandler] Navigation interceptors setup completed");
}
app.name = Env.isDev ? "aside-dev" : "aside";
try {
  const language = SettingsStore.getInstance().get("language");
  const locale = language === "ko" ? "ko-KR" : language === "ja" ? "ja-JP" : "en-US";
  app.commandLine.appendSwitch("lang", locale);
  logger.info("[Main] Chromium locale switch applied", { locale, language });
} catch (error) {
  logger.warn("[Main] Failed to apply Chromium locale switch", { error: String(error) });
}
setupProtocolHandlers();
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  logger.warn("[Main] App already running. Exiting.");
  app.quit();
} else {
  app.on("ready", async () => {
    logger.info("[Main] App ready event triggered");
    try {
      logger.info("[Main] Step 1/5: Initializing electron-store...");
      Store.initRenderer();
      logger.info("[Main] Step 2/5: Setting up session...");
      SessionManager.setup();
      logger.info("[Main] Step 2.5/5: Setting up navigation interceptors...");
      setupNavigationInterceptors();
      logger.info("[Main] Step 3/5: Setting up IPC handlers...");
      setupIPCHandlers();
      logger.info("[Main] Step 4/5: Initializing services...");
      UpdateService.initialize();
      logger.info("[Main] Step 5/5: Bootstrapping application...");
      await AppLifecycle.bootstrap();
      logger.info("[Main] App ready. All systems online.");
    } catch (error) {
      logger.error("[Main] App ready failed:", error);
      app.quit();
    }
  });
  app.on("window-all-closed", () => {
    logger.info("[Main] All windows closed");
    if (process.platform !== "darwin") {
      logger.info("[Main] Quitting app (non-macOS)");
      app.quit();
    } else {
      logger.info("[Main] Keeping app running (macOS)");
    }
  });
  app.on("activate", () => {
    logger.info("[Main] App activated");
  });
  app.on("will-quit", async () => {
    logger.info("[Main] App will-quit event triggered");
    try {
      logger.info("[Main] Step 1/3: Running shutdown...");
      await AppLifecycle.shutdown();
      logger.info("[Main] Step 2/3: Stopping update service...");
      UpdateService.stop();
      logger.info("[Main] Step 3/3: Removing IPC handlers...");
      removeAllIPCHandlers();
      logger.info("[Main] App shutdown completed. Goodbye.");
    } catch (error) {
      logger.error("[Main] App shutdown failed:", error);
    }
  });
  process.on("uncaughtException", (error) => {
    logger.error("[Main] Uncaught exception:", error);
  });
  process.on("unhandledRejection", (reason) => {
    logger.error("[Main] Unhandled rejection:", reason);
  });
}
