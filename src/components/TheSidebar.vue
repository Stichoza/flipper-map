<script setup>
import { ref, watch } from 'vue';
import { useFlipperStore } from '@/stores/flipper.js';
import { notify } from '@/helpers/notification.js';

const props = defineProps({
  pins: {
    type: Array,
    required: true
  },
  searchQuery: {
    type: String,
    default: ''
  },
  selectedPin: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['search', 'select-pin']);

const flipper = useFlipperStore();
const searchInput = ref(props.searchQuery);

const handleFlipperConnection = async () => {
  if (flipper.isConnected) {
    flipper.disconnect();
  } else {
    flipper.connect();
  }
}

watch(() => flipper.isSyncing, () => {
  if (!flipper.isSyncing) {
    notify(`${flipper.fileList.length || 'No'} files discovered`, 'success');
  }
});

const handleSearch = () => {
  emit('search', searchInput.value);
};

const handleSelectPin = (pin) => {
  if (pin.latitude && pin.longitude) {
    emit('select-pin', pin);
  }
}

</script>

<template>
  <div class="sidebar border-end d-flex flex-column w-100 h-100">
    <div class="sidebar-header">
      <div class="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-2">
          <div class="d-flex align-items-center justify-content-center bg-white rounded-circle p-1 size-32">
            <i class="fas fa-location-dot text-primary fs-6" />
          </div>
          <h1 class="mb-0 fs-3 pixel-font">
            Flipper Map
          </h1>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button
            :disabled="flipper.isConnecting"
            class="btn btn-sm d-flex align-items-center gap-1 btn-light"
            @click="handleFlipperConnection"
          >
            <i :class="['fas', flipper.isSyncing ? 'fa-sync fa-spin' : (flipper.isConnected ? 'fa-check' : (flipper.isConnecting ? 'fa-spinner fa-spin' : 'fa-plug'))]" />
            <span>{{ flipper.isSyncing ? 'Syncing' : (flipper.isConnected ? 'Connected' : (flipper.isConnecting ? 'Connecting' : 'Connect')) }}</span>
          </button>
          <button
            class="btn btn-sm btn-light"
            data-bs-toggle="modal"
            data-bs-target="#settingsModal"
          >
            <i class="fas fa-cog" />
          </button>
        </div>
      </div>
    </div>

    <div class="sidebar-search p-3 border-bottom">
      <div class="position-relative">
        <span class="position-absolute top-50 start-0 translate-middle-y ms-3">
          <i class="fas fa-search text-muted" />
        </span>
        <input
          v-model="searchInput"
          type="text"
          class="form-control ps-5"
          :placeholder="flipper.isSyncing ? `Importing file ${flipper.fileList.length} out of ${flipper.fileCount}` : `Search${flipper.fileList.length ? ' ' + flipper.fileList.length + ' pins' : ''}...`"
          @input="handleSearch"
        >
      </div>
      <div>
        <div v-if="flipper.isSyncing">
          <div class="progress mt-3">
            <div
              :style="{ width: flipper.fileList.length / (flipper.fileCount || 1) * 100 + '%' }"
              class="progress-bar progress-bar-striped progress-bar-animated"
            />
          </div>
        </div>
      </div>
    </div>
    
    <div class="sidebar-content flex-grow-1 overflow-auto">
      <div
        v-if="pins.length === 0"
        class="d-flex flex-column align-items-center justify-content-center py-5"
      >
        <div v-if="!flipper.isConnected">
          <p class="text-muted small text-center">
            Connect Flipper to see files.
          </p>
          <div class="mt-5 text-center">
            <button
              type="button"
              class="btn btn-sm btn-link text-decoration-none"
              data-bs-toggle="modal"
              data-bs-target="#helpModal"
            >
              <i class="fas fa-question-circle" /> Help
            </button>
          </div>
        </div>
        <p v-else-if="flipper.isSyncing">
          <span class="text-muted small">Syncing...</span>
        </p>
        <p v-else>
          <span class="text-muted small">No files found.</span>
        </p>
      </div>
    
      <div v-else>
        <div class="list-group list-group-flush">
          <a
            v-for="pin in pins"
            :key="pin.hash"
            href="#"
            class="list-group-item list-group-item-action px-3 py-3 overflow-hidden"
            :class="{'bg-body-secondary': selectedPin && selectedPin.hash === pin.hash, 'd-none': !pin.visible}"
            @click.prevent="handleSelectPin(pin)"
          >
            <div class="d-flex align-items-center">
              <div
                class="d-flex align-items-center justify-content-center rounded-circle shadow-sm flex-shrink-0 size-46"
                :class="'bg-' + pin.type"
              >
                <i :class="['fas', `fa-${flipper.getFileIcon(pin.type)}`, 'text-white']" />
              </div>
              <div
                class="flex-grow-1 min-width-0 mx-3 overflow-hidden"
                :class="pin.distance ? '' : 'opacity-75'"
              >
                <span class="d-block fw-medium small text-truncate">{{ pin.name }}</span>
                <div class="text-muted small d-flex align-items-center text-truncate">
                  <div v-if="pin.distance">
                    <i class="fas fa-location-dot me-1 small flex-shrink-0" />
                    <span class="text-truncate">{{ pin.distanceText }} away</span>
                  </div>
                  <div v-else-if="pin.latitude && pin.longitude">
                    <i class="fas fa-location-pin-lock me-1 small flex-shrink-0" />
                    <span class="text-truncate">Unknown distance</span>
                  </div>
                  <div v-else>
                    <i class="fas fa-location-pin-lock me-1 small flex-shrink-0" />
                    <span class="text-truncate">No location</span>
                  </div>
                </div>
              </div>
              <div class="flex-shrink-0">
                <i
                  v-if="pin.distance"
                  class="fas fa-chevron-right text-muted"
                />
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
