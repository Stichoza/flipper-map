<script setup>
import { ref, computed } from 'vue';

const dismissed = ref(localStorage.getItem('appStoreBannerDismissed') === '1');

const isMac = computed(() => /Macintosh|MacIntel|MacPPC|Mac68K/i.test(navigator.userAgent));
const platformLabel = computed(() => isMac.value ? 'iOS and Mac App Store' : 'App Store');

const dismiss = () => {
  dismissed.value = true;
  localStorage.setItem('appStoreBannerDismissed', '1');
};
</script>

<template>
  <div
    v-if="!dismissed"
    class="app-store-banner d-flex align-items-center justify-content-between p-2"
  >
    <div class="d-flex align-items-center gap-2 small ms-1">
      <i class="fab fa-app-store fs-4" />
      <span class="d-none d-sm-inline">Get the full-featured {{ platformLabel }} version</span>
      <span class="d-sm-none">Get the mobile app</span>
    </div>
    <div class="d-flex align-items-center gap-2">
      <a
        href="https://apps.apple.com/app/apple-store/id6759526315?pt=128571460&ct=Flipper%20Map%20Web&mt=8"
        target="_blank"
        class="btn btn-sm btn-light fw-medium rounded-pill px-3 text-nowrap"
      >
        <i class="fab fa-apple me-1" />
        <span class="d-none d-sm-inline">Get it on App Store</span>
        <span class="d-sm-none">Install</span>
      </a>
      <button
        type="button"
        class="banner-close-btn me-1"
        aria-label="Close"
        @click="dismiss"
      >
        <i class="fas fa-xmark" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.app-store-banner {
  position: fixed;
  bottom: 12px;
  left: 12px;
  right: 12px;
  z-index: 1100;
  background: rgba(26, 26, 26, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #fff;
  border-radius: 999px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.banner-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #fff;
  color: #000;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
}
</style>
