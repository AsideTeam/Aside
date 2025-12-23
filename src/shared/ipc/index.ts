/**
 * IPC Module - Main ↔ Renderer 통신 규약
 *
 * [Barrel File Pattern]
 * 책임: shared/ipc 모듈의 모든 export를 취합
 *
 * Main/Renderer에서 import하는 곳:
 *   import { IPC_CHANNELS } from '@shared/ipc/channels';
 *   import type { TabCreateRequest, IpcResponse } from '@shared/ipc/payloads';
 *
 * 또는 Barrel 사용:
 *   import { IPC_CHANNELS, type TabCreateRequest } from '@shared/ipc';
 *
 * 철학:
 * - 채널명은 channels.ts에서 관리
 * - 데이터 타입은 payloads.ts에서 관리
 * - shared는 인터페이스만 제공 (구현은 Main/Renderer에서)
 */

export * from './channels'
export * from './payloads'
