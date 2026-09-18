import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [react()],
  resolve: {
    alias: {
      // The removed @base44/vite-plugin supplied this alias. jsconfig.json only
      // teaches the editor about it — Vite/Rollup needs its own copy, and
      // without this the build fails on every `@/...` import even though dev
      // and the IDE look fine.
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
