# Flipper Map

Connect your Flipper Zero to your computer using USB and visualize signal recordings on map.

**[↗ flipper-map.stichoza.com](https://flipper-map.stichoza.com)**

![Flipper Zero Map](./public/flipper-zero-cover.png)

Flipper files should include `Lat:` and `Lon:` lines. Custom firmwares like Momentum and RogueMaster automatically add these lines using GPS module (via GPIO). For the official firmware or Unleashed, it should be done manually I hope some day they'll implement same features. You can add location info using Flipper mobile app or directly edit them on SD card.

> [!Tip]
> Check out a native Flipper application [Nearby Files](https://github.com/Stichoza/flipper-nearby-files) to view nearby recordings directly on your Flipper Zero.

### Example File

```yaml
Filetype: Flipper SubGhz Key File
Version: 1
Frequency: 433920000
Preset: FuriHalSubGhzPresetOok270Async
Lat: 41.123456
Lon: 44.987654
Protocol: Dickert_MAHS
Bit: 36
Key: 00 00 00 0C 12 AB CD EF
```

### Preview

<img width="1825" height="1008" alt="screen preview copy" src="https://github.com/user-attachments/assets/20384336-1c16-4fc4-a9a4-7c7bd08107f8" />
