const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
require('dotenv').config();

const CONFIG = {
    THREAD_CHANNEL_ID: "1505228395963879616" 
};

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

// Fungsi pembantu untuk merapikan teks hasil regex secara aman
const cleanText = (match) => match && match[1] ? match[1].trim().replace(/[\r\n]+/g, '') : null;

// Fungsi mandiri untuk memproses dan menyimpan data ke Supabase (Anti-Ganda)
async function prosesDanSimpanPesan(message) {
    if (message.author.bot) return;

    const content = message.content;
    if (!content.includes("FORMAT PEMBUATAN SIM") || !content.includes("PASSPORT/UCP")) return;

    try {
        // 1. CEK ANTI-GANDA: Periksa apakah ID pesan sudah terdaftar di Supabase
        const { data: existingData } = await supabase
            .from('pendaftaran_sim')
            .select('message_id')
            .eq('message_id', message.id)
            .maybeSingle();

        if (existingData) return; // Jika sudah ada, langsung lewati (skip)

        // 2. Ekstraksi Data Regex
        const passportMatch = content.match(/PASSPORT\/UCP\s*:\s*(.*)/i);
        const namaMatch = content.match(/NAMA LENGKAP\s*:\s*(.*)/i);
        const noHpMatch = content.match(/NOMOR HP\s*:\s*(.*)/i);
        const jenisSimMatch = content.match(/JENIS SIM\s*:\s*(.*)/i);
        const fotoKtpUrl = message.attachments.first() ? message.attachments.first().url : null;

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

        // 3. Masukkan ke Supabase
        const { error } = await supabase.from('pendaftaran_sim').insert([payload]);
        if (!error) {
            console.log(`✅ Sukses menyimpan data SIM milik: ${payload.nama_lengkap}`);
        } else {
            console.error(`❌ Gagal menyimpan data ke Supabase:`, error.message);
        }

    } catch (err) {
        console.error('❌ Terjadi kesalahan saat memproses pesan:', err.message);
    }
}

// --- EVENT 1: PEMINDAIAN MASSAL PESAN LAMA SAAT BOT MENYALA ---
client.once('ready', async () => {
    console.log(`🤖 Bot Layanan SIM Online: ${client.user.tag}`);
    console.log(`⏳ Memulai pemindaian menyeluruh isi riwayat thread...`);
    
    try {
        const channel = await client.channels.fetch(CONFIG.THREAD_CHANNEL_ID);
        if (!channel || (channel.type !== ChannelType.PublicThread && channel.type !== ChannelType.PrivateThread)) {
            console.error("❌ ID Channel bukan sebuah thread atau tidak ditemukan.");
            return;
        }

        let lastMessageId = null;
        let totalScanned = 0;
        let running = true;

        // Melakukan looping scrolling ke atas tanpa batas sampai pesan paling awal (pertama dibuat)
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
                lastMessageId = message.id; // Geser jangkar pemindaian ke pesan yang lebih lama
            }

            totalScanned += messages.size;
            console.log(`🔄 Telah memindai ${totalScanned} riwayat pesan...`);
            
            // Beri jeda 1 detik per ambil data agar tidak terkena Rate Limit API Discord
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`✨ Pemindaian riwayat pesan lama selesai! Bot sekarang stand-by memantau data baru...`);

    } catch (err) {
        console.error('❌ Gagal memindai riwayat lama:', err.message);
    }
});

// --- EVENT 2: STAND-BY MENUNGGU PESAN BARU (REALTIME) ---
client.on('messageCreate', async (message) => {
    // Pastikan pesan masuk di ID Thread yang dipantau
    if (message.channel.id !== CONFIG.THREAD_CHANNEL_ID) return;
    
    // Langsung proses secara otomatis
    await prosesDanSimpanPesan(message);
});

client.login(process.env.DISCORD_BOT_TOKEN);
