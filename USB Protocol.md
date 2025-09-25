# Audient EVO 16 USB Protocol (Reverse Engineered)

just use wireshark to MITM the thing and capture the USB traffic

---

## Device Info

**Vendor ID:** 0x2708  
**Product ID:** 0x000a

---

## USB Interfaces

| #   | Type            | Class/Subclass/Proto | Endpoints | Notes              |
| --- | --------------- | -------------------- | --------- | ------------------ |
| 0   | Audio Control   | 0x01/0x01/0x20       | 1         | Mixer, clock, etc. |
| 1   | Audio Streaming | 0x01/0x02/0x20       | 1 (OUT)   | 24ch, 24-bit PCM   |
| 2   | Audio Streaming | 0x01/0x02/0x20       | 1 (IN)    | 24ch, 24-bit PCM   |
| 3   | DFU (Firmware)  | 0xfe/0x01/0x01       | 0         | Firmware upgrade   |

**Endpoints:**

- 0x82 (IN, Interrupt, 6 bytes, Interval 8)
- 0x01 (OUT, Audio, 936 bytes, Interval 1)
- 0x81 (IN, Audio, 936 bytes, Interval 1)

---

## Control Requests

All requests use `bRequest: 0x01` (GET_CUR or SET_CUR).

- **SET:** `bmRequestType: 0x21` (Host→Dev, Class, Interface)
- **GET:** Haven't tested.

| Feature                 | wValue    | wIndex | Payload (size)          | Notes                                                                                    |
| ----------------------- | --------- | ------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| **Request Sample Rate** | 0x0100    | 0x2900 | 4 bytes (Hz, LE)        | e.g. 44.1kHz = `44 ac 00 00`                                                             |
| **Set Clock Source**    | 0x0100    | 0x2800 | 1 byte                  | 01=Internal, 02=Opt1, 03=Opt2                                                            |
| **Persist to NVM**      | 0x1800    | 0x3600 | 4 bytes (`00 00 00 00`) | Write all current settings to on device flash                                            |
| **48V Phantom Power**   | 0x00XX    | 0x3a00 | 4 bytes                 | 01=on, 00=off; XX=channel (e.g. 00=ch1)                                                  |
| **High-Z Input**        | 0x04XX    | 0x0000 | 4 bytes                 | 02=on, 00=off; XX=channel                                                                |
| **Preamp Gain**         | 0x01XX    | 0x3a00 | 4 bytes                 | Last 3 bytes: gain (0 to 50dB: `00 00 00`–`32 00 00`, -1 to -8dB: `ff ff ff`–`f8 ff ff`) |
| **Mute**                | 0x02XX    | 0x3a00 | 4 bytes                 | 01=mute, 00=unmute; XX=channel                                                           |
| **Stereo Link**         | 0x03XX    | 0x3a00 | 4 bytes                 | 01=link, 00=unlink; link chN+1 to chN                                                    |
| **Polarity**            | 0x0dXX    | 0x0b00 | 1 byte                  | 01=invert, 00=normal; not hardware-controllable                                          |
| **Rename Chan**         | 0x06XX    | 0x3a00 | up to 17 bytes (ASCII)  | Null-terminated string                                                                   |
| **Patch Output**        | 0x06XX    | 0x3300 | 1 byte                  | \*See patch table below                                                                  |
| **Patch HP**            | 0x06XX    | 0x3300 | 1 byte                  | See patch table below                                                                    |
| **Loopback Src**        | 0x0616/17 | 0x3400 | 1 byte                  | Loopback is served on driver's CH23/24, See patch table below                            |

- `XX` = channel or port number (e.g., 0x00 for ch1)
- All payloads are little-endian unless noted.
- \* For some reason, when patching line outputs, main mix's index is different from headphone/loopback.

---

### Patch Source Table

| Source     | Payload for Output | Payload for HeadphoneJack | Payload for Loopback |
| ---------- | ------------------ | ------------------------- | -------------------- |
| MAIN MIX   | 3f/40              | 43/44                     | 43/44                |
| ALT SPK    | 41/42              | 41/42                     | 41/42                |
| CUE A      | 32/33              | 32/33                     | 32/33                |
| CUE B      | 34/35              | 34/35                     | 34/35                |
| CUE C      | 36/37              | 36/37                     | 36/37                |
| CUE D      | 38/39              | 38/39                     | 38/39                |
| DAW 1/2    | 00/01              | 00/01                     | 00/01                |
| ADAT 15/16 | —                  | —                         | 2e/2f (disable)      |

> when loopback is patched to 2e&2f, it will act like ADAT 15/16 IN, aka disable loopback

---

### NIMPL

A lot of things haven't been figured out yet, like monitor mixs.
