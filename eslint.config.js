/**
 * ESLint Configuration (v9+)
 *
 * 핵심 목표:
 * 1. Shared 폴더 보호 (Node.js API, Electron API 금지)
 * 2. TypeScript strict (no-explicit-any, 엄격한 타입 체크)
 * 3. 코드 품질 (no-console, prefer-const 등)
 */

import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

const tsconfigRootDir = new URL('.', import.meta.url).pathname

export default [
  // ===== Ignore patterns =====
  {
    ignores: [
      'dist-main/**',
      'dist-preload/**',
      'dist-renderer/**',
      'node_modules/**',
      'build/**',
      '.next/**',
      'out/**',
      'prisma/**',
    ],
  },

  // ===== Type definition files =====
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // ===== Base JavaScript rules =====
  js.configs.recommended,

  // ===== Shared 폴더 STRICT 규칙 =====
  {
    files: ['src/shared/**/*.ts', 'src/shared/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        crypto: 'readonly',
        // Browser globals (shared에서는 없지만 타입 체크용)
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // ===== TypeScript Strict for Shared =====
      '@typescript-eslint/no-explicit-any': [
        'error',
        { fixToUnknown: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // _param = 의도적으로 미사용
          varsIgnorePattern: '^_|^[A-Z]', // _var 또는 Type/Enum/Interface
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
    ],
      'no-unused-vars': 'off', // TS 규칙으로만 체크
      // Shared는 인터페이스/타입만 있어서 unused warning 무시
      'no-unreachable': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // ===== Forbidden Imports in Shared =====
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['fs', 'fs/*', 'fs/**'],
              message:
                '❌ SHARED에서 fs 금지\n- Renderer에서 사용 불가\n- 파일 작업은 src/main에서만',
            },
            {
              group: ['path', 'path/*', 'path/**'],
              message:
                '❌ SHARED에서 path 금지\n- 경로 처리는 src/main에서만\n- shared는 순수 함수만',
            },
            {
              group: ['os', 'os/*', 'os/**'],
              message:
                '❌ SHARED에서 os 금지\n- OS 정보는 IPC로 요청',
            },
            {
              group: ['child_process', 'child_process/*', 'child_process/**'],
              message:
                '❌ SHARED에서 child_process 금지\n- Main에서만 사용 가능',
            },
            {
              group: ['electron', 'electron/*', 'electron/**'],
              message:
                '❌ SHARED에서 electron import 금지\n- shared는 인터페이스만\n- 구현은 Main/Renderer에서',
            },
          ],
        },
      ],

      // ===== Forbidden Globals in Shared =====
      'no-restricted-globals': [
        'error',
        {
          name: 'window',
          message:
            '❌ SHARED에서 window 금지\n- Main에서 window는 없음',
        },
        {
          name: 'document',
          message:
            '❌ SHARED에서 document 금지\n- Main에서 document는 없음',
        },
        {
          name: 'localStorage',
          message:
            '❌ SHARED에서 localStorage 금지\n- 상태 저장은 Prisma 사용',
        },
      ],

      // ===== Code Quality for Shared =====
      'no-console': 'error',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // ===== Main process - Node.js globals =====
  {
    files: ['src/main/**/*.ts', 'src/main/**/*.tsx'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        NodeJS: 'readonly',
      },
    },
  },

  // ===== Preload process - Node.js + console allowed =====
  {
    files: ['src/preload/**/*.cjs', 'src/preload/**/*.ts'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // Preload에서는 console 허용 (Logger 없음)
    },
  },

  // ===== Renderer process - Browser globals =====
  {
    files: ['src/renderer/**/*.ts', 'src/renderer/**/*.tsx'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
      },
    },
    rules: {
      // Renderer에서는 디버깅이 중요해서 error 대신 warn
      'no-console': 'off',
    },
  },

  // ===== General TypeScript rules (Main, Renderer) =====
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // ===== Type Safety (STRICT) =====
      '@typescript-eslint/no-explicit-any': 'error',  // ← warn → error
      '@typescript-eslint/no-unused-vars': [
        'error',  // ← warn → error
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^[A-Z]',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // NOTE: typescript-eslint v8+ 환경에서 rule 로딩/이관 이슈가 잦아
      // 프로젝트 생산성/실무 관점에서 강제하지 않음. (IPC boundary는 별도 리뷰로 관리)
      '@typescript-eslint/explicit-function-return-types': 'off',

      // NOTE: type-aware rule. project 설정이 없거나 단일파일 lint 시 문제될 수 있어 warn으로 완화.
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // ===== Code Quality (STRICT) =====
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],  // info 제거
        },
      ],
      'no-debugger': 'error',     // ← warn → error
      'prefer-const': 'error',    // ← warn → error
      'no-var': 'error',          // ← warn → error
    },
  },

  // ===== Type definitions - allow unused vars (interface definitions) =====
  {
    files: ['src/types/**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off', // Interface properties can be intentionally unused
      'no-unused-vars': 'off',
    },
  },
]
