import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Masukkan ID Thread "LOKET PEMBUATAN SIM" Anda langsung di sini
const CONFIG = {
    THREAD_CHANNEL_ID: "1505228395963879616" 
};

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', async () => {
    console.log(`🤖 Bot aktif untuk pemindaian berkala: ${client.user.tag}`);
    
    try {
        const channel = await client.channels.fetch(CONFIG.THREAD_CHANNEL_ID);
        if (!channel || (channel.type !== ChannelType.PublicThread && channel.type !== ChannelType.PrivateThread)) {
            console.error("❌ ID Channel bukan sebuah thread atau tidak ditemukan.");
            process.exit(1);
        }

        const messages = await channel.messages.fetch({ limit: 50 });
        console.log(`🔍 Memeriksa ${messages.size} pesan di dalam thread...`);

        for (const [id, message] of messages) {
            if (message.author.bot) continue;

            const content = message.content;
            if (!content.includes("FORMAT PEMBUATAN SIM") || !content.includes("PASSPORT/UCP")) continue;

            const { data: existingData } = await supabase
                .from('pendaftaran_sim')
                .select('message_id')
                .eq('message_id', message.id)
                .maybeSingle();

            if (existingData) continue; 

            // Ekstraksi teks dan membersihkan spasi / sisa baris baru
            const passportMatch = content.match(/PASSPORT\/UCP\s*:\s*(.*)/i);
            const namaMatch = content.match(/NAMA LENGKAP\s*:\s*(.*)/i);
            const noHpMatch = content.match(/NOMOR HP\s*:\s*(.*)/i);
            const jenisSimMatch = content.match(/JENIS SIM\s*:\s*(.*)/i);
            const fotoKtpUrl = message.attachments.first() ? message.attachments.first().url : null;

            // Fungsi pembantu untuk merapikan teks hasil regex
            const cleanText = (match) => match ? match[1].trim().replace(/[\r\n]+/g, '') : null;

            const payload = {
                message_id: message.id,
                // Baris thread_id telah dihapus
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
                console.log(`✅ Sukses menyimpan data SIM baru milik: ${payload.nama_lengkap}`);
            } else {
                console.error(`❌ Gagal menyimpan data:`, error.message);
            }
        }

    } catch (err) {
        console.error('❌ Terjadi kesalahan:', err.message);
    } finally {
        client.destroy();
        process.exit(0);
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
