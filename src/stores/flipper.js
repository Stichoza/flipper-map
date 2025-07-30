import { ref } from 'vue';
import { defineStore } from 'pinia';
import { SHA256 } from 'crypto-js';

export const useFlipperStore = defineStore('flipper', () => {
  const port = ref(null);
  const reader = ref(null);
  const writer = ref(null);
  const isConnected = ref(false);
  const isConnecting = ref(false);
  const isSyncing = ref(false);
  const connectionError = ref(null);
  const generalError = ref(null);
  const fileCount = ref(0); // Needed for storing discovered files count before importing them
  const fileList = ref([]);
  const fileReadQueue = ref([]);
  const isProcessingFiles = ref(false);
  const isProcessingDirectories = ref(false);
  const hardwareName = ref(null);
  const hardwareModel = ref(null);
  const currentFile = ref({
    hash: '',
    name: '',
    path: '',
    type: '',
    content: '',
    latitude: 0,
    longitude: 0,
    key: '',
  });

  const directories = [
    '/ext/subghz',
    '/ext/nfc',
    '/ext/lfrfid',
  ];
  
  const connect = async () => {
    if (!navigator.serial) {
      connectionError.value = "Web Serial API is not supported in your browser";
      return false;
    }

    try {
      isConnecting.value = true;
      port.value = await navigator.serial.requestPort({
        filters: [{ usbVendorId: 0x0483 }]
      });
      await port.value.open({ baudRate: 230400 });

      // Create reader and writer
      const textDecoder = new TextDecoderStream();
      port.value.readable.pipeTo(textDecoder.writable);
      reader.value = textDecoder.readable.getReader();
      
      const textEncoder = new TextEncoderStream();
      textEncoder.readable.pipeTo(port.value.writable);
      writer.value = textEncoder.writable.getWriter();
      
      readLoop(); // Start infinite reading loop
      
      // Send initial command to ensure we're in CLI mode (and ger device details)
      await writer.value.write("!\r\n");
      
      // Wait a bit for the device to respond
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set connected state
      isConnected.value = true;
      isConnecting.value = false;

      await syncFiles();

      return true;
    } catch (error) {
      console.error("Error connecting to Flipper:", error);
      connectionError.value = error.message || "Failed to connect to Flipper";
      if (port.value && port.value.readable) {
        try {
          await port.value.close();
        } catch (closeError) {
          console.error("Error closing port:", closeError);
        }
      }
      port.value = null;
      reader.value = null;
      writer.value = null;

      return false;
    } finally {
      isConnecting.value = false;
    }
  };

  const syncFiles = async () => {
    if (!writer.value || !isConnected.value) return;
    
    try {
      isSyncing.value = true;
      isProcessingFiles.value = false;
      isProcessingDirectories.value = true;
      fileCount.value = 0;
      fileList.value = [];
      fileReadQueue.value = [];

      for (const directory of directories) {
        console.log(`Processing ${directory}`);
        await writer.value.write(`storage tree "${directory.replace(/\/\/+/g, '/')}"\r\n`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      isProcessingDirectories.value = false;
      isProcessingFiles.value = true;

      while (fileReadQueue.value.length) {
        const file = fileReadQueue.value.shift();
        console.log(`Processing ${file}`);
        currentFile.value = {
          hash: SHA256(file).toString(),
          name: file.split('/').pop().split('.').shift(),
          path: file,
          type: {sub: 'subghz', nfc: 'nfc', rfid: 'rfid'}[file.split('.').pop()],
          content: '',
          latitude: null,
          longitude: null,
          key: '',
        };
        await writer.value.write(`storage read "${file.replace(/\/\/+/g, '/')}"\r\n`);
        await new Promise(resolve => setTimeout(resolve, 200));

        fileList.value.push(currentFile.value);
      }

    } catch (error) {
      console.error("Error syncing files:", error);
    } finally {
      isSyncing.value = false;
      isProcessingFiles.value = false;
      isProcessingDirectories.value = false;
    }
  };

  const processLine = (line) => {
    if (isSyncing.value && isProcessingDirectories.value) {
      const matches = line.match(/\[\F\]\s+(\/ext\/(subghz|nfc|lfrfid)\/[A-Za-z0-9_,\+\-\s\./\(\)]+\.(sub|nfc|rfid))\s\d+b/m)

      if (matches && matches[1]) {
        const filePath = matches[1];
        if (filePath && !filePath.includes('/.') && !filePath.includes('/assets/')) {
          console.log(`Found file: ${filePath}`);
          fileReadQueue.value.push(filePath);
          fileCount.value++;
        }
      }
    } else if (isSyncing.value && isProcessingFiles.value) {
      currentFile.value.content += line + '\n';

      if (
        line.toLowerCase().startsWith('latitude:') || // Original version
        line.toLowerCase().startsWith('latitute:') || // https://github.com/Next-Flip/Momentum-Firmware/pull/246#issuecomment-2395826614
        line.toLowerCase().startsWith('lat:') // Momentum, RogueMaster
      ) {
        currentFile.value.latitude = parseFloat(line.split(':').pop()) || null;
      }

      if (
        line.toLowerCase().startsWith('longitude:') || // Original version
        line.toLowerCase().startsWith('lon:') || // Momentum, RogueMaster
        line.toLowerCase().startsWith('lng:') // Just in case
      ) {
        currentFile.value.longitude = parseFloat(line.split(':').pop()) || null;
      }

      if (line.toLowerCase().startsWith('key:')) {
        currentFile.value.key = line.split(':').pop().trim();
      }

      if (line.toLowerCase().startsWith('raw:')) {
        currentFile.value.key = 'RAW';
      }
    }

    if (line.toLowerCase().startsWith('loader is locked')) {
      generalError.value = line.trim();
      setTimeout(() => generalError.value = null, 50);
    }

    if (line.toLowerCase().startsWith('hardware_name')) {
      hardwareName.value = line.split(':').pop().trim();
    }

    if (line.toLowerCase().startsWith('hardware_model')) {
      hardwareModel.value = line.split(':').pop().trim();
    }
  }

  const readLoop = async () => {
    if (!reader.value) return;
    
    try {
      let buffer = '';
      
      while (true) {
        const { value, done } = await reader.value.read();
        if (done) {
          break; // Reader has been canceled
        }
        
        buffer += value; // Append to buffer and process
        const lines = buffer.split("\n"); // Process complete lines
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
          processLine(line.trim());
        }
      }
    } catch (error) {
      console.error("Error reading from Flipper:", error);
      if (isConnected.value) {
        // Try to reconnect or handle the error
        connectionError.value = "Connection lost: " + (error.message || "Unknown error");
        isConnected.value = false;
      }
    }
  };
  
  const disconnect = async () => {
    if (!isConnected.value || !port.value) return;
    
    try {
      if (reader.value) {
        await reader.value.cancel();
        reader.value = null;
      }
      
      if (writer.value) {
        await writer.value.close();
        writer.value = null;
      }
      
      if (port.value) {
        await port.value.close();
        port.value = null;
      }
      
      isConnected.value = false;
      isConnecting.value = false;
      isSyncing.value = false;
    } catch (error) {
      console.error("Error disconnecting from Flipper:", error);
    }
  };

  const fileByHash = (hash) => {
    return fileList.value.find(file => file.hash === hash);
  };

  const launchFile = async (file) => {
    if (!writer.value || !isConnected.value) return;

    const app = {subghz: 'Sub-GHz', nfc: 'NFC', rfid: '"125 kHz RFID"'}[file.type]; // lowercase names like nfc or lfrfid does not work for some reason, subghz works.

    console.log(`Launchung ${app} file: ${file.path}`);
    
    // Works ONLY without quotes: https://github.com/flipperdevices/flipperzero-firmware/issues/4248
    await writer.value.write(`loader close\r\n`);
    await new Promise(resolve => setTimeout(resolve, 100));
    await writer.value.write(`loader open ${app} ${file.path}\r\n`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const getFileIcon = (type) => {
    switch (type) {
      case 'subghz':
        return 'wave-square';
      case 'nfc':
        return 'wifi';
      case 'rfid':
        return 'id-card-clip';
      default:
        return 'question';
    }
  };
  
  return {
    port,
    reader,
    writer,
    isConnected,
    isConnecting,
    isSyncing,
    connectionError,
    generalError,
    fileCount,
    fileList,
    fileByHash,
    isProcessingFiles,
    isProcessingDirectories,
    hardwareName,
    hardwareModel,
    getFileIcon,
    connect,
    disconnect,
    syncFiles,
    launchFile
  };
});
