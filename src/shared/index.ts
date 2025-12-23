/**
 * Shared Module - Main & Renderer 공용 계약서 & 도구함
 *
 * [프로젝트 아키텍처의 핵심]
 * 이 폴더는 Main Process와 Renderer Process가 함께 사용하는 공용 공간입니다.
 * - "계약서": IPC 채널, 데이터 타입, 에러 정의
 * - "도구함": 날짜 포맷팅, ID 생성, URL 검증 등 순수 함수
 *
 * [SRP(단일 책임 원칙) 준수]
 * - 각 파일/폴더가 하나의 책임만 가짐
 * - logger: 인터페이스만 (구현은 각 프로세스에서)
 * - ipc: 채널명과 데이터 타입만 (구현은 handlers에서)
 * - utils: 순수 함수만 (side effect 없음)
 *
 * [Barrel File Pattern]
 * - index.ts는 export만 담당
 * - 모듈 구조를 숨기고 공개 API만 노출
 *
 * ===== 사용 예 =====
 * import { ILogger, LogLevel } from '@shared/logger';
 *
 * import { IPC_CHANNELS, type TabCreateRequest } from '@shared/ipc';
 *
 * import type { History, Bookmark } from '@shared/types';
 * import { AsideError } from '@shared/types';
 *
 * import { APP_NAME, LAYOUT, TIMEOUTS } from '@shared/constants';
 *
 * import { formatDate, generateId, isValidUrl } from '@shared/utils';
 *
 * ===== 폴더 구조 =====
 *
 * src/shared/
 * ├── constants/         # 앱 전체 상수 (APP_NAME, LAYOUT, TIMEOUTS)
 * ├── ipc/               # 통신 규약 (채널명, 페이로드 타입)
 * ├── logger/            # 로거 인터페이스 (구현은 각 프로세스에서)
 * ├── types/             # 도메인 타입 (History, Common, Errors)
 * ├── utils/             # 순수 유틸 함수 (날짜, ID, URL)
 * └── index.ts           # 이 파일
 *
 * ===== 설계 철학 =====
 *
 * Q: Main/Renderer이 같은 타입을 쓰면 안 되나?
 * A: 좋아요, 하지만 구현은 각자 다릅니다.
 *    - ILogger 타입 @shared (계약서)
 *    - Logger 구현 @main/utils (Main 전용)
 *    - Logger 구현 @renderer/lib (Renderer 전용)
 *
 * Q: IPC 페이로드도 여기에?
 * A: 네, 반드시입니다. Main과 Renderer 모두가 같은 형식을 따라야
 *    타입 에러가 없습니다. 이것이 "계약서" 역할입니다.
 *
 * Q: 비즈니스 로직이 커지면?
 * A: src/shared에 추가하지 마세요.
 *    - 서비스는 @main/services, @renderer/lib에서
 *    - 컴포넌트는 @renderer/components에서
 *    - shared는 "계약서"만 유지하세요.
 */

// ===== Logger (인터페이스 & 레벨)
export * from './logger'

// ===== IPC (채널 & 페이로드)
export * from './ipc'

// ===== Types (도메인 타입 & 유틸 타입)
export * from './types'

// ===== Constants (앱 상수)
export * from './constants'

// ===== Utils (순수 함수)
export * from './utils'
