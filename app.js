const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// Ensure directories exist
const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDirExists('./auth_data');
ensureDirExists('./chrome_data');

// Configure the WhatsApp client
const client = new Client({
  webVersion: "2.3000.1021490555-alpha.html",
  headless: true,
  webVersionCache: {
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/refs/heads/main/html/2.3000.1021490555-alpha.html',
    type: 'remote'
  },
  puppeteer: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ],
    executablePath: '/usr/bin/google-chrome-stable'
  },
  authStrategy: new LocalAuth({
    clientId: 'Ella'
  })
});

// Event for QR code generation
client.on('qr', (qr) => {
  console.log('QR CODE:',qr);
});

// Event for ready state
client.on('ready', () => {
  console.log('Client is ready!');
});

// Event for authentication
client.on('authenticated', () => {
  console.log('Authentication successful!');
});

// Event for auth failure
client.on('auth_failure', (msg) => {
  console.error('Authentication failure:', msg);
});

// Event for disconnection
client.on('disconnected', (reason) => {
  console.log('Client was disconnected:', reason);
});

// Initialize the client
console.log('Starting WhatsApp Web client...');
client.initialize().catch(err => {
  console.error('Error initializing client:', err);
});

// Basic message handling example
client.on('message', async (msg) => {
  console.log('Message received:', msg.body);
  
  // Example reply
  if (msg.body === '!ping') {
    await msg.reply('pong');
  }
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await client.destroy();
  process.exit(0);
});
