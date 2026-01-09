// // gps-server.js
// const http = require('http');
// const net = require('net');
// const fs = require('fs');
// const path = require('path');
// const { Pool } = require('pg');

// const TCP_PORT = 5000;  // For raw TCP connections from GPS devices
// const HTTP_PORT = 3000; // For HTTP API
// const LOG_FILE = 'GPS_Data_Log.txt';

// // PostgreSQL connection configuration
// const pool = new Pool({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'gps_tracking',
//     password: 'postgres', // Change this
//     port: 5432,
// });

// // Initialize log file
// function initializeLogFile() {
//     const timestamp = new Date().toISOString();
//     const header = `=== GPS Server Started at ${timestamp} ===\n\n`;
    
//     if (!fs.existsSync(LOG_FILE)) {
//         fs.writeFileSync(LOG_FILE, header);
//     } else {
//         fs.appendFileSync(LOG_FILE, `\n${header}`);
//     }
// }

// // Save raw data to text file
// function saveToTextFile(data) {
//     const timestamp = new Date().toLocaleString('en-IN', {
//         timeZone: 'Asia/Kolkata',
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//         second: '2-digit',
//         hour12: true
//     });
    
//     const logEntry = `${timestamp}\n${data}\n\n`;
    
//     fs.appendFile(LOG_FILE, logEntry, (err) => {
//         if (err) {
//             console.error('Error writing to log file:', err);
//         } else {
//             console.log(`Data logged to ${LOG_FILE}`);
//         }
//     });
// }

// // Parse GPS data from various formats
// function parseGPSData(rawData) {
//     const result = {
//         protocol: 'unknown',
//         deviceId: null,
//         imei: null,
//         timestamp: null,
//         latitude: null,
//         longitude: null,
//         speed: null,
//         heading: null,
//         altitude: null,
//         satellites: null,
//         hdop: null,
//         gsmSignal: null,
//         batteryVoltage: null,
//         status: null,
//         rawData: rawData
//     };

//     try {
//         // Try to parse JSON format (like {"tcp/ip": "$DP,..."})
//         if (rawData.startsWith('{')) {
//             const jsonMatch = rawData.match(/\{.*\}/);
//             if (jsonMatch) {
//                 const jsonData = JSON.parse(jsonMatch[0]);
//                 for (const [key, value] of Object.entries(jsonData)) {
//                     if (value.startsWith('$')) {
//                         rawData = value;
//                         result.protocol = key.split('/')[0];
//                         break;
//                     }
//                 }
//             }
//         }

//         // Parse different GPS formats
//         if (rawData.startsWith('$STS')) {
//             // STS Protocol: $STS:4GA6205,J869742082283836,...
//             const parts = rawData.split(',');
//             if (parts.length >= 6) {
//                 result.deviceId = parts[0].substring(5);
//                 result.imei = parts[1];
                
//                 // Parse date: DDMMYYYY
//                 const dateStr = parts[4];
//                 // Parse time: HHMMSS
//                 const timeStr = parts[5];
                
//                 if (dateStr && timeStr && dateStr.length === 8 && timeStr.length === 6) {
//                     const day = dateStr.substring(0, 2);
//                     const month = dateStr.substring(2, 4);
//                     const year = dateStr.substring(4, 8);
//                     const hour = timeStr.substring(0, 2);
//                     const minute = timeStr.substring(2, 4);
//                     const second = timeStr.substring(4, 6);
                    
//                     result.timestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
//                 }
                
//                 // Latitude and longitude (positions 6 and 8)
//                 if (parts[6] && parts[6] !== '0.000000') {
//                     result.latitude = parseFloat(parts[6]);
//                 }
//                 if (parts[8] && parts[8] !== '0.000000') {
//                     result.longitude = parseFloat(parts[8]);
//                 }
                
//                 // Parse other fields
//                 if (parts[10]) result.speed = parseFloat(parts[10]);
//                 if (parts[11]) result.heading = parseFloat(parts[11]);
//                 if (parts[12]) result.altitude = parseFloat(parts[12]);
//                 if (parts[13]) result.satellites = parseInt(parts[13]);
//                 if (parts[17]) result.batteryVoltage = parseFloat(parts[17]);
//             }
//         } else if (rawData.startsWith('$DP')) {
//             // DP Protocol: $DP,BB100V,4GA6205,NR,1,L,869742082283836,...
//             const parts = rawData.split(',');
//             if (parts.length >= 12) {
//                 result.deviceId = parts[2];
//                 result.imei = parts[6];
//                 result.protocol = 'DP';
                
//                 // Parse date: DDMMYYYY
//                 const dateStr = parts[9];
//                 // Parse time: HHMMSS
//                 const timeStr = parts[10];
                
//                 if (dateStr && timeStr && dateStr.length === 8 && timeStr.length === 6) {
//                     const day = dateStr.substring(0, 2);
//                     const month = dateStr.substring(2, 4);
//                     const year = dateStr.substring(4, 8);
//                     const hour = timeStr.substring(0, 2);
//                     const minute = timeStr.substring(2, 4);
//                     const second = timeStr.substring(4, 6);
                    
//                     result.timestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
//                 }
                
//                 // Latitude and longitude (positions 11, 12, 13, 14)
//                 if (parts[11] && parts[11] !== '0.000000') {
//                     result.latitude = parseFloat(parts[11]);
//                     if (parts[12] === 'S') result.latitude *= -1;
//                 }
//                 if (parts[13] && parts[13] !== '0.000000') {
//                     result.longitude = parseFloat(parts[13]);
//                     if (parts[14] === 'W') result.longitude *= -1;
//                 }
                
//                 // Parse other fields
//                 if (parts[15]) result.speed = parseFloat(parts[15]);
//                 if (parts[16]) result.heading = parseFloat(parts[16]);
//                 if (parts[17]) result.altitude = parseFloat(parts[17]);
//                 if (parts[18]) result.satellites = parseInt(parts[18]);
//                 if (parts[25]) result.hdop = parseFloat(parts[25]);
//                 if (parts[38]) result.batteryVoltage = parseFloat(parts[38]);
//                 if (parts[7]) result.status = parts[7] === '1' ? 1 : 0;
//             }
//         } else if (rawData.startsWith('$TM')) {
//             // TM Protocol: $TM,4GA6205,NR,L,3,869742082283836,...
//             const parts = rawData.split(',');
//             if (parts.length >= 12) {
//                 result.deviceId = parts[1];
//                 result.imei = parts[5];
//                 result.protocol = 'TM';
                
//                 // Parse date: DDMMYYYY
//                 const dateStr = parts[10];
//                 // Parse time: HHMMSS
//                 const timeStr = parts[11];
                
//                 if (dateStr && timeStr && dateStr.length === 8 && timeStr.length === 6) {
//                     const day = dateStr.substring(0, 2);
//                     const month = dateStr.substring(2, 4);
//                     const year = dateStr.substring(4, 8);
//                     const hour = timeStr.substring(0, 2);
//                     const minute = timeStr.substring(2, 4);
//                     const second = timeStr.substring(4, 6);
                    
//                     result.timestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
//                 }
                
//                 // Latitude and longitude
//                 if (parts[12] && parts[12] !== '0.000000') {
//                     result.latitude = parseFloat(parts[12]);
//                 }
//                 if (parts[13] && parts[13] !== '0.000000') {
//                     result.longitude = parseFloat(parts[13]);
//                 }
                
//                 // Parse other fields
//                 if (parts[14]) result.speed = parseFloat(parts[14]);
//                 if (parts[15]) result.heading = parseFloat(parts[15]);
//                 if (parts[16]) result.altitude = parseFloat(parts[16]);
//                 if (parts[17]) result.batteryVoltage = parseFloat(parts[17]);
//                 if (parts[6]) result.status = parseInt(parts[6]);
//             }
//         } else if (rawData.startsWith('J')) {
//             // J protocol for ZLIV messages: J869742082283836 ZLIV:21;
//             const imeiMatch = rawData.match(/^J(\d+)/);
//             if (imeiMatch) {
//                 result.imei = imeiMatch[1];
//                 result.protocol = 'ZLIV';
//             }
//         }
//     } catch (error) {
//         console.error('Error parsing GPS data:', error);
//     }
    
//     return result;
// }

// // Save data to PostgreSQL
// async function saveToDatabase(parsedData) {
//     if (!parsedData.imei) {
//         console.log('No IMEI found, skipping database save');
//         return;
//     }

//     try {
//         // First, check if device exists or insert it
//         await pool.query(
//             `INSERT INTO devices (imei, device_name) 
//              VALUES ($1, $2) 
//              ON CONFLICT (imei) DO NOTHING`,
//             [parsedData.imei, parsedData.deviceId || 'Unknown']
//         );

//         // Insert GPS data
//         const query = `
//             INSERT INTO gps_data (
//                 device_imei, protocol, timestamp, latitude, longitude,
//                 speed, heading, altitude, satellites, hdop,
//                 gsm_signal, battery_voltage, status, raw_data
//             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
//         `;
        
//         const values = [
//             parsedData.imei,
//             parsedData.protocol,
//             parsedData.timestamp || new Date(),
//             parsedData.latitude,
//             parsedData.longitude,
//             parsedData.speed,
//             parsedData.heading,
//             parsedData.altitude,
//             parsedData.satellites,
//             parsedData.hdop,
//             parsedData.gsmSignal,
//             parsedData.batteryVoltage,
//             parsedData.status,
//             parsedData.rawData
//         ];

//         await pool.query(query, values);
//         console.log(`Data saved to database for device: ${parsedData.imei}`);
//     } catch (error) {
//         console.error('Error saving to database:', error);
//     }
// }

// // TCP Server for GPS devices
// const tcpServer = net.createServer((socket) => {
//     const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
//     console.log(`GPS Device connected from: ${clientAddress}`);
    
//     let buffer = '';
    
//     socket.on('data', (data) => {
//         try {
//             const receivedData = data.toString().trim();
            
//             // Handle special control characters
//             if (receivedData.includes('\u0001\u0004')) {
//                 // This is a heartbeat/acknowledgment
//                 console.log('Heartbeat received');
//                 // Send acknowledgment back if needed
//                 socket.write('\u0001\u0004');
//                 return;
//             }
            
//             if (receivedData === 'DBGON') {
//                 console.log('Debug mode ON');
//                 return;
//             }
            
//             if (receivedData === 'Capture Started') {
//                 console.log('Capture started');
//                 return;
//             }
            
//             // Log the raw data
//             console.log(`Received from ${clientAddress}: ${receivedData}`);
            
//             // Save raw data to text file
//             saveToTextFile(receivedData);
            
//             // Parse and save to database
//             const parsedData = parseGPSData(receivedData);
//             if (parsedData.imei) {
//                 saveToDatabase(parsedData);
//             }
            
//             // Send acknowledgment if required by protocol
//             if (parsedData.protocol === 'STS' || parsedData.protocol === 'DP') {
//                 // Some GPS devices expect an acknowledgment
//                 socket.write('OK\r\n');
//             }
            
//         } catch (error) {
//             console.error('Error processing data:', error);
//         }
//     });
    
//     socket.on('error', (err) => {
//         console.error(`Socket error from ${clientAddress}:`, err.message);
//     });
    
//     socket.on('close', () => {
//         console.log(`GPS Device disconnected: ${clientAddress}`);
//     });
// });

// // HTTP Server for API and monitoring
// const httpServer = http.createServer(async (req, res) => {
//     // CORS headers
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
//     if (req.method === 'OPTIONS') {
//         res.writeHead(200);
//         res.end();
//         return;
//     }
    
//     // Parse URL
//     const url = new URL(req.url, `http://${req.headers.host}`);
    
//     // API endpoints
//     if (url.pathname === '/api/devices' && req.method === 'GET') {
//         try {
//             const result = await pool.query('SELECT * FROM devices ORDER BY created_at DESC');
//             res.writeHead(200, { 'Content-Type': 'application/json' });
//             res.end(JSON.stringify(result.rows));
//         } catch (error) {
//             res.writeHead(500, { 'Content-Type': 'application/json' });
//             res.end(JSON.stringify({ error: error.message }));
//         }
//     } else if (url.pathname === '/api/latest-positions' && req.method === 'GET') {
//         try {
//             const result = await pool.query('SELECT * FROM latest_positions');
//             res.writeHead(200, { 'Content-Type': 'application/json' });
//             res.end(JSON.stringify(result.rows));
//         } catch (error) {
//             res.writeHead(500, { 'Content-Type': 'application/json' });
//             res.end(JSON.stringify({ error: error.message }));
//         }
//     } else if (url.pathname === '/api/gps-data' && req.method === 'GET') {
//         try {
//             const imei = url.searchParams.get('imei');
//             const limit = url.searchParams.get('limit') || 100;
            
//             let query = 'SELECT * FROM gps_data WHERE latitude IS NOT NULL AND longitude IS NOT NULL';
//             let params = [];
            
//             if (imei) {
//                 query += ' AND device_imei = $1';
//                 params.push(imei);
//             }
            
//             query += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1);
//             params.push(parseInt(limit));
            
//             const result = await pool.query(query, params);
//             res.writeHead(200, { 'Content-Type': 'application/json' });
//             res.end(JSON.stringify(result.rows));
//         } catch (error) {
//             res.writeHead(500, { 'Content-Type': 'application/json' });
//             res.end(JSON.stringify({ error: error.message }));
//         }
//     } else if (url.pathname === '/api/upload' && req.method === 'POST') {
//         // For HTTP upload (alternative to TCP)
//         let body = '';
//         req.on('data', chunk => {
//             body += chunk.toString();
//         });
        
//         req.on('end', async () => {
//             try {
//                 // Save to text file
//                 saveToTextFile(body);
                
//                 // Parse and save to database
//                 const parsedData = parseGPSData(body);
//                 if (parsedData.imei) {
//                     await saveToDatabase(parsedData);
//                 }
                
//                 res.writeHead(200, { 'Content-Type': 'application/json' });
//                 res.end(JSON.stringify({ 
//                     success: true, 
//                     message: 'Data received and saved',
//                     device: parsedData.imei 
//                 }));
//             } catch (error) {
//                 res.writeHead(500, { 'Content-Type': 'application/json' });
//                 res.end(JSON.stringify({ error: error.message }));
//             }
//         });
//     } else if (url.pathname === '/api/stats' && req.method === 'GET') {
//         try {
//             const devicesCount = await pool.query('SELECT COUNT(*) FROM devices');
//             const dataCount = await pool.query('SELECT COUNT(*) FROM gps_data');
//             const todayCount = await pool.query(`
//                 SELECT COUNT(*) FROM gps_data 
//                 WHERE DATE(timestamp) = CURRENT_DATE
//             `);
            
//             res.writeHead(200, { 'Content-Type': 'application/json' });
//             res.end(JSON.stringify({
//                 totalDevices: parseInt(devicesCount.rows[0].count),
//                 totalRecords: parseInt(dataCount.rows[0].count),
//                 todayRecords: parseInt(todayCount.rows[0].count),
//                 serverTime: new Date().toISOString()
//             }));
//         } catch (error) {
//             res.writeHead(500, { 'Content-Type': 'application/json' });
//             res.end(JSON.stringify({ error: error.message }));
//         }
//     } else {
//         res.writeHead(404, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify({ error: 'Endpoint not found' }));
//     }
// });

// // Start servers
// async function startServers() {
//     try {
//         // Test database connection
//         await pool.query('SELECT 1');
//         console.log('PostgreSQL connected successfully');
        
//         // Initialize log file
//         initializeLogFile();
        
//         // Start TCP server
//         tcpServer.listen(TCP_PORT, () => {
//             console.log(`TCP Server listening on port ${TCP_PORT}`);
//             console.log('Waiting for GPS devices to connect...');
//         });
        
//         // Start HTTP server
//         httpServer.listen(HTTP_PORT, () => {
//             console.log(`HTTP Server listening on port ${HTTP_PORT}`);
//             console.log(`API available at http://localhost:${HTTP_PORT}/api`);
//         });
        
//         // Graceful shutdown
//         process.on('SIGINT', async () => {
//             console.log('\nShutting down servers...');
            
//             const timestamp = new Date().toISOString();
//             const footer = `\n=== Server Stopped at ${timestamp} ===\n`;
//             fs.appendFileSync(LOG_FILE, footer);
            
//             tcpServer.close();
//             httpServer.close();
//             await pool.end();
            
//             console.log('Servers closed');
//             process.exit(0);
//         });
        
//     } catch (error) {
//         console.error('Failed to start servers:', error);
//         process.exit(1);
//     }
// }

// // Export for testing
// module.exports = {
//     parseGPSData,
//     saveToDatabase,
//     saveToTextFile,
//     startServers,
//     pool
// };

// // Start servers if run directly
// if (require.main === module) {
//     startServers();
// }

const http = require('http');
const { Pool } = require('pg');

const HTTP_PORT = process.env.PORT || 3000;

// ✅ CRITICAL: Add SSL configuration for Render PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false  // This is REQUIRED for Render PostgreSQL
    }
});

// Initialize database
async function initDatabase() {
    try {
        // Test connection first
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL database');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS devices (
                device_id SERIAL PRIMARY KEY,
                imei VARCHAR(20) UNIQUE NOT NULL,
                device_name VARCHAR(50),
                model VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS gps_data (
                id SERIAL PRIMARY KEY,
                device_imei VARCHAR(20) NOT NULL,
                protocol VARCHAR(10),
                timestamp TIMESTAMP NOT NULL,
                latitude DECIMAL(10, 6),
                longitude DECIMAL(10, 6),
                speed DECIMAL(5, 2),
                heading DECIMAL(5, 2),
                altitude DECIMAL(6, 2),
                satellites INTEGER,
                hdop DECIMAL(4, 2),
                gsm_signal INTEGER,
                battery_voltage DECIMAL(5, 2),
                status INTEGER,
                raw_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        client.release();
        console.log('✅ Database tables ready');
    } catch (error) {
        console.error('❌ Database error:', error.message);
        console.error('Full error:', error);
        // Don't crash - server can still run
    }
}

// Parse GPS data (keep your existing function)
function parseGPSData(rawData) {
    // Your parsing logic here
    return {
        imei: 'test',
        protocol: 'test',
        timestamp: new Date(),
        rawData: rawData
    };
}

// HTTP Server
const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.url === '/api/stats' && req.method === 'GET') {
        try {
            const devices = await pool.query('SELECT COUNT(*) FROM devices');
            const data = await pool.query('SELECT COUNT(*) FROM gps_data');
            
            res.end(JSON.stringify({
                status: 'online',
                devices: parseInt(devices.rows[0].count),
                records: parseInt(data.rows[0].count),
                serverTime: new Date().toISOString()
            }));
        } catch (error) {
            res.end(JSON.stringify({ error: error.message, status: 'db_error' }));
        }
    } else if (req.url === '/api/gps' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const parsed = parseGPSData(body);
                
                // Save device
                await pool.query(
                    `INSERT INTO devices (imei, device_name) 
                     VALUES ($1, $2) 
                     ON CONFLICT (imei) DO NOTHING`,
                    [parsed.imei, 'Unknown']
                );
                
                // Save GPS data
                await pool.query(`
                    INSERT INTO gps_data 
                    (device_imei, protocol, timestamp, raw_data)
                    VALUES ($1, $2, $3, $4)
                `, [parsed.imei, parsed.protocol, parsed.timestamp, parsed.rawData]);
                
                res.end(JSON.stringify({ status: 'received' }));
            } catch (error) {
                console.error('GPS data save error:', error);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else {
        res.end(JSON.stringify({ 
            message: 'GPS Server',
            endpoints: [
                'GET /api/stats',
                'POST /api/gps'
            ],
            database: process.env.DATABASE_URL ? 'Connected' : 'Not connected'
        }));
    }
});

// Start server with better error handling
async function startServer() {
    try {
        await initDatabase();
        
        server.listen(HTTP_PORT, '0.0.0.0', () => {
            console.log(`✅ GPS Server running on port ${HTTP_PORT}`);
            console.log(`🌐 Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
            console.log(`📊 Health check: http://localhost:${HTTP_PORT}/api/stats`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await pool.end();
    process.exit(0);
});

startServer();
