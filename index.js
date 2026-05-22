const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot is active!'));
app.listen(process.env.PORT || 3000);

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('=== QR Code එක පහතින් ඇත. Scan කරන්න ===');
});

client.on('ready', () => {
    console.log('Bot is ready and running!');
});

client.on('message', async (msg) => {
    const text = msg.body.toLowerCase();

    if (text === 'hi' || text === 'hello') {
        msg.reply('හලෝ! මම ඔයාගේ පළමු වට්සැප් බොට්. 🤖');
    }
    if (text === '.alive') {
        msg.reply('I am alive and working perfectly! ✅');
    }
});

client.initialize();
