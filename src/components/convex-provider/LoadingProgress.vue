<template>
  <div class="loading-progress-container">
    <LoadingSpinner :size="size" :color="color" :text="currentStepText" />
    
    <div class="progress-steps">
      <div 
        v-for="(step, index) in steps" 
        :key="index"
        class="progress-step"
        :class="{
          'step-completed': step.status === 'completed',
          'step-active': step.status === 'active',
          'step-pending': step.status === 'pending',
          'step-error': step.status === 'error'
        }"
      >
        <div class="step-indicator">
          <span v-if="step.status === 'completed'" class="step-icon">✓</span>
          <span v-else-if="step.status === 'error'" class="step-icon">✗</span>
          <span v-else class="step-number">{{ index + 1 }}</span>
        </div>
        <div class="step-content">
          <div class="step-title">{{ step.title }}</div>
          <div v-if="step.message" class="step-message">{{ step.message }}</div>
          <div v-if="step.error" class="step-error-message">
            <strong>오류:</strong> {{ step.error }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

export interface LoadingStep {
  title: string
  status: 'pending' | 'active' | 'completed' | 'error'
  message?: string
  error?: string
}

interface Props {
  steps: LoadingStep[]
  size?: 'small' | 'medium' | 'large'
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'large',
  color: 'primary'
})

const currentStepText = computed(() => {
  const activeStep = props.steps.find(step => step.status === 'active')
  if (activeStep) {
    return activeStep.title
  }
  const errorStep = props.steps.find(step => step.status === 'error')
  if (errorStep) {
    return `오류: ${errorStep.title}`
  }
  return '초기화 중...'
})
</script>

<style scoped>
.loading-progress-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 20px;
  background-color: var(--background);
}

.progress-steps {
  width: 100%;
  max-width: 500px;
  margin-top: 40px;
}

.progress-step {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.02);
  transition: all 0.3s ease;
}

.step-pending {
  opacity: 0.5;
}

.step-active {
  background-color: rgba(255, 255, 255, 0.05);
  border-left: 3px solid var(--main);
}

.step-completed {
  opacity: 0.8;
}

.step-error {
  background-color: rgba(255, 0, 0, 0.1);
  border-left: 3px solid var(--notification);
}

.step-indicator {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  font-weight: 600;
  font-size: 14px;
}

.step-active .step-indicator {
  background-color: var(--main);
  color: white;
  animation: pulse 2s ease-in-out infinite;
}

.step-completed .step-indicator {
  background-color: #10b981;
  color: white;
}

.step-error .step-indicator {
  background-color: var(--notification);
  color: white;
}

.step-number {
  color: rgba(255, 255, 255, 0.6);
}

.step-icon {
  font-size: 18px;
  font-weight: bold;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--font-black);
  margin-bottom: 4px;
}

.step-pending .step-title {
  color: rgba(255, 255, 255, 0.5);
}

.step-message {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
}

.step-error-message {
  font-size: 12px;
  color: var(--notification);
  margin-top: 6px;
  font-weight: 500;
  line-height: 1.5;
  padding: 8px;
  background-color: rgba(209, 59, 109, 0.1);
  border-radius: 4px;
  border-left: 2px solid var(--notification);
}

.step-error-message strong {
  display: block;
  margin-bottom: 4px;
  font-weight: 600;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>

