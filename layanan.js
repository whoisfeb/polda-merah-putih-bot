const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
require('dotenv').config();

// ==================== PERBAIKAN: DUA CHANNEL BERBEDA ====================
const CONFIG = {
    THREAD_SIM_ID: "1505228395963879616",  // ID Thread khusus SIM
    THREAD_SKCK_ID: "1506887659585536040" // GANTI DENGAN ID CHANNEL/THREAD SKCK
};
// ========================================================================

const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_ANON_KEY,
    {
        auth: { persistSession: false },
        realtime: { transport: ws }
    }
);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const cleanText = (match) => match && match[1] ? match[1].trim() : null;

// ==================== FUNGSI UTAMA PROSES DATA ====================
async function prosesDanSimpanPesan(message) {
    if (message.author.bot) return;

    const content = message.content;
    const isSimChannel = message.channel.id === CONFIG.THREAD_SIM_ID;
    const isSkckChannel = message.channel.id === CONFIG.THREAD_SKCK_ID;

    // 1. PROSES DATA JIKA MASUK KE CHANNEL SIM
    if (isSimChannel && content.includes("FORMAT PEMBUATAN SIM") && content.includes("PASSPORT/UCP")) {
        try {
            const { data: existingData } = await supabase.from('pendaftaran_sim').select('message_id').eq('message_id', message.id).maybeSingle();
            if (existingData) return; 

            const passportMatch = content.match(/PASSPORT\s*[\/|]\s*UCP\s*:\s*([^\n\r]+)/i);
            const namaMatch     = content.match(/NAMA\s*LENGKAP\s*:\s*([^\n\r]+)/i);
            const noHpMatch     = content.match(/NOMOR\s*HP\s*:\s*([^\n\r]+)/i);
            const jenisSimMatch = content.match(/JENIS\s*SIM\s*:\s*([^\n\r]+)/i);
            const fotoKtpUrl    = message.attachments.first() ? message.attachments.first().url : null;

            const payload = {
                message_id: message.id,
                author_id: message.author.id,
                author_name: message.author.username,
                passport_ucp: cleanText(passportMatch),
                nama_lengkap: cleanText(namaMatch),
                nomor_hp: cleanText(noHpMatch),
                jenis_sim: cleanText(jenisSimMatch),
                foto_ktp_url: fotoKtpUrl,
                created_at: new Date(message.createdTimestamp).toISOString()
            };

            const { error } = await supabase.from('pendaftaran_sim').insert([payload]);
            if (!error) console.log(`✅ [SIM] Sukses menyimpan data milik: ${payload.nama_lengkap}`);
            else console.error(`❌ [SIM] Gagal menyimpan ke Supabase:`, error.message);

        } catch (err) {
            console.error('❌ Error proses SIM:', err.message);
        }
    }

    // 2. PROSES DATA JIKA MASUK KE CHANNEL SKCK
    if (isSkckChannel && content.includes("FORMAT PEMBUATAN SKCK") && content.includes("PASSPORT/UCP")) {
        try {
            const { data: existingData } = await supabase.from('pendaftaran_skck').select('message_id').eq('message_id', message.id).maybeSingle();
            if (existingData) return; 

            // Regex disesuaikan dengan kebutuhan SKCK (ditambahkan Keperluan pembuatan SKCK)
            const passportMatch  = content.match(/PASSPORT\s*[\/|]\s*UCP\s*:\s*([^\n\r]+)/i);
            const namaMatch      = content.match(/NAMA\s*LENGKAP\s*:\s*([^\n\r]+)/i);
            const noHpMatch      = content.match(/NOMOR\s*HP\s*:\s*([^\n\r]+)/i);
            const keperluanMatch = content.match(/KEPERLUAN\s*:\s*([^\n\r]+)/i); // Kolom tambahan SKCK
            const fotoKtpUrl     = message.attachments.first() ? message.attachments.first().url : null;

            const payload = {
                message_id: message.id,
                author_id: message.author.id,
                author_name: message.author.username,
                passport_ucp: cleanText(passportMatch),
                nama_lengkap: cleanText(namaMatch),
                nomor_hp: cleanText(noHpMatch),
                keperluan: cleanText(keperluanMatch),
                foto_ktp_url: fotoKtpUrl,
                created_at: new Date(message.createdTimestamp).toISOString()
            };

            const { error } = await supabase.from('pendaftaran_skck').insert([payload]);
            if (!error) console.log(`✅ [SKCK] Sukses menyimpan data milik: ${payload.nama_lengkap}`);
            else console.error(`❌ [SKCK] Gagal menyimpan ke Supabase:`, error.message);

        } catch (err) {
            console.error('❌ Error proses SKCK:', err.message);
        }
    }
}

// --- FUNGSI SCANNING RIWAYAT SECARA MASSTAL ---
async function scanHistoryChannel(channelId) {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || (channel.type !== ChannelType.PublicThread && channel.type !== ChannelType.PrivateThread)) {
            console.error(`❌ ID ${channelId} bukan sebuah thread atau tidak ditemukan.`);
            return;
        }

        let lastMessageId = null;
        let running = true;

        while (running) {
            const options = { limit: 100 };
            if (lastMessageId) options.before = lastMessageId;

            const messages = await channel.messages.fetch(options);
            if (messages.size === 0) {
                running = false;
                break;
            }

            for (const [id, message] of messages) {
                await prosesDanSimpanPesan(message);
                lastMessageId = message.id; 
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    } catch (err) {
        console.error('❌ Gagal melakukan pemindaian riwayat:', err.message);
    }
}

// --- EVENT 1: PEMINDAIAN MASSAL SAAT BOT NYALA ---
client.once('ready', async () => {
    console.log(`🤖 Bot Layanan Terpadu Polda (SIM & SKCK): ${client.user.tag}`);
    
    console.log(`⏳ Memulai pemindaian riwayat Thread SIM...`);
    await scanHistoryChannel(CONFIG.THREAD_SIM_ID);
    
    console.log(`⏳ Memulai pemindaian riwayat Thread SKCK...`);
    await scanHistoryChannel(CONFIG.THREAD_SKCK_ID);

    console.log(`✨ Semua riwayat selesai disinkronkan! Bot siaga memantau pesan baru...`);
});

// --- EVENT 2: STAND-BY MENUNGGU PESAN BARU ---
client.on('messageCreate', async (message) => {
    // Validasi agar bot hanya merespon jika pesan dikirim di salah satu dari dua channel di atas
    if (message.channel.id !== CONFIG.THREAD_SIM_ID && message.channel.id !== CONFIG.THREAD_SKCK_ID) return;
    await prosesDanSimpanPesan(message);
});

client.login(process.env.DISCORD_BOT_TOKEN);
