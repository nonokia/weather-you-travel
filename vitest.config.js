import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.js',
        // Unit/component tests live under src/. Playwright owns e2e/ and must
        // not be picked up by Vitest (their test() APIs are incompatible).
        include: ['src/**/*.{test,spec}.{js,jsx}'],
        exclude: ['node_modules', 'dist', 'e2e'],
    },
})
