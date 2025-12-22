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
      outDir: resolve(__dirname, 'dist-main'),
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
    ,
    build: {
      outDir: resolve(__dirname, 'dist-preload')
    }
  },
  renderer: {
    root: 'src/renderer',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@app': resolve(__dirname, 'src/renderer/app'),
        '@components': resolve(__dirname, 'src/renderer/components'),
        '@hooks': resolve(__dirname, 'src/renderer/hooks'),
        '@lib': resolve(__dirname, 'src/renderer/lib'),
        '@store': resolve(__dirname, 'src/renderer/store'),
        '@styles': resolve(__dirname, 'src/renderer/styles'),
        '@utils': resolve(__dirname, 'src/renderer/utils'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    },
    build: {
      outDir: resolve(__dirname, 'dist-renderer'),
      rollupOptions: {
        input: resolve(__dirname, 'src/renderer/index.html')
      }
    }
  }
})
