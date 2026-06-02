import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react()],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'ReactOutlier',
            formats: ['es', 'umd'],
            fileName: (format) => `react-outlier.${format}.js`,
        },
        rollupOptions: {
            external: ['react'],
            output: {
                globals: { react: 'React' },
            },
        },
    },
})
