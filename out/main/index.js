import { app, WebContentsView, screen, BrowserWindow, session, ipcMain, protocol } from "electron";
import Store from "electron-store";
import { existsSync, mkdirSync, appendFileSync, promises } from "node:fs";
import { join, dirname } from "node:path";
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
function validateOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }
  return result.data;
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
    STATE: "app:state"
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
    RESET: "settings:reset"
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
class ViewManager {
  static tabs = /* @__PURE__ */ new Map();
  static activeTabId = null;
  static contentWindow = null;
  static uiWebContents = null;
  static isInitializing = false;
  static lastReorderTarget = null;
  static externalActiveBounds = null;
  /**
   * ViewManager 초기화
   *
   * 프로세스:
   * 1. 메인 윈도우 저장
   * 2. 기본 탭 1개 생성 (홈페이지)
   * 3. 레이아웃 적용
   *
   * @param window - 부모 BrowserWindow
   */
  static async initialize(contentWindow, uiWebContents) {
    if (this.contentWindow) {
      logger.warn("[ViewManager] Already initialized. Skipping.");
      return;
    }
    if (this.isInitializing) {
      throw new Error("[ViewManager] Initialization already in progress");
    }
    this.isInitializing = true;
    try {
      logger.info("[ViewManager] Initializing...");
      this.contentWindow = contentWindow;
      this.uiWebContents = uiWebContents;
      this.dumpContentViewTree("after-initialize");
      this.contentWindow.on("resize", () => {
        this.layout();
      });
      const homeTabId = await this.createTab("https://www.google.com");
      logger.info("[ViewManager] Home tab created", { tabId: homeTabId });
      this.switchTab(homeTabId);
      this.layout();
      logger.info("[ViewManager] Layout applied");
      this.ensureUITopmost();
      this.dumpContentViewTree("after-layout");
      logger.info("[ViewManager] Initialization completed");
    } catch (error) {
      logger.error("[ViewManager] Initialization failed:", error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }
  /**
   * 새 탭 생성
   *
   * 프로세스:
   * 1. WebContentsView 생성
   * 2. 탭 데이터 저장
   * 3. URL 로드
   * 4. 이벤트 리스너 설정
   *
   * @param url - 초기 URL
   * @returns 생성된 탭 ID
   */
  static async createTab(url) {
    if (!this.contentWindow) {
      throw new Error("[ViewManager] Not initialized. Call initialize() first.");
    }
    try {
      logger.info("[ViewManager] Creating new tab...", { url });
      const view = new WebContentsView({
        webPreferences: {
          contextIsolation: true,
          sandbox: true
        }
      });
      view.setBackgroundColor("#00000000");
      const tabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const tabData = {
        id: tabId,
        view,
        url,
        title: "New Tab",
        isActive: false
      };
      this.tabs.set(tabId, tabData);
      const contentView = this.contentWindow.getContentView();
      try {
        if (contentView.children.includes(view)) {
          contentView.removeChildView(view);
        }
      } catch {
      }
      contentView.addChildView(view);
      this.ensureUITopmost();
      this.dumpContentViewTree("after-add-tab-view");
      view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      await view.webContents.loadURL(url);
      this.setupTabEvents(tabId, view);
      logger.info("[ViewManager] Tab created", { tabId, url });
      return tabId;
    } catch (error) {
      logger.error("[ViewManager] Tab creation failed:", error);
      throw error;
    }
  }
  /**
   * 탭 전환
   *
   * @param tabId - 활성화할 탭 ID
   */
  static switchTab(tabId) {
    const tabData = this.tabs.get(tabId);
    if (!tabData) {
      logger.warn("[ViewManager] Tab not found", { tabId });
      return;
    }
    if (this.activeTabId) {
      const prevTab = this.tabs.get(this.activeTabId);
      if (prevTab) {
        prevTab.isActive = false;
        prevTab.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      }
    }
    this.activeTabId = tabId;
    tabData.isActive = true;
    this.layout();
    logger.info("[ViewManager] Tab switched", { tabId });
    this.syncToRenderer();
  }
  /**
   * Renderer에서 들어온 safe-area 오프셋을 받아 실제 bounds 계산
   */
  static setActiveViewBounds(safeArea) {
    if (!this.contentWindow) {
      logger.warn("[ViewManager] contentWindow not available; ignoring safe-area");
      return;
    }
    const contentBounds = this.contentWindow.getBounds();
    const { width, height } = contentBounds;
    logger.info("[📐 MAIN] Content Window actual bounds:", {
      x: contentBounds.x,
      y: contentBounds.y,
      width: contentBounds.width,
      height: contentBounds.height
    });
    const bleed = 0;
    this.externalActiveBounds = {
      x: safeArea.left,
      y: safeArea.top,
      width: Math.max(0, width - safeArea.left + bleed),
      height: Math.max(0, height - safeArea.top + bleed)
    };
    logger.debug("[📐 MAIN] Calculated bounds from safe-area (with bleed):", {
      contentWindow: { w: width, h: height },
      safeArea,
      bleed,
      calculatedBounds: this.externalActiveBounds
    });
    this.layout();
  }
  /**
   * 탭 닫기
   *
   * @param tabId - 닫을 탭 ID
   */
  static closeTab(tabId) {
    const tabData = this.tabs.get(tabId);
    if (!tabData) {
      logger.warn("[ViewManager] Tab not found", { tabId });
      return;
    }
    try {
      if (this.contentWindow) {
        this.contentWindow.getContentView().removeChildView(tabData.view);
      }
      tabData.view.webContents.close();
      this.tabs.delete(tabId);
      if (this.activeTabId === tabId) {
        const remainingTabId = Array.from(this.tabs.keys())[0];
        if (remainingTabId) {
          this.switchTab(remainingTabId);
        } else {
          this.activeTabId = null;
        }
      }
      logger.info("[ViewManager] Tab closed", { tabId });
      this.syncToRenderer();
    } catch (error) {
      logger.error("[ViewManager] Tab close failed:", error);
    }
  }
  /**
   * 탭 리스트 반환
   *
   * @returns 모든 탭 메타데이터 (뷰 객체 제외)
   */
  static getTabs() {
    return Array.from(this.tabs.values()).map(({ id, url, title, isActive }) => ({
      id,
      url,
      title,
      isActive
    }));
  }
  /**
   * 활성 탭 ID 반환
   */
  static getActiveTabId() {
    return this.activeTabId;
  }
  /**
   * 현재 활성 탭에서 URL 이동
   * about: 스키마 처리 (React 컴포넌트로 렌더링)
   * 
   * ⚠️ 중요: loadURL()은 비동기이지만, 완료를 기다리지 않는다
   * did-finish-load / did-fail-load 이벤트로 결과를 감지해야 함
   */
  static async navigate(url) {
    if (!this.activeTabId) {
      logger.warn("[ViewManager] No active tab to navigate");
      return;
    }
    const tabData = this.tabs.get(this.activeTabId);
    if (!tabData) {
      logger.warn("[ViewManager] Active tab not found");
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
            logger.info("[ViewManager] Navigating to settings page", { tabId: this.activeTabId });
            this.syncToRenderer();
            return;
          default:
            logger.warn("[ViewManager] Unknown about page:", { page: aboutPage });
            return;
        }
      }
      const loadPromise = tabData.view.webContents.loadURL(url);
      await Promise.race([
        loadPromise,
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("loadURL timeout")), 3e4)
        )
      ]);
      tabData.url = url;
      logger.info("[ViewManager] URL loading started", { tabId: this.activeTabId, url });
      this.syncToRenderer();
    } catch (error) {
      logger.error("[ViewManager] Navigate failed:", { error, url });
      throw error;
    }
  }
  /**
   * 뒤로 가기
   */
  static goBack() {
    if (!this.activeTabId) return;
    const tabData = this.tabs.get(this.activeTabId);
    if (tabData?.view.webContents.navigationHistory.canGoBack()) {
      tabData.view.webContents.navigationHistory.goBack();
      logger.info("[ViewManager] Go back", { tabId: this.activeTabId });
    }
  }
  /**
   * 앞으로 가기
   */
  static goForward() {
    if (!this.activeTabId) return;
    const tabData = this.tabs.get(this.activeTabId);
    if (tabData?.view.webContents.navigationHistory.canGoForward()) {
      tabData.view.webContents.navigationHistory.goForward();
      logger.info("[ViewManager] Go forward", { tabId: this.activeTabId });
    }
  }
  /**
   * 새로고침
   */
  static reload() {
    if (!this.activeTabId) return;
    const tabData = this.tabs.get(this.activeTabId);
    if (tabData) {
      tabData.view.webContents.reload();
      logger.info("[ViewManager] Reload", { tabId: this.activeTabId });
    }
  }
  /**
   * 모든 탭 정리 (앱 종료 시)
   */
  static destroy() {
    logger.info("[ViewManager] Destroying all tabs...");
    for (const [tabId] of this.tabs) {
      try {
        this.closeTab(tabId);
      } catch (error) {
        logger.error("[ViewManager] Error closing tab:", { tabId, error });
      }
    }
    this.tabs.clear();
    this.activeTabId = null;
    this.contentWindow = null;
    this.uiWebContents = null;
    logger.info("[ViewManager] All tabs destroyed");
  }
  /**
   * 활성 탭의 WebContentsView 숨기기
   * Settings 페이지 표시 시 사용
   */
  static hideActiveView() {
    if (!this.activeTabId) return;
    const tabData = this.tabs.get(this.activeTabId);
    if (tabData && this.contentWindow) {
      tabData.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      logger.info("[ViewManager] Active view hidden", { tabId: this.activeTabId });
    }
  }
  /**
   * 활성 탭의 WebContentsView 다시 표시
   * Settings 페이지 닫을 시 사용
   */
  static showActiveView() {
    if (!this.activeTabId) return;
    const tabData = this.tabs.get(this.activeTabId);
    if (tabData) {
      this.layout();
      logger.info("[ViewManager] Active view shown", { tabId: this.activeTabId });
    }
  }
  /**
   * 레이아웃 계산 및 적용
   *
   * React UI 영역 (TabBar + AddressBar)을 제외한 영역에 WebContentsView 배치
   */
  static layout() {
    if (!this.contentWindow) return;
    const { width, height } = this.contentWindow.getBounds();
    const defaultBounds = {
      x: 0,
      y: 0,
      width,
      height: Math.max(0, height)
    };
    const activeBounds = this.externalActiveBounds ?? defaultBounds;
    logger.debug("[MAIN LAYOUT] Applying bounds:", {
      contentWindow: { w: width, h: height },
      externalBounds: this.externalActiveBounds,
      finalBounds: activeBounds,
      usingExternal: !!this.externalActiveBounds
    });
    for (const [, tabData] of this.tabs) {
      if (tabData.isActive) {
        if (tabData.url.startsWith("about:")) {
          tabData.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
          logger.debug("[ViewManager] Layout: hiding WebView for about page", { url: tabData.url });
        } else {
          tabData.view.setBounds(activeBounds);
        }
      } else {
        tabData.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      }
    }
  }
  /**
   * Renderer 프로세스에 탭 상태 동기화
   * 
   * tabs:updated 이벤트를 Main Window의 webContents로 전송
   */
  static syncToRenderer() {
    if (!this.uiWebContents) return;
    const state = {
      tabs: this.getTabs(),
      activeTabId: this.activeTabId
    };
    try {
      this.uiWebContents.send("tabs:updated", state);
      logger.info("[ViewManager] Synced to renderer", { tabCount: state.tabs.length });
    } catch (error) {
      logger.error("[ViewManager] Failed to sync to renderer:", error);
    }
  }
  /**
   * 탭 이벤트 설정
   *
   * @param tabId - 탭 ID
   * @param view - WebContentsView 인스턴스
   */
  static setupTabEvents(tabId, view) {
    view.webContents.on("before-input-event", (_event, input) => {
      try {
        if (!this.uiWebContents) return;
        if (input.type !== "mouseDown" && input.type !== "mouseUp") return;
        const payload = OverlayContentPointerEventSchema.parse({
          kind: input.type,
          timestamp: Date.now()
        });
        this.uiWebContents.send(IPC_CHANNELS.OVERLAY.CONTENT_POINTER, payload);
      } catch {
      }
    });
    view.webContents.on("page-title-updated", (_event, title) => {
      const tabData = this.tabs.get(tabId);
      if (tabData) {
        tabData.title = title;
        logger.info("[ViewManager] Tab title updated", { tabId, title });
        this.syncToRenderer();
      }
    });
    view.webContents.on("did-navigate", (_event, url) => {
      const tabData = this.tabs.get(tabId);
      if (tabData) {
        tabData.url = url;
        logger.info("[ViewManager] Tab URL changed", { tabId, url });
        this.syncToRenderer();
        if (this.uiWebContents && tabData.isActive) {
          this.uiWebContents.send("view:navigated", {
            url,
            canGoBack: view.webContents.navigationHistory.canGoBack(),
            canGoForward: view.webContents.navigationHistory.canGoForward(),
            timestamp: Date.now()
          });
        }
      }
    });
    view.webContents.on("did-navigate-in-page", (_event, url) => {
      const tabData = this.tabs.get(tabId);
      if (tabData) {
        tabData.url = url;
        this.syncToRenderer();
        if (this.uiWebContents && tabData.isActive) {
          this.uiWebContents.send("view:navigated", {
            url,
            canGoBack: view.webContents.navigationHistory.canGoBack(),
            canGoForward: view.webContents.navigationHistory.canGoForward(),
            timestamp: Date.now()
          });
        }
      }
    });
    view.webContents.on("did-finish-load", () => {
      const tabData = this.tabs.get(tabId);
      if (!tabData) return;
      if (this.uiWebContents && tabData.isActive) {
        this.uiWebContents.send("view:loaded", {
          url: view.webContents.getURL(),
          timestamp: Date.now()
        });
      }
    });
    logger.info("[ViewManager] Tab event listeners attached", { tabId });
  }
  /**
   * UI WebContents가 항상 최상위(마지막 인덱스)에 오도록 보장
   * - UI View의 배경이 투명(#00000000)하므로 Web Content를 가리지 않음
   * - UI 요소(헤더, 사이드바)만 Web Content 위에 overlay됨
   */
  /**
   * UI View를 최상단(Z-Order top)으로 이동
   */
  static ensureUITopmost() {
    if (!this.contentWindow || !this.uiWebContents || this.lastReorderTarget === "ui") return;
    try {
      const contentView = this.contentWindow.getContentView();
      const uiId = this.uiWebContents.id;
      const uiView = contentView.children.find((child) => {
        const maybe = child;
        return maybe.webContents?.id === uiId;
      });
      if (uiView) {
        contentView.addChildView(uiView);
        this.lastReorderTarget = "ui";
      }
    } catch (error) {
      logger.error("[ViewManager] Failed to reorder UI view", error);
    }
  }
  /**
   * Content View(웹탭)를 최상단으로 이동하여 클릭 가능하게 함
   */
  static ensureContentTopmost() {
    if (!this.contentWindow || !this.activeTabId || this.lastReorderTarget === "content") return;
    try {
      const tabData = this.tabs.get(this.activeTabId);
      if (!tabData) return;
      const contentView = this.contentWindow.getContentView();
      contentView.addChildView(tabData.view);
      this.lastReorderTarget = "content";
    } catch (error) {
      logger.error("[ViewManager] Failed to reorder content view", error);
    }
  }
  static dumpContentViewTree(reason) {
    if (!this.contentWindow) return;
    try {
      const contentView = this.contentWindow.getContentView();
      const uiId = this.uiWebContents?.id;
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
      logger.info("[ViewManager] ContentView tree", {
        reason,
        windowId: this.contentWindow.id,
        uiWebContentsId: uiId ?? null,
        childCount: children.length,
        children
      });
    } catch (error) {
      logger.error("[ViewManager] Failed to dump content view tree", error);
    }
  }
}
const TRACKING_INTERVAL_MS = 16;
const MAX_METRICS_AGE_MS = 1e4;
const STATE_UPDATE_THROTTLE_MS = 16;
const WINDOW_ADJUST_THROTTLE_MS = 80;
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
    if (!Number.isFinite(metrics.dpr) || metrics.dpr <= 0 || !Number.isFinite(metrics.timestamp)) {
      logger.warn("[OverlayController] Invalid dpr or timestamp, skipping");
      return;
    }
    const current = this.hoverMetrics;
    if (!current) {
      this.hoverMetrics = { ...metrics, timestamp: metrics.timestamp || Date.now() };
      logger.info("[OverlayController] Initial metrics received");
      return;
    }
    if (metrics.sidebarRightPx !== void 0 && Number.isFinite(metrics.sidebarRightPx)) {
      current.sidebarRightPx = Math.max(0, metrics.sidebarRightPx);
    }
    if (metrics.headerBottomPx !== void 0 && Number.isFinite(metrics.headerBottomPx)) {
      current.headerBottomPx = Math.max(0, metrics.headerBottomPx);
    }
    if (metrics.titlebarHeightPx !== void 0 && Number.isFinite(metrics.titlebarHeightPx)) {
      current.titlebarHeightPx = Math.max(0, metrics.titlebarHeightPx);
    }
    current.dpr = metrics.dpr;
    current.timestamp = metrics.timestamp || Date.now();
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
    this.startGlobalMouseTracking();
    this.setupKeyboardShortcuts();
    logger.info("[OverlayController] Attached (Arc/Zen style)");
  }
  static dispose() {
    this.stopGlobalMouseTracking();
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
      overlayStore.getState().setFocused(focused);
      try {
        const target = this.uiWebContents ?? uiWindow.webContents;
        target.send("window:focus-changed", focused);
      } catch {
      }
      if (!focused) {
        this.closeNonLatchedOverlays();
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
    this.hoverTrackingTimer = setInterval(() => this.trackMouseAndUpdateState(), TRACKING_INTERVAL_MS);
    this.cleanupFns.push(() => this.stopGlobalMouseTracking());
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
      this.closeNonLatchedOverlays();
      return;
    }
    const relativeX = Math.max(0, Math.floor(mouseX - bounds.x));
    const relativeY = Math.max(0, Math.floor(mouseY - bounds.y));
    const { headerLatched, sidebarLatched } = overlayStore.getState();
    const metrics = this.hoverMetrics;
    const EDGE_THRESHOLD = 3;
    const sidebarWidth = metrics?.sidebarRightPx ?? 288;
    const headerHeight = metrics?.headerBottomPx ?? 56;
    let shouldOpenSidebar = false;
    let shouldCloseSidebar = false;
    if (!sidebarLatched) {
      if (relativeX <= EDGE_THRESHOLD) {
        shouldOpenSidebar = true;
      }
      if (this.currentState.sidebarOpen && relativeX > sidebarWidth) {
        shouldCloseSidebar = true;
      }
    }
    let shouldOpenHeader = false;
    let shouldCloseHeader = false;
    if (!headerLatched) {
      if (relativeY <= EDGE_THRESHOLD) {
        shouldOpenHeader = true;
      }
      if (this.currentState.headerOpen && relativeY > headerHeight) {
        shouldCloseHeader = true;
      }
    }
    if (shouldOpenSidebar && shouldOpenHeader) {
      shouldOpenSidebar = false;
    }
    const finalSidebarOpen = sidebarLatched || (shouldOpenSidebar || this.currentState.sidebarOpen && !shouldCloseSidebar);
    const finalHeaderOpen = headerLatched || (shouldOpenHeader || this.currentState.headerOpen && !shouldCloseHeader);
    if (Math.random() < 0.02) {
      logger.debug("[OverlayController] State Debug", {
        mouse: { screenX: mouseX, screenY: mouseY, relativeX, relativeY },
        bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        dimensions: {
          sidebarWidth,
          headerHeight,
          edgeThreshold: EDGE_THRESHOLD
        },
        triggers: {
          shouldOpenSidebar,
          shouldCloseSidebar,
          shouldOpenHeader,
          shouldCloseHeader
        },
        state: { headerOpen: finalHeaderOpen, sidebarOpen: finalSidebarOpen }
      });
    }
    const mouseInSidebar = finalSidebarOpen && relativeX <= sidebarWidth;
    const mouseInHeader = finalHeaderOpen && relativeY <= headerHeight;
    if (mouseInSidebar || mouseInHeader) {
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
  static uiOverlayView = null;
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
          sandbox: Env.isDev ? false : true
        },
        show: false
      };
      this.uiWindow = new BrowserWindow(uiWindowOptions);
      this.contentWindow = this.uiWindow;
      this.uiOverlayView = new WebContentsView({
        webPreferences: {
          preload: join(__dirname, "../preload/index.cjs"),
          contextIsolation: true,
          sandbox: Env.isDev ? false : true,
          nodeIntegration: false,
          webSecurity: true
        }
      });
      this.uiOverlayView.setBackgroundColor("#00000000");
      logger.info("[MainWindow] Windows created", {
        width,
        height,
        platform: process.platform
      });
      try {
        const root = this.uiWindow.getContentView();
        root.addChildView(this.uiOverlayView);
        this.uiOverlayView.setBounds({ x: 0, y: 0, width, height });
      } catch (error) {
        logger.error("[MainWindow] Failed to attach uiOverlayView", error);
        throw error;
      }
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
            uiWebContents: this.uiOverlayView?.webContents ?? void 0
          });
          didShow = true;
          logger.info("[MainWindow] Main window shown (single-window)");
        } catch (error) {
          logger.error("[MainWindow] Failed to show windows:", error);
        }
      };
      this.uiWindow.once("ready-to-show", showMain);
      await this.uiWindow.loadURL("about:blank");
      const startUrl = this.getStartUrl();
      await this.uiOverlayView.webContents.loadURL(startUrl);
      logger.info("[MainWindow] UI URL loaded (overlay view)", { url: startUrl });
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
        this.uiOverlayView.webContents.openDevTools({ mode: "detach" });
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
  static getUiOverlayWebContents() {
    return this.uiOverlayView?.webContents ?? null;
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
    try {
      this.uiOverlayView?.webContents?.removeAllListeners();
    } catch {
    }
    this.uiOverlayView = null;
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
      try {
        this.uiOverlayView?.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
      } catch {
      }
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
  static async pathExists(path) {
    try {
      await promises.access(path);
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
      logger.info("Step 5/8: Initializing ViewManager");
      const mainWindow = await MainWindow.create();
      const uiWebContents = MainWindow.getUiOverlayWebContents();
      if (!uiWebContents) {
        throw new Error("[AppLifecycle] UI overlay webContents not available");
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
      if (Env.isDev) {
        defaultSession.webRequest.onHeadersReceived((details, callback) => {
          const isViteDev = details.url.startsWith("http://localhost:5173/");
          if (!isViteDev) {
            callback({});
            return;
          }
          const responseHeaders = details.responseHeaders ?? {};
          responseHeaders["Cache-Control"] = ["no-store"];
          delete responseHeaders["ETag"];
          delete responseHeaders["etag"];
          callback({ responseHeaders });
        });
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
      logger.info("[TabHandler] tab:list requested");
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
  logger.info("[TabHandler] Handlers setup completed");
}
const DEFAULT_SETTINGS = {
  theme: "dark",
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
  blockAds: false
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
        if (!["small", "medium", "large"].includes(value)) {
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
  logger.info("[SettingsHandler] IPC handlers registered successfully");
}
function setupViewHandlers(registry2) {
  logger.info("[ViewHandler] Setting up handlers...");
  registry2.on(IPC_CHANNELS.VIEW.RESIZE, (_event, bounds) => {
    try {
      logger.info("[ViewHandler] 📥 Received VIEW.RESIZE from renderer:", { ...bounds });
      const parsed = ViewResizeSchema.safeParse(bounds);
      if (!parsed.success) {
        logger.warn("[ViewHandler] VIEW.RESIZE validation failed:", { error: parsed.error });
        return;
      }
      logger.info("[ViewHandler] Calling ViewManager.setActiveViewBounds");
      ViewManager.setActiveViewBounds(bounds);
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
        contents.send("navigate-to-settings");
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
