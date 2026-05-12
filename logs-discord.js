// Mengaktifkan dotenv di baris paling pertama
require('dotenv').config();

const { Client, GatewayIntentBits, AuditLogEvent, EmbedBuilder, Partials } = require('discord.js');

// Mengaktifkan seluruh hak akses (Intents) dan Partials agar pesan lama tetap terlacak saat dihapus
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// GANTI ID DI BAWAH INI DENGAN ID CHANNEL LOG SERVER ANDA
const LOG_CHANNEL_ID = '1496865882503118939'; 

client.once('ready', () => {
    console.log(`[SYSTEM] Bot Super Logs 100% Full Version aktif sebagai ${client.user.tag}`);
});

// Helper universal untuk mengirim log ke channel tujuan
function sendLog(guild, embed) {
    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) logChannel.send({ embeds: [embed] }).catch(err => console.error('Gagal mengirim log:', err));
}

// ==========================================
// 1. MANAGEMENT MESSAGES (PESAN)
// ==========================================

// Log Pesan Dihapus
client.on('messageDelete', async (message) => {
    if (!message.guild || message.author?.bot) return;

    const embed = new EmbedBuilder()
        .setTitle('🗑️ Pesan Dihapus')
        .setColor('#e74c3c')
        .setDescription(`Pesan dikirim oleh ${message.author || 'User Tidak Diketahui'} di channel ${message.channel} telah dihapus.`)
        .addFields({ name: 'Isi Pesan', value: message.content || '*Hanya berisi gambar/file/embed atau pesan terlalu lama sehingga tidak tersimpan di cache.*' })
        .setTimestamp();
    sendLog(message.guild, embed);
});

// Log Pesan Diedit
client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // Mengabaikan jika hanya memicu preview link

    const embed = new EmbedBuilder()
        .setTitle('✏️ Pesan Diedit')
        .setColor('#f1c40f')
        .setDescription(`Pesan dikirim oleh ${oldMessage.author} di channel ${oldMessage.channel} telah diubah.`)
        .addFields(
            { name: 'Sebelum', value: oldMessage.content || '*Kosong / File*' },
            { name: 'Sesudah', value: newMessage.content || '*Kosong / File*' }
        )
        .setTimestamp();
    sendLog(newMessage.guild, embed);
});


// ==========================================
// 2. MANAGEMENT CHANNELS & KATEGORI
// ==========================================

// Log saat Channel / Kategori Dibuat
client.on('channelCreate', async (channel) => {
    if (!channel.guild) return;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Jeda aman untuk sistem audit log
    const fetchedLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate });
    const logEntry = fetchedLogs.entries.first();
    const executor = logEntry ? logEntry.executor.tag : 'Tidak diketahui';
    const tipe = channel.type === 4 ? 'Kategori' : 'Channel';

    const embed = new EmbedBuilder()
        .setTitle(`🆕 ${tipe} Dibuat`)
        .setColor('#2ecc71')
        .setDescription(`${tipe} bernama **${channel.name}** (<#${channel.id}>) telah dibuat oleh **${executor}**.`)
        .setTimestamp();
    sendLog(channel.guild, embed);
});

// Log saat Channel / Kategori Dihapus
client.on('channelDelete', async (channel) => {
    if (!channel.guild) return;
    await new Promise(resolve => setTimeout(resolve, 1000));
    const fetchedLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
    const logEntry = fetchedLogs.entries.first();
    const executor = logEntry ? logEntry.executor.tag : 'Tidak diketahui';
    const tipe = channel.type === 4 ? 'Kategori' : 'Channel';

    const embed = new EmbedBuilder()
        .setTitle(`🗑️ ${tipe} Dihapus`)
        .setColor('#e74c3c')
        .setDescription(`${tipe} bernama **${channel.name}** telah dihapus oleh **${executor}**.`)
        .setTimestamp();
    sendLog(channel.guild, embed);
});

// Log saat Channel / Kategori Diubah (Nama / Posisi Kategori)
client.on('channelUpdate', async (oldChannel, newChannel) => {
    if (!oldChannel.guild) return;
    await new Promise(resolve => setTimeout(resolve, 1000));
    const fetchedLogs = await oldChannel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelUpdate });
    const updateLog = fetchedLogs.entries.first();
    const executor = updateLog ? updateLog.executor.tag : 'Tidak diketahui';

    const embed = new EmbedBuilder().setTimestamp().setColor('#f1c40f');
    let adaPerubahan = false;
    const tipeKonten = oldChannel.type === 4 ? 'Kategori' : 'Channel';

    if (oldChannel.name !== newChannel.name) {
        adaPerubahan = true;
        embed.setTitle(`✏️ Nama ${tipeKonten} Diubah`)
            .setDescription(`Perubahan nama pada ${newChannel}`)
            .addFields(
                { name: 'Nama Lama', value: oldChannel.name, inline: true },
                { name: 'Nama Baru', value: newChannel.name, inline: true },
                { name: 'Pengubah', value: executor }
            );
    }

    if (oldChannel.parentId !== newChannel.parentId) {
        adaPerubahan = true;
        const katLama = oldChannel.parent ? oldChannel.parent.name : 'Tanpa Kategori';
        const katBaru = newChannel.parent ? newChannel.parent.name : 'Tanpa Kategori';

        embed.setTitle(`📂 Perpindahan Kategori ${tipeKonten}`)
            .setDescription(`Posisi kategori ${newChannel} telah bergeser.`)
            .addFields(
                { name: 'Kategori Lama', value: katLama, inline: true },
                { name: 'Kategori Baru', value: katBaru, inline: true },
                { name: 'Pengubah', value: executor }
            );
    }

    if (adaPerubahan) sendLog(newChannel.guild, embed);
});


// ==========================================
// 3. MANAGEMENT MEMBERS & MODERASI
// ==========================================

// Member Masuk Server
client.on('guildMemberAdd', (member) => {
    const embed = new EmbedBuilder()
        .setTitle('📥 Member Masuk')
        .setColor('#2ecc71')
        .setDescription(`${member} (${member.user.tag}) telah bergabung ke dalam server.`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields({ name: 'ID Pengguna', value: member.id })
        .setTimestamp();
    sendLog(member.guild, embed);
});

// Member Keluar / Ditendang (Kick)
client.on('guildMemberRemove', async (member) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
    const kickLog = fetchedLogs.entries.first();
    
    let deskripsi = `${member.user.tag} telah meninggalkan server secara mandiri.`;
    let judul = '📤 Member Keluar';
    let warna = '#95a5a6';

    if (kickLog && kickLog.target.id === member.id && (Date.now() - kickLog.createdTimestamp < 5000)) {
        judul = '🥾 Member Ditendang (Kick)';
        warna = '#e67e22';
        deskripsi = `${member} (${member.user.tag}) telah ditendang oleh **${kickLog.executor.tag}**.\n**Alasan:** ${kickLog.reason || 'Tidak ada alasan'}`;
    }

    const embed = new EmbedBuilder().setTitle(judul).setColor(warna).setDescription(deskripsi).setTimestamp();
    sendLog(member.guild, embed);
});

// Member Banned
client.on('guildBanAdd', async (ban) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const fetchedLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
    const banLog = fetchedLogs.entries.first();
    const executor = banLog ? banLog.executor.tag : 'Tidak diketahui';
    const alasan = banLog ? banLog.reason : 'Tidak ada alasan';

    const embed = new EmbedBuilder()
        .setTitle('🔨 Member Di-Ban')
        .setColor('#d32f2f')
        .setDescription(`${ban.user} (${ban.user.tag}) telah dibanned secara permanen.`)
        .addFields(
            { name: 'Eksekutor', value: executor, inline: true },
            { name: 'Alasan', value: alasan, inline: true }
        )
        .setTimestamp();
    sendLog(ban.guild, embed);
});

// Member Unbanned
client.on('guildBanRemove', async (ban) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const fetchedLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanRemove });
    const logEntry = fetchedLogs.entries.first();
    const executor = logEntry ? logEntry.executor.tag : 'Tidak diketahui';

    const embed = new EmbedBuilder()
        .setTitle('🔓 Blokir Dicabut (Unban)')
        .setColor('#2ecc71')
        .setDescription(`${ban.user.tag} telah di-unban oleh **${executor}**.`)
        .setTimestamp();
    sendLog(ban.guild, embed);
});

// Update Member (Nickname, Roles, Timeout)
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const embed = new EmbedBuilder().setTimestamp().setColor('#3498db');
    let adaPerubahan = false;

    // Log Ganti Nickname
    if (oldMember.nickname !== newMember.nickname) {
        adaPerubahan = true;
        embed.setTitle('🏷️ Perubahan Nama Panggilan')
            .setDescription(`Nama panggilan ${newMember} telah diubah.`)
            .addFields(
                { name: 'Semula', value: oldMember.nickname || oldMember.user.username, inline: true },
                { name: 'Menjadi', value: newMember.nickname || newMember.user.username, inline: true }
            );
    }

    // Log Timeout (Mute Sistem Discord)
    if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
        if (newMember.communicationDisabledUntilTimestamp) {
            adaPerubahan = true;
            const waktuSelesai = new Date(newMember.communicationDisabledUntilTimestamp).toLocaleString('id-ID');
            embed.setTitle('🤫 Member Di-Timeout')
                .setColor('#e67e22')
                .setDescription(`${newMember} (${newMember.user.tag}) telah dibungkam (Timeout) sampai **${waktuSelesai}**.`);
        } else {
            adaPerubahan = true;
            embed.setTitle('🔊 Timeout Berakhir')
                .setColor('#2ecc71')
                .setDescription(`Masa hukuman Timeout ${newMember} telah dicabut atau selesai.`);
        }
    }

    // Log Pemberian / Pencabutan Role
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    if (oldRoles.size !== newRoles.size) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const fetchedLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate });
        const roleLog = fetchedLogs.entries.first();
        const executor = roleLog ? roleLog.executor : 'Tidak diketahui';

        const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
        const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

        if (addedRoles.size > 0) {
            adaPerubahan = true;
            embed.setTitle('🛡️ Role Diberikan')
                .setColor('#2ecc71')
                .setDescription(`Role baru telah ditambahkan ke ${newMember}`)
                .addFields(
                    { name: 'Role yang Diberi', value: addedRoles.map(r => `${r}`).join(', ') },
                    { name: 'Diberikan Oleh', value: `${executor}` }
                );
        }

        if (removedRoles.size > 0) {
            adaPerubahan = true;
            embed.setTitle('❌ Role Dicabut')
                .setColor('#e74c3c')
                .setDescription(`Role telah dicabut dari ${newMember}`)
                .addFields(
                    { name: 'Role yang Dicabut', value: removedRoles.map(r => `${r}`).join(', ') },
                    { name: 'Dicabut Oleh', value: `${executor}` }
                );
        }
    }

    if (adaPerubahan) sendLog(newMember.guild, embed);
});


// ==========================================
// 4. MANAGEMENT ROLES (PEMBUATAN / PENGHAPUSAN ROLE)
// ==========================================

client.on('roleCreate', async (role) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const fetchedLogs = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleCreate });
    const logEntry = fetchedLogs.entries.first();
    const executor = logEntry ? logEntry.executor.tag : 'Tidak diketahui';

    const embed = new EmbedBuilder()
        .setTitle('➕ Role Baru Dibuat')
        .setColor('#2ecc71')
        .setDescription(`Role **${role.name}** telah dibuat oleh **${executor}**.`)
        .setTimestamp();
    sendLog(role.guild, embed);
});

client.on('roleDelete', async (role) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const fetchedLogs = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete });
    const logEntry = fetchedLogs.entries.first();
    const executor = logEntry ? logEntry.executor.tag : 'Tidak diketahui';

    const embed = new EmbedBuilder()
        .setTitle('🔥 Role Dihapus')
        .setColor('#e74c3c')
        .setDescription(`Role **${role.name}** telah dihapus oleh **${executor}**.`)
        .setTimestamp();
    sendLog(role.guild, embed);
});


// ==========================================
// 5. MANAGEMENT VOICE (AKTIVITAS SUARA)
// ==========================================

client.on('voiceStateUpdate', (oldState, newState) => {
    const member = newState.member;
    const embed = new EmbedBuilder().setTimestamp();

    // 1. Join Room Voice
    if (!oldState.channelId && newState.channelId) {
        embed.setTitle('🎙️ Masuk Voice Channel')
            .setColor('#2ecc71')
            .setDescription(`${member} (${member.user.tag}) telah masuk ke voice channel <#${newState.channelId}>.`);
        sendLog(newState.guild, embed);
    }
    
    // 2. Keluar Room Voice (Leave)
    else if (oldState.channelId && !newState.channelId) {
        embed.setTitle('🔇 Keluar Voice Channel')
            .setColor('#e74c3c')
            .setDescription(`${member} (${member.user.tag}) telah meninggalkan voice channel <#${oldState.channelId}>.`);
        sendLog(oldState.guild, embed);
    }
    
    // 3. Pindah Room Voice (Move)
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        embed.setTitle('🔀 Pindah Voice Channel')
            .setColor('#34495e')
            .setDescription(`${member} (${member.user.tag}) berpindah ruangan voice.`)
            .addFields(
                { name: 'Dari Room', value: `<#${oldState.channelId}>`, inline: true },
                { name: 'Ke Room', value: `<#${newState.channelId}>`, inline: true }
            );
        sendLog(newState.guild, embed);
    }
});

// Menggunakan variabel environment token Anda
const TOKEN = process.env.DISCORD_BOT_TOKEN;
client.login(TOKEN);
