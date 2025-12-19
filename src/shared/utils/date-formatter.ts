/**
 * Date Formatter - 날짜/시간 포맷팅 유틸
 *
 * 책임: 날짜를 사람이 읽기 쉬운 형식으로 변환하는 함수들만 존재
 *
 * 사용 예:
 *   import { formatDate, formatTime, formatRelativeTime } from '@shared/utils/date-formatter';
 *   formatDate(new Date()); // "2025-12-19"
 *   formatTime(new Date()); // "16:30:45"
 *   formatRelativeTime(new Date(Date.now() - 60000)); // "1분 전"
 */

/**
 * 날짜를 'YYYY-MM-DD' 형식으로 포맷
 *
 * @param date - 포맷할 Date 객체
 * @returns 포맷된 날짜 문자열 (예: "2025-12-19")
 *
 * 예:
 *   formatDate(new Date('2025-12-19')) // "2025-12-19"
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 날짜를 'HH:MM:SS' 형식으로 포맷
 *
 * @param date - 포맷할 Date 객체
 * @returns 포맷된 시간 문자열 (예: "16:30:45")
 *
 * 예:
 *   formatTime(new Date('2025-12-19T16:30:45')) // "16:30:45"
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * 날짜를 'YYYY-MM-DD HH:MM:SS' 형식으로 포맷
 *
 * @param date - 포맷할 Date 객체
 * @returns 포맷된 날짜/시간 문자열
 *
 * 예:
 *   formatDateTime(new Date('2025-12-19T16:30:45'))
 *   // "2025-12-19 16:30:45"
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

/**
 * 상대적 시간 표현 (예: "2분 전", "3시간 전")
 *
 * @param date - 기준 Date 객체
 * @param baseDate - 현재 시간 (기본값: 현재)
 * @returns 상대적 시간 표현
 *
 * 예:
 *   const pastDate = new Date(Date.now() - 60000); // 1분 전
 *   formatRelativeTime(pastDate) // "1분 전"
 *
 *   formatRelativeTime(new Date(Date.now() - 3600000)) // "1시간 전"
 *
 *   formatRelativeTime(new Date(Date.now() + 60000)) // "1분 후"
 */
export function formatRelativeTime(date: Date, baseDate: Date = new Date()): string {
  const diffMs = baseDate.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (Math.abs(diffSec) < 60) {
    return diffSec >= 0 ? '방금 전' : '방금 후'
  }

  if (Math.abs(diffMin) < 60) {
    return diffMin >= 0 ? `${diffMin}분 전` : `${-diffMin}분 후`
  }

  if (Math.abs(diffHour) < 24) {
    return diffHour >= 0 ? `${diffHour}시간 전` : `${-diffHour}시간 후`
  }

  if (Math.abs(diffDay) < 30) {
    return diffDay >= 0 ? `${diffDay}일 전` : `${-diffDay}일 후`
  }

  // 1개월 이상 차이나면 정확한 날짜 표시
  return formatDate(date)
}

/**
 * 현지화된 날짜 문자열 (브라우저 로케일 기준)
 *
 * @param date - 포맷할 Date 객체
 * @param locale - 로케일 코드 (기본값: 'ko-KR')
 * @returns 로케일별 포맷된 날짜
 *
 * 예:
 *   formatLocaleDate(new Date('2025-12-19'), 'ko-KR') // "2025. 12. 19."
 *   formatLocaleDate(new Date('2025-12-19'), 'en-US') // "12/19/2025"
 */
export function formatLocaleDate(date: Date, locale: string = 'ko-KR'): string {
  return new Intl.DateTimeFormat(locale).format(date)
}

/**
 * 현지화된 시간 문자열 (브라우저 로케일 기준)
 *
 * @param date - 포맷할 Date 객체
 * @param locale - 로케일 코드 (기본값: 'ko-KR')
 * @returns 로케일별 포맷된 시간
 *
 * 예:
 *   formatLocaleTime(new Date('2025-12-19T16:30:45'), 'ko-KR') // "오후 4:30:45"
 *   formatLocaleTime(new Date('2025-12-19T16:30:45'), 'en-US') // "4:30:45 PM"
 */
export function formatLocaleTime(date: Date, locale: string = 'ko-KR'): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

/**
 * ISO 8601 형식의 날짜 문자열 (예: 데이터 저장용)
 *
 * @param date - 포맷할 Date 객체
 * @returns ISO 8601 형식 문자열
 *
 * 예:
 *   formatISO(new Date('2025-12-19T16:30:45'))
 *   // "2025-12-19T16:30:45.000Z"
 */
export function formatISO(date: Date): string {
  return date.toISOString()
}
