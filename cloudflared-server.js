// Simple server that forwards to your GPS server
const http = require('http');

const GPS_SERVER_URL = 'https://gps-server-zq8o.onrender.com';

const server = http.createServer((req, res) => {
    // Forward all requests
    const forwardReq = http.request(GPS_SERVER_URL + req.url, {
        method: req.method,
        headers: req.headers
    }, (forwardRes) => {
        res.writeHead(forwardRes.statusCode, forwardRes.headers);
        forwardRes.pipe(res);
    });
    
    req.pipe(forwardReq);
});

server.listen(3000, () => {
    console.log('Cloudflare Tunnel Proxy running on port 3000');
});
