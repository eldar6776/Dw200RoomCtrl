document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const outputEl = document.getElementById('output');
    const logOutputEl = document.getElementById('log-output');
    const deviceSnEl = document.getElementById('device-sn');

    const btnOpenDoor = document.getElementById('btn-open-door');
    const btnSyncTime = document.getElementById('btn-sync-time');
    const btnAddQr = document.getElementById('btn-add-qr');
    const btnAddPin = document.getElementById('btn-add-pin');
    const btnSetConfig = document.getElementById('btn-set-config');
    const btnOtaUpdate = document.getElementById('btn-ota-update');
    
    const btnDeleteQr = document.getElementById('btn-delete-qr');
    const btnDeletePin = document.getElementById('btn-delete-pin');
    const btnDeleteAll = document.getElementById('btn-delete-all');

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
        const topicInfo = log.topic ? `[${log.topic}] ` : '';
        logOutputEl.textContent = `[${log.timestamp}] ${topicInfo}${log.message}\n` + logOutputEl.textContent;
        
        // Limit log size
        const lines = logOutputEl.textContent.split('\n');
        if (lines.length > 100) {
            logOutputEl.textContent = lines.slice(0, 100).join('\n');
        }
    });

    // --- Helper Functions ---
    function logToOutput(message) {
        outputEl.textContent = `[${new Date().toLocaleTimeString()}] ${message}\n` + outputEl.textContent;
    }

    function getDeviceSn() {
        return deviceSnEl.value;
    }

    function dateTimeToUnix(dateTimeValue) {
        if (!dateTimeValue) {
            // Default to current time if empty
            return Math.floor(Date.now() / 1000);
        }
        return Math.floor(new Date(dateTimeValue).getTime() / 1000);
    }

    function setDefaultDateTime() {
        const now = new Date();
        const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        
        const formatDateTime = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        // Set default values for all datetime inputs
        document.getElementById('qr-start-time').value = formatDateTime(now);
        document.getElementById('qr-end-time').value = formatDateTime(oneYearLater);
        document.getElementById('pin-start-time').value = formatDateTime(now);
        document.getElementById('pin-end-time').value = formatDateTime(oneYearLater);
    }

    // Set default date/time on page load
    setDefaultDateTime();

    // --- Event Listeners ---

    // 1. Open Door (with configurable duration)
    btnOpenDoor.addEventListener('click', () => {
        const topic = `access_device/v1/cmd/${getDeviceSn()}/control`;
        const duration = parseInt(document.getElementById('door-duration').value) || 2000;
        const payload = JSON.stringify({ 
            uuid: getDeviceSn(),
            data: { 
                command: 1,
                duration: duration
            }
        });
        logToOutput(`Opening door (${duration}ms)...`);
        socket.emit('sendCommand', { topic, payload });
    });

    // 2. Sync Time from PC
    btnSyncTime.addEventListener('click', () => {
        const now = new Date();

        // Get the correct Unix timestamp for the current local time.
        const unixTimestamp = Math.floor(now.getTime() / 1000);
        const dateString = now.toLocaleString(); // Use locale-specific format for logging

        const topic = `access_device/v1/cmd/${getDeviceSn()}/setConfig`;
        const payload = JSON.stringify({
            uuid: getDeviceSn(),
            data: {
                sysInfo: {
                    time: unixTimestamp
                }
            }
        });
        logToOutput(`Syncing time: ${dateString} → timestamp: ${unixTimestamp}`);
        socket.emit('sendCommand', { topic, payload });
    });

    // 3. Add QR Code
    btnAddQr.addEventListener('click', () => {
        const code = document.getElementById('qr-code').value.trim();
        if (!code) {
            logToOutput('Error: QR Code cannot be empty!');
            return;
        }
        
        const startTime = dateTimeToUnix(document.getElementById('qr-start-time').value);
        const endTime = dateTimeToUnix(document.getElementById('qr-end-time').value);
        
        const topic = `access_device/v1/cmd/${getDeviceSn()}/insertPermission`;
        const payload = JSON.stringify({
            uuid: getDeviceSn(),
            data: [{
                id: `qr_${Date.now()}`,  // Unique ID
                type: 100,  // QR type
                code: code,
                index: 0,
                time: {
                    type: 0  // 0 = Permanent (no time restriction)
                },
                extra: {}
            }]
        });
        logToOutput(`Adding QR Code: ${code} (permanent access)`);
        socket.emit('sendCommand', { topic, payload });
    });

    // 4. Add PIN Code
    btnAddPin.addEventListener('click', () => {
        const code = document.getElementById('pin-code').value.trim();
        if (!code || !/^\d{4}$/.test(code)) {
            logToOutput('Error: PIN must be exactly 4 digits!');
            return;
        }
        
        const startTime = dateTimeToUnix(document.getElementById('pin-start-time').value);
        const endTime = dateTimeToUnix(document.getElementById('pin-end-time').value);
        
        const topic = `access_device/v1/cmd/${getDeviceSn()}/insertPermission`;
        const payload = JSON.stringify({
            uuid: getDeviceSn(),
            data: [{
                id: `pin_${Date.now()}`,  // Unique ID
                type: 300,  // PIN type
                code: code,
                index: 0,
                time: {
                    type: 0  // 0 = Permanent (no time restriction)
                },
                extra: {}
            }]
        });
        logToOutput(`Adding PIN Code: ${code} (permanent access)`);
        socket.emit('sendCommand', { topic, payload });
    });

    // 5. Set Config
    btnSetConfig.addEventListener('click', () => {
        const topic = `access_device/v1/cmd/${getDeviceSn()}/setConfig`;
        const payload = JSON.stringify({
            uuid: getDeviceSn(),
            data: {
                doorInfo: {
                    openTimeout: parseInt(document.getElementById('door-timeout').value)
                }
            }
        });
        logToOutput('Sending "Set Config" command...');
        socket.emit('sendCommand', { topic, payload });
    });

    // 6. OTA Update
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

    // --- Delete QR Code ---
    btnDeleteQr.addEventListener('click', async () => {
        const qrCode = document.getElementById('delete-qr-code').value.trim();
        if (!qrCode) {
            logToOutput('Please enter QR code to delete');
            return;
        }
        
        try {
            const res = await fetch('/api/db/delete-qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: qrCode })
            });
            const result = await res.json();
            logToOutput(result.message);
            if (result.success) {
                document.getElementById('delete-qr-code').value = '';
            }
        } catch (error) {
            logToOutput(`Error: ${error.message}`);
        }
    });

    // --- Delete PIN Code ---
    btnDeletePin.addEventListener('click', async () => {
        const pinCode = document.getElementById('delete-pin-code').value.trim();
        if (!pinCode || pinCode.length !== 4) {
            logToOutput('Please enter 4-digit PIN to delete');
            return;
        }
        
        try {
            const res = await fetch('/api/db/delete-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: pinCode })
            });
            const result = await res.json();
            logToOutput(result.message);
            if (result.success) {
                document.getElementById('delete-pin-code').value = '';
            }
        } catch (error) {
            logToOutput(`Error: ${error.message}`);
        }
    });

    // --- Delete ALL ---
    btnDeleteAll.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to DELETE ALL credentials from the database? This cannot be undone!')) {
            return;
        }
        
        try {
            const res = await fetch('/api/db/delete-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const result = await res.json();
            logToOutput(result.message);
        } catch (error) {
            logToOutput(`Error: ${error.message}`);
        }
    });
});