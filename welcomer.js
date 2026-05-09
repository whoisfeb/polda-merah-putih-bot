require('dotenv').config(); // Memuat variabel dari file .env
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// 1. Inisialisasi Client dengan Intents yang diperlukan
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // WAJIB aktif di Developer Portal
        GatewayIntentBits.GuildMessages
    ]
});

// Ambil token dari environment
const TOKEN = process.env.DISCORD_BOT_TOKEN;

// 2. Event ketika member baru bergabung
client.on('guildMemberAdd', async (member) => {
    // ID Channel tujuan pengiriman pesan
    const channelId = '1496865882721353980';
    
    // Mengambil channel berdasarkan ID
    const channel = member.guild.channels.cache.get(channelId);

    // Jika channel tidak ditemukan atau bot tidak punya akses
    if (!channel) {
        return console.log(`⚠️ Channel dengan ID ${channelId} tidak ditemukan!`);
    }

    // 3. Membuat tampilan Embed (Kotak Pesan)
    const welcomeEmbed = new EmbedBuilder()
        .setColor(0x2b2d31) // Warna abu-abu gelap sesuai tema Discord
        .setTitle('Kepolisian Daerah Merah Putih')
        .setThumbnail(member.guild.iconURL({ dynamic: true }) || member.user.displayAvatarURL())
        .setDescription(
            `Hey, Welcome <@${member.id}>\n\n` +
            `Silahkan ambil role anda terlebih dahulu di <#1496865882721353981>\n` +
            `Jika anda polisi silahkan req role di <#1496865882721353987>`
        )
        .setFooter({ text: 'Sistem Informasi Polda Merah Putih' })
        .setTimestamp();

    // 4. Mengirim pesan ke channel
    try {
        await channel.send({ 
            content: `Selamat datang <@${member.id}>!`, // Pesan teks di luar kotak agar user dapat notifikasi
            embeds: [welcomeEmbed] 
        });
        console.log(`✅ Berhasil menyambut ${member.user.tag}`);
    } catch (err) {
        console.error("❌ Gagal mengirim pesan welcome:", err);
    }
});

// Indikator saat bot online
client.once('ready', () => {
    console.log('========================================');
    console.log(`✅ Welcomer Online: ${client.user.tag}`);
    console.log('Status: Menunggu member baru bergabung...');
    console.log('========================================');
});

// 5. Proses Login
if (TOKEN) {
    client.login(TOKEN).catch(err => {
        console.error("❌ Gagal Login: Token tidak valid atau masalah jaringan.");
    });
} else {
    console.error("❌ ERROR: DISCORD_BOT_TOKEN tidak ditemukan di file .env atau environment!");
}
