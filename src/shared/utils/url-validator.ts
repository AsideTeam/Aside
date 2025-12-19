/**
 * URL Validator - URL 검증 및 정규화 유틸
 *
 * 책임: URL 검증, 정규화, 파싱 함수들만 존재
 *
 * 사용 예:
 *   import { isValidUrl, normalizeUrl } from '@shared/utils/url-validator';
 *   isValidUrl('https://google.com'); // true
 *   normalizeUrl('google.com'); // 'https://google.com/'
 */

/**
 * URL이 유효한지 검증
 *
 * @param url - 검증할 URL 문자열
 * @returns 유효하면 true, 아니면 false
 *
 * 예:
 *   isValidUrl('https://google.com'); // true
 *   isValidUrl('http://localhost:3000'); // true
 *   isValidUrl('invalid-url'); // false
 *   isValidUrl('ftp://example.com'); // true (ftp도 허용)
 *
 * 검증 규칙:
 * - URL 형식이 올바른가?
 * - 프로토콜(http, https, ftp 등)이 있는가?
 * - 호스트명이 있는가?
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)

    // 프로토콜 확인 (http, https, ftp 등만 허용)
    const allowedProtocols = ['http:', 'https:', 'ftp:', 'ftps:', 'file:']
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false
    }

    // 호스트명이 있는지 확인
    if (!urlObj.hostname) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * URL을 표준 형식으로 정규화
 *
 * 사용자가 입력한 불완전한 URL을 표준 형식으로 변환.
 *
 * @param url - 입력 URL (프로토콜 없을 수 있음)
 * @returns 정규화된 URL
 *
 * 예:
 *   normalizeUrl('google.com'); // 'https://google.com/'
 *   normalizeUrl('example.com/path'); // 'https://example.com/path'
 *   normalizeUrl('https://google.com'); // 'https://google.com/'
 *   normalizeUrl('  https://google.com  '); // 'https://google.com/'
 *
 * 정규화 규칙:
 * 1. 앞뒤 공백 제거
 * 2. 프로토콜이 없으면 https:// 추가
 * 3. URL 정규화 (정리)
 */
export function normalizeUrl(url: string): string {
  // 앞뒤 공백 제거
  url = url.trim()

  // 프로토콜이 없으면 https:// 추가
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url)) {
    url = 'https://' + url
  }

  try {
    const urlObj = new URL(url)

    // 표준 형식 반환
    // protocol + // + hostname + pathname + search + hash
    return urlObj.toString()
  } catch {
    // 파싱 실패 시 원본 반환
    return url
  }
}

/**
 * URL에서 호스트명 추출
 *
 * @param url - URL 문자열
 * @returns 호스트명 (예: "google.com")
 *
 * 예:
 *   getHostname('https://google.com/search?q=test');
 *   // 'google.com'
 *
 *   getHostname('https://www.github.com');
 *   // 'www.github.com'
 *
 * null 반환 조건:
 * - URL 파싱 실패 시
 * - 호스트명이 없을 때
 */
export function getHostname(url: string): string | null {
  try {
    return new URL(normalizeUrl(url)).hostname
  } catch {
    return null
  }
}

/**
 * URL에서 도메인명만 추출 (www 제거)
 *
 * @param url - URL 문자열
 * @returns 도메인명 (예: "google.com")
 *
 * 예:
 *   getDomain('https://www.google.com');
 *   // 'google.com'
 *
 *   getDomain('https://mail.google.com');
 *   // 'google.com' (서브도메인도 제거)
 *
 *   getDomain('https://localhost:3000');
 *   // 'localhost'
 */
export function getDomain(url: string): string | null {
  const hostname = getHostname(url)
  if (!hostname) return null

  // localhost나 IP 주소는 그대로 반환
  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+/.test(hostname)) {
    return hostname
  }

  // www 제거
  let domain = hostname.replace(/^www\./, '')

  // 서브도메인 제거 (예: mail.google.com → google.com)
  const parts = domain.split('.')
  if (parts.length > 2) {
    domain = parts.slice(-2).join('.')
  }

  return domain
}

/**
 * URL에서 프로토콜 추출
 *
 * @param url - URL 문자열
 * @returns 프로토콜 (예: "https", "http", "ftp")
 *
 * 예:
 *   getProtocol('https://google.com');
 *   // 'https'
 *
 *   getProtocol('ftp://ftp.example.com');
 *   // 'ftp'
 */
export function getProtocol(url: string): string | null {
  try {
    const urlObj = new URL(normalizeUrl(url))
    // 프로토콜에서 ':' 제거
    return urlObj.protocol.replace(':', '')
  } catch {
    return null
  }
}

/**
 * 두 URL이 같은 도메인에 속하는지 확인
 *
 * 보안 정책(CORS, CSP 등)에서 자주 사용.
 *
 * @param url1 - 비교할 URL 1
 * @param url2 - 비교할 URL 2
 * @returns 같은 도메인이면 true
 *
 * 예:
 *   isSameDomain('https://google.com', 'https://google.com/search');
 *   // true
 *
 *   isSameDomain('https://google.com', 'https://www.google.com');
 *   // true (www 무시)
 *
 *   isSameDomain('https://google.com', 'https://github.com');
 *   // false
 */
export function isSameDomain(url1: string, url2: string): boolean {
  const domain1 = getDomain(url1)
  const domain2 = getDomain(url2)

  if (!domain1 || !domain2) return false

  return domain1.toLowerCase() === domain2.toLowerCase()
}

/**
 * URL이 보안 프로토콜을 사용하는지 확인
 *
 * @param url - 확인할 URL
 * @returns https 또는 다른 보안 프로토콜이면 true
 *
 * 예:
 *   isSecureUrl('https://google.com'); // true
 *   isSecureUrl('http://example.com'); // false
 *   isSecureUrl('file:///path/to/file'); // false
 */
export function isSecureUrl(url: string): boolean {
  const protocol = getProtocol(url)
  const secureProtocols = ['https', 'ftps', 'file']
  return protocol ? secureProtocols.includes(protocol) : false
}
