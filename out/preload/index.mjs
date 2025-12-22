import require$$0 from "electron";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var preload = {};
var hasRequiredPreload;
function requirePreload() {
  if (hasRequiredPreload) return preload;
  hasRequiredPreload = 1;
  const { contextBridge, ipcRenderer } = require$$0;
  const electronAPI = {
    // ===== App Control =====
    app: {
      quit: () => ipcRenderer.invoke("app:quit"),
      restart: () => ipcRenderer.invoke("app:restart"),
      getState: () => ipcRenderer.invoke("app:state")
    },
    // ===== Window Control =====
    window: {
      minimize: () => ipcRenderer.invoke("window:minimize"),
      maximize: () => ipcRenderer.invoke("window:maximize"),
      close: () => ipcRenderer.invoke("window:close")
    },
    // ===== Tab Management =====
    tab: {
      create: (url) => ipcRenderer.invoke("tab:create", { url }),
      close: (tabId) => ipcRenderer.invoke("tab:close", { tabId }),
      switch: (tabId) => ipcRenderer.invoke("tab:switch", { tabId }),
      list: () => ipcRenderer.invoke("tab:list"),
      getActive: () => ipcRenderer.invoke("tab:active")
    },
    // ===== Utility Functions =====
    /**
     * IPC 채널에 직접 invoke (유연성)
     * @param {string} channel - IPC 채널명
     * @param {...any} args - 인자들
     * @returns {Promise<any>}
     */
    invoke: (channel, ...args) => {
      const allowedChannels = [
        "app:quit",
        "app:restart",
        "app:state",
        "window:minimize",
        "window:maximize",
        "window:close",
        "tab:create",
        "tab:close",
        "tab:switch",
        "tab:list",
        "tab:active"
      ];
      if (!allowedChannels.includes(channel)) {
        return Promise.reject(new Error(`Channel '${channel}' is not allowed`));
      }
      return ipcRenderer.invoke(channel, ...args);
    }
  };
  try {
    contextBridge.exposeInMainWorld("electronAPI", electronAPI);
    console.log("[Preload] ElectronAPI exposed to renderer");
  } catch (error) {
    console.error("[Preload] Failed to expose ElectronAPI:", error);
  }
  return preload;
}
var preloadExports = requirePreload();
const index = /* @__PURE__ */ getDefaultExportFromCjs(preloadExports);
export {
  index as default
};
