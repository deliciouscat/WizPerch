import { createApp } from "vue";
import { createPinia } from "pinia";
import { clerkPlugin } from "@clerk/vue";
import { convexVue } from "convex-vue";
// @clerk/clerk-js를 직접 import하여 번들에 포함시킴
import { Clerk } from "@clerk/clerk-js";
import App from "./App.vue";
import "./styles/color_template.css";

/**
 * 메인 Vue 애플리케이션 인스턴스를 생성합니다.
 * 이 인스턴스는 플러그인으로 구성되고 DOM에 마운트됩니다.
 */
const app = createApp(App);
const pinia = createPinia();

/**
 * Pinia 상태 관리 플러그인을 구성합니다.
 */
app.use(pinia);

/**
 * Clerk 인증 플러그인을 구성합니다.
 *
 * Clerk는 사용자 인증, 사용자 관리, 세션 처리를 제공합니다.
 * 플러그인은 환경 변수에서 가져온 공개 키로 구성되며,
 * 인증 시스템이 제대로 작동하기 위해 필요합니다.
 *
 * @see https://clerk.com/docs
 */
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Clerk 키 검증 및 디버깅 정보 출력
console.log('Clerk 초기화 시도:', {
    hasKey: !!clerkPublishableKey,
    keyType: typeof clerkPublishableKey,
    keyLength: clerkPublishableKey?.length || 0,
    keyPrefix: clerkPublishableKey?.substring(0, 20) + '...',
    keyFormat: clerkPublishableKey?.startsWith('pk_') ? 'valid' : 'invalid',
    isUndefined: clerkPublishableKey === undefined,
    isNull: clerkPublishableKey === null,
    isEmpty: clerkPublishableKey === '',
    fullKey: clerkPublishableKey // 개발 환경에서만 (빌드 시 제거 권장)
});

if (!clerkPublishableKey || clerkPublishableKey === 'undefined' || !clerkPublishableKey.startsWith('pk_')) {
    console.error('Clerk 키 오류:', {
        key: clerkPublishableKey,
        message: 'Clerk publishable key가 올바르게 설정되지 않았습니다. .env 파일을 확인하세요.'
    });
}

// Chrome Extension에서는 Clerk.js를 번들에 포함시켜야 함
// Clerk 인스턴스를 미리 생성하여 전역에 설정
// 이렇게 하면 Clerk Vue가 동적 스크립트 로딩을 시도하지 않음
const clerkInstance = new Clerk(clerkPublishableKey);

// 전역 window 객체에 Clerk 클래스와 인스턴스 설정
// Clerk Vue가 이를 감지하고 사용함
// 중요: window.Clerk는 클래스로 유지하되, load된 인스턴스도 제공
(window as any).Clerk = Clerk;
(window as any).__clerk_instance__ = clerkInstance;

// Clerk Vue가 window.Clerk.load()를 호출할 수 있도록
// 클래스에 정적 load 메서드 추가 (실제로는 인스턴스를 생성하고 로드)
(window as any).Clerk.load = async (options: any) => {
    // 이미 생성된 인스턴스가 있으면 그것을 사용
    if ((window as any).__clerk_instance__) {
        return (window as any).__clerk_instance__.load(options);
    }
    // 없으면 새로 생성
    const instance = new Clerk(clerkPublishableKey);
    (window as any).__clerk_instance__ = instance;
    return instance.load(options);
};

try {
    // Clerk Vue 플러그인 설정
    // publishableKey만 전달하면 되지만, Clerk 인스턴스가 이미 전역에 있음
    app.use(clerkPlugin, {
        publishableKey: clerkPublishableKey,
    });
    
    console.log('Clerk 플러그인 등록 완료 (번들 포함 모드, 전역 인스턴스 설정)');
    
    // Clerk 인스턴스가 로드될 때까지 기다림 (비동기)
    clerkInstance.load().then(() => {
        console.log('Clerk 인스턴스 로드 완료');
    }).catch((error) => {
        console.error('Clerk 인스턴스 로드 실패:', error);
    });
} catch (error) {
    console.error('Clerk 플러그인 등록 실패:', error);
    // 실패해도 앱은 계속 실행되도록 함 (디버깅을 위해)
    console.warn('Clerk 없이 앱 계속 실행');
}

/**
 * Convex 백엔드 플러그인을 구성합니다.
 *
 * Convex는 백엔드 데이터베이스, 실시간 구독, 서버리스 함수를 제공합니다.
 * 플러그인은 환경 변수에서 가져온 배포 URL로 구성되어
 * 올바른 백엔드에 연결됩니다.
 *
 * @see https://docs.convex.dev
 */
app.use(convexVue, {
    url: import.meta.env.VITE_CONVEX_URL,
});

/**
 * 전역 에러 핸들러 설정
 * Clerk 초기화 관련 네트워크 오류나 CSP 오류를 감지합니다.
 */
window.addEventListener('error', (event) => {
    if (event.message?.includes('clerk') || event.filename?.includes('clerk')) {
        console.error('Clerk 관련 오류 감지:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
    }
});

window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('clerk') || event.reason?.stack?.includes('clerk')) {
        console.error('Clerk 관련 Promise 거부:', {
            reason: event.reason,
            message: event.reason?.message,
            stack: event.reason?.stack
        });
    }
});

/**
 * 구성된 애플리케이션을 DOM에 마운트합니다.
 *
 * 이는 id가 "app"인 HTML 요소에 Vue 애플리케이션을 렌더링합니다.
 * 애플리케이션은 이제 상호작용 가능하며 사용자 작업에 응답합니다.
 */
(async () => {
    try {
        app.mount("#app");
        console.log('Vue 앱 마운트 완료');
    } catch (error) {
        console.error('Vue 앱 마운트 실패:', error);
        throw error;
    }
})();