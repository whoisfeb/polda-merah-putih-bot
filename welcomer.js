client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.find(ch => ch.name === 'introduction'); // Nama channel tujuan
    if (!channel) return;

    const welcomeEmbed = {
        color: 0x2b2d31, // Warna gelap sesuai gambar
        title: 'Kepolisian Daerah Merah Putih',
        description: `Hey, Welcome <@${member.id}>\n\n` +
                     'Silahkan ambil role anda terlebih dahulu di <#1496865882721353981>\n' +
                     'Jika anda polisi silahkan req role di <#1496865882721353987>',
        thumbnail: {
            url: member.guild.iconURL(), // Mengambil logo server otomatis
        },
    };

    channel.send({ embeds: [welcomeEmbed] });
});
