import { createApp } from "vue";
import { clerkPlugin } from "@clerk/vue";
import { convexVue } from "convex-vue";
import App from "./App.vue";
import "./styles/color_template.css";

/**
 * 메인 Vue 애플리케이션 인스턴스를 생성합니다.
 * 이 인스턴스는 플러그인으로 구성되고 DOM에 마운트됩니다.
 */
const app = createApp(App);

/**
 * Clerk 인증 플러그인을 구성합니다.
 *
 * Clerk는 사용자 인증, 사용자 관리, 세션 처리를 제공합니다.
 * 플러그인은 환경 변수에서 가져온 공개 키로 구성되며,
 * 인증 시스템이 제대로 작동하기 위해 필요합니다.
 *
 * @see https://clerk.com/docs
 */
app.use(clerkPlugin, {
    publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
});

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
 * 구성된 애플리케이션을 DOM에 마운트합니다.
 *
 * 이는 id가 "app"인 HTML 요소에 Vue 애플리케이션을 렌더링합니다.
 * 애플리케이션은 이제 상호작용 가능하며 사용자 작업에 응답합니다.
 */
app.mount("#app");