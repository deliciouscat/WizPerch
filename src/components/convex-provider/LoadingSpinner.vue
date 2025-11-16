<template>
  <div class="loading-spinner-container" :class="sizeClass">
    <div class="loading-spinner" :class="[sizeClass, colorClass]">
      <span class="spinner-dot" v-for="i in 3" :key="i" :style="{ animationDelay: `${(i - 1) * 0.15}s` }"></span>
    </div>
    <p v-if="showText" class="loading-text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

/**
 * @fileoverview LoadingSpinner 컴포넌트
 *
 * 애플리케이션 전체에서 일관된 로딩 상태를 제공하는 재사용 가능한
 * 로딩 스피너 컴포넌트입니다. 다양한 사용 사례를 위해 다른 크기와
 * 색상을 지원합니다.
 *
 * 주요 기능:
 * - 여러 크기 옵션 (small, medium, large)
 * - 다양한 컨텍스트를 위한 색상 변형
 * - 선택적 로딩 텍스트
 * - 애플리케이션 전체의 일관된 스타일링
 * - 접근 가능한 로딩 표시기
 *
 * @author Vue + Convex + Clerk Auth System
 * @version 1.0.0
 */

/**
 * 로딩 스피너를 사용자 정의하기 위한 컴포넌트 props.
 *
 * @prop {string} size - 스피너의 크기 (small, medium, large)
 * @prop {string} color - 스피너의 색상 변형 (primary, success, warning, danger)
 * @prop {string} text - 스피너 아래에 표시할 선택적 텍스트
 * @prop {boolean} showText - 로딩 텍스트를 표시할지 여부
 */
interface Props {
  size?: "small" | "medium" | "large";
  color?: "primary" | "success" | "warning" | "danger";
  text?: string;
  showText?: boolean;
}

/**
 * 로딩 스피너의 기본 prop 값.
 */
const props = withDefaults(defineProps<Props>(), {
  size: "medium",
  color: "primary",
  text: "Loading...",
  showText: true,
});

/**
 * 스피너 크기에 대한 계산된 CSS 클래스.
 * size prop을 적절한 CSS 클래스에 매핑합니다.
 */
const sizeClass = computed(() => `spinner-${props.size}`);

/**
 * 스피너 색상에 대한 계산된 CSS 클래스.
 * color prop을 적절한 CSS 클래스에 매핑합니다.
 */
const colorClass = computed(() => `spinner-${props.color}`);
</script>

<style scoped>
/**
 * 로딩 스피너의 기본 컨테이너 스타일.
 * 모든 스피너 변형에 대해 일관된 레이아웃과 간격을 제공합니다.
 */
.loading-spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/**
 * 부드러운 애니메이션이 있는 기본 스피너 스타일.
 * 점들이 순차적으로 나타나는 현대적인 디자인입니다.
 */
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}

/**
 * 스피너의 각 점 요소.
 * 순차적으로 나타나는 애니메이션 효과를 가집니다.
 */
.spinner-dot {
  display: inline-block;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
  opacity: 0.3;
}

/**
 * 작은 스피너 변형.
 * 인라인 로딩 상태 및 작은 컴포넌트에 사용됩니다.
 */
.spinner-small .spinner-dot {
  width: 6px;
  height: 6px;
}

.spinner-small {
  gap: 3px;
}

/**
 * 중간 스피너 변형.
 * 대부분의 로딩 시나리오에서 사용되는 기본 크기입니다.
 */
.spinner-medium .spinner-dot {
  width: 8px;
  height: 8px;
}

.spinner-medium {
  gap: 4px;
}

/**
 * 큰 스피너 변형.
 * 전체 페이지 로딩 상태 및 눈에 띄는 로딩 표시기에 사용됩니다.
 */
.spinner-large .spinner-dot {
  width: 12px;
  height: 12px;
}

.spinner-large {
  gap: 6px;
}

/**
 * 기본 색상 변형 (grey-lv3).
 * 일반 로딩 상태의 기본 색상입니다.
 */
.spinner-primary .spinner-dot {
  background-color: var(--grey-lv3);
}

/**
 * 성공 색상 변형 (main).
 * 성공적인 작업 및 긍정적인 피드백에 사용됩니다.
 */
.spinner-success .spinner-dot {
  background-color: var(--main);
}

/**
 * 경고 색상 변형 (노란색).
 * 경고 상태 및 주의 표시기에 사용됩니다.
 */
.spinner-warning .spinner-dot {
  background-color: #ffc107;
}

/**
 * 위험 색상 변형 (빨간색).
 * 오류 상태 및 중요한 작업에 사용됩니다.
 */
.spinner-danger .spinner-dot {
  background-color: var(--notification);
}

/**
 * 로딩 텍스트 스타일.
 * 스피너 아래에 명확하고 읽기 쉬운 텍스트를 제공합니다.
 */
.loading-text {
  color: #6c757d;
  font-size: 14px;
  margin: 0;
  margin-top: 8px;
  font-weight: 500;
}

/**
 * 컴팩트 레이아웃을 위한 작은 텍스트 변형.
 */
.loading-spinner-container.spinner-small .loading-text {
  font-size: 12px;
  margin-top: 6px;
}

/**
 * 눈에 띄는 로딩 상태를 위한 큰 텍스트 변형.
 */
.loading-spinner-container.spinner-large .loading-text {
  font-size: 16px;
  margin-top: 10px;
}

/**
 * 점이 튀어오르는 애니메이션 키프레임.
 * 부드럽고 자연스러운 로딩 효과를 생성합니다.
 */
@keyframes bounce {

  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.3;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/**
 * 접근성을 위한 감소된 모션 지원.
 * 사용자의 감소된 모션 선호 설정을 존중합니다.
 */
@media (prefers-reduced-motion: reduce) {
  .spinner-dot {
    animation: none;
    opacity: 1;
  }
}
</style>
