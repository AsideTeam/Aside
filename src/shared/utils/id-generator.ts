/**
 * ID Generator - 고유 ID 생성 유틸
 *
 * 책임: ID 생성 함수들만 존재
 * - UUID, Nanoid, 타임스탬프 기반 ID 등
 *
 * 사용 예:
 *   import { generateId, generateShortId } from '@shared/utils/id-generator';
 *   const tabId = generateId(); // 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
 *   const shortId = generateShortId(); // 'abc123xyz'
 *
 * [중요] Web Crypto API 필요
 * - Node.js 15+ (Main Process)
 * - 모든 모던 브라우저 (Renderer)
 */

/**
 * UUID v4 생성
 *
 * Universally Unique Identifier를 생성합니다.
 * 네트워크를 통해 안전하게 식별자를 전송할 때 사용.
 *
 * @returns UUID v4 문자열 (예: "f47ac10b-58cc-4372-a567-0e02b2c3d479")
 *
 * 예:
 *   const tabId = generateId();
 *   // "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *
 * 장점:
 * - 고유성 보장 (충돌 가능성 극히 낮음)
 * - 표준 형식 (많은 도구/DB에서 지원)
 * - 길이가 고정 (36자)
 *
 * 단점:
 * - 길어서 DB 저장 시 공간 많이 필요
 * - 읽기 어려움
 */
export function generateId(): string {
  // Crypto API 사용 (Node.js 15+, 모던 브라우저)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback: 수동 UUID 생성 (Polyfill)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 짧은 난수 ID 생성 (12자)
 *
 * 사람이 읽기 쉬운 짧은 ID.
 * 디버깅/로그에서 사용하기 좋음.
 *
 * @returns 12자 알파벳/숫자 문자열 (예: "a4c7e9f2b1d6")
 *
 * 예:
 *   const shortId = generateShortId();
 *   // "a4c7e9f2b1d6"
 *
 * 장점:
 * - 짧고 읽기 쉬움
 * - 디버깅 로그에 좋음
 *
 * 단점:
 * - 충돌 가능성이 UUID보다 높음 (대규모 앱에서는 주의)
 * - 고유성 보장이 약함
 */
export function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  // Crypto API 사용 가능 시
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomBytes = new Uint8Array(12)
    crypto.getRandomValues(randomBytes)

    for (let i = 0; i < 12; i++) {
      result += chars[randomBytes[i] % chars.length]
    }
  } else {
    // Fallback: Math.random()
    for (let i = 0; i < 12; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
  }

  return result
}

/**
 * 타임스탬프 기반 ID 생성
 *
 * 현재 시간을 기반으로 ID 생성.
 * ID가 시간 순서대로 정렬되므로 데이터베이스 인덱싱에 유리.
 *
 * @returns 타임스탬프 + 난수 (예: "1702998645123-a4c7e9")
 *
 * 예:
 *   const orderedId = generateOrderedId();
 *   // "1702998645123-a4c7e9"
 *
 * 장점:
 * - 시간순으로 정렬됨
 * - DB 인덱싱에 유리
 * - 생성 시간을 ID에서 추출 가능
 *
 * 단점:
 * - 길음
 * - 예측 가능성 (보안이 중요한 곳에는 부적절)
 */
export function generateOrderedId(): string {
  const timestamp = Date.now()
  const randomPart = generateShortId().slice(0, 6)
  return `${timestamp}-${randomPart}`
}

/**
 * 숫자 기반 ID (증분 ID)
 *
 * 시작값부터 증분하는 ID.
 * 로컬 세션용 임시 ID에만 사용 (서버 저장 ID로는 부적절).
 *
 * @param seed - 시작값 (기본값: 1)
 * @returns 숫자 ID 생성 함수
 *
 * 예:
 *   const idGenerator = createNumericIdGenerator(1000);
 *   idGenerator(); // 1000
 *   idGenerator(); // 1001
 *   idGenerator(); // 1002
 *
 * 사용 사례:
 * - 탭 ID (로컬 세션 중만 유효)
 * - 임시 작업 ID
 * - 렌더링 키 (React key 속성)
 *
 * 주의:
 * - 페이지 새로고침 후 리셋됨
 * - 다중 탭에서 중복 가능
 * - 프로덕션 DB 저장용 부적절
 */
export function createNumericIdGenerator(seed: number = 0): () => number {
  let counter = seed
  return () => ++counter
}

/**
 * 문자열 기반 고유 ID 풀
 *
 * 특정 접두사(prefix)를 가진 고유 ID를 생성.
 * 타입 안전성과 가독성을 동시에 제공.
 *
 * @param prefix - ID 접두사 (예: 'tab_', 'bookmark_')
 * @returns 접두사가 붙은 고유 ID
 *
 * 예:
 *   const tabId = generatePrefixedId('tab_');
 *   // "tab_f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *
 *   const bookmarkId = generatePrefixedId('bookmark_');
 *   // "bookmark_a4c7e9f2b1d6"
 *
 * 장점:
 * - ID 타입을 문자열로 구분 가능
 * - 로그에서 가독성 좋음
 * - 문자열 검색으로 필터링 가능
 *
 * 사용 사례:
 * - 탭 ID: 'tab_' + UUID
 * - 북마크 ID: 'bookmark_' + UUID
 * - 히스토리 ID: 'history_' + UUID
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}${generateId()}`
}
