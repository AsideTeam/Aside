# 📘 Aside - LITE-ZEN Browser PRD (v1.0)

## 🎯 프로젝트 개요

**Aside (어사이드)**는 초경량의 액자형 몰입형 브라우저입니다.

| 항목 | 내용 |
|------|------|
| **제품명** | LITE-ZEN Browser |
| **핵심 철학** | LITE (리소스 최소화) + ZEN (UI 방해 최소화) + STABLE (명확한 생명주기) |
| **기술 스택** | Electron 31 + React 19 + Vite + TypeScript + Tailwind CSS v4 + Prisma + SQLite |
| **개발 환경** | pnpm + electron-vite |
| **상태** | MVP Phase 1: Lifecycle & Core Architecture |

---

## 🔄 생명주기 명세 (Lifecycle) ★ 핵심

### Phase 1: BOOTSTRAP (앱 시작)

```
app.on('ready')
  ↓
AppLifecycle.bootstrap()
  ├─ Config.load() → userData 경로 확보
  ├─ Logger init
  ├─ Database connect → Prisma 연결
  └─ Services init
  ↓
createWindow() → BrowserWindow 생성 (React 로드)
  ↓
ViewManager.initialize() → 싱글톤 생성
  ↓
Create Initial Tab (Google)
  ↓
setupIPCHandlers() → IPC 채널 등록
  ↓
✓ App Ready
```

### Phase 2: RUNTIME (앱 실행)

사용자 상호작용: 탭 전환, URL 입력, 새로고침 등

### Phase 3: SHUTDOWN (앱 종료)

```
app.on('will-quit')
  ↓
AppLifecycle.shutdown()
  ├─ ViewManager.destroy() → 모든 웹뷰 메모리 해제
  ├─ Prisma.$disconnect() → DB 연결 종료
  └─ Cleanup files
  ↓
app.exit(0)
  ↓
✓ Clean shutdown
```

---

## 📊 데이터베이스 설계

**파일:** `prisma/schema.prisma`

4개 테이블:
- **History**: 방문 기록
- **Bookmark**: 북마크
- **AppSetting**: 앱 설정 (키-값 스토어)
- **SessionTab**: 탭 세션 복구 (MVP: 구조만)

---

## 📁 핵심 디렉토리

```
src/main/
├── core/
│   ├── lifecycle.ts     # ★ AppLifecycle (부팅/종료)
│   ├── env.ts           # Config 싱글톤
│   └── window.ts        # BrowserWindow 팩토리
├── managers/
│   └── view-manager.ts  # ★ WebContentsView 탭 관리
├── services/
│   ├── database.ts      # Prisma 싱글톤
│   └── index.ts         # 서비스 초기화
├── handlers/
│   └── index.ts         # IPC 핸들러 등록
└── index.ts             # Entry Point

src/shared/
├── constants/           # 글로벌 상수
├── types/               # 공용 타입 (errors, models, payloads)
└── utils/               # 공용 유틸

src/renderer/src/
├── main.tsx             # React 진입점
├── app/                 # App 컴포넌트
├── components/          # UI 컴포넌트
├── store/               # Zustand 상태
└── lib/                 # 유틸 (ipc 래퍼, cn 등)
```

---

## 🚀 빠른 시작

```bash
# 1. 의존성 설치
pnpm install

# 2. Prisma 생성
pnpm exec prisma generate

# 3. 개발 서버 실행
pnpm run dev

# → Electron + Vite 동시 실행
```

---

## 💡 설계 철학

### 1. **Lifecycle 명시화**
- 앱 시작/종료의 각 단계를 명확히 정의
- `AppLifecycle` 클래스로 중앙 집중식 관리

### 2. **Singleton 패턴**
- `ViewManager`, `Config`, `Prisma Client` 등
- 한 번만 생성/연결되도록 보장

### 3. **IPC 강타입화**
- `shared/types/payloads.ts`로 모든 페이로드 정의
- Renderer → Main 호출 시 타입 안전성

### 4. **Logger 중앙화**
- Main Process 전역에서 로그 통일
- 콘솔 + 파일 (error.log) 이중 출력

### 5. **electron-vite 표준**
- alex8088/electron-vite-boilerplate 기준
- `dist-main`, `dist-preload`, `dist-renderer` 분리

---

## 📚 참고 자료

- [electron-vite-boilerplate](https://github.com/alex8088/electron-vite-boilerplate)
- [Electron Docs](https://www.electronjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs/)
- [React 19 Docs](https://react.dev)

# aside
# Aside
# Aside
