const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.get('/', (req, res) => res.send('Anuu Official Bot Server is active!'));
app.listen(process.env.PORT || 3000);

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrcode.generate(qr, { small: true });
            console.log('=== QR Code එක පහතින් ඇත. Scan කරන්න ===');
        }
        
        if (connection === 'close') {
            console.log('සම්බන්ධතාවය බිඳ වැටුණා, නැවත උත්සාහ කරයි...');
            startBot();
        } else if (connection === 'open') {
            console.log('ANUU OFFICIAL BOT V1.01 is ready and running perfectly! ✅');
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
        const from = msg.key.remoteJid;
        const cmd = text.toLowerCase();

        // ======= 1. LOCAL IMAGE + VOICE NOTE සහිත .MENU COMMAND එක =======
        if (cmd === '.menu' || cmd === '.help') {

            const menuText = 
`╔══════════════════════╗
   *ANUU OFFICIAL BOT V1.01* 🤖
╚══════════════════════╝

👋 හලෝ, මම ඔයාගේ සහායක වට්සැප් බොට්. පහත දැක්වෙන්නේ මගේ සියලුම විධානයන් (Commands) ලැයිස්තුවයි.

┌───────────────────────
│ 📥 *DOWNLOAD COMMANDS*
├───────────────────────
│ 🎬 *.video* [link] - වීඩියෝ ඩවුන්ලෝඩ් කරන්න
│ 🎵 *.song* [නම / link] - සින්දු බාගත කරන්න
│ 📝 *.sub* [නම] - සිංහල සබ්ටයිටල් බාගන්න 🇱🇰
└───────────────────────

┌───────────────────────
│ 🔍 *SEARCH COMMANDS*
├───────────────────────
│ 📸 *.image* [නම] - පින්තූර සොයන්න
│ 🎥 *.movie* [නම] - චිත්‍රපට විස්තර සොයන්න
└───────────────────────

┌───────────────────────
│ ⚙️ *SYSTEM COMMANDS*
├───────────────────
│ ℹ️ *.alive* - බොට් සක්‍රීයදැයි බැලීමට
└───────────────────────

💡 *භාවිතා කරන ක්‍රමය:*
උදාහරණයක් ලෙස චිත්‍රපටයක සිංහල සබ්ටයිටල් එකක් අවශ්‍ය නම් \`.sub Avatar\` ලෙස එවන්න.

*Created by anuu-studios* ✨`;

            try {
                // Image එක Path එක විදිහට දෙනවා
                if (fs.existsSync('./menu.jpg')) {
                    await sock.sendMessage(from, { 
                        image: { url: './menu.jpg' }, // fs.readFileSync වෙනුවට { url: '...' } දැම්මා
                        caption: menuText 
                    });
                } else {
                    await sock.sendMessage(from, { text: menuText });
                }

                // Voice Note එකක් වෙනුවට සාමාන්‍ය Audio එකක් විදිහට යවනවා (ප්ලේ වෙනවාමයි)
if (fs.existsSync('./menu.mp3')) {
    await sock.sendMessage(from, { 
        audio: { url: './menu.mp3' }, 
        mimetype: 'audio/mp4', 
        ptt: false // true වෙනුවට false දාන්න
    });
}

            } catch (err) {
                console.log("Menu Error: ", err);
                await sock.sendMessage(from, { text: menuText });
            }
            return;
        }

        // ======= 2. SYSTEM ALIVE COMMAND =======
        if (cmd === '.alive') {
            await sock.sendMessage(from, { text: '✨ *ANUU OFFICIAL BOT V1.01 is alive and working perfectly!* ✅\n\n*Created by anuu-studios*' });
            return;
        }

        // ======= 3. SINHALA SUBTITLE DOWNLOADER =======
        if (text.startsWith('.sub ')) {
            const query = text.replace('.sub ', '').trim();
            await sock.sendMessage(from, { text: `⏳ *"${query}" චිත්‍රපටයේ සිංහල සබ්ටයිටල් සොයමින් පවතිනවා...* 🇱🇰` });

            try {
                const searchRes = await axios.get(`https://api.dreaded.site/api/search/subscene?query=${encodeURIComponent(query)}&lang=sinhala`);
                
                if (searchRes.data?.result && searchRes.data.result.length > 0) {
                    const subLink = searchRes.data.result[0].download_url;
                    const subTitle = searchRes.data.result[0].title || query;

                    await sock.sendMessage(from, { text: `📥 *මෙන්න සබ්ටයිටල් එක හම්බුණා!* දැන් ඔයාගේ වට්සැප් එකට ෆයිල් එක Upload වෙනවා...` });

                    await sock.sendMessage(from, {
                        document: { url: subLink },
                        mimetype: 'application/zip',
                        fileName: `${subTitle} Sinhala Sub.zip`,
                        caption: `📝 *${subTitle} Sinhala Subtitle*\n\n*Done by anuu-bot v1.01* ✨`
                    });
                } else {
                    await sock.sendMessage(from, { text: '❌ කණගාටුයි, මේ චිත්‍රපටය සඳහා සිංහල සබ්ටයිටල් සොයාගන්න ලැබුණේ නැහැ.' });
                }
            } catch (error) {
                await sock.sendMessage(from, { text: '❌ සබ්ටයිටල් සෙවීමේදී සර්වර් දෝෂයක් ආවා. පසුව උත්සාහ කරන්න.' });
            }
        }

        // ======= 4. VIDEO DOWNLOADER =======
        if (text.startsWith('.video ')) {
            const url = text.replace('.video ', '').trim();
            if (!url.startsWith('http')) return sock.sendMessage(from, { text: '❌ කරුණාකර නිවැරදි ලින්ක් එකක් ලබාදෙන්න.' });

            await sock.sendMessage(from, { text: '⏳ *පොඩ්ඩක් ඉන්න... ඔයාගේ වීඩියෝ එක ඩවුන්ලෝඩ් වෙමින් පවතිනවා...*' });
            try {
                const response = await axios.get(`https://api.dreaded.site/api/download/all?url=${encodeURIComponent(url)}`);
                if (response.data?.result?.download_url) {
                    await sock.sendMessage(from, { 
                        video: { url: response.data.result.download_url }, 
                        caption: `🎬 *${response.data.result.title || 'Video'}*\n\n*Done by anuu-bot v1.01* ✨` 
                    });
                } else {
                    await sock.sendMessage(from, { text: '❌ කණගාටුයි, මේ ලින්ක් එක ඩවුන්ලෝඩ් කරන්න බැරි වුණා.' });
                }
            } catch (err) { await sock.sendMessage(from, { text: '❌ සර්වර් එකේ ගැටලුවක්. පසුව උත්සාහ කරන්න.' }); }
        }

        // ======= 5. SONG DOWNLOADER =======
        if (text.startsWith('.song ')) {
            const query = text.replace('.song ', '').trim();
            await sock.sendMessage(from, { text: `⏳ *"${query}" සින්දුව සොයමින් පවතිනවා...*` });
            try {
                const response = await axios.get(`https://api.dreaded.site/api/ytdl/video?query=${encodeURIComponent(query)}`);
                if (response.data?.result?.audio) {
                    await sock.sendMessage(from, { 
                        audio: { url: response.data.result.audio }, 
                        mimetype: 'audio/mp4',
                        ptt: false 
                    });
                } else {
                    await sock.sendMessage(from, { text: '❌ කණගාටුයි, සින්දුව සොයාගන්න ලැබුණේ නැහැ.' });
                }
            } catch (err) { await sock.sendMessage(from, { text: '❌ සින්දුව බාගැනීමේදී දෝෂයක් ආවා.' }); }
        }

        // ======= 6. IMAGE SEARCH =======
        if (text.startsWith('.image ')) {
            const query = text.replace('.image ', '').trim();
            await sock.sendMessage(from, { text: `⏳ *"${query}" පින්තූර සොයමින් පවතිනවා...*` });
            try {
                const response = await axios.get(`https://api.dreaded.site/api/search/pinterest?query=${encodeURIComponent(query)}`);
                if (response.data?.result && response.data.result.length > 0) {
                    const imageUrl = response.data.result[0].image; 
                    await sock.sendMessage(from, { image: { url: imageUrl }, caption: `📸 *මෙන්න ඔයා ඉල්ලපු පින්තූරය:* ${query}\n\n*Anuu Official Bot*` });
                } else {
                    await sock.sendMessage(from, { text: '❌ පින්තූර සොයාගන්න ලැබුණේ නැහැ.' });
                }
            } catch (err) { await sock.sendMessage(from, { text: '❌ දෝෂයක් ආවා, නැවත උත්සාහ කරන්න.' }); }
        }

        // ======= 7. MOVIE DETAILS SEARCH =======
        if (text.startsWith('.movie ')) {
            const query = text.replace('.movie ', '').trim();
            await sock.sendMessage(from, { text: `⏳ *"${query}" චිත්‍රපටයේ විස්තර සොයමින් පවතිනවා...*` });
            try {
                const response = await axios.get(`https://api.dreaded.site/api/search/imdb?query=${encodeURIComponent(query)}`);
                if (response.data?.result && response.data.result.length > 0) {
                    const movie = response.data.result[0];
                    const movieDetails = `🎬 *Title:* ${movie.title}\n` +
                                         `📅 *Year:* ${movie.year}\n` +
                                         `⭐ *Rating:* ${movie.rating || 'N/A'}\n` +
                                         `🎭 *Type:* ${movie.type || 'Movie'}\n\n` +
                                         `🔗 *IMDb Link:* ${movie.imdb_url || 'N/A'}\n\n` +
                                         `*Done by anuu-bot v1.01* ✨`;
                    
                    if (movie.poster) {
                        await sock.sendMessage(from, { image: { url: movie.poster }, caption: movieDetails });
                    } else {
                        await sock.sendMessage(from, { text: movieDetails });
                    }
                } else {
                    await sock.sendMessage(from, { text: '❌ මෙවැනි චිත්‍රපටයක් සොයාගන්න ලැබුණේ නැහැ.' });
                }
            } catch (err) { await sock.sendMessage(from, { text: '❌ විස්තර සෙවීමේදී දෝෂයක් ආවා.' }); }
        }
    });
}

startBot();