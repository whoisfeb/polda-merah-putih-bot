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

// Perbaikan fungsi pembersih teks agar aman mengambil indeks grup ke-1
const cleanText = (match) => match && match[1] ? match[1].trim() : null;

async function prosesDanSimpanPesan(message) {
    if (message.author.bot) return;

    const content = message.content;
    if (!content.includes("FORMAT PEMBUATAN SIM") || !content.includes("PASSPORT/UCP")) return;

    try {
        const { data: existingData } = await supabase
            .from('pendaftaran_sim')
            .select('message_id')
            .eq('message_id', message.id)
            .maybeSingle();

        if (existingData) return; 

        // ==================== PERBAIKAN UTAMA: REGEX ANTI-LECOK ====================
        // Menggunakan [^\n\r]+ agar pencarian teks BERHENTI tepat saat menyentuh batas akhir baris/enter
        const passportMatch   = content.match(/PASSPORT\s*[\/|]\s*UCP\s*:\s*([^\n\r]+)/i);
        const namaMatch       = content.match(/NAMA\s*LENGKAP\s*:\s*([^\n\r]+)/i);
        const noHpMatch       = content.match(/NOMOR\s*HP\s*:\s*([^\n\r]+)/i);
        const jenisSimMatch   = content.match(/JENIS\s*SIM\s*:\s*([^\n\r]+)/i);
        // ===========================================================================
        
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

// --- EVENT 1: PEMINDAIAN MASSAL PESAN LAMA ---
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

            totalScanned += messages.size;
            console.log(`🔄 Telah memindai ${totalScanned} riwayat pesan...`);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`✨ Pemindaian riwayat pesan lama selesai! Bot sekarang stand-by memantau data baru...`);

    } catch (err) {
        console.error('❌ Gagal memindai riwayat lama:', err.message);
    }
});

// --- EVENT 2: STAND-BY MENUNGGU PESAN BARU ---
client.on('messageCreate', async (message) => {
    if (message.channel.id !== CONFIG.THREAD_CHANNEL_ID) return;
    await prosesDanSimpanPesan(message);
});

client.login(process.env.DISCORD_BOT_TOKEN);
