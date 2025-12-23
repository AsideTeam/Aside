/**
 * ESLint Configuration (v9+ flat config)
 *
 * 목표:
 * - TS 기반 규칙을 기본으로 사용(no-unused-vars/no-undef는 TS로)
 * - 프로세스별(Main/Preload/Renderer) globals 분리
 * - src/shared는 가장 엄격하게(금지 import/금지 globals/console 금지)
 */

import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url))

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

  // ===== Base JavaScript rules =====
  js.configs.recommended,

  // ===== General TypeScript rules (applies to src/**) =====
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
      // Base JS rules are noisy/incorrect for TS (types, interfaces, d.ts).
      'no-unused-vars': 'off',
      'no-undef': 'off',

      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^[A-Z]',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-types': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'error',

      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
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
      'no-console': 'off',
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
      'no-console': 'off',
    },
  },

  // ===== Shared 폴더 STRICT 규칙 (General TS보다 뒤에 와야 덮어써짐) =====
  {
    files: ['src/shared/**/*.ts', 'src/shared/**/*.tsx'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^[A-Z]',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': 'error',
      'no-unreachable': 'off',

      // ===== Forbidden Imports in Shared =====
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['fs', 'fs/*', 'fs/**'],
              message: '❌ SHARED에서 fs 금지\n- 파일 작업은 src/main에서만',
            },
            {
              group: ['path', 'path/*', 'path/**'],
              message: '❌ SHARED에서 path 금지\n- 경로 처리는 src/main에서만',
            },
            {
              group: ['os', 'os/*', 'os/**'],
              message: '❌ SHARED에서 os 금지\n- OS 정보는 IPC로 요청',
            },
            {
              group: ['child_process', 'child_process/*', 'child_process/**'],
              message: '❌ SHARED에서 child_process 금지\n- Main에서만 사용 가능',
            },
            {
              group: ['electron', 'electron/*', 'electron/**'],
              message: '❌ SHARED에서 electron import 금지\n- 구현은 Main/Renderer에서',
            },
          ],
        },
      ],

      // ===== Forbidden Globals in Shared =====
      'no-restricted-globals': [
        'error',
        { name: 'window', message: '❌ SHARED에서 window 금지' },
        { name: 'document', message: '❌ SHARED에서 document 금지' },
        { name: 'localStorage', message: '❌ SHARED에서 localStorage 금지' },
      ],
    },
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
]
