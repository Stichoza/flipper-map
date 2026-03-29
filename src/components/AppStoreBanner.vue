<script setup>
import { ref, computed, onMounted } from 'vue';
import appStoreBadge from '@/assets/app-store-badge.svg';

const APP_STORE_URL = 'https://apps.apple.com/us/app/flipper-map/id6759526315';
const DISMISSED_KEY = 'appStoreBannerDismissed';

const dismissed = ref(false);
const isAppleDevice = ref(false);
const isMacOS = ref(false);

onMounted(() => {
  dismissed.value = localStorage.getItem(DISMISSED_KEY) === 'true';
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isTouchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 0;
  isMacOS.value = /Macintosh/.test(ua) && !isIOS && navigator.maxTouchPoints === 0;
  isAppleDevice.value = isIOS || isTouchMac || /Macintosh/.test(ua);
});

const visible = computed(() => isAppleDevice.value && !dismissed.value);

const platformLabel = computed(() => isMacOS.value ? 'macOS' : 'iOS');

const dismiss = () => {
  dismissed.value = true;
  localStorage.setItem(DISMISSED_KEY, 'true');
};
</script>

<template>
  <Transition name="banner-slide">
    <div
      v-if="visible"
      class="app-store-banner d-flex align-items-center justify-content-between px-3 py-2"
    >
      <div class="d-flex flex-column">
        <span class="banner-title fw-semibold small">Full-featured {{ platformLabel }} app available</span>
        <span
          class="banner-subtitle text-muted"
          style="font-size: 0.72rem;"
        >More features on the native app</span>
      </div>
      <div class="d-flex align-items-center gap-2 flex-shrink-0">
        <a
          :href="APP_STORE_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="app-store-badge-link"
          aria-label="Download Flipper Map on the App Store"
        >
          <img
            :src="appStoreBadge"
            alt="Download on the App Store"
            class="app-store-badge-img"
            height="34"
          >
        </a>
        <button
          type="button"
          class="btn-close btn-close-sm ms-1"
          aria-label="Dismiss"
          @click="dismiss"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.app-store-banner {
  background: #f5f5f7;
  border-top: 1px solid #e0e0e0;
  width: 100%;
  z-index: 1000;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

@media (prefers-color-scheme: dark) {
  .app-store-banner {
    background: #1c1c1e;
    border-top-color: #38383a;
  }

  .banner-title {
    color: #f5f5f7;
  }
}

.app-store-badge-img {
  display: block;
}

.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.banner-slide-enter-from,
.banner-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
