/**
 * 에러 정의 (Shared Error Types)
 */

export class AsideError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'AsideError'
    Object.setPrototypeOf(this, AsideError.prototype)
  }
}

export const ErrorCodes = {
  // Lifecycle
  BOOTSTRAP_FAILED: 'BOOTSTRAP_FAILED',
  SHUTDOWN_FAILED: 'SHUTDOWN_FAILED',
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',

  // View
  VIEW_CREATION_FAILED: 'VIEW_CREATION_FAILED',
  VIEW_NOT_FOUND: 'VIEW_NOT_FOUND',

  // IPC
  IPC_CHANNEL_NOT_FOUND: 'IPC_CHANNEL_NOT_FOUND',

  // DB
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
}
