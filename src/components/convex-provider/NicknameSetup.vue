<template>
  <div class="nickname-setup-overlay">
    <div class="nickname-setup-container">
      <div class="setup-header">
        <img src="@/components/assets/logo.svg" alt="WizPerch Logo" class="logo" />
        <h2>환영합니다!</h2>
        <p>사용하실 닉네임을 입력해주세요.</p>
      </div>

      <div class="setup-form">
        <input
          v-model="nickname"
          type="text"
          placeholder="닉네임 (2-20자)"
          class="nickname-input"
          maxlength="20"
          @keyup.enter="handleSubmit"
          :disabled="isSubmitting"
        />
        <div v-if="error" class="error-message">{{ error }}</div>
        <button
          @click="handleSubmit"
          class="submit-button"
          :disabled="!isValidNickname || isSubmitting"
        >
          <span v-if="!isSubmitting">시작하기</span>
          <div v-else class="spinner"></div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useConvexMutation } from 'convex-vue'
import { api } from '../../../convex/_generated/api'

const emit = defineEmits<{
  complete: []
}>()

// State
const nickname = ref('')
const error = ref('')
const isSubmitting = ref(false)

// Convex mutation
const { mutate: updateUserData } = useConvexMutation(api.users.updateUserData)

// Validation
const isValidNickname = computed(() => {
  const trimmed = nickname.value.trim()
  return trimmed.length >= 2 && trimmed.length <= 20
})

async function handleSubmit() {
  if (!isValidNickname.value || isSubmitting.value) return

  error.value = ''
  isSubmitting.value = true

  try {
    // Clerk identity를 통해 사용자 정보 업데이트
    await updateUserData({
      name: nickname.value.trim(),
    })
    emit('complete')
  } catch (err: any) {
    console.error('Failed to update nickname:', err)
    error.value = err.message || '닉네임 설정에 실패했습니다. 다시 시도해주세요.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.nickname-setup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.nickname-setup-container {
  background-color: var(--background);
  padding: 32px;
  max-width: 400px;
  width: 90%;
  border-radius: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.setup-header {
  text-align: center;
  margin-bottom: 24px;
}

.logo {
  height: 48px;
  width: auto;
  margin-bottom: 16px;
}

.setup-header h2 {
  color: var(--font-black);
  margin: 0 0 8px 0;
  font-size: 24px;
}

.setup-header p {
  color: var(--grey-lv3);
  margin: 0;
  font-size: 14px;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nickname-input {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--grey-lv2);
  border-radius: 0;
  font-size: 16px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.nickname-input:focus {
  outline: none;
  border-color: var(--main);
}

.nickname-input:disabled {
  background-color: var(--grey-lv1);
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  font-size: 14px;
  text-align: center;
}

.submit-button {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 0;
  background-color: var(--main);
  color: var(--background);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}

.submit-button:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-button:disabled {
  background-color: var(--grey-lv2);
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid var(--background);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

