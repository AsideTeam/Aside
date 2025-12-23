import { ipcMain, type IpcMainInvokeEvent } from 'electron'

type IpcMainHandleSignature = Parameters<typeof ipcMain.handle>[1]
type IpcMainOnSignature = Parameters<typeof ipcMain.on>[1]

/**
 * ipcMain 등록을 추적해 종료 시 깔끔히 해제하는 레지스트리.
 * - 실무에서 흔한 문제(핸들러 중복 등록, 리스너 누수)를 방지
 * - removeAllListeners() 같은 전역 제거를 피함
 */
export class IpcRegistry {
  private handledChannels = new Set<string>()
  private onListeners = new Map<string, Set<IpcMainOnSignature>>()

  handle<TArgs extends unknown[], TResult>(
    channel: string,
    handler: (event: IpcMainInvokeEvent, ...args: TArgs) => TResult | Promise<TResult>
  ): void {
    ipcMain.handle(channel, handler as unknown as IpcMainHandleSignature)
    this.handledChannels.add(channel)
  }

  on<TArgs extends unknown[]>(
    channel: string,
    listener: (event: Electron.IpcMainEvent, ...args: TArgs) => void
  ): void {
    ipcMain.on(channel, listener as unknown as IpcMainOnSignature)
    const set = this.onListeners.get(channel) ?? new Set<IpcMainOnSignature>()
    set.add(listener)
    this.onListeners.set(channel, set)
  }

  dispose(): void {
    for (const channel of this.handledChannels) {
      try {
        ipcMain.removeHandler(channel)
      } catch {
        // ignore
      }
    }
    this.handledChannels.clear()

    for (const [channel, listeners] of this.onListeners.entries()) {
      for (const listener of listeners) {
        try {
          ipcMain.removeListener(channel, listener)
        } catch {
          // ignore
        }
      }
    }
    this.onListeners.clear()
  }
}
