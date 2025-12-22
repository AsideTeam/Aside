import { app, screen, BrowserWindow, WebContentsView, session, ipcMain } from "electron";
import { existsSync, mkdirSync, appendFileSync, promises } from "node:fs";
import { join, dirname } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { z } from "zod";
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
class MainWindow {
  static window = null;
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
    if (this.window) {
      logger.warn("[MainWindow] Window already exists. Returning existing instance.");
      return this.window;
    }
    if (this.isCreating) {
      throw new Error("[MainWindow] Window creation already in progress");
    }
    this.isCreating = true;
    try {
      logger.info("[MainWindow] Creating main window...");
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      this.window = new BrowserWindow({
        width,
        height,
        minWidth: 800,
        minHeight: 600,
        // 네이티브 타이틀바 사용 (macOS 신호등 버튼)
        // titleBarStyle: 'hiddenInset',
        // trafficLightPosition: { x: 12, y: 12 },
        titleBarStyle: "default",
        // preload 스크립트 (IPC 통신용)
        webPreferences: {
          preload: join(__dirname, "../preload/index.cjs"),
          contextIsolation: true,
          // 보안: 메인 ↔ 렌더러 격리
          sandbox: true
          // 렌더러 프로세스 샌드박스
        },
        // 창 로드 전 숨김 (깜빡임 방지)
        show: false,
        // 배경색 (깜빡임 방지)
        backgroundColor: "#1a1a1a"
      });
      logger.info("[MainWindow] BrowserWindow instance created", {
        width,
        height
      });
      this.setupWindowEvents();
      const startUrl = this.getStartUrl();
      await this.window.loadURL(startUrl);
      logger.info("[MainWindow] URL loaded", { url: startUrl });
      this.window.show();
      logger.info("[MainWindow] Window shown");
      if (Env.isDev) {
        this.window.webContents.openDevTools({ mode: "detach" });
        logger.info("[MainWindow] DevTools opened (dev mode, detached)");
      }
      return this.window;
    } catch (error) {
      logger.error("[MainWindow] Creation failed:", error);
      this.window = null;
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
    return this.window;
  }
  /**
   * MainWindow 파괴
   *
   * 명시적으로 호출하지 말 것 (창 닫기 → 자동 정리)
   * - 이벤트 리스너 정리
   * - 메모리 해제
   */
  static destroy() {
    if (this.window) {
      this.window.removeAllListeners();
      if (this.window.webContents) {
        this.window.webContents.removeAllListeners();
      }
      this.window.destroy();
      this.window = null;
      logger.info("[MainWindow] Window destroyed and cleaned up");
    }
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
   * - closed: 창 닫힐 때 인스턴스 정리
   * - closed → app 종료 (단일 창 기반)
   */
  static setupWindowEvents() {
    if (!this.window) return;
    this.window.on("closed", () => {
      this.window = null;
      logger.info("[MainWindow] Closed event received");
      if (process.platform !== "darwin") {
        app.quit();
      }
    });
    this.window.webContents.on("before-input-event", (event) => {
    });
    logger.info("[MainWindow] Event listeners attached");
  }
}
const LAYOUT = {
  TOOLBAR_HEIGHT: 92
};
class ViewManager {
  static tabs = /* @__PURE__ */ new Map();
  static activeTabId = null;
  static mainWindow = null;
  static isInitializing = false;
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
  static async initialize(window) {
    if (this.mainWindow) {
      logger.warn("[ViewManager] Already initialized. Skipping.");
      return;
    }
    if (this.isInitializing) {
      throw new Error("[ViewManager] Initialization already in progress");
    }
    this.isInitializing = true;
    try {
      logger.info("[ViewManager] Initializing...");
      this.mainWindow = window;
      this.mainWindow.on("resize", () => {
        this.layout();
      });
      const homeTabId = await this.createTab("https://www.google.com");
      logger.info("[ViewManager] Home tab created", { tabId: homeTabId });
      this.layout();
      logger.info("[ViewManager] Layout applied");
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
    if (!this.mainWindow) {
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
      const tabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const tabData = {
        id: tabId,
        view,
        url,
        title: "New Tab",
        isActive: false
      };
      this.tabs.set(tabId, tabData);
      this.mainWindow.contentView.addChildView(view);
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
      if (this.mainWindow) {
        this.mainWindow.contentView.removeChildView(tabData.view);
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
      await tabData.view.webContents.loadURL(url);
      tabData.url = url;
      logger.info("[ViewManager] Navigated", { tabId: this.activeTabId, url });
    } catch (error) {
      logger.error("[ViewManager] Navigate failed:", error);
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
    this.mainWindow = null;
    logger.info("[ViewManager] All tabs destroyed");
  }
  /**
   * 레이아웃 계산 및 적용
   *
   * React UI 영역 (TabBar + AddressBar)을 제외한 영역에 WebContentsView 배치
   */
  static layout() {
    if (!this.mainWindow) return;
    const { width, height } = this.mainWindow.getBounds();
    const toolbarHeight = LAYOUT.TOOLBAR_HEIGHT;
    const contentY = toolbarHeight;
    const contentHeight = height - toolbarHeight;
    for (const [, tabData] of this.tabs) {
      if (tabData.isActive) {
        tabData.view.setBounds({
          x: 0,
          y: contentY,
          width,
          height: Math.max(0, contentHeight)
        });
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
    if (!this.mainWindow) return;
    const state = {
      tabs: this.getTabs(),
      activeTabId: this.activeTabId
    };
    try {
      this.mainWindow.webContents.send("tabs:updated", state);
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
      }
    });
    view.webContents.on("did-navigate-in-page", (_event, url) => {
      const tabData = this.tabs.get(tabId);
      if (tabData) {
        tabData.url = url;
        this.syncToRenderer();
      }
    });
    logger.info("[ViewManager] Tab event listeners attached", { tabId });
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
      await ViewManager.initialize(mainWindow);
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
function setupAppHandlers() {
  logger.info("[AppHandler] Setting up handlers...");
  ipcMain.handle("app:quit", async () => {
    try {
      logger.info("[AppHandler] app:quit requested");
      app.quit();
      return { success: true };
    } catch (error) {
      logger.error("[AppHandler] app:quit failed:", error);
      return { success: false, error: String(error) };
    }
  });
  ipcMain.handle("app:restart", async () => {
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
  ipcMain.handle("window:minimize", async () => {
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
  ipcMain.handle("window:maximize", async () => {
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
  ipcMain.handle("window:close", async () => {
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
  ipcMain.handle("app:state", async () => {
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
  logger.info("[AppHandler] Handlers setup completed");
}
z.object({});
z.object({});
z.object({});
z.object({});
z.object({});
z.object({});
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
function setupTabHandlers() {
  logger.info("[TabHandler] Setting up handlers...");
  ipcMain.handle("tab:create", async (_event, input) => {
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
  ipcMain.handle("tab:close", async (_event, input) => {
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
  ipcMain.handle("tab:switch", async (_event, input) => {
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
  ipcMain.handle("tab:list", async () => {
    try {
      logger.info("[TabHandler] tab:list requested");
      const tabs = ViewManager.getTabs();
      return { success: true, tabs };
    } catch (error) {
      logger.error("[TabHandler] tab:list failed:", error);
      return { success: false, error: String(error) };
    }
  });
  ipcMain.handle("tab:active", async () => {
    try {
      logger.info("[TabHandler] tab:active requested");
      const tabId = ViewManager.getActiveTabId();
      return { success: true, tabId };
    } catch (error) {
      logger.error("[TabHandler] tab:active failed:", error);
      return { success: false, error: String(error) };
    }
  });
  ipcMain.handle("tab:navigate", async (_event, input) => {
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
  ipcMain.handle("tab:back", async () => {
    try {
      logger.info("[TabHandler] tab:back requested");
      ViewManager.goBack();
      return { success: true };
    } catch (error) {
      logger.error("[TabHandler] tab:back failed:", error);
      return { success: false, error: String(error) };
    }
  });
  ipcMain.handle("tab:forward", async () => {
    try {
      logger.info("[TabHandler] tab:forward requested");
      ViewManager.goForward();
      return { success: true };
    } catch (error) {
      logger.error("[TabHandler] tab:forward failed:", error);
      return { success: false, error: String(error) };
    }
  });
  ipcMain.handle("tab:reload", async () => {
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
function setupIPCHandlers() {
  logger.info("[IPC] Setting up all handlers...");
  try {
    setupAppHandlers();
    logger.info("[IPC] App handlers registered");
    setupTabHandlers();
    logger.info("[IPC] Tab handlers registered");
    logger.info("[IPC] All handlers setup completed");
  } catch (error) {
    logger.error("[IPC] Handler setup failed:", error);
    throw error;
  }
}
function removeAllIPCHandlers() {
  logger.info("[IPC] Removing all handlers...");
  try {
    ipcMain.removeAllListeners();
    logger.info("[IPC] All handlers removed");
  } catch (error) {
    logger.error("[IPC] Handler removal failed:", error);
  }
}
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  logger.warn("[Main] App already running. Exiting.");
  app.quit();
} else {
  app.on("ready", async () => {
    logger.info("[Main] App ready event triggered");
    try {
      logger.info("[Main] Step 1/4: Setting up session...");
      SessionManager.setup();
      logger.info("[Main] Step 2/4: Setting up IPC handlers...");
      setupIPCHandlers();
      logger.info("[Main] Step 3/4: Initializing services...");
      UpdateService.initialize();
      logger.info("[Main] Step 4/4: Bootstrapping application...");
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
