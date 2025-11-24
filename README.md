# DW200 Room Control

## 1. Overview

This project is a comprehensive access control application for **DW200 series** devices, designed for environments like hotels, offices, and smart homes. It provides a robust, offline-first system for managing access through multiple authentication methods.

The system is built on the **DejaOS** platform and features a multi-threaded architecture to ensure a responsive user interface while handling hardware interactions in the background.

### Key Features

-   **Multiple Authentication Methods**:
    -   📱 **QR Code**: Scan QR codes for access.
    -   💳 **NFC/RFID Card**: Supports Mifare Classic M1 cards.
    -   🔢 **PIN Code**: 4-digit PIN entry via a touchscreen interface.
-   **Hardware Integration**:
    -   ⚡ **Door Lock Control**: Manages an electric lock via GPIO (Pin 105).
    -   🔊 **Audio Feedback**: Provides success and failure sounds through a PWM buzzer.
    -   📺 **Visual Feedback**: Displays status messages ("Success," "Invalid," etc.) on the screen.
-   **Offline Operation**:
    -   🗄️ **SQLite Database**: All access credentials are stored locally, allowing the device to function without a network connection.
-   **Node.js Test Server**:
    -   🌐 **Web Interface**: A standalone Node.js web application for managing the device's access database.
    -   **REST API**: Allows for programmatic management of users and credentials.
-   **High Configurability**:
    -   ⚙️ A detailed `config.json` file allows for fine-tuning of nearly every aspect of the device's operation.

---

## 2. System Architecture

The system is composed of two main parts: the **DejaOS Application** running on the DW200 device and a **Node.js Test Server** for management.

```
+------------------------+         +--------------------------+
|    Node.js Server      |         |     DW200 Device         |
| (Manages Database)     |         |  (DejaOS Application)    |
|                        |         |                          |
|  - Web UI (Port 8080)  |         |  - QR Scanner (Worker)   |
|  - REST API            |         |  - NFC Reader (Worker)   |
|                        |         |  - UI (Main Thread)      |
+-----------|------------+         +------------|-------------+
            |                                  |
            | Writes/Reads                     | Reads
            |                                  |
            +-----------------› app.db ‹-------+
                         (SQLite Database)
```

### DejaOS Application

The core application runs on the DW200 device. It uses a multi-threaded design to prevent the UI from freezing during hardware operations.

-   **Main Thread**: Handles the user interface, including the PIN entry screen and status popups.
-   **Worker Threads**:
    -   **QR Scanner Worker**: Continuously scans for QR codes using the device's camera.
    -   **Hardware Controller Worker**: Manages the NFC reader, GPIO for the door lock, and other hardware components.

### Node.js Test Server

Because DejaOS does not have a built-in HTTP server module, a separate Node.js application is provided for testing and management.

-   **Functionality**: It provides a simple web interface and a REST API to add, remove, and view access credentials in the SQLite database.
-   **Communication**: The Node.js server communicates with the DejaOS application **indirectly** by modifying the shared `app.db` SQLite database file.

---

## 3. Getting Started

### Prerequisites

-   A DW200 series device.
-   DejaOS development environment.
-   Node.js and npm (for running the test server).

### Running the DejaOS Application

1.  Deploy the project files to the DW200 device.
2.  The application (`/app/code/src/main.js`) will start automatically on boot.
3.  On the first run, it will create the SQLite database (`/app/data/db/app.db`) and populate it with test credentials.

### Running the Node.js Test Server

1.  Navigate to the project directory on your computer.
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
4.  The web interface will be available at `http://localhost:8080`.

---

## 4. How to Use

### Physical Device Operation

-   **QR Code**: Present a valid QR code to the device's camera.
-   **NFC Card**: Tap a valid NFC card on the reader area.
-   **PIN Code**: Touch the screen, enter a 4-digit PIN, and press confirm.

Upon successful authentication, the device will:
1.  Play a **success sound**.
2.  Display a **green "Success" message**.
3.  Activate the **GPIO pin** to unlock the door for a configurable duration (default: 2 seconds).

### Web Interface

The web interface provided by the `test_server_nodejs.js` allows you to manage the access credentials in the database. You can:

-   Add new QR codes, NFC cards, and PINs.
-   View existing credentials.
-   Remove credentials.

---

## 5. Test Data

The application comes with a pre-configured set of test credentials that are valid for one year.

| Type | Value |
| :--- | :---- |
| **QR Code** | `HOTEL-ROOM-101-GUEST-12345`, `HOTEL123456`, `TESTQR001` |
| **NFC Card**| `AABBCCDD`, `11223344`, `12345678` |
| **PIN Code**| `1234`, `5678`, `0000` |

---

## 6. Configuration

The main configuration file is located at `/app/data/config/config.json`. This file allows you to customize many aspects of the system, including:

-   `doorInfo.openTime`: The duration (in ms) the door remains unlocked.
-   `scanInfo.codeSwitch`: Enable or disable the QR scanner.
-   `sysInfo.language`: Set the UI language (EN/CN).
-   `mqttInfo.*`: Configure MQTT settings for remote management.

For more details on configuration, refer to the `CODE_DOCUMENTATION.md` file in the `archive` folder.

---

## 7. NFC Card Programming

To enroll new NFC cards, they must be programmed with a specific data structure. This project uses **Mifare Classic M1** cards.

-   The card data includes fields for **Object ID**, **Room Address**, and **Expiration Date**.
-   The controller validates this data against its own configuration before granting access.

For detailed instructions on the memory layout and programming process, see the `NFC_CARD_PROGRAMMING.md` file in the `archive` folder.