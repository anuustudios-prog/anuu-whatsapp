const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fs = require('fs');

const app = express();
app.get('/', (req, res) => res.send('Anuu Bot Server is Online 24/7!'));
app.listen(process.env.PORT || 3000);

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({ auth: state, printQRInTerminal: true });
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });
        if (connection === 'close') startBot();
        else if (connection === 'open') console.log('ANUU BOT V2.1 PREMIUM IS ONLINE 24/7! ✅');
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
        const from = msg.key.remoteJid;
        const cmd = text.toLowerCase();

        const cobaltHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
        };

        // ======= 1. LASSANA MENU WITH IMAGE & AUDIO =======
        if (cmd === '.menu' || cmd === '.help') {
            const menuText = 
`╔══════════════════════╗
   *ANUU OFFICIAL BOT 24/7* 🤖
╚══════════════════════╝

👋 හලෝ, මම ඔයාගේ සහායක වට්සැප් බොට්. 

┌───────────────────────
│ 📥 *DOWNLOAD COMMANDS*
├───────────────────────
│ 🎬 *.video* [YouTube Link] - වීඩියෝ බාගන්න
│ 🎵 *.song* [YouTube Link] - සින්දු බාගත කරන්න
└───────────────────────

┌───────────────────────
│ ⚙️ *SYSTEM COMMANDS*
├───────────────────
│ ℹ️ *.alive* - බොට් සක්‍රීයදැයි බැලීමට
└───────────────────────

*Created by anuu-studios* ✨`;

            // ඔයාගේ GitHub එකේ තියෙන menu.jpg එක කෙලින්ම WhatsApp එකට යවනවා
            await sock.sendMessage(from, { 
                image: { url: 'https://raw.githubusercontent.com/anuustudios-prog/anuu-whatsapp/main/menu.jpg' }, 
                caption: menuText 
            });

            // මෙනු එකත් එක්ක යන ලස්සන Voice Note / Audio එක
            await sock.sendMessage(from, { 
                audio: { url: 'https://raw.githubusercontent.com/anuustudios-prog/anuu-whatsapp/main/menu.mp3' }, 
                mimetype: 'audio/mp4', 
                ptt: false 
            });
            return;
        }

        if (cmd === '.alive') {
            return await sock.sendMessage(from, { text: '✨ *Anuu Bot is running 24 Hours online!* ✅' });
        }

        // ======= 2. COBALT PREMIUM VIDEO DOWNLOADER =======
        if (text.startsWith('.video ')) {
            const url = text.replace('.video ', '').trim();
            if (!url.startsWith('http')) return sock.sendMessage(from, { text: '❌ කරුණාකර නිවැරදි YouTube ලින්ක් එකක් ලබාදෙන්න.' });
            
            await sock.sendMessage(from, { text: '⏳ *වීඩියෝව බාගත වෙමින් පවතිනවා...*' });
            try {
                const response = await fetch('https://api.cobalt.tools/api/json', {
                    method: 'POST', headers: cobaltHeaders, body: JSON.stringify({ url: url, vQuality: '720', isAudioOnly: false })
                });
                const data = await response.json();
                if (data?.url) {
                    await sock.sendMessage(from, { video: { url: data.url }, caption: '🎬 *Downloaded via Koyeb 24/7* ✨' });
                } else {
                    await sock.sendMessage(from, { text: '❌ වීඩියෝව බාගත කිරීමට සර්වර් එක අසමත් වුණා.' });
                }
            } catch (err) { await sock.sendMessage(from, { text: '❌ සර්වර් දෝෂයකි.' }); }
        }

        // ======= 3. COBALT PREMIUM SONG DOWNLOADER =======
        if (text.startsWith('.song ')) {
            const url = text.replace('.song ', '').trim();
            if (!url.startsWith('http')) return sock.sendMessage(from, { text: '❌ කරුණාකර නිවැරදි YouTube ලින්ක් එකක් ලබාදෙන්න.' });
            
            await sock.sendMessage(from, { text: '⏳ *සින්දුව බාගත වෙමින් පවතිනවා...*' });
            try {
                const response = await fetch('https://api.cobalt.tools/api/json', {
                    method: 'POST', headers: cobaltHeaders, body: JSON.stringify({ url: url, isAudioOnly: true })
                });
                const data = await response.json();
                if (data?.url) {
                    await sock.sendMessage(from, { audio: { url: data.url }, mimetype: 'audio/mp4', ptt: false });
                } else {
                    await sock.sendMessage(from, { text: '❌ සින්දුව බාගත කිරීමට සර්වර් එක අසමත් වුණා.' });
                }
            } catch (err) { await sock.sendMessage(from, { text: '❌ සර්වර් දෝෂයකි.' }); }
        }
    });
}
startBot();