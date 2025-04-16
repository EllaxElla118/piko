const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const sharp = require('sharp');
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, HTTP world!');
});

// Start the server
const PORT = 3034; // You can use any available port
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// Ensure directories exist
const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDirExists('./auth_data');
ensureDirExists('./chrome_data');

const https = require('https');

// Replace with your Render app's URL (include the protocol)
const APP_URL = 'https://piko-7v35.onrender.com';

// Function to send a GET request to your own endpoint
function keepAlive() {
  https.get(APP_URL, (res) => {
    // Optionally, log status code or handle the response
    console.log(`Self-ping status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('Error during self-ping:', err);
  });
}

// Ping every 10 minutes (adjust the interval if needed)
const TEN_MINUTES = 1 * 60 * 1000;
setInterval(keepAlive, TEN_MINUTES);

console.log(`Self-ping scheduled every ${TEN_MINUTES / 60000} minutes to ${APP_URL}`);


// Configure the WhatsApp client
const client = new Client({
    webVersion: "2.2412.54v2",
    headless: true,
  puppeteer: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'/*,
      '--disable-gpu',
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
      '--user-data-dir=./chrome_data'*/
    ],
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
  }
});

let paired = false;
// Event for QR code generation
client.on('qr', async(qr) => {
	if(!paired) {
		let x = await client.requestPairingCode('2349113642216');
  	console.log(x);
  	paired = true;
  }
 // qrcode.generate(qr, {small: true});
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

client.on('message', async msg => {
  console.log(`Msg received: ${msg.body}`);
  let chat = await msg.getChat();
  await setState('typing', chat);

  if (msg.body.startsWith('/join ')) {
      const inviteCode = msg.body.split(' ')[1].replace("https://chat.whatsapp.com/", "");
      try {
        await client.acceptInvite(inviteCode);
        msg.reply('Joined the group!');
      } catch (e) {
        msg.reply("Couldn't join the group. Check the invite link and try again...");
      }
  } else if (msg.body === '/exit') {
    if (chat.isGroup) {
      await msg.reply("Bye👋👋😘️");
      chat.leave();
    } else {
      msg.reply('This command can only be used in a group!');
    }
  } else if (msg.body === '/admins') {
    if (chat.isGroup) {
      const admins = chat.participants.filter(participant => participant.isAdmin || participant.isSuperAdmin); 
      const adminList = admins.map(admin => `- +${admin.id._serialized.replace('@c.us', '')}`).join('\n');
      await msg.reply(`The admins are:\n${adminList}`);
    }    
  } else if (msg.body === '/tagadmins') {
    if (chat.isGroup) {
      let mentions = [];
      for (let participant of chat.participants) {
        if (participant.isAdmin || participant.isSuperAdmin) {
          mentions.push(participant.id._serialized);
        }
      }
      chat.sendMessage('@admins', { mentions });
    }    
  } else if (msg.body.startsWith('/promote ')) {
    if (chat.isGroup) {
      const number = msg.body.split(" ")[1].replace('+', '');
      await chat.promoteParticipants([number + '@c.us']);
      msg.reply(`${number} is now an admin`);
    }    
  } else if (msg.body.startsWith('/demote ')) {
    if (chat.isGroup) {
      const number = msg.body.split(" ")[1].replace('+', '');
      await chat.demoteParticipants([number + '@c.us']);
      msg.reply(`${number} is no longer an admin`);
    }    
  } else if (msg.body === '/status') {
    msg.reply("I'm alive😁💯️");
  } else if (msg.body === '/tagall') {
    if (chat.isGroup) {
      let mentions = [];
      for (let participant of chat.participants) {
        mentions.push(participant.id._serialized);
      }
      if (!msg.hasQuotedMsg) {
        chat.sendMessage('@everyone', { mentions });
      } else {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.hasMedia) {
          const attachmentData = await quotedMsg.downloadMedia();
          chat.sendMessage(attachmentData, { caption: quotedMsg.body, mentions });
        } else {
          chat.sendMessage(quotedMsg.body, { mentions });
        }
      }
    } else {
      msg.reply('This command can only be used in a group!');
    }
  } else if (msg.body === '/del' || msg.body === '/delete') {
    if (msg.hasQuotedMsg) {
      const quotedMsg = await msg.getQuotedMessage();
      quotedMsg.delete(true);
    } else {
      msg.reply('Please tag the message to be deleted');
    }
  } else if (msg.body.startsWith('/pin ')) {
    if (msg.hasQuotedMsg) {
      const quotedMsg = await msg.getQuotedMessage();
      let time = await getPinTime(msg.body.split(" ")[1], msg.body.split(" ")[2]);
      if (time) {
        const result = await quotedMsg.pin(time);
        msg.reply(result ? 'Pinned' : "Couldn't Pin Message");
      }
    } else {
      msg.reply('Please tag the message to be pinned');
    }
  } else if(msg.body.startsWith('/test ')) {
      let u = require('./pdf.js');
      let name = await u(1024*1024*parseInt(msg.body.split(' ')[1]), () => console.log(`File created`));
      await client.sendLargeMedia(name, chat.id._serialized);
  } else if (msg.body.startsWith('/chat ')) {
    let a = msg.body.replace("/chat ", "");
    const { default: chatFunction } = await import('./chat.mjs');
    let res = await chatFunction(a);
    if (res) {
      await msg.reply(res + `\n\n> *ⓘ _Generated by Gemini_*`);      
    } else {
      await msg.reply("Sorry, Can't chat right now, I've hit my chat limit... Try later");      
    }
  } else if(msg.body.startsWith('/anisearch')) {
      if(msg.body.split(' ').length === 1) { msg.reply('Use this command as: `/anisearch _anime-name_`');return}
      let y = msg.body.split(' ');
      y.shift();
      let name = y.join(' ');
      const { anisearch } = require('./anime.js');
      let result = await anisearch(name);
      if(!result.success) { msg.reply('Something is wrong with the anime plugin');return }
      console.dir(result.results,{depth: null});
      if(!result.results) { msg.reply('No results found, try shortening the search string, use Japanese name or checking the spelling');return  }
      const formattedReply = 
`🎌 *Anime Search Results* 🎏
────────────────
${result.results.slice(0, 5).map((anime, index) => 
  `${index + 1}. ${anime.text}\n   🔖 ID: \`${anime.animeID}\``
).join('\n\n')}
────────────────
${result.results.length === 0 ? 
  "❌ No results found" : 
  `📑 Found ${result.results.length} matches\n` + 
  "Currently displaying up to 5 results. Increase the search results by using the command /anisearch [name] [results]\n" +
  "Use the ID with /aniinfo [ID] to get details or /anidl [ID] [episode] to download \n\n`Example: /aniinfo one-piece`"}`;
      msg.reply(formattedReply);
  } else if(msg.body.startsWith('/anidl')) {
    let parts = msg.body.split(' ');
    let anidl = require('./anidl.js');
    let vid = await anidl(parts[1],parts[2]);
    await chat.sendMessage(MessageMedia.fromFilePath(vid),{ quotedMessageId: msg.id._serialized });
  } else if(msg.body === '/sticker') {
      if(!msg.hasQuotedMsg) {
        msg.reply('Please tag the image/video to convert to a sticker');return
      }
      let quotedMsg = await msg.getQuotedMessage();
      if(!quotedMsg.hasMedia) { msg.reply('Please tag an image/video to convert to a sticker');return  }
      let media = await quotedMsg.downloadMedia();
      const output = `${(Math.random()*(10e10)).toFixed()}.jpg`;
      const buffer = Buffer.from(media.data, 'base64');
      fs.writeFileSync(output,buffer);/*
      const ffmpegCmd = `ffmpeg -i ${output} -vcodec libwebp -lossless 1 ${output}.webp`;
      let execPromise = util.promisify(exec);
      const { stdout, stderr } = await execPromise(ffmpegCmd);
      const stickerMedia = MessageMedia.fromFilePath(`${output}.webp`);*/
      const stickerMedia = MessageMedia.fromFilePath(`${output}`);
      await chat.sendMessage(stickerMedia, { quotedMessageId: msg.id._serialized, sendMediaAsSticker: true });
      fs.unlink(`${output}.webp`);fs.unlink(`${output}.jpg`);
  } else if (msg.body.startsWith('/ytdl ')) {
    try {
      const { ytdl } = require('./downloader.js');
      const videoUrl = msg.body.split(' ')[1];
      const result = await ytdl(videoUrl);

      if (!result.success) {
        return await msg.reply('Download failed. Please try again later.');
      }
      const files = await require('fs').promises.readdir('./');
    	const path = files.find(file => file.startsWith(result.filePath) && file.includes('.mp4')) || null;
    	if(!path) { msg.reply("Couldn't complete download");return }
  	const ffmpegCmd = `ffmpeg -i ${path} -vf "scale='min(1280,iw)':'-2'" -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart output_${path}`;
		let execPromise = util.promisify(exec);
		const { stdout, stderr } = await execPromise(ffmpegCmd);
  		let media = MessageMedia.fromFilePath(`output_${path}`);
  		await chat.sendMessage(media, {caption: 'Your video is ready!', quotedMessageId: msg.id._serialized});
    	} catch (error) {
      console.error('Error processing video:', error);
      msg.reply('An error occurred while processing your request.');
    }
  } else if (msg.body === '/ban') {
    if (msg.hasQuotedMsg) {
      const quotedMsg = await msg.getQuotedMessage();
      chat.removeParticipants([quotedMsg.author]);
      msg.reply('Member +' + quotedMsg.author.replace('@c.us', '') + ' was banned by admin +' + msg.author.replace('@c.us', ''));
    } else {
      msg.reply(`Please tag the person to be banned or use /ban [The person's number]`);
    }
  } else if (msg.body.startsWith('/ban ')) {
    let t = `Banned user @${msg.body.split(" ")[1]}\n`;
    if (msg.body.split(" ")[2]) {
      t += "Reason: " + msg.body.replace("/ban " + msg.body.split(" ")[1], "");
    }
    msg.reply(t);
    chat.removeParticipants([msg.body.split(" ")[1].replace('+', '') + '@c.us']);
  } else if (msg.body === "/link") {
    let l = await chat.getInviteCode();
    msg.reply('https://chat.whatsapp.com/' + l);
  } else if (msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();
    if (quotedMsg.body.includes('> *ⓘ _Generated by Gemini_*') && quotedMsg.fromMe) {
      let quotedMessagesArray = [];
      await getMemory(msg, quotedMessagesArray);
      quotedMessagesArray.reverse();
      temp_bool = false;
      const { default: chatFunction } = await import('./chat.mjs');
      let res = await chatFunction(msg.body, quotedMessagesArray);
      if (res) {
        await msg.reply(res + `\n\n> *ⓘ _Generated by Gemini_*`);      
      } else {
        await msg.reply("Sorry, Can't chat right now, I've hit my chat limit... Try later");      
      }
    }
  }
  await setState('none', chat); 
});

async function getPinTime(num, type) {
  const timeMap = { seconds: 1, minutes: 60, hours: 3600, days: 86400 };
  return timeMap[type.toLowerCase()] ? num * timeMap[type.toLowerCase()] : null;
}

async function setState(state, chat) {
  if (state === 'typing') {
    chat.sendStateTyping();
  } else if (state === 'none') {
    chat.clearState();
  }
}

let temp_bool = false;
async function getMemory(msg, quotedMessagesArray) {
  const quotedMsg = await msg.getQuotedMessage();
  if (quotedMsg) {
    const role = temp_bool ? "user" : "assistant";
    quotedMessagesArray.push({
      role: role,
      content: quotedMsg.body.trim().split("'").join('').split('> *ⓘ _Generated by Gemini_*').join('').trim()
    });
    temp_bool = !temp_bool;
    if (quotedMsg.hasQuotedMsg) {
      await getMemory(quotedMsg, quotedMessagesArray);
    }
  }
}

async function convertImageToSticker(imagePath) {
  // Convert image to a 512x512 WebP sticker
  const buffer = await sharp(imagePath)
    .resize(512, 512, { fit: 'inside' })
    .toFormat('webp')
    .toBuffer();
  return buffer.toString('base64');
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await client.destroy();
  process.exit(0);
});
