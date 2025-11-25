document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const outputEl = document.getElementById('output');
    const logOutputEl = document.getElementById('log-output');
    const deviceSnEl = document.getElementById('device-sn');

    const btnOpenDoor = document.getElementById('btn-open-door');
    const btnAddQr = document.getElementById('btn-add-qr');
    const btnSetConfig = document.getElementById('btn-set-config');
    const btnOtaUpdate = document.getElementById('btn-ota-update');

    // --- Socket.IO Connection ---
    const socket = io();

    socket.on('connect', () => {
        logToOutput('Connected to server via WebSocket.');
    });

    socket.on('disconnect', () => {
        logToOutput('Disconnected from server.');
    });

    socket.on('commandResult', (result) => {
        logToOutput(result.message);
    });

    socket.on('otaResult', (result) => {
        logToOutput(result.message);
    });

    socket.on('new_log', (log) => {
        if (logOutputEl.textContent === 'Waiting for log messages...') {
            logOutputEl.textContent = '';
        }
        logOutputEl.textContent = `[${log.timestamp}] ${log.message}\n` + logOutputEl.textContent;
    });

    // --- Helper Functions ---
    function logToOutput(message) {
        outputEl.textContent = `[${new Date().toLocaleTimeString()}] ${message}\n` + outputEl.textContent;
    }

    function getDeviceSn() {
        return deviceSnEl.value;
    }

    // --- Event Listeners ---

    // 1. Open Door
    btnOpenDoor.addEventListener('click', () => {
        const topic = `access_device/v1/cmd/${getDeviceSn()}/control`;
        const payload = JSON.stringify({ command: 1 });
        logToOutput('Sending "Open Door" command...');
        socket.emit('sendCommand', { topic, payload });
    });

    // 2. Add QR Code
    btnAddQr.addEventListener('click', () => {
        const topic = `access_device/v1/cmd/${getDeviceSn()}/insertPermission`;
        const payload = JSON.stringify({
            data: [{
                type: 'qr',
                code: document.getElementById('qr-code').value,
                startTime: parseInt(document.getElementById('qr-start-time').value),
                endTime: parseInt(document.getElementById('qr-end-time').value)
            }]
        });
        logToOutput('Sending "Add QR" command...');
        socket.emit('sendCommand', { topic, payload });
    });

    // 3. Set Config
    btnSetConfig.addEventListener('click', () => {
        const topic = `access_device/v1/cmd/${getDeviceSn()}/setConfig`;
        const payload = JSON.stringify({
            data: {
                doorInfo: {
                    openTimeout: parseInt(document.getElementById('door-timeout').value)
                }
            }
        });
        logToOutput('Sending "Set Config" command...');
        socket.emit('sendCommand', { topic, payload });
    });

    // 4. OTA Update
    btnOtaUpdate.addEventListener('click', async () => {
        const serverIp = document.getElementById('server-ip').value;
        const fileInput = document.getElementById('firmware-file');
        const file = fileInput.files[0];

        if (!serverIp) {
            logToOutput('Error: Please enter your computer\'s IP address.');
            return;
        }
        if (!file) {
            logToOutput('Error: Please select an update.zip file.');
            return;
        }

        // Step 1: Upload the file
        logToOutput('Uploading firmware file...');
        const formData = new FormData();
        formData.append('firmware', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                logToOutput(`Error uploading file: ${result.message || response.statusText}`);
                return;
            }

            logToOutput('File uploaded successfully. Sending OTA command...');

            // Step 2: Send the OTA command via Socket.IO
            const topic = `access_device/v1/cmd/${getDeviceSn()}/upgradeFirmware`;
            socket.emit('sendOtaUpdate', { topic, serverIp });

        } catch (error) {
            logToOutput(`An error occurred: ${error.message}`);
        }
    });
});