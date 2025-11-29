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

// Clerk 동적 스크립트 로딩 방지 플러그인
const disableClerkDynamicLoading = () => {
    return {
        name: 'disable-clerk-dynamic-loading',
        transform(code: string, id: string) {
            // Clerk 관련 파일에서 처리
            if (!id.includes('@clerk')) {
                return null;
            }

            let modified = false;
            let newCode = code;

            // @clerk/shared/loadClerkJsScript 모듈 패치
            if (id.includes('loadClerkJsScript')) {
                // loadClerkJsScript 함수를 즉시 resolve하는 함수로 대체
                if (newCode.includes('export') && newCode.includes('loadClerkJsScript')) {
                    newCode = newCode.replace(
                        /export\s+(?:async\s+)?function\s+loadClerkJsScript[^{]*\{[^}]*\}/gs,
                        `export async function loadClerkJsScript() {
                            // DISABLED FOR CHROME EXTENSION: Clerk.js is already bundled
                            return Promise.resolve();
                        }`
                    );
                    modified = true;
                }
            }

            // @clerk/vue 플러그인 파일 패치
            if (id.includes('@clerk/vue') && (id.includes('plugin') || id.includes('index'))) {
                // loadClerkJsScript 호출을 Promise.resolve()로 대체
                if (newCode.includes('loadClerkJsScript')) {
                    newCode = newCode.replace(
                        /void\s+loadClerkJsScript\([^)]*\)\.then\(/g,
                        `Promise.resolve().then(`
                    );
                    modified = true;
                    
                    // window.Clerk 체크를 건너뛰고 바로 사용
                    if (newCode.includes('if (!window.Clerk)')) {
                        newCode = newCode.replace(
                            /if\s*\(\s*!\s*window\.Clerk\s*\)\s*\{[^}]*throw[^}]*\}/g,
                            `if (false) { /* DISABLED: Clerk already loaded */ }`
                        );
                        modified = true;
                    }
                    
                    // window.Clerk.load() 호출을 수정
                    // window.Clerk가 클래스이므로 load는 정적 메서드로 처리됨
                    if (newCode.includes('window.Clerk.load')) {
                        // window.Clerk.load() 호출은 이미 main.ts에서 처리됨
                        // 여기서는 그대로 두되, clerk.value 할당을 수정
                        modified = true;
                    }
                    
                    // clerk.value = window.Clerk 패턴을 인스턴스로 변경
                    // 그리고 window.Clerk.load() 호출을 clerk.value.load()로 변경
                    if (newCode.includes('clerk.value = window.Clerk')) {
                        // clerk.value 할당을 인스턴스로 변경
                        newCode = newCode.replace(
                            /clerk\.value\s*=\s*window\.Clerk;/g,
                            `clerk.value = window.__clerk_instance__ || new window.Clerk(options.publishableKey);`
                        );
                        modified = true;
                    }
                    
                    // window.Clerk.load() 호출을 clerk.value.load()로 변경
                    if (newCode.includes('await window.Clerk.load')) {
                        newCode = newCode.replace(
                            /await\s+window\.Clerk\.load\([^)]*\);/g,
                            `await clerk.value.load(options);`
                        );
                        modified = true;
                    }
                    
                    // window.Clerk.load() 호출 (await 없이)
                    if (newCode.includes('window.Clerk.load') && !newCode.includes('await clerk.value.load')) {
                        newCode = newCode.replace(
                            /window\.Clerk\.load\([^)]*\)/g,
                            `clerk.value.load(options)`
                        );
                        modified = true;
                    }
                }
            }

            if (modified) {
                console.log(`[disable-clerk-dynamic-loading] Patched: ${id}`);
                return {
                    code: newCode,
                    map: null
                };
            }

            return null;
        }
    }
}

// https://vite.dev/config/
export default defineConfig({
    base: './', // Chrome Extension에서 상대 경로 사용을 위해 필요
    plugins: [
        vue(),
        vueDevTools(),
        disableClerkDynamicLoading(),
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
        emptyOutDir: true,
    },
})
