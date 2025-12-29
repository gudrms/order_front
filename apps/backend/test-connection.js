const net = require('net');

const host = 'aws-1-ap-northeast-2.pooler.supabase.com';
const ports = [6543, 5432];

console.log(`Testing connectivity to ${host}...`);

function checkPort(port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(5000); // 5 second timeout

        socket.on('connect', () => {
            console.log(`✅ Success: Connected to port ${port}`);
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            console.log(`❌ Timeout: Could not connect to port ${port} (Firewall/Network issue)`);
            socket.destroy();
            resolve(false);
        });

        socket.on('error', (err) => {
            console.log(`❌ Error on port ${port}: ${err.message}`);
            resolve(false);
        });

        socket.connect(port, host);
    });
}

async function run() {
    for (const port of ports) {
        await checkPort(port);
    }
}

run();
