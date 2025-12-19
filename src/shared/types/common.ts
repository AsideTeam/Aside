/**
 * Common Types - 모든 모듈에서 공용으로 사용하는 유틸 타입
 *
 * 책임: 재사용 가능한 Generic 타입 정의
 * - Result<T>, Maybe<T>, 등 Utility Types
 * - 도메인과 무관한 순수 타입 로직만
 *
 * 사용 예:
 *   import type { Result, Maybe } from '@shared/types/common';
 *
 * 철학:
 * - Prisma 모델과 무관
 * - 비즈니스 로직과 무관
 * - 언어 수준의 타입만 포함
 */

/**
 * Result<T, E> - 성공 또는 실패를 나타내는 타입
 *
 * Rust의 Result 타입과 유사
 * 성공/실패 여부를 타입 시스템으로 표현
 *
 * 사용 예:
 *   const result: Result<number> = { ok: true, value: 123 };
 *   const error: Result<number> = { ok: false, error: 'Not found' };
 *
 *   if (result.ok) {
 *     console.log(result.value); // 123
 *   } else {
 *     console.log(result.error);  // 'Not found'
 *   }
 */
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E }

/**
 * Maybe<T> - null 또는 undefined일 수 있는 값
 *
 * 선택적 값을 명시적으로 표현
 *
 * 사용 예:
 *   const maybeUser: Maybe<User> = null;
 *   const maybeTitle: Maybe<string> = "Google";
 */
export type Maybe<T> = T | null | undefined

/**
 * Nullable<T> - null일 수 있는 값 (undefined는 제외)
 *
 * 사용 예:
 *   const nullable: Nullable<string> = null;
 */
export type Nullable<T> = T | null

/**
 * Async 헬퍼 타입
 *
 * Promise 래핑/언래핑
 */
export type Awaitable<T> = T | Promise<T>
export type Flatten<T> = T extends Promise<infer U> ? U : T

/**
 * 딕셔너리/맵 타입
 *
 * 키-값 쌍의 객체를 명시적으로 표현
 *
 * 사용 예:
 *   const settings: Dict<string> = { theme: 'dark', language: 'ko' };
 */
export type Dict<T = any> = Record<string, T>

/**
 * 배열 또는 단일 값
 *
 * 사용 예:
 *   type TargetIds = ArrayOrSingle<string>;
 *   const ids1: TargetIds = "123";
 *   const ids2: TargetIds = ["123", "456"];
 */
export type ArrayOrSingle<T> = T | T[]

/**
 * 함수 타입
 *
 * 사용 예:
 *   const callback: Fn<[number], void> = (n) => console.log(n);
 */
export type Fn<Args extends any[] = any[], Return = void> = (...args: Args) => Return
export type AsyncFn<Args extends any[] = any[], Return = any> = (...args: Args) => Promise<Return>

/**
 * JSON 직렬화 가능한 값
 *
 * JSON.stringify()에 전달할 수 있는 값
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray
export interface JsonObject {
  [key: string]: JsonValue
}
export interface JsonArray extends Array<JsonValue> {}

/**
 * DeepPartial<T> - 중첩된 객체의 모든 프로퍼티를 Optional로 만들기
 *
 * 사용 예:
 *   interface User { name: string; profile: { age: number } }
 *   const partial: DeepPartial<User> = { profile: { age: 25 } }; // OK
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * DeepReadonly<T> - 중첩된 객체의 모든 프로퍼티를 Readonly로 만들기
 *
 * 사용 예:
 *   interface Config { db: { host: string } }
 *   const config: DeepReadonly<Config> = ...; // host 수정 불가
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * Constructor<T> - 생성자 타입
 *
 * 사용 예:
 *   const ctor: Constructor<Logger> = Logger;
 *   const instance = new ctor();
 */
export type Constructor<T = {}> = new (...args: any[]) => T

/**
 * Opaque<T, Brand> - 브랜드 타입 (고급)
 *
 * 컴파일 시점에 서로 다른 타입으로 취급
 *
 * 사용 예:
 *   type UserId = Opaque<string, 'UserId'>;
 *   type Email = Opaque<string, 'Email'>;
 *
 *   const user: UserId = "user123" as UserId;
 *   const email: Email = "user@example.com" as Email;
 *
 *   // 이 둘은 컴파일 에러 (서로 다른 타입)
 *   const wrong: UserId = email;
 */
export type Opaque<T, Brand extends string> = T & { readonly __brand: Brand }
