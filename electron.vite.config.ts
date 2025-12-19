import { fileURLToPath } from 'node:url'
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@main': resolve(__dirname, 'src/main'),
        '@shared': resolve(__dirname, 'src/shared'),
        '@config': resolve(__dirname, 'src/main/config')
      }
    },
    build: {
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
    }
  },
  renderer: {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@app': resolve(__dirname, 'src/renderer/src/app'),
        '@renderer': resolve(__dirname, 'src/renderer/src'),
        '@shared': resolve(__dirname, 'src/shared'),
        '@components': resolve(__dirname, 'src/renderer/src/components'),
        '@lib': resolve(__dirname, 'src/renderer/src/lib'),
        '@store': resolve(__dirname, 'src/renderer/src/store'),
        '@styles': resolve(__dirname, 'src/renderer/src/styles'),
        '@hooks': resolve(__dirname, 'src/renderer/src/hooks')
      }
    },
    build: {
      outDir: resolve(__dirname, 'dist-renderer')
    }
  }
})
