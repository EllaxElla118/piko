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
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-features=VizDisplayCompositor',
      '--single-process',
      '--no-zygote',
      '--renderer-process-limit=1',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-domain-reliability',
      '--disable-extensions',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-sync',
      '--force-color-profile=srgb',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-crash-upload',
      '--no-pings',
      '--password-store=basic',
      '--use-gl=swiftshader',
      '--use-mock-keychain',
      '--disable-software-rasterizer',
      '--user-data-dir=./chrome_data'
    ],
    executablePath: '/usr/bin/google-chrome-stable'
  },
  authStrategy: new LocalAuth({
    clientId: 'Ella',
    dataPath: './auth_data'
  })
});

// Event for QR code generation
client.on('qr', (qr) => {
  console.log('QR CODE:');
  qrcode.generate(qr, { small: true });
  
  // Optionally save QR code to a file for access outside container
  fs.writeFileSync('./auth_data/last_qr.txt', qr);
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