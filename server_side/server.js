const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mqtt = require('mqtt');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

// --- Basic Setup ---
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;

// --- MQTT Configuration (customize as needed) ---
const mqttConfig = {
    broker: 'localhost',
    port: 1883,
    username: '', // Add username if required
    password: '', // Add password if required
};
const mqttClient = mqtt.connect(`mqtt://${mqttConfig.broker}:${mqttConfig.port}`, {
    username: mqttConfig.username,
    password: mqttConfig.password,
});

// --- File Upload Setup ---
const UPLOAD_PATH = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_PATH)) {
    fs.mkdirSync(UPLOAD_PATH);
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
        // Always name the uploaded file 'update.zip' to have a consistent URL
        cb(null, 'update.zip');
    }
});
const upload = multer({ storage: storage });

// --- Middleware ---
app.use(express.json());
// Serve frontend files
app.use(express.static(path.join(__dirname, 'frontend')));
// Serve uploaded update files
app.use('/ota', express.static(UPLOAD_PATH));


// --- MQTT Client Logic ---
const DEVICE_TOPICS = [
    'access_device/v1/event/+/#',         // All device events with device ID (+ is wildcard for one level)
    'access_device/v1/status/+/#',        // Device status updates
    'access_device/v1/cmd/+/#'            // Command responses
];

mqttClient.on('connect', () => {
    console.log(`Connected to MQTT broker at ${mqttConfig.broker}:${mqttConfig.port}`);
    // Subscribe to all device topics
    DEVICE_TOPICS.forEach(topic => {
        mqttClient.subscribe(topic, (err) => {
            if (err) {
                console.error(`Failed to subscribe to topic ${topic}:`, err);
            } else {
                console.log(`✓ Subscribed to: ${topic}`);
            }
        });
    });
});

mqttClient.on('error', (error) => {
    console.error('MQTT connection error:', error);
});

// Handle incoming MQTT messages
mqttClient.on('message', (topic, message) => {
    const payload = message.toString();
    console.log(`\n[MQTT] Topic: ${topic}`);
    console.log(`[MQTT] Payload: ${payload}`);
    
    // Broadcast to all connected web clients
    io.emit('new_log', {
        timestamp: new Date().toLocaleString(),
        topic: topic,
        message: payload
    });
    
    // Parse JSON if possible
    try {
        const jsonData = JSON.parse(payload);
        console.log('[MQTT] Parsed JSON:', JSON.stringify(jsonData, null, 2));
        
        // Handle specific message types
        if (topic.includes('heartbeat')) {
            console.log('[HEARTBEAT] Device alive');
        } else if (topic.includes('access')) {
            console.log('[ACCESS] Access event detected!');
        } else if (topic.includes('connect')) {
            console.log('[CONNECT] Device connected to server');
        }
    } catch (e) {
        // Not JSON, that's OK
    }
});

// --- API Routes ---

// Endpoint for handling file uploads
app.post('/api/upload', upload.single('firmware'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    console.log('Firmware file uploaded:', req.file.filename);
    res.status(200).json({
        message: 'File uploaded successfully',
        filePath: `/ota/${req.file.filename}`
    });
});


// --- WebSocket (Socket.IO) Logic ---
io.on('connection', (socket) => {
    console.log('Web client connected:', socket.id);

    // Handle regular commands
    socket.on('sendCommand', (data) => {
        const { topic, payload } = data;
        if (!topic || !payload) {
            console.error('Invalid command data from client');
            return;
        }
        mqttClient.publish(topic, payload, (err) => {
            if (err) {
                console.error(`Failed to send command to topic ${topic}:`, err);
                socket.emit('commandResult', { success: false, message: 'Failed to send command via MQTT' });
            } else {
                console.log(`Command sent to topic ${topic}:`, payload);
                socket.emit('commandResult', { success: true, message: `Command sent successfully to topic: ${topic}` });
            }
        });
    });

    // Handle OTA Update command
    socket.on('sendOtaUpdate', (data) => {
        const { topic, serverIp } = data;
        const updateFilePath = path.join(UPLOAD_PATH, 'update.zip');

        if (!fs.existsSync(updateFilePath)) {
            socket.emit('otaResult', { success: false, message: 'update.zip not found on server. Please upload the file first.' });
            return;
        }

        // 1. Calculate MD5 hash
        const fileBuffer = fs.readFileSync(updateFilePath);
        const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

        // 2. Construct payload
        const payload = {
            data: {
                url: `http://${serverIp}:${port}/ota/update.zip`,
                md5: md5Hash
            }
        };
        const payloadString = JSON.stringify(payload);

        // 3. Publish to MQTT
        mqttClient.publish(topic, payloadString, (err) => {
            if (err) {
                console.error(`Failed to send OTA command to topic ${topic}:`, err);
                socket.emit('otaResult', { success: false, message: 'Failed to send OTA command via MQTT.' });
            } else {
                console.log(`OTA Update command sent to topic ${topic}:`, payloadString);
                socket.emit('otaResult', { success: true, message: 'OTA Update command sent successfully!' });
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('Web client disconnected:', socket.id);
    });
});


// --- Start Server ---
server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`Uploads will be stored in: ${UPLOAD_PATH}`);
});

process.on('SIGINT', () => {
    console.log('Shutting down server...');
    mqttClient.end();
    server.close();
    process.exit(0);
});
