const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// 1. Inisialisasi Client dengan Intents yang benar
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // WAJIB AKTIF untuk deteksi member join
        GatewayIntentBits.GuildMessages
    ]
});

client.on('guildMemberAdd', async (member) => {
    // 2. Cari channel berdasarkan nama (pastikan namanya persis 'introduction')
    const channel = member.guild.channels.cache.find(ch => ch.name === 'introduction');
    
    // Jika tidak ketemu lewat nama, sangat disarankan pakai ID Channel:
    // const channel = member.guild.channels.cache.get('ID_CHANNEL_DISINI');

    if (!channel) return console.log("Channel introduction tidak ditemukan.");

    // 3. Membuat Embed menggunakan EmbedBuilder (Standar v14)
    const welcomeEmbed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle('Kepolisian Daerah Merah Putih')
        .setDescription(
            `Hey, Welcome <@${member.id}>\n\n` +
            `Silahkan ambil role anda terlebih dahulu di <#1496865882721353981>\n` +
            `Jika anda polisi silahkan req role di <#1496865882721353987>`
        )
        .setThumbnail(member.guild.iconURL({ dynamic: true }) || null);

    // 4. Kirim pesan
    try {
        await channel.send({ embeds: [welcomeEmbed] });
    } catch (err) {
        console.error("Gagal mengirim pesan welcome:", err);
    }
});

// 5. Login (Gunakan Token Bot Anda)
client.login('TOKEN_BOT_ANDA');

// Log status agar Anda tahu bot sudah jalan
client.once('ready', () => {
    console.log(`✅ Welcomer Online sebagai ${client.user.tag}`);
});
