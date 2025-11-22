<template>
  <div class="sponsor-box" @click="handleSponsorClick">
    <div class="sponsor-placeholder">
      <div class="sponsor-content">
        <h3>{{ sponsorTitle }}</h3>
        <p>{{ sponsorDescription }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  sponsorUrl?: string
  sponsorTitle?: string
  sponsorDescription?: string
}

const props = withDefaults(defineProps<Props>(), {
  sponsorUrl: 'https://github.com/deliciouscat',
  sponsorTitle: 'Sponsor',
  sponsorDescription: 'Support this project'
})

function handleSponsorClick() {
  window.open(props.sponsorUrl, '_blank')
}
</script>

<style scoped>
.sponsor-box {
  border: 1px dashed var(--grey-lv2);
  border-radius: 0;
  padding: 16px;
  background-color: var(--background);
  cursor: pointer;
  transition: background-color 0.2s;
}

.sponsor-box:hover {
  background-color: var(--grey-lv1);
}

.sponsor-placeholder {
  width: 100%;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.sponsor-placeholder::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    var(--grey-lv2) 10px,
    var(--grey-lv2) 20px
  );
  opacity: 0.3;
}

.sponsor-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.sponsor-content h3 {
  color: var(--font-black);
  margin: 0 0 8px 0;
}

.sponsor-content p {
  color: var(--grey-lv3);
  margin: 0;
}
</style>

