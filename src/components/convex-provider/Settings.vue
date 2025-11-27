<template>
  <div class="settings-content">
    <div class="settings-nav">
      <button @click="goBack" class="back-button">
        <PhArrowLeft :size="20" weight="bold" />
        <span>뒤로가기</span>
      </button>
    </div>

    <div class="settings-header">
      <h2>설정</h2>
    </div>

    <div class="settings-section">
      <h3 class="section-title">언어 설정</h3>
      <div class="setting-item">
        <label for="language-select" class="setting-label">언어</label>
        <select id="language-select" v-model="selectedLanguage" class="setting-select">
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">테마 설정</h3>
      <div class="setting-item">
        <label for="theme-select" class="setting-label">테마</label>
        <select id="theme-select" v-model="selectedTheme" class="setting-select">
          <option value="light">라이트</option>
          <option value="dark">다크 (준비 중)</option>
        </select>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">알림 설정</h3>
      <div class="setting-item">
        <label class="setting-label">댓글 알림</label>
        <label class="toggle-switch">
          <input type="checkbox" v-model="notificationsEnabled" />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <div class="settings-footer">
      <p class="version-info">WizPerch v0.0.1</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Settings 컴포넌트
 *
 * 이 컴포넌트는 애플리케이션 설정을 관리합니다.
 *
 * @author Vue + Convex + Clerk Auth System
 * @version 1.0.0
 */
import { ref } from 'vue';
import { PhArrowLeft } from '@phosphor-icons/vue';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();

const selectedLanguage = ref('ko');
const selectedTheme = ref('light');
const notificationsEnabled = ref(true);

function goBack() {
  appStore.setOverlayMode(null);
}
</script>

<style scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background-color: var(--background);
}

.settings-nav {
  padding: 16px 20px;
  border-bottom: 2px solid var(--grey-lv2);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 2px solid var(--grey-lv2);
  border-radius: 0;
  background-color: var(--background);
  color: var(--font-black);
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: var(--grey-lv1);
}

.back-button svg {
  fill: var(--font-black);
}

.settings-header {
  padding: 40px 20px 20px;
}

.settings-header h2 {
  color: var(--font-black);
  margin: 0;
  font-size: 24px;
}

.settings-section {
  margin: 0 20px 24px;
  padding: 20px;
  border: 2px solid var(--grey-lv2);
  border-radius: 0;
}

.section-title {
  color: var(--font-black);
  font-size: 16px;
  margin: 0 0 16px 0;
  font-weight: bold;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.setting-item:not(:last-child) {
  border-bottom: 1px solid var(--grey-lv1);
}

.setting-label {
  color: var(--font-black);
  font-size: 14px;
}

.setting-select {
  padding: 8px 12px;
  border: 2px solid var(--grey-lv2);
  border-radius: 0;
  background-color: var(--background);
  color: var(--font-black);
  font-size: 14px;
  cursor: pointer;
  min-width: 120px;
}

.setting-select:focus {
  outline: none;
  border-color: var(--main);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--grey-lv2);
  transition: 0.3s;
  border-radius: 0;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: var(--background);
  transition: 0.3s;
}

input:checked+.toggle-slider {
  background-color: var(--main);
}

input:checked+.toggle-slider:before {
  transform: translateX(24px);
}

.settings-footer {
  margin-top: auto;
  padding: 20px;
  text-align: center;
  border-top: 2px solid var(--grey-lv2);
}

.version-info {
  color: var(--grey-lv3);
  font-size: 12px;
  margin: 0;
}
</style>
