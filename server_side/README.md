# Web Interface for Dw200RoomCtrl

This document provides instructions on how to set up and use the web-based interface for controlling the Dw200RoomCtrl device.

## 1. Introduction

The web interface provides a user-friendly way to send commands to the Dw200RoomCtrl device without using the command line. It consists of a Node.js backend that serves a simple HTML frontend. The backend calls the `mqtt_publisher.py` script to send MQTT messages to the device.

## 2. Prerequisites

Before you begin, ensure you have the following installed on your computer:

1.  **Node.js and npm**: Required to run the web server. You can download them from [https://nodejs.org/](https://nodejs.org/).
2.  **Python**: Required to execute the MQTT publisher script. Download it from [https://www.python.org/](https://www.python.org/).
3.  **paho-mqtt**: The Python library for MQTT communication. Install it by running:
    ```bash
    pip install paho-mqtt
    ```
4.  **Mosquitto MQTT Broker**: If you don't have an MQTT broker set up, you can install Mosquitto from [https://mosquitto.org/](https://mosquitto.org/).

    **add to mosquitto.conf**
    listener 1883 0.0.0.0
    allow_anonymous true

    **run mosquitto**
    "C:\Program Files\mosquitto\mosquitto.exe" -c "C:\Program Files\mosquitto\mosquitto.conf" -v

## 3. Installation

1.  **Navigate to the `server_side` directory**:
    Open a terminal or command prompt and change your directory to `server_side`.

2.  **Install Node.js dependencies**:
    Run the following command to install the necessary Node.js packages (specifically, the Express framework):
    ```bash
    npm install
    ```

## 4. Running the Server

1.  **Start the web server**:
    From within the `server_side` directory, run the following command:
    ```bash
    node server.js
    ```
    You should see a message indicating that the server is running, like `Server listening at http://localhost:3000`.

2.  **Access the web interface**:
    Open your web browser and navigate to [http://localhost:3000](http://localhost:3000).

## 5. Using the Web Interface

The web interface is divided into several sections, each corresponding to a different command that can be sent to the device.

-   **Device Control**: For general commands, such as opening the door.
-   **Add QR Code**: To add a new QR code permission to the device.
-   **Set Config**: To change device settings, such as the door open timeout.

To use the interface:
1.  Fill in the required fields for the command you wish to send. The "Device SN" is pre-filled but should match the serial number of your device.
2.  Click the button corresponding to the command.
3.  The output from the `mqtt_publisher.py` script will be displayed in the "Output" section at the bottom of the page.

To stop the server, go to the terminal where it is running and press `Ctrl+C`.
