require('dotenv').config(); // PENTING: Untuk membaca file .env
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages
    ]
});

// Gunakan variabel environment
const TOKEN = process.env.DISCORD_BOT_TOKEN;

client.on('guildMemberAdd', async (member) => {
    // Cari channel 'introduction'
    const channel = member.guild.channels.cache.find(ch => ch.name === 'introduction');
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle('Kepolisian Daerah Merah Putih')
        .setThumbnail(member.guild.iconURL({ dynamic: true }))
        .setDescription(
            `Hey, Welcome <@${member.id}>\n\n` +
            `Silahkan ambil role anda terlebih dahulu di <#1496865882721353981>\n` +
            `Jika anda polisi silahkan req role di <#1496865882721353987>`
        );

    try {
        await channel.send({ embeds: [welcomeEmbed] });
    } catch (err) {
        console.error("Gagal mengirim pesan welcome:", err);
    }
});

client.once('ready', () => {
    console.log(`✅ Welcomer Online: ${client.user.tag}`);
});

// Cek apakah token ada sebelum login
if (TOKEN) {
    client.login(TOKEN);
} else {
    console.error("❌ ERROR: DISCORD_BOT_TOKEN tidak ditemukan di environment!");
}
