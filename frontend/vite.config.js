import { defineConfig } from 'vite'

export default defineConfig({
    base: './',
    build: {
        commonjsOptions: { include: [/node_modules/, /shared/] }
    }
})
