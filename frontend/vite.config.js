import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
    base: './',
    resolve: {
        alias: {
            '@bchan/shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url))
        }
    }
})
