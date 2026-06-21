const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
require('dotenv').config();

// ==================== CONFIG: ID THREAD DISCORD ====================
const CONFIG = {
    THREAD_SIM_ID: "1505228395963879616",  // ID Thread khusus SIM
    THREAD_SKCK_ID: "1506887659585536040" // ID Thread khusus SKCK
};
// ========================================================================

const supabase = createClient(
    process.env.LAYANAN_URL, 
    process.env.LAYANAN_ANON_KEY,
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
            // Pemotongan teks dengan Regex baru (*) agar baris kosong tidak error
            const passportMatch = content.match(/PASSPORT\s*[\/|]\s*UCP\s*:\s*([^\n\r]*)/i);
            const namaMatch     = content.match(/NAMA\s*LENGKAP\s*:\s*([^\n\r]*)/i);
            const noHpMatch     = content.match(/NOMOR\s*HP\s*:\s*([^\n\r]*)/i);
            const jenisSimMatch = content.match(/JENIS\s*SIM\s*:\s*([^\n\r]*)/i);
            const fotoKtpUrl    = message.attachments.first() ? message.attachments.first().url : null;

            const passportUcp = cleanText(passportMatch);
            const jenisSimBaru = cleanText(jenisSimMatch);

            if (!passportUcp) return; 

            // Cek apakah data user sudah ada sebelumnya untuk menggabungkan Jenis SIM
            const { data: dataLama } = await supabase
                .from('pendaftaran_sim')
                .select('jenis_sim')
                .eq('passport_ucp', passportUcp)
                .maybeSingle();

            let jenisSimFinal = jenisSimBaru;

            if (dataLama) {
                const daftarSimLama = dataLama.jenis_sim ? dataLama.jenis_sim.split(',').map(s => s.trim()) : [];
                
                // Masukkan jenis SIM ke daftar jika belum terdaftar sebelumnya (mencegah duplikat seperti A, A)
                if (jenisSimBaru && !daftarSimLama.includes(jenisSimBaru)) {
                    daftarSimLama.push(jenisSimBaru);
                }
                
                // Urutkan alfabetis agar rapi (A, B) lalu satukan dengan koma
                jenisSimFinal = daftarSimLama.sort().join(', ');
            }

            const payload = {
                message_id: message.id,
                author_id: message.author.id,
                author_name: message.author.username,
                passport_ucp: passportUcp,
                nama_lengkap: cleanText(namaMatch),
                nomor_hp: cleanText(noHpMatch),
                jenis_sim: jenisSimFinal,
                foto_ktp_url: fotoKtpUrl || (dataLama ? undefined : null), // Gunakan foto lama jika foto baru kosong
                created_at: new Date(message.createdTimestamp).toISOString()
            };

            // Menggunakan UPSERT untuk memperbarui baris data yang sama
            const { error } = await supabase
                .from('pendaftaran_sim')
                .upsert([payload], { onConflict: 'passport_ucp' });

            if (!error) console.log(`✅ [SIM] Sukses memperbarui/menyimpan data milik: ${payload.nama_lengkap} (${jenisSimFinal})`);
            else console.error(`❌ [SIM] Gagal menyimpan ke Supabase:`, error.message);

        } catch (err) {
            console.error('❌ Error proses SIM:', err.message);
        }
    }

    // 2. PROSES DATA JIKA MASUK KE CHANNEL SKCK
    if (isSkckChannel && content.includes("FORMAT PEMBUATAN SKCK") && content.includes("PASSPORT/UCP")) {
        try {
            const passportMatch  = content.match(/PASSPORT\s*[\/|]\s*UCP\s*:\s*([^\n\r]*)/i);
            const namaMatch      = content.match(/NAMA\s*LENGKAP\s*:\s*([^\n\r]*)/i);
            const noHpMatch      = content.match(/NOMOR\s*HP\s*:\s*([^\n\r]*)/i);
            const keperluanMatch = content.match(/KEPERLUAN\s*:\s*([^\n\r]*)/i);
            const fotoKtpUrl     = message.attachments.first() ? message.attachments.first().url : null;

            const passportUcp = cleanText(passportMatch);
            if (!passportUcp) return;

            const payload = {
                message_id: message.id,
                author_id: message.author.id,
                author_name: message.author.username,
                passport_ucp: passportUcp,
                nama_lengkap: cleanText(namaMatch),
                nomor_hp: cleanText(noHpMatch),
                keperluan: cleanText(keperluanMatch),
                foto_ktp_url: fotoKtpUrl,
                created_at: new Date(message.createdTimestamp).toISOString()
            };

            // Menggunakan UPSERT untuk memperbarui baris data SKCK yang sama
            const { error } = await supabase
                .from('pendaftaran_skck')
                .upsert([payload], { onConflict: 'passport_ucp' });

            if (!error) console.log(`✅ [SKCK] Sukses memperbarui/menyimpan data milik: ${payload.nama_lengkap}`);
            else console.error(`❌ [SKCK] Gagal menyimpan ke Supabase:`, error.message);

        } catch (err) {
            console.error('❌ Error proses SKCK:', err.message);
        }
    }
}

// --- FUNGSI SCANNING RIWAYAT SECARA MASSAL ---
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
    if (message.channel.id !== CONFIG.THREAD_SIM_ID && message.channel.id !== CONFIG.THREAD_SKCK_ID) return;
    await prosesDanSimpanPesan(message);
});

client.login(process.env.DISCORD_BOT_TOKEN);
