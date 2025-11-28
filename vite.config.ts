import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { copyFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Chrome Extension 빌드를 위한 플러그인
const chromeExtensionPlugin = () => {
    return {
        name: 'chrome-extension',
        closeBundle() {
            const distDir = resolve(__dirname, 'dist')
            const manifestSrc = resolve(__dirname, 'manifest.json')
            const manifestDest = resolve(distDir, 'manifest.json')
            const backgroundSrc = resolve(__dirname, 'public', 'background.js')
            const backgroundDest = resolve(distDir, 'background.js')

            // manifest.json 복사
            if (existsSync(manifestSrc)) {
                copyFileSync(manifestSrc, manifestDest)
                console.log('✓ manifest.json copied to dist')
            }

            // background.js 복사 (있는 경우)
            if (existsSync(backgroundSrc)) {
                copyFileSync(backgroundSrc, backgroundDest)
                console.log('✓ background.js copied to dist')
            }
        }
    }
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vueDevTools(),
        chromeExtensionPlugin(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
        },
        // Chrome Extension은 절대 경로를 사용하므로 base를 설정하지 않음
        emptyOutDir: true,
    },
})
