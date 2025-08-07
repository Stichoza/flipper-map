<template>
  <div
    id="helpModal"
    class="modal fade"
    tabindex="-1"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fas fa-question-circle me-1" />
            How to use Flipper Map
          </h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
          />
        </div>
        <div class="modal-body px-4">
          <div class="mb-4">
            <ol>
              <li>Connect your Flipper Zero to the computer using USB cable.</li>
              <li>Click the <span class="fw-medium">Connect</span> button in the sidebar and select your Flipper Zero device from the browser dialog.</li>
              <li>Wait for the app to sync files from your device.</li>
            </ol>
            <div class="alert alert-success">
              <i class="fas fa-lock me-1" />
              Your files are never sent to any server and always remain private.
              <a
                href="https://github.com/Stichoza/flipper-map"
                class="link-success"
              >View source on GitHub</a>.
            </div>
            <p>
              Pins on the map represent your Flipper files with location data. Click a pin to view detailed information about the file.
              Flipper Map currently supports <i class="fas fa-wave-square color-subghz" /> Sub-GHz, <i class="fas fa-wifi color-nfc" /> NFC and <i class="fas fa-id-card-clip color-rfid" /> RFID files.
            </p>
            <ul>
              <li><span class="fw-bold">Files must include <code>Lat</code> and <code>Lon</code> lines to appear on the map.</span></li>
              <li><a href="https://momentum-fw.dev/">Momentum</a> and <a href="https://github.com/RogueMaster/flipperzero-firmware-wPlugins">RogueMaster</a> firmware automatically add these lines using GPS module (via GPIO).</li>
              <li>For the official firmware or <a href="https://flipperunleashed.com/">Unleashed</a>, coordinates should be added manually.</li>
              <li>You can also add location data by editing files on your SD card or using the Flipper mobile app.</li>
              <li><code>Latitude</code> and <code>Longitude</code> lines are also supported as an alternative of <code>Lat</code> and <code>Lon</code>.</li>
              <li>Files without location data will still appear in the sidebar but won't be shown on the map.</li>
            </ul>
          </div>
          <div class="mb-4">
            <h6>Example File</h6>
            <pre class="border rounded bg-body-secondary py-2 px-3 small">
Filetype: Flipper SubGhz Key File
Version: 1
Frequency: 433920000
Preset: FuriHalSubGhzPresetOok270Async
<strong class="text-success">Lat: 41.123456789</strong>
<strong class="text-success">Lon: 44.987654321</strong>
Protocol: Princeton
...</pre>
          </div>
          <div class="mb-4">
            <p>
              <span class="fw-bold">Tip</span>: Check out <a href="https://github.com/Stichoza/flipper-nearby-files"><i class="fas fa-location-dot" /> <span class="fw-medium">Nearby Files</span></a> — a native Flipper application for viewing nearby files directly on your Flipper Zero without the need to connect it to your computer using USB cable.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
