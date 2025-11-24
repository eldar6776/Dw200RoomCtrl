# 📚 DW200 Hotel Access Control - Code Documentation

**Version:** 2.0.2.3  
**Date:** 2025-11-23  
**Author:** DW200 Access Control Project

---

## 📂 Project Structure

```
src/
├── main.js                 # Main application entry point
├── controller.js           # Hardware controller (Worker thread)
├── code.js                 # QR scanner service (Worker thread)
├── driver.js               # Hardware driver layer
├── screen.js               # UI screen management
├── services.js             # Event dispatcher
├── view/                   # UI components
│   ├── mainView.js         # Main screen UI
│   ├── passwordView.js     # PIN input UI
│   └── popWin.js           # Popup windows
├── service/                # Business logic services
│   ├── accessService.js    # Access control logic
│   ├── codeService.js      # QR code processing
│   ├── nfcService.js       # NFC/RFID processing
│   ├── gpioKeyService.js   # GPIO button handling
│   ├── mqttService.js      # MQTT communication
│   ├── netService.js       # Network management
│   ├── uartBleService.js   # Bluetooth communication
│   ├── sqliteService.js    # Database operations
│   ├── testDataService.js  # Test data initialization
│   └── configService.js    # Configuration management
└── common/                 # Shared utilities
    ├── utils/
    │   └── utils.js        # Helper functions
    └── consts/
        └── configConst.js  # Configuration constants
```

---

## 🎯 Core Files Explained

### **main.js** - Application Entry Point
**Purpose:** Starts the entire application and coordinates all components

**What it does:**
- ✅ Initializes Event Bus for inter-thread communication
- ✅ Creates 3 worker threads:
  - `qr_scanner` - Handles QR code scanning (code.js)
  - `controller` - Manages hardware (controller.js)
  - `services` - Processes events (services.js pool)
- ✅ Initializes database (SQLite)
- ✅ Sets up screen/UI
- ✅ Feeds watchdog to prevent system reboot
- ✅ Loads test data (for development)

**Flow:**
```
1. startWorkers() → Initialize config, UART, MQTT, database
2. Create QR scanner worker via Event Bus
3. Initialize screen UI
4. Create controller worker
5. Initialize service pool (3 workers)
6. Main loop (5ms) → Feed watchdog + Update screen
```

**Key Functions:**
- `startWorkers()` - Initializes worker threads and services
- Main loop - Runs every 5ms to keep system alive

---

### **code.js** - QR Scanner Worker
**Purpose:** Continuously scans for QR codes in a separate worker thread

**What it does:**
- ✅ Opens camera device (`/dev/video11`)
- ✅ Initializes decoder (640x480 resolution)
- ✅ Scans for QR codes every 5ms (200 scans/sec)
- ✅ Sends `dxCode.RECEIVE_MSG` event when QR detected

**Hardware:**
- Camera: `/dev/video11` (USB or built-in)
- Decoder: "decoder v4"
- Resolution: 640x480 (optimized for low memory)

**Flow:**
```
1. init() → dxCode.worker.beforeLoop(camera, decoder)
2. loop() → dxCode.worker.loop() every 5ms
3. QR detected → Event sent to services.js
4. services.js → codeService.receiveMsg()
5. codeService → accessService.access()
```

**Why separate worker?**
- Prevents UI blocking
- Avoids memory conflict with NFC reader
- Based on working demo: dw200_update_new

---

### **controller.js** - Hardware Controller Worker
**Purpose:** Manages all hardware components in a dedicated worker thread

**What it initializes:**
1. **GPIO** - Relay control (door lock)
2. **GPIO Keys** - Physical buttons
3. **Watchdog** - System watchdog timer
4. **PWM** - Buzzer/beeper control
5. **Audio** - Voice feedback (English)
6. **NFC** - RFID card reader (`/dev/ttymxc2`)
7. **NFC EID** - Electronic ID reader
8. **Network** - Ethernet/WiFi connectivity
9. ~~**QR Scanner**~~ - SKIPPED (runs in separate worker)

**Main Loop (5ms):**
```javascript
loop() {
    driver.net.loop()       // Check network status
    driver.code.loop()      // Update QR scanner state
    driver.nfc.loop()       // Check for NFC cards
    driver.gpiokey.loop()   // Check button presses
    driver.ntp.loop()       // Sync time
    driver.mqtt.heartbeat() // Send MQTT heartbeat
}
```

**Why it exists:**
- Separates hardware management from main thread
- Continuous monitoring of all hardware
- Feeds watchdog every 5ms

---

### **services.js** - Event Dispatcher
**Purpose:** Routes events from hardware to appropriate service handlers

**Event Topics:**
- `dxCode.RECEIVE_MSG` → QR code scanned → `codeService`
- `dxNfc.RECEIVE_MSG` → RFID card detected → `nfcService`
- `password` → PIN entered → `accessService`
- `dxGpioKey.RECEIVE_MSG` → Button pressed → `gpioKeyService`
- `dxMqtt.RECEIVE_MSG` → MQTT message → `mqttService`
- `dxNet.STATUS_CHANGE` → Network change → `netService`
- `dxUart.VG.RECEIVE_MSG` → BLE message → `uartBleService`

**Flow:**
```
Hardware Event → Event Bus → services.js (pool.callback) 
    → Switch(topic) → Appropriate service handler
```

**Worker Pool:**
- 3 worker threads
- Queue size: 100 events
- Handles events in parallel

---

## 🔐 Service Layer Explained

### **accessService.js** - Access Control Logic
**Purpose:** Validates credentials and grants/denies access

**What it does:**
1. Receives access request (QR/RFID/PIN)
2. Checks device status (enabled/disabled)
3. Validates credential in database
4. Checks time validity (startTime < now < endTime)
5. Grants or denies access
6. Triggers GPIO relay (open door)
7. Plays audio feedback (success/fail)
8. Updates screen UI
9. Reports access log to MQTT server

**Credential Types:**
- Type `100` - QR Code
- Type `200` - RFID Card
- Type `300` - PIN Code
- Type `400` - Password
- Type `600` - Bluetooth

**Database Check:**
```sql
SELECT * FROM permissions 
WHERE type = ? AND code = ? 
AND startTime <= ? AND endTime >= ?
```

**Access Flow:**
```
1. access(data) → Validate device status
2. Query database for credential
3. Check time validity
4. If valid:
   ✅ Play success audio (mj_s_eng.wav)
   ✅ Show success popup
   ✅ Open door relay (GPIO 105)
   ✅ Log access event
5. If invalid:
   ❌ Play fail audio (mj_f_eng.wav)
   ❌ Show fail popup
   ❌ Log failed attempt
```

---

### **codeService.js** - QR Code Processing
**Purpose:** Processes QR codes scanned by camera

**What it does:**
1. Receives raw QR data from `dxCode.RECEIVE_MSG`
2. Converts hex to UTF-8 string
3. Formats/parses QR code content
4. Checks if it's a special code:
   - **Config code** → `__VGS__0...` → Updates device config
   - **EID code** → Electronic ID activation
   - **Access code** → Normal access (sends to accessService)

**QR Code Types:**
- **Access Code:** `HOTEL123456` → Type 100
- **Config Code:** `__VGS__0{json}` → Device configuration
- **EID Code:** Electronic ID activation

**Flow:**
```
QR Scanned → receiveMsg(rawData) 
    → utf8HexToStr(data) 
    → formatCode(str) 
    → Determine type:
        - Config → configCode()
        - EID → driver.eid.active()
        - Access → accessService.access()
```

---

### **nfcService.js** - NFC/RFID Card Processing
**Purpose:** Processes RFID cards read by NFC reader

**What it does:**
1. Receives card data from `dxNfc.RECEIVE_MSG`
2. Extracts card ID
3. Formats card number
4. Sends to accessService with Type 200

**Hardware:**
- NFC Reader: `/dev/ttymxc2` (serial port)
- Protocol: ISO14443-A/B, ISO15693
- Chip: mh1608

**Flow:**
```
Card detected → receiveMsg(data) 
    → Extract card ID 
    → Format number 
    → accessService.access({type: 200, code: cardID})
```

---

### **gpioKeyService.js** - Button Handler
**Purpose:** Handles physical button presses

**What it does:**
- Detects button press events
- Triggers actions (e.g., open door manually)

---

### **mqttService.js** - MQTT Communication
**Purpose:** Handles MQTT connection and messaging

**What it does:**
- Connects to MQTT broker
- Publishes access events
- Receives remote commands (e.g., remote door open)
- Sends heartbeat every 60 seconds

**Topics:**
- `access_device/v1/event/access` - Access events
- `access_device/v1/event/heartbeat` - Heartbeat
- `access_device/v1/command/open` - Remote open command

---

### **netService.js** - Network Management
**Purpose:** Manages network connectivity

**What it does:**
- Monitors network status
- Handles DHCP/static IP
- Reconnects on disconnect

---

### **uartBleService.js** - Bluetooth Communication
**Purpose:** Handles Bluetooth Low Energy communication

**What it does:**
- Receives access requests via BLE
- Sends access results back to mobile app
- Firmware upgrade via BLE

---

### **sqliteService.js** - Database Layer
**Purpose:** All database operations

**What it provides:**
```javascript
{
    query(sql, params),           // Execute SELECT
    insert(table, data),          // INSERT record
    update(table, data, where),   // UPDATE record
    delete(table, where),         // DELETE record
    queryPermission(type, code),  // Check access permission
    addPermission(type, code, startTime, endTime)  // Add new credential
}
```

**Database Schema:**
```sql
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type INTEGER NOT NULL,           -- 100=QR, 200=RFID, 300=PIN
    code TEXT NOT NULL,               -- Credential value
    startTime INTEGER NOT NULL,       -- Unix timestamp start
    endTime INTEGER NOT NULL,         -- Unix timestamp end
    passTimes INTEGER DEFAULT 0,      -- Usage count
    extra TEXT DEFAULT '{}',          -- JSON metadata
    UNIQUE(type, code)
);
```

---

### **testDataService.js** - Test Data Loader
**Purpose:** Automatically loads test credentials for development

**What it loads:**
- 5 QR Codes: `HOTEL123456`, `TESTQR001`, etc.
- 5 RFID Cards: `AABBCCDD`, `11223344`, etc.
- 5 PIN Codes: `1234`, `5678`, `0000`, `9999`, `1111`

**All valid for 1 year from device startup**

---

### **configService.js** - Configuration Manager
**Purpose:** Manages device configuration

**What it does:**
- Parses QR config codes
- Updates device settings
- Validates configuration JSON

---

## 🖥️ View Layer Explained

### **screen.js** - Screen Manager
**Purpose:** Manages UI screens and transitions

**What it does:**
- Switches between main view and password view
- Handles screen rotation
- Updates time display
- Shows access result popups

---

### **mainView.js** - Main Screen
**Purpose:** Default screen showing time and device info

**What it shows:**
- Current time
- Device name
- IP address
- QR/RFID icons
- Password button

---

### **passwordView.js** - PIN Input Screen
**Purpose:** Touch screen keyboard for PIN entry

**What it does:**
- Shows numeric keypad (0-9)
- Collects 4-digit PIN
- Sends to accessService for validation

---

### **popWin.js** - Popup Windows
**Purpose:** Shows success/fail messages

**Types:**
- Success popup (green) - "成功!" (Success!)
- Fail popup (red) - "失败!" (Failed!)
- Auto-closes after 2 seconds

---

## 🔧 Driver Layer Explained

### **driver.js** - Hardware Abstraction Layer
**Purpose:** Provides unified interface to all hardware

**Drivers:**
```javascript
driver.gpio        // Relay control (door lock)
driver.gpiokey     // Button input
driver.pwm         // Buzzer/beeper
driver.audio       // Voice feedback
driver.nfc         // RFID reader
driver.code        // QR scanner
driver.net         // Network
driver.mqtt        // MQTT client
driver.uartBle     // Bluetooth
driver.watchdog    // System watchdog
driver.config      // Configuration
driver.ntp         // Time sync
driver.screen      // Screen control
driver.autoRestart // Auto-restart scheduler
```

**Key Functions:**
- `driver.gpio.open()` - Open door relay
- `driver.audio.success()` - Play success sound
- `driver.audio.fail()` - Play fail sound
- `driver.pwm.press()` - Beep on button press
- `driver.screen.accessSuccess()` - Show success popup
- `driver.screen.accessFail()` - Show fail popup

---

## 🎵 Audio Feedback

**English voice feedback (always):**
- Success: `/app/code/resource/wav/mj_s_eng.wav`
- Fail: `/app/code/resource/wav/mj_f_eng.wav`

**Changed from Chinese to English** - no longer depends on `sysInfo.language` config!

---

## 🗄️ Database Structure

**Location:** `/app/data/db/app.db`

**Table:** `permissions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `type` | INTEGER | 100=QR, 200=RFID, 300=PIN |
| `code` | TEXT | Credential (QR string, card ID, PIN) |
| `startTime` | INTEGER | Unix timestamp start |
| `endTime` | INTEGER | Unix timestamp end |
| `passTimes` | INTEGER | Usage count |
| `extra` | TEXT | JSON metadata |

---

## 🔄 Event Flow Examples

### Example 1: QR Code Scan
```
1. User shows QR code to camera
2. code.js (worker) → dxCode.worker.loop() detects QR
3. dxCode fires RECEIVE_MSG event
4. services.js receives event → routes to codeService
5. codeService.receiveMsg(data) → converts hex to string
6. codeService.code(str) → formats and parses
7. accessService.access({type: 100, code: "HOTEL123456"})
8. accessService queries database
9. If valid:
   ✅ driver.audio.success()
   ✅ driver.gpio.open()
   ✅ driver.screen.accessSuccess()
10. Door opens for 2 seconds
```

### Example 2: RFID Card
```
1. User taps RFID card on reader
2. controller.js → driver.nfc.loop() detects card
3. dxNfc fires RECEIVE_MSG event
4. services.js → routes to nfcService
5. nfcService.receiveMsg(data) → extracts card ID
6. accessService.access({type: 200, code: "AABBCCDD"})
7. (Same as QR flow from step 8)
```

### Example 3: PIN Entry
```
1. User presses "密码" button on main screen
2. screen.js switches to passwordView
3. User enters PIN: 1-2-3-4
4. passwordView collects digits
5. User presses "确认" (Confirm)
6. passwordView fires "password" event
7. services.js → routes to accessService
8. accessService.access({type: 300, code: "1234"})
9. (Same as QR flow from step 8)
```

---

## ⚙️ Configuration System

**Location:** `/app/data/config/config.json`

**Key Settings:**
```json
{
  "scanInfo.codeSwitch": 1,        // Enable QR scanner
  "scanInfo.deType": 65535,        // QR code types to scan
  "scanInfo.sMode": 0,             // 0=interval, 1=single
  "scanInfo.interval": 2000,       // Scan interval (ms)
  
  "sysInfo.nfc": 1,                // Enable NFC reader
  "sysInfo.language": "CN",        // UI language (doesn't affect audio!)
  "sysInfo.volume": 60,            // Audio volume (0-60)
  "sysInfo.volume1": 100,          // Buzzer volume (0-100)
  "sysInfo.relayd": 2000,          // Door open time (ms)
  "sysInfo.deviceName": "欢迎使用", // Device name on screen
  "sysInfo.autoRestart": 3,        // Auto-restart at 3 AM
  
  "doorInfo.openMode": 0,          // 0=normal, 1=always open
  "doorInfo.openTime": 2000,       // Door open duration (ms)
  
  "mqttInfo.mqttAddr": "server:1883",
  "mqttInfo.mqttName": "admin",
  "mqttInfo.password": "password"
}
```

---

## 🚀 Startup Sequence

```
[0ms] main.js starts
    ↓
[10ms] Initialize config, UART, MQTT, database
    ↓
[50ms] Create QR scanner worker (code.js)
    ↓
[100ms] Initialize screen UI
    ↓
[150ms] Create controller worker (controller.js)
    ↓
[200ms] Initialize service pool (services.js)
    ↓
[1000ms] Load test data (testDataService)
    ↓
[∞] Main loop (5ms) → Watchdog + Screen updates
[∞] Controller loop (5ms) → Hardware monitoring
[∞] QR scanner loop (5ms) → Continuous scanning
```

---

## 🧪 Testing

### Test Server (Node.js)
```bash
npm start
# Opens http://localhost:8080
# Add QR codes, RFID cards, PIN codes via web interface
```

### Test Credentials (Auto-loaded)
**QR Codes:**
- `HOTEL-ROOM-101-GUEST-12345`
- `HOTEL123456`
- `TESTQR001`

**RFID Cards:**
- `AABBCCDD`
- `11223344`

**PIN Codes:**
- `1234`
- `5678`

---

## 📝 Code Style

**Comments:**
- English only (no Chinese)
- JSDoc format where applicable
- Clear function descriptions
- Hardware details documented

**Logging:**
- `log.info()` - Normal operations
- `log.debug()` - Detailed debugging
- `log.error()` - Errors and failures

---

## 🎯 Key Takeaways

1. **3 Worker Threads:**
   - QR scanner (code.js)
   - Controller (controller.js)
   - Service pool (services.js)

2. **Event-Driven Architecture:**
   - Hardware events → Event Bus → Services → Actions

3. **3 Access Methods:**
   - QR Codes (Type 100)
   - RFID Cards (Type 200)
   - PIN Codes (Type 300)

4. **Database-Driven:**
   - All credentials stored in SQLite
   - Time-based validity
   - Usage tracking

5. **Audio Feedback:**
   - Always English (mj_s_eng.wav / mj_f_eng.wav)
   - Independent of UI language

---

**End of Documentation**  
**For questions, refer to individual source files with inline comments**
