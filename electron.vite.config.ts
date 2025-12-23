import { fileURLToPath } from 'node:url'
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// 별칭 설정 정보 (재사용용)
const mainAliases = {
  '@main': resolve(__dirname, 'src/main'),
  '@main/config': resolve(__dirname, 'src/main/config'),
  '@main/handlers': resolve(__dirname, 'src/main/handlers'),
  '@main/managers': resolve(__dirname, 'src/main/managers'),
  '@main/services': resolve(__dirname, 'src/main/services'),
  '@main/utils': resolve(__dirname, 'src/main/utils'),
  '@main/core': resolve(__dirname, 'src/main/core'),
  '@shared': resolve(__dirname, 'src/shared'),
}

const rendererAliases = {
  '@renderer': resolve(__dirname, 'src/renderer'),
  '@renderer/app': resolve(__dirname, 'src/renderer/app'),
  '@renderer/components': resolve(__dirname, 'src/renderer/components'),
  '@renderer/hooks': resolve(__dirname, 'src/renderer/hooks'),
  '@renderer/layouts': resolve(__dirname, 'src/renderer/layouts'),
  '@renderer/lib': resolve(__dirname, 'src/renderer/lib'),
  '@renderer/pages': resolve(__dirname, 'src/renderer/pages'),
  '@renderer/styles': resolve(__dirname, 'src/renderer/styles'),
  '@renderer/types': resolve(__dirname, 'src/renderer/types'),
  '@shared': resolve(__dirname, 'src/shared'),
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: mainAliases
    },
    build: {
      outDir: resolve(__dirname, 'out/main'),
      rollupOptions: {
        external: ['sqlite3', 'better-sqlite3', '@prisma/client']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared')
      }
    },
    build: {
      outDir: resolve(__dirname, 'out/preload'),
      rollupOptions: {
        output: {
          format: 'cjs'
        }
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: rendererAliases
    },
    build: {
      outDir: resolve(__dirname, 'out/renderer'),
      rollupOptions: {
        input: resolve(__dirname, 'src/renderer/index.html')
      }
    }
  }
})
