import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        detached: resolve(__dirname, 'src/detached/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        'floating-panel': resolve(__dirname, 'src/floating-panel/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        // Chrome 扩展的 content scripts 和 service workers 不支持 ES modules
        // 由于Vite多入口构建限制，共享代码仍会被提取为单独的chunk
        // 后处理脚本会将这些chunk内联到需要它们的入口点中
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  define: {
    __IS_DEV__: process.env.NODE_ENV === 'development'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/services': resolve(__dirname, 'src/services'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/hooks': resolve(__dirname, 'src/hooks'),
      '@/i18n': resolve(__dirname, 'src/i18n')
    }
  }
})
