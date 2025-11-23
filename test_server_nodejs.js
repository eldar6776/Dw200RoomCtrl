/**
 * DW200 Access Control Test Server (Node.js)
 * Web interface for simulating QR, RFID, and PIN inputs
 * 
 * This is a standalone Node.js server that adds credentials to SQLite database
 * Run separately: node test_server_nodejs.js
 */

const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const PORT = 8080;
const DB_PATH = path.join(__dirname, 'app', 'data', 'db', 'app.db');
console.log('Current directory:', __dirname);
console.log('Database path:', DB_PATH);

// Open database connection
let db = null;
function initDB() {
    // Create directory structure if it doesn't exist
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log('Created database directory:', dbDir);
    }
    
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Database connection error:', err);
        } else {
            console.log('Connected to SQLite database:', DB_PATH);
            // Create tables if they don't exist
            createTables();
        }
    });
}

// Create database tables
function createTables() {
    const createPermissionsTable = `
        CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type INTEGER NOT NULL,
            code TEXT NOT NULL,
            startTime INTEGER NOT NULL,
            endTime INTEGER NOT NULL,
            passTimes INTEGER DEFAULT 0,
            extra TEXT DEFAULT '{}',
            UNIQUE(type, code)
        )
    `;
    
    db.run(createPermissionsTable, (err) => {
        if (err) {
            console.error('Error creating permissions table:', err);
        } else {
            console.log('Permissions table ready');
        }
    });
}

// HTML interface
const htmlInterface = `
<!DOCTYPE html>
<html lang="hr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DW200 Access Control Test Interface</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .section {
            margin: 25px 0;
            padding: 20px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            background: #f9f9f9;
        }
        .section h2 {
            color: #667eea;
            margin-top: 0;
            font-size: 1.3em;
        }
        label {
            display: block;
            margin: 10px 0 5px;
            color: #555;
            font-weight: 600;
        }
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            box-sizing: border-box;
            transition: border-color 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 10px;
            transition: background 0.3s;
            width: 100%;
        }
        button:hover {
            background: #5568d3;
        }
        button:active {
            transform: scale(0.98);
        }
        .response {
            margin-top: 15px;
            padding: 15px;
            border-radius: 5px;
            display: none;
        }
        .response.success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            display: block;
        }
        .response.error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            display: block;
        }
        .info {
            background: #e7f3ff;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #667eea;
        }
        .pin-input {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 10px 0;
        }
        .pin-digit {
            width: 100%;
            text-align: center;
            font-size: 24px;
            padding: 15px;
        }
        .example {
            font-size: 0.9em;
            color: #777;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 DW200 Access Control Test</h1>
        
        <div class="info">
            <strong>Test Interface za hotelski sustav kontrole pristupa</strong><br>
            Koristi ovu stranicu za testiranje autentifikacije i upravljanje pristupnim pravima.
        </div>

        <!-- Database Management -->
        <div class="section">
            <h2>🗄️ Upravljanje Pristupnim Pravima</h2>
            <h3>Dodaj QR Kod</h3>
            <input type="text" id="addQR" placeholder="QR kod za dodavanje">
            <button onclick="addQRToDatabase()">Dodaj QR u bazu</button>
            
            <h3 style="margin-top: 20px;">Dodaj RFID Karticu</h3>
            <input type="text" id="addCard" placeholder="Broj kartice za dodavanje">
            <button onclick="addCardToDatabase()">Dodaj Karticu u bazu</button>
            
            <h3 style="margin-top: 20px;">Dodaj PIN</h3>
            <input type="text" id="addPIN" placeholder="4-cifreni PIN" maxlength="4">
            <button onclick="addPINToDatabase()">Dodaj PIN u bazu</button>
            
            <div id="dbResponse" class="response"></div>
        </div>

        <!-- Test Data Section -->
        <div class="section">
            <h2>📋 Dostupni Test Podaci</h2>
            <h3>QR Kodovi (Tip 100)</h3>
            <ul>
                <li>HOTEL-ROOM-101-GUEST-12345</li>
                <li>HOTEL-ROOM-102-GUEST-67890</li>
                <li>HOTEL123456</li>
                <li>TESTQR001</li>
                <li>STAFF-KEY-ADMIN</li>
            </ul>
            
            <h3>RFID Kartice (Tip 200)</h3>
            <ul>
                <li>AABBCCDD</li>
                <li>11223344</li>
                <li>12345678</li>
                <li>ABCD1234</li>
                <li>CARD0001</li>
            </ul>
            
            <h3>PIN Kodovi (Tip 300)</h3>
            <ul>
                <li>1234</li>
                <li>5678</li>
                <li>0000</li>
                <li>9999</li>
                <li>1111</li>
            </ul>
            <p style="color: #777; font-style: italic;">Test preko fizičkih uređaja (QR scanner, RFID reader, touch screen)</p>
        </div>
    </div>

    <script>
        async function sendRequest(endpoint, data) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                return await response.json();
            } catch (error) {
                return { success: false, message: 'Greška u komunikaciji: ' + error.message };
            }
        }

        function showResponse(elementId, data) {
            const element = document.getElementById(elementId);
            element.className = 'response ' + (data.success ? 'success' : 'error');
            element.textContent = data.message;
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }

        async function addQRToDatabase() {
            const qrCode = document.getElementById('addQR').value;
            if (!qrCode) {
                showResponse('dbResponse', { success: false, message: 'Unesite QR kod!' });
                return;
            }
            const result = await sendRequest('/api/db/add-qr', { code: qrCode });
            showResponse('dbResponse', result);
            if (result.success) document.getElementById('addQR').value = '';
        }

        async function addCardToDatabase() {
            const cardId = document.getElementById('addCard').value;
            if (!cardId) {
                showResponse('dbResponse', { success: false, message: 'Unesite broj kartice!' });
                return;
            }
            const result = await sendRequest('/api/db/add-card', { code: cardId });
            showResponse('dbResponse', result);
            if (result.success) document.getElementById('addCard').value = '';
        }

        async function addPINToDatabase() {
            const pin = document.getElementById('addPIN').value;
            if (pin.length !== 4 || !/^\\d{4}$/.test(pin)) {
                showResponse('dbResponse', { success: false, message: 'PIN mora biti 4 cifre!' });
                return;
            }
            const result = await sendRequest('/api/db/add-pin', { code: pin });
            showResponse('dbResponse', result);
            if (result.success) document.getElementById('addPIN').value = '';
        }
    </script>
</body>
</html>
`;

// HTTP Server
const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Main page
    if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlInterface);
        return;
    }

    // API endpoints
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                handleAPIRequest(req.url, data, res);
            } catch (error) {
                sendJSON(res, { success: false, message: 'Invalid JSON: ' + error.message });
            }
        });
        return;
    }

    // 404
    res.writeHead(404);
    res.end('Not Found');
});

function handleAPIRequest(url, data, res) {
    switch (url) {
        case '/api/db/add-qr':
            addPermission(100, data.code, res);
            break;
        case '/api/db/add-card':
            addPermission(200, data.code, res);
            break;
        case '/api/db/add-pin':
            addPermission(300, data.code, res);
            break;
        default:
            sendJSON(res, { success: false, message: 'Unknown endpoint' });
    }
}

function addPermission(type, code, res) {
    if (!code) {
        sendJSON(res, { success: false, message: 'Kod nije proslijeđen!' });
        return;
    }

    const now = Math.floor(Date.now() / 1000);
    const oneYearLater = now + (365 * 24 * 60 * 60);

    const sql = `INSERT INTO permissions (type, code, startTime, endTime, passTimes, extra) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [type, code, now, oneYearLater, 0, '{}'], function(err) {
        if (err) {
            console.error('Database insert error:', err);
            sendJSON(res, { 
                success: false, 
                message: 'Greška u bazi podataka: ' + err.message 
            });
        } else {
            const typeName = type === 100 ? 'QR kod' : type === 200 ? 'RFID kartica' : 'PIN';
            console.log(`[TestServer] Added ${typeName}: ${code}`);
            sendJSON(res, { 
                success: true, 
                message: `${typeName} "${code}" uspješno dodan u bazu! (ID: ${this.lastID})` 
            });
        }
    });
}

function sendJSON(res, obj) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
}

// Initialize test data
function initTestData() {
    const now = Math.floor(Date.now() / 1000);
    const oneYearLater = now + (365 * 24 * 60 * 60);
    
    // Test QR Codes
    const testQRCodes = [
        'HOTEL-ROOM-101-GUEST-12345',
        'HOTEL-ROOM-102-GUEST-67890',
        'HOTEL123456',
        'TESTQR001',
        'STAFF-KEY-ADMIN'
    ];
    
    // Test RFID Cards
    const testCards = [
        'AABBCCDD',
        '11223344',
        '12345678',
        'ABCD1234',
        'CARD0001'
    ];
    
    // Test PINs
    const testPINs = [
        '1234',
        '5678',
        '0000',
        '9999',
        '1111'
    ];
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║ Initializing Test Credentials                            ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    
    // Add QR codes (type 100)
    testQRCodes.forEach(code => {
        const sql = `INSERT OR IGNORE INTO permissions (type, code, startTime, endTime, passTimes, extra) 
                     VALUES (100, ?, ?, ?, 0, '{}')`;
        db.run(sql, [code, now, oneYearLater], function(err) {
            if (!err && this.changes > 0) {
                console.log(`✓ Added QR Code: ${code}`);
            }
        });
    });
    
    // Add RFID cards (type 200)
    testCards.forEach(code => {
        const sql = `INSERT OR IGNORE INTO permissions (type, code, startTime, endTime, passTimes, extra) 
                     VALUES (200, ?, ?, ?, 0, '{}')`;
        db.run(sql, [code, now, oneYearLater], function(err) {
            if (!err && this.changes > 0) {
                console.log(`✓ Added RFID Card: ${code}`);
            }
        });
    });
    
    // Add PINs (type 300)
    testPINs.forEach(code => {
        const sql = `INSERT OR IGNORE INTO permissions (type, code, startTime, endTime, passTimes, extra) 
                     VALUES (300, ?, ?, ?, 0, '{}')`;
        db.run(sql, [code, now, oneYearLater], function(err) {
            if (!err && this.changes > 0) {
                console.log(`✓ Added PIN Code: ${code}`);
            }
        });
    });
    
    setTimeout(() => {
        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║ Test Credentials Available:                              ║');
        console.log('║                                                           ║');
        console.log('║ QR Codes (Type 100):                                      ║');
        testQRCodes.forEach(code => {
            console.log('║   • ' + code.padEnd(55) + '║');
        });
        console.log('║                                                           ║');
        console.log('║ RFID Cards (Type 200):                                    ║');
        testCards.forEach(code => {
            console.log('║   • ' + code.padEnd(55) + '║');
        });
        console.log('║                                                           ║');
        console.log('║ PIN Codes (Type 300):                                     ║');
        testPINs.forEach(code => {
            console.log('║   • ' + code.padEnd(55) + '║');
        });
        console.log('╚═══════════════════════════════════════════════════════════╝\n');
    }, 500);
}

// Start server
function startServer() {
    initDB();
    
    // Wait for DB initialization then add test data
    setTimeout(() => {
        initTestData();
    }, 1000);
    
    server.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log('  DW200 Access Control Test Server');
        console.log('='.repeat(60));
        console.log(`  Server running on: http://localhost:${PORT}`);
        console.log(`  Database: ${DB_PATH}`);
        console.log('='.repeat(60));
        console.log('  Open your browser and navigate to the URL above');
        console.log('='.repeat(60));
    });
}

startServer();
