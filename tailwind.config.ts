/**
 * Tailwind CSS v4 Configuration
 * 
 * Electron Aside Browser 스타일링 설정
 * - 색상 팔레트 (다크 테마 중심)
 * - 커스텀 토큰 (spacing, typography)
 * - 플러그인 (없음, 현재는 기본 설정)
 */

import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
  ],
  
  theme: {
    extend: {
      colors: {
        // ===== 기본 색상 팔레트 (다크 테마) =====
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        
        blue: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        
        red: {
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      
      spacing: {
        // ===== 커스텀 spacing =====
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
      
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
      },
    },
  },
  
  plugins: [],
} satisfies Config
