<script setup>
import { onMounted, onUnmounted, ref, toRaw, watch } from 'vue';
import { useLocationStore } from '@/stores/location.js';
import { useFlipperStore } from '@/stores/flipper.js';
import { notify } from '@/helpers/notification';
import { Modal } from 'bootstrap';
import L from 'leaflet';
import 'leaflet-easybutton';
import 'leaflet.marker.slideto';
import 'leaflet.markercluster';
import 'leaflet.markercluster.freezable';
import SmoothMarkerBouncing from 'leaflet.smooth_marker_bouncing';

SmoothMarkerBouncing(L);

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

const emit = defineEmits(['select-pin']);

const map = ref(null);
const clusters = ref(null);
const markers = ref({});
const userMarker = ref(null);
const defaultZoom = 17;
const isMovingPin = ref(false);
const movingPinHash = ref(null);
const clusteringEnabled = ref(true);

const location = useLocationStore()
const flipper = useFlipperStore()

onMounted(async () => {
  
  const flag = `
    <svg xmlns="http://www.w3.org/2000/svg" id="flag-icons-ge" viewBox="0 0 640 480" width="12" height="8" class="leaflet-attribution-flag">
      <path fill="#fff" d="M0 0h640v480H0z"/><path fill="red" d="M272 0h96v480h-96z"/><path fill="red" d="M0 192h640v96H0z"/>
      <path fill="red" fill-rule="evenodd" d="M146.8 373.1c1-16.8 4-31.1 4-31.1s-9.8 1-14.8 1-14.8-1-14.8-1 3 14.3 4 31.2c-16.9-1-31.2-4-31.2-4s1 7.4 1 14.8-1 14.8-1 14.8 14.3-3 31.2-4c-1 16.9-4 31.2-4 31.2s7.4-1 14.8-1 14.8 1 14.8 1-3-14.3-4-31.2c16.9 1 31.2 4 31.2 4s-1-9.8-1-14.8 1-14.8 1-14.8-14.3 3-31.1 4zm368-288c1-16.8 4-31.1 4-31.1s-9.8 1-14.8 1-14.8-1-14.8-1 3 14.3 4 31.1c-16.9-1-31.2-3.9-31.2-3.9s1 7.4 1 14.8-1 14.8-1 14.8 14.3-3 31.2-4c-1 16.9-4 31.2-4 31.2s7.4-1 14.8-1 14.8 1 14.8 1-3-14.3-4-31.1c16.9 1 31.2 4 31.2 4s-1-10-1-14.9 1-14.8 1-14.8-14.3 3-31.2 4zm-368 0c1-16.8 4-31.1 4-31.1s-9.8 1-14.8 1-14.8-1-14.8-1 3 14.3 4 31.2c-16.9-1-31.2-4-31.2-4s1 7.4 1 14.8-1 14.8-1 14.8 14.3-3 31.2-4c-1 16.9-4 31.2-4 31.2s7.4-1 14.8-1 14.8 1 14.8 1-3-14.3-4-31.1c16.9 1 31.2 4 31.2 4s-1-9.8-1-14.8 1-14.8 1-14.8-14.3 3-31.1 4zm368 288c1-16.8 4-31.1 4-31.1s-9.8 1-14.8 1-14.8-1-14.8-1 3 14.3 4 31.2c-16.9-1-31.2-4-31.2-4s1 7.4 1 14.8-1 14.8-1 14.8 14.3-3 31.2-4c-1 16.9-4 31.2-4 31.2s7.4-1 14.8-1 14.8 1 14.8 1-3-14.3-4-31.2c16.9 1 31.2 4 31.2 4s-1-9.8-1-14.8 1-14.8 1-14.8-14.3 3-31.2 4z"/>
    </svg>`;
  
  const attribution = '<span>Made in ' + flag + ' by <a href="https://stichoza.com">Stichoza</a></span>';
  
  const layers = {
    'Normal': L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a> | ' + attribution,
      subdomains: 'abcd',
      maxZoom: 20
    }),
    'Light': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a> | ' + attribution,
      subdomains: 'abcd',
      maxZoom: 20
    }),
    'Dark': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a> | ' + attribution,
      subdomains: 'abcd',
      maxZoom: 20
    }),
    'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; <a href="https://www.esri.com/en-us/arcgis/products/arcgis-online/basemaps" target="_blank" rel="noopener">ESRI</a> | ' + attribution,
      maxZoom: 19
    }),
  };
  
  const baseLayer = window.localStorage.getItem('baseLayer') ?? 'Normal';
  
  map.value = L.map('map', {
    center: window.localStorage.getItem('center')?.split(',') ?? [25, 0],
    zoom: window.localStorage.getItem('zoom') ?? 3,
    zoomControl: true,
    worldCopyJump: true,
    layers: layers[baseLayer] ?? layers['Normal'], // In case old naming is stuck in local storage
  });
  
  // Clusters
  clusters.value = L.markerClusterGroup({
    maxClusterRadius: zoom => zoom < 3 ? 40 : 30,
    animateAddingMarkers: true,
    disableClusteringAtZoom: 18
  }).addTo(toRaw(map.value));
  
  let centerWasSet = false;
  
  // Center map to last known coordinates and zoom level
  if (window.localStorage.getItem('center')) {
    centerWasSet = true;
    map.value.setView(
    window.localStorage.getItem('center')?.split(',') ?? [25, 0],
    window.localStorage.getItem('zoom') ?? defaultZoom
    );
  }
  
  // Set user location marker
  if (location.geolocationSupported()) {
    
    L.easyButton({
      position: 'topleft',
      states: [
      {
        stateName: 'geolocation-button',
        title: 'Center map to current location',
        icon: 'fa-location-crosshairs fa-lg',
        onClick: async () => {
          await location.getUserLocation();
          const { latitude, longitude } = location.userLocation;
          if (latitude && longitude) {
            toRaw(map.value).flyTo([latitude, longitude], Math.max(defaultZoom, map.value.getZoom()));
          }
        },
      },
      ],
    }).addTo(toRaw(map.value))
    
    await location.getUserLocation();
    const { latitude, longitude } = location.userLocation || {};
    
    if (!centerWasSet && latitude && longitude) {
      map.value.setView([latitude, longitude], defaultZoom);
    }
    
    const pulsingIcon = L.divIcon({
      className: 'user-location-marker',
      html: '<div class="pulse"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      tooltipAnchor: [0, -12],
    });
    
    if (latitude && longitude) {
      userMarker.value = L.marker([latitude, longitude], { icon: pulsingIcon })
        .addTo(toRaw(map.value))
        .bindTooltip('Your Location', { direction: 'top' });
    }
    
    // Update user marker location over time
    setInterval(async () => {
      try {
        await location.getUserLocation();
        const { latitude, longitude } = location.userLocation;
        if (latitude && longitude && userMarker.value) {
          toRaw(userMarker.value).slideTo([latitude, longitude], {duration: 3000});
        }
      } catch (error) {
        console.error('Error getting user location update');
      }
    }, 3000);
  }
  
  // Save center locally
  map.value.on('moveend', () => {
    const center = map.value.getCenter()
    window.localStorage.setItem('center', [center.lat, center.lng].join(','))
  })
  
  // Save zoom level locally
  map.value.on('zoomend', () => {
    window.localStorage.setItem('zoom', map.value.getZoom())
  })
  
  map.value.on('baselayerchange', (e) => {
    window.localStorage.setItem('baseLayer', e.name);
    document.body.setAttribute('data-bs-theme', e.name.toLowerCase().includes('dark') ? 'dark' : 'light');
  })
  
  // Initial selection
  document.body.setAttribute('data-bs-theme', baseLayer.toLowerCase().includes('dark') ? 'dark' : 'light');
  
  map.value.on('popupclose', () => {
    emit('select-pin', null);
  });
  
  L.easyButton({
    position: 'topleft',
    states: [
      {
        stateName: 'clustering-enabled',
        title: 'Disable clustering',
        icon: 'fa-circle-nodes fa-lg',
        onClick: async (btn) => {
          clusteringEnabled.value = false;
          toRaw(clusters.value).disableClustering();
          btn.state('clustering-disabled');
        },
      },
      {
        stateName: 'clustering-disabled',
        title: 'Enable clustering',
        icon: 'fa-arrows-to-circle fa-lg',
        onClick: async (btn) => {
          clusteringEnabled.value = true;
          toRaw(clusters.value).enableClustering();
          btn.state('clustering-enabled');
        },
      },
    ],
  }).addTo(toRaw(map.value))
  
  L.control.layers(layers).addTo(toRaw(map.value));
  
  watch(() => props.selectedPin, () => {
    if (props.selectedPin) {
      if (props.selectedPin.latitude && props.selectedPin.longitude) {
        toRaw(map.value).flyTo([props.selectedPin.latitude, props.selectedPin.longitude], defaultZoom, {duration: 0.5}); // Limit duration to make sure popup is able to open
        setTimeout(() => {
          toRaw(markers.value[props.selectedPin.hash]).openPopup();
        }, 1000);
      } else {
        const content = createPopup(props.selectedPin);
        const modal = new Modal('#nonGeolocatedPinModal');
        document.querySelector('#nonGeolocatedPinModal .modal-body').innerHTML = content;
        modal.show();
      }
    }
  });
  
});

const clearMarkers = () => {
  markers.value.forEach(marker => {
    marker.remove();
  });
  markers.value = [];
};

const createMarker = file => {
  const icon = flipper.getFileIcon(file.type);
  const isUnknown = file.name.startsWith('_'); // For my personal use case ¯\_(ツ)_/¯
  
  return L.marker([file.latitude, file.longitude], {
    title: file.name,
    riseOnHover: true,
    icon: L.divIcon({
      className: 'custom-map-marker',
      html: `<div class="bg-${file.type}${isUnknown ? ' unknown-pin' : ''}"><i class="fas fa-${icon}"></i></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    }),
  })
  .bindPopup(createPopup(file), {
    closeButton: false,
    autoPanPadding: [60, 20],
    customHash: file.hash // Used for dynamically updating distance in popup content
  }).on('popupopen', (e) => {
    const popup = e.popup;
    const file = props.pins.find(file => file.hash === popup.options.customHash);

    if (file) {
      const distanceText = file.distanceText;
      popup.getElement().querySelector('.popup-distance-text').textContent = distanceText;
      popup.getElement().querySelector('.popup-coordinates-text').textContent = `${file.latitude.toFixed(6)}, ${file.longitude.toFixed(6)}`; // For moved pins
    }
  })
}

const createPopup = file => {
  const icon = flipper.getFileIcon(file.type);
  const cleanContent = file.content.trim();
  const key = file.key.replace(/00\s/g, '');
  const frequency = file.content.match(/frequency:\s*(\d+)/i)?.[1];
  const protocol = file.content.match(/protocol:\s*(.+)/i)?.[1];
  const bit = file.content.match(/bit:\s*(.+)/i)?.[1];
  const uid = file.content.match(/uid:\s*(.+)/i)?.[1];
  const keyType = file.content.match(/key type:\s*(.+)/i)?.[1];
  const data = file.content.match(/data:\s*(.+)/i)?.[1]; // Show only with keyType (RFID), otherwise it will display RAW SubGHz data
  const type = {subghz: 'Sub-GHz', nfc: 'NFC', rfid: 'RFID'}[file.type] ?? file.type;
  const openVerb = file.type === 'subghz' ? 'Open on Flipper' : 'Emulate on Flipper';
  const hasLocation = file.latitude && file.longitude;

  return `<div class="custom-popup">
    <div class="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom">
      <div class="flex-shrink-0 rounded-circle d-flex justify-content-center align-items-center bg-${file.type} size-24">
        <i class="fas fa-${icon} text-white"></i>
      </div>
      <h6 class="m-0 flex-grow-1 text-truncate">${file.name}</h6>
      <div class="btn-group dropstart">
        <button class="btn btn-link-secondary btn-sm border-0 px-2" data-bs-toggle="dropdown" data-bs-placement="left">
          <i class="fas fa-ellipsis-v"></i>
        </button>
        <ul class="dropdown-menu shadow-sm">
          <li><a class="dropdown-item small ps-2" href="#" onclick="jsLaunchFile('${file.hash}')"><i class="fas fa-fw mx-1 fa-square-arrow-up-right"></i> ${openVerb}</a></li>
          <li><a class="dropdown-item small ps-2${hasLocation ? '' : ' disabled'}" href="#" onclick="jsRelocateFile('${file.hash}')"><i class="fas fa-fw mx-1 ${hasLocation ? 'fa-arrows-up-down-left-right' : 'fa-location-dot'}"></i> ${hasLocation ? 'Move Pin' : 'Set Location'}</a></li>
          <li><a class="dropdown-item small ps-2" href="#" onclick="jsRenameFile('${file.hash}')"><i class="fas fa-fw mx-1 fa-pen-to-square"></i> Rename</a></li>
          <li><a class="dropdown-item small ps-2" href="#" onclick="jsDeleteFile('${file.hash}')"><i class="fas fa-fw mx-1 fa-trash-can"></i> Delete</a></li>
        </ul>
      </div>
    </div>
    <div>
      <div class="mb-1"><strong>Type:</strong> ${type}</div>
      ${frequency ? `<div class="mb-1"><strong>Frequency:</strong> ${frequency/1000000} MHz</div>` : ''}
      ${protocol ? `<div class="mb-1"><strong>Protocol:</strong> ${protocol} ${bit ? `(${bit} bit)` : ''}</div>` : ''}
      ${key ? `<div class="mb-1"><strong>Key:</strong> ${key}</div>` : ''}
      ${uid ? `<div class="mb-1"><strong>UID:</strong> ${uid}</div>` : ''}
      ${keyType ? `<div class="mb-1"><strong>Key Type:</strong> ${keyType}</div>` : ''}
      ${keyType && data ? `<div class="mb-1"><strong>Data:</strong> ${data}</div>` : ''}
      <div class="mb-1"><strong>Distance:</strong> <span class="popup-distance-text">${file.distanceText}</span></div>
      ${file.latitude && file.longitude ? `<div class="mb-1"><strong>Coordinates:</strong> <span class="popup-coordinates-text">${file.latitude.toFixed(6)}, ${file.longitude.toFixed(6)}</span></div>` : ''}
      <div class="mb-1"><strong>Path:</strong> ${file.path}</div>
    </div>
    <details>
      <summary><strong>File content</strong></summary>
      <pre class="mt-2 card p-2 bg-body-secondary" style="max-height: 210px">${cleanContent}</pre>
    </details>
    <div class="mt-2">
      <button class="btn btn-sm btn-secondary w-100 d-flex align-items-center" onclick="jsLaunchFile('${file.hash}')">
        <span class="flex-grow-1 ps-3">${openVerb}</span>
        <i class="fas fa-square-arrow-up-right pull-right"></i></button>
    </div>
  </div>`;
}

const addMarkers = () => {
  const existingPins = Object.keys(markers.value);
  const addedPinHashes = []; // To diff orphaned markers
  
  props.pins.forEach(file => {
    if (!existingPins.includes(file.hash) && file.latitude && file.longitude) {
      try {
        markers.value[file.hash] = createMarker(file).addTo(toRaw(clusters.value));
      } catch (error) {
        notify('Failed to add marker for ' + file.name, 'error');
      }
    }
    addedPinHashes.push(file.hash);
  });

  // TODO: Optimize the removal of orphaned markers
  existingPins.forEach(hash => {
    if (!addedPinHashes.includes(hash)) {
      toRaw(clusters.value).removeLayer(toRaw(markers.value)[hash]);
      delete markers.value[hash];
    }
  });
}

window.jsLaunchFile = (hash) => {
  if (flipper.isSyncing) {
    notify('Please wait until sync is complete', 'warning');
  } else if (!flipper.isConnected) {
    notify('Please connect your Flipper', 'error');
  } else {
    const file = flipper.fileByHash(hash);
    flipper.launchFile(file);
  }
}

window.jsRenameFile = async (hash) => {
  const file = flipper.fileByHash(hash);

  if (flipper.isSyncing) {
    notify('Please wait until sync is complete', 'warning');
  } else if (!flipper.isConnected) {
    notify('Please connect your Flipper', 'error');
  } else if (file) {
    const newName = prompt('Enter new name', file.name);

    if (!newName) {
      notify('File name cannot be empty', 'warning');
      return;
    }

    if (await flipper.renameFile(file, newName)) {
      notify('File renamed successfully', 'success');
    } else {
      notify('Failed to rename file', 'error');
    }
  }
}

window.jsDeleteFile = async (hash) => {
  if (flipper.isSyncing) {
    notify('Please wait until sync is complete', 'warning');
  } else if (!flipper.isConnected) {
    notify('Please connect your Flipper', 'error');
  } else if (confirm('Are you sure you want to delete this file?')) {
    const file = flipper.fileByHash(hash);
    if (await flipper.deleteFile(file)) {
      notify('File deleted successfully', 'success');
    }
  }
}

window.jsRelocateFile = (hash) => {
  const file = flipper.fileByHash(hash);
  
  if (!file || !file.latitude || !file.longitude) {
    return; // Only handle geolocated pins
  }
  
  // Cancel any existing move operation first
  if (isMovingPin.value) {
    cancelMovePin();
  }
  
  // Enter move mode
  isMovingPin.value = true;
  movingPinHash.value = hash;

  // Disable clustering
  toRaw(clusters.value).disableClustering();
  
  // Close any open popups
  toRaw(map.value).closePopup();
  
  // Center map to pin location
  toRaw(map.value).flyTo([file.latitude, file.longitude], defaultZoom, { duration: 0.5 });
  
  // Wait for flyTo animation to complete, then start centering the marker
  const marker = toRaw(markers.value[hash]);
  if (marker) {
    marker.bounce();
    
    setTimeout(() => {
      // Keep marker centered as map moves
      const updateMarkerPosition = () => {
        const center = toRaw(map.value).getCenter();
        marker.setLatLng(center);
      };
      
      // Set initial position to center
      updateMarkerPosition();
      
      toRaw(map.value).on('move', updateMarkerPosition);
      
      // Store the event handler so we can remove it later
      marker._movePinHandler = updateMarkerPosition;
    }, 500); // Match the flyTo duration
  }
}

const cancelMovePin = () => {
  isMovingPin.value = false;
  
  // Remove bouncing animation and restore marker
  if (movingPinHash.value && markers.value[movingPinHash.value]) {
    const marker = toRaw(markers.value[movingPinHash.value]);
    const file = flipper.fileByHash(movingPinHash.value);
    
    marker.stopBouncing();
    
    // Remove move event listener
    if (marker._movePinHandler) {
      toRaw(map.value).off('move', marker._movePinHandler);
      delete marker._movePinHandler;
    }
    
    // Restore marker to original position
    if (file && file.latitude && file.longitude) {
      marker.setLatLng([file.latitude, file.longitude]);
    }
  }
  
  movingPinHash.value = null;

  // Re-enable clustering if it was enabled before
  if (clusteringEnabled.value) {
    toRaw(clusters.value).enableClustering();
  }
}

const savePinLocation = () => {
  if (movingPinHash.value && markers.value[movingPinHash.value]) {
    const marker = toRaw(markers.value[movingPinHash.value]);
    const file = flipper.fileByHash(movingPinHash.value);
    const center = toRaw(map.value).getCenter();
    
    // Update the file object with new coordinates
    if (file) {
      file.latitude = center.lat;
      file.longitude = center.lng;
      
      // Remove move event listener
      if (marker._movePinHandler) {
        toRaw(map.value).off('move', marker._movePinHandler);
        delete marker._movePinHandler;
      }
      
      // Keep marker at the new position
      marker.setLatLng(center);
      marker.stopBouncing();
      
      // TODO: Implement actual file saving to Flipper device later
      notify('Pin location updated', 'success');
      notify('Unable to persist updated location to Flipper', 'error');
    }
  }
  
  isMovingPin.value = false;
  movingPinHash.value = null;

  // Re-enable clustering if it was enabled before
  if (clusteringEnabled.value) {
    toRaw(clusters.value).enableClustering();
  }
}

window.jsCancelMovePin = cancelMovePin;
window.jsSavePinLocation = savePinLocation;

watch(() => props.pins, () => {
  if (map.value) {
    addMarkers();
  }
}, { deep: true });

onUnmounted(() => {
  if (map.value) {
    map.value.remove();
  }
});
</script>

<template>
  <div class="position-relative w-100 h-100">
    <div
      id="map"
      class="map-container w-100 h-100"
    />
    
    <!-- Move Pin Controls -->
    <div
      v-if="isMovingPin"
      class="move-pin-controls position-absolute bottom-0 start-50 translate-middle-x mb-4"
    >
      <div class="d-flex gap-2">
        <button
          class="btn btn-success btn-sm shadow px-3"
          @click="savePinLocation"
        >
          <i class="fas fa-check me-1" />
          Update Pin Location
        </button>
        <button
          class="btn btn-secondary btn-sm shadow px-3"
          @click="cancelMovePin"
        >
          <i class="fas fa-times me-1" />
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
