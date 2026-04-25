require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ==========================================
// --- KONFIGURASI CHANNEL & TOKEN ---
// ==========================================
const TOKEN = process.env.DISCORD_BOT_TOKEN; 
const PROMOTION_CHANNEL_ID = process.env.DISCORD_PROMOTION_CHANNEL_ID || '1496865883723792564';
const NOTIF_CHANNEL_ID = '1497462798094045264'; 

// ==========================================
// --- ROLE IDENTITAS UTAMA (WAJIB BENAR) ---
// ==========================================
const WARGA_ROLE_ID = '1496865881651810519';       // Role: Warga Excellence
const POLICE_MAIN_ROLE_ID = '1496865881672912899'; // Role: Excellence Police

// ==========================================
// --- 1. MAPPING PREFIX NICKNAME ---
// ==========================================
const rankPrefixes = {
    '1496865881727176763': 'JENDPOL',
    '1496865881727176762': 'KOMJENPOL',
    '1496865881727176761': 'IRJENPOL',
    '1496865881727176760': 'BRIGJENPOL',
    '1496865881706201280': 'KOMBESPOL',
    '1496865881706201279': 'AKBP',
    '1496865881706201278': 'KOMPOL',
    '1496865881698074694': 'AKP',
    '1496865881698074693': 'IPTU',
    '1496865881698074692': 'IPDA',
    '1496865881698074690': 'AIPTU',
    '1496865881698074689': 'AIPDA',
    '1496865881698074688': 'BRIPKA',
    '1496865881698074687': 'BRIGPOL',
    '1496865881698074686': 'BRIPTU',
    '1496865881681166466': 'BRIPDA',
    '1496865881681166464': 'ABRIP',
    '1496865881681166463': 'ABRIPTU',
    '1496865881681166462': 'ABRIPDA',
    '1496865881681166461': 'BHARAKA',
    '1496865881681166460': 'BHARATU',
    '1496865881681166459': 'BHARADA'
};

// ==========================================
// --- 2. MAPPING ROLE KELOMPOK (GROUPS) ---
// ==========================================
const groupRoles = {
    // --- Golongan: Perwira Tinggi (PATI) ---
    '1496865881727176763': '1496865881739890800', // Jenderal Polisi
    '1496865881727176762': '1496865881739890800', // Komjen Pol
    '1496865881727176761': '1496865881739890800', // Irjen Pol
    '1496865881727176760': '1496865881739890800', // Brigjen Pol

    // --- Golongan: Perwira Menengah (PAMEN) ---
    '1496865881706201280': '1496865881706201281', // Kombes Pol
    '1496865881706201279': '1496865881706201281', // AKBP
    '1496865881706201278': '1496865881706201281', // Kompol

    // --- Golongan: Perwira Pertama (PAMA) ---
    '1496865881698074694': '1496865881698074695', // AKP
    '1496865881698074693': '1496865881698074695', // IPTU
    '1496865881698074692': '1496865881698074695', // IPDA

    // --- Golongan: Bintara Polisi ---
    '1496865881698074690': '1496865881698074691', // AIPTU
    '1496865881698074689': '1496865881698074691', // AIPDA
    '1496865881698074688': '1496865881698074691', // BRIPKA
    '1496865881698074687': '1496865881698074691', // BRIGPOL
    '1496865881698074686': '1496865881698074691', // BRIPTU
    '1496865881681166466': '1496865881698074691', // BRIPDA

    // --- Golongan: Tamtama ---
    '1496865881681166464': '1496865881681166465', // Ajun Brigadir
    '1496865881681166463': '1496865881681166465', // Ajun Brigadir Satu
    '1496865881681166462': '1496865881681166465', // Ajun Brigadir Dua
    '1496865881681166461': '1496865881681166465', // Bhayangkara Kepala
    '1496865881681166460': '1496865881681166465', // Bhayangkara Satu
    '1496865881681166459': '1496865881681166465'  // Bhayangkara Dua
};

// ==========================================
// --- 3. DAFTAR MEMBERSIHKAN ROLE POLISI ---
// ==========================================
const allGroupIDs = [
    POLICE_MAIN_ROLE_ID,    // Role Utama (SAPD)
    '1496865881739890800', // Golongan: Perwira Tinggi
    '1496865881706201281', // Golongan: Perwira Menengah
    '1496865881698074695', // Golongan: Perwira Pertama
    '1496865881698074691', // Golongan: Bintara Polisi
    '1496865881681166465', // Golongan: Tamtama
    '1496865881727176759', // Divisi: Propam (IAD)
    '1496865881727176758', // Divisi: Keuangan Polda
    '1496865881672912905', // Divisi: Biro SDM (HRB)
    '1496865881672912904', // Divisi: Brimob
    '1496865881672912903', // Divisi: Sabhara (Metropolitan)
    '1496865881672912902', // Divisi: Lantas (Highway Patrol)
    '1496865881672912901'  // Divisi: Reskrim (Detective)
];

// ==========================================
// --- HELPER FUNCTIONS ---
// ==========================================

/**
 * Extract user mention from text and return user ID
 * Format: <@123456789> or <@!123456789>
 */
function extractUserID(text) {
    const match = text.match(/<@!?(\d+)>/);
    return match ? match[1] : null;
}

/**
 * Extract role mention from text and return role ID
 * Format: <@&123456789>
 * ⭐ DIPERBAIKI: Menghandle multiple role mentions
 */
function extractRoleIDs(text) {
    if (!text) return [];
    const matches = text.match(/<@&(\d+)>/g);
    if (!matches) return [];
    return matches.map(mention => mention.replace(/[<@&>]/g, ''));
}

/**
 * Extract single role ID (untuk backward compatibility)
 */
function extractRoleID(text) {
    const ids = extractRoleIDs(text);
    return ids.length > 0 ? ids[0] : null;
}

/**
 * Check if a value is considered "empty" (-, N/A, atau similar)
 */
function isEmpty(value) {
    if (!value) return true;
    const cleaned = value.trim().toLowerCase();
    return cleaned === '-' || cleaned === 'n/a' || cleaned === 'na' || cleaned === '';
}

/**
 * Parse the official promotion/demotion letter format
 * Extracts data from "Pihak Terkait" section
 * ⭐ DIPERBAIKI: Better regex patterns untuk multi-line fields
 */
function parsePromotionLetter(messageContent) {
    try {
        // Find "Pihak Terkait" section
        const pihakTerkaitStart = messageContent.indexOf('Pihak Terkait');
        if (pihakTerkaitStart === -1) {
            console.log('Section "Pihak Terkait" not found');
            return null;
        }

        // Extract from "Pihak Terkait" until next major section or end
        const afterPihakTerkait = messageContent.substring(pihakTerkaitStart);
        const nextSectionIndex = afterPihakTerkait.indexOf('Bersama ini saya membuat');
        const pihakTerkaitContent = nextSectionIndex !== -1 
            ? afterPihakTerkait.substring(0, nextSectionIndex) 
            : afterPihakTerkait;

        // ⭐ PERBAIKAN: Improved regex patterns untuk handle whitespace lebih baik
        const namaMatch = pihakTerkaitContent.match(/a\.\s*Nama\s*:\s*(.+?)(?=\nb\.|$)/is);
        const pangkatLamaMatch = pihakTerkaitContent.match(/b\.\s*Pangkat\s+Lama\s*:\s*(.+?)(?=\nc\.|$)/is);
        const pangkatBaruMatch = pihakTerkaitContent.match(/c\.\s*Pangkat\s+Baru\s*:\s*(.+?)(?=\nd\.|$)/is);
        const jabatanLamaMatch = pihakTerkaitContent.match(/d\.\s*Jabatan\s+Lama\s*:\s*(.+?)(?=\ne\.|$)/is);
        const jabatanBaruMatch = pihakTerkaitContent.match(/e\.\s*Jabatan\s+Baru\s*:\s*(.+?)(?=\nf\.|$)/is);
        const satuanLamaMatch = pihakTerkaitContent.match(/f\.\s*Satuan\s+Lama\s*:\s*(.+?)(?=\ng\.|$)/is);
        const satuanBaruMatch = pihakTerkaitContent.match(/g\.\s*Satuan\s+Baru\s*:\s*(.+?)(?=\nh\.|$)/is);
        const statusMatch = pihakTerkaitContent.match(/h\.\s*Status\s*:\s*(.+?)(?=\n|$)/is);

        // Extract user ID from name field (if contains mention)
        const nama = namaMatch ? namaMatch[1].trim() : null;
        const userID = nama ? extractUserID(nama) : null;

        if (!userID) {
            console.log('User mention not found in Nama field');
            return null;
        }

        const pangkatLama = pangkatLamaMatch ? pangkatLamaMatch[1].trim() : null;
        const pangkatBaru = pangkatBaruMatch ? pangkatBaruMatch[1].trim() : null;
        const jabatanLama = jabatanLamaMatch ? jabatanLamaMatch[1].trim() : null;
        const jabatanBaru = jabatanBaruMatch ? jabatanBaruMatch[1].trim() : null;
        const satuanLama = satuanLamaMatch ? satuanLamaMatch[1].trim() : null;
        const satuanBaru = satuanBaruMatch ? satuanBaruMatch[1].trim() : null;
        const status = statusMatch ? statusMatch[1].trim().toUpperCase() : null;

        return {
            userID,
            pangkatLama: isEmpty(pangkatLama) ? null : pangkatLama,
            pangkatBaru: isEmpty(pangkatBaru) ? null : pangkatBaru,
            jabatanLama: isEmpty(jabatanLama) ? null : jabatanLama,
            jabatanBaru: isEmpty(jabatanBaru) ? null : jabatanBaru,
            satuanLama: isEmpty(satuanLama) ? null : satuanLama,
            satuanBaru: isEmpty(satuanBaru) ? null : satuanBaru,
            status: isEmpty(status) ? null : status,
        };
    } catch (error) {
        console.error('Error parsing promotion letter:', error);
        return null;
    }
}

client.once('ready', () => {
    console.log(`Bot login sebagai ${client.user.tag}`);
    const notifChannel = client.channels.cache.get(NOTIF_CHANNEL_ID);
    if (notifChannel) {
        notifChannel.send(`✅ **Sistem SAPD Online** | ${new Date().toLocaleString('id-ID')} | Status: Menunggu Promosi/Demotion... \n\n*Bot ini akan otomatis memproses promosi/demotion berdasarkan format surat resmi yang ditentukan di channel promosi.*\n*Pastikan format surat benar agar bot dapat memproses dengan lancar.*`)
        .catch(console.error);
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || message.channel.id !== PROMOTION_CHANNEL_ID) return;

    // Check if message contains the official letter format
    if (!message.content.includes('Pihak Terkait') || !message.content.includes('Bersama ini saya membuat')) {
        return;
    }

    // Parse the promotion letter
    const letterData = parsePromotionLetter(message.content);
    
    if (!letterData) {
        console.log('Failed to parse promotion letter');
        await message.react('❌').catch(() => null);
        return;
    }

    const { userID, pangkatLama, pangkatBaru, jabatanLama, jabatanBaru, satuanLama, satuanBaru, status } = letterData;

    console.log('📋 Parsed Data:', { userID, pangkatLama, pangkatBaru, satuanLama, satuanBaru, status });

    try {
        const member = await message.guild.members.fetch(userID);
        const botMember = message.guild.members.me;

        // PROTEKSI HIERARKI: Bot tidak bisa ubah member yang rolenya lebih tinggi dari bot
        if (member.roles.highest.position >= botMember.roles.highest.position) {
            console.warn(`[SKIP] Role ${member.user.tag} terlalu tinggi untuk Bot.`);
            await message.react('⚠️').catch(() => null);
            return;
        }

        // --- PROSES BERDASARKAN STATUS ---
        // Status PTDH atau RESIGN: Hapus semua role kepolisian
        if (status === 'PTDH' || status === 'RESIGN') {
            console.log(`[${status}] Memproses ${member.user.tag}...`);

            // 1. Cabut Pangkat Lama (jika ada)
            if (pangkatLama) {
                const roleID = extractRoleID(pangkatLama);
                if (roleID) {
                    await member.roles.remove(roleID).catch(() => null);
                    console.log(`  ✓ Pangkat lama dihapus: ${roleID}`);
                }
            }

            // 2. Cabut Semua Role Kelompok (Termasuk Excellence Police)
            for (const groupID of allGroupIDs) {
                if (member.roles.cache.has(groupID)) {
                    await member.roles.remove(groupID).catch(e => 
                        console.error(`Gagal cabut group ${groupID}: ${e.message}`)
                    );
                }
            }
            console.log(`  ✓ Semua role kepolisian dihapus`);

            // 3. Cabut Satuan Lama (jika ada)
            if (satuanLama) {
                const roleIDs = extractRoleIDs(satuanLama);
                for (const roleID of roleIDs) {
                    await member.roles.remove(roleID).catch(() => null);
                }
                console.log(`  ✓ Satuan lama dihapus`);
            }

            // 4. Tambah Warga Excellence & Update Nickname
            await member.roles.add(WARGA_ROLE_ID).catch(console.error);
            console.log(`  ✓ Role Warga Excellence ditambahkan`);
            
            let cleanName = member.displayName;
            if (cleanName.includes('|')) cleanName = cleanName.split('|')[1].trim();
            const newNickname = `Civil | ${cleanName}`.substring(0, 32);
            await member.setNickname(newNickname).catch(() => null);
            console.log(`  ✓ Nickname diubah: ${newNickname}`);
        }
        // --- PROSES PROMOSI/DEMOSI/ROTASI NORMAL ---
        else {
            console.log(`[PROMOSI/DEMOSI/ROTASI] Memproses ${member.user.tag}...`);

            // 1. Cabut Pangkat Lama (jika ada)
            if (pangkatLama) {
                const roleID = extractRoleID(pangkatLama);
                if (roleID) {
                    await member.roles.remove(roleID).catch(() => null);
                    console.log(`  ✓ Pangkat lama dihapus: ${roleID}`);
                }
            }

            // 2. Tambah Pangkat Baru (jika ada)
            let newRankID = null;
            if (pangkatBaru) {
                newRankID = extractRoleID(pangkatBaru);
                if (newRankID) {
                    await member.roles.add(newRankID).catch(console.error);
                    console.log(`  ✓ Pangkat baru ditambahkan: ${newRankID}`);
                }
            }

            // 3. Cabut Satuan Lama & Tambah Satuan Baru (untuk Rotasi)
            if (satuanLama) {
                const roleIDs = extractRoleIDs(satuanLama);
                for (const roleID of roleIDs) {
                    await member.roles.remove(roleID).catch(() => null);
                }
                console.log(`  ✓ Satuan lama dihapus`);
            }
            
            if (satuanBaru) {
                const roleIDs = extractRoleIDs(satuanBaru);
                for (const roleID of roleIDs) {
                    await member.roles.add(roleID).catch(console.error);
                    console.log(`  ✓ Satuan baru ditambahkan: ${roleID}`);
                }
            }

            // 4. Sinkronisasi Role Kelompok (berdasarkan pangkat baru)
            if (newRankID && groupRoles[newRankID]) {
                const targetGroupID = groupRoles[newRankID];
                
                // Cabut group lama (kecuali Excellence Police)
                for (const groupID of allGroupIDs) {
                    if (member.roles.cache.has(groupID) && groupID !== targetGroupID && groupID !== POLICE_MAIN_ROLE_ID) {
                        await member.roles.remove(groupID).catch(() => null);
                    }
                }
                
                // Tambah group baru
                await member.roles.add(targetGroupID).catch(console.error);
                console.log(`  ✓ Role golongan disinkronisasi: ${targetGroupID}`);
            }

            // 5. Pastikan Excellence Police role tetap ada
            if (newRankID) {
                await member.roles.add(POLICE_MAIN_ROLE_ID).catch(console.error);
            }

            // 6. Update Prefix Nickname (berdasarkan pangkat baru)
            if (newRankID && rankPrefixes[newRankID]) {
                const prefix = rankPrefixes[newRankID];
                let cleanName = member.displayName;
                if (cleanName.includes('|')) cleanName = cleanName.split('|')[1].trim();
                const newNickname = `${prefix} | ${cleanName}`.substring(0, 32);
                await member.setNickname(newNickname).catch(() => null);
                console.log(`  ✓ Nickname diubah: ${newNickname}`);
            }
        }

        await message.react('✅').catch(() => null);
        console.log(`✅ Selesai: ${member.user.tag}\n`);
    } catch (error) {
        console.error(`❌ Gagal memproses ID ${userID}:`, error);
        await message.react('❌').catch(() => null);
    }
});

async function sendOfflineNotif() {
    const notifChannel = client.channels.cache.get(NOTIF_CHANNEL_ID);
    if (notifChannel) {
        try {
            await notifChannel.send(`⚠️ **Sistem SAPD Offline**\n\n*Silahkan tunggu sistem SAPD online kembali*\n\n@everyone | ${new Date().toLocaleString('id-ID')} | Status: Berhenti/Timeout. \n*Bot akan aktif kembali otomatis sesuai jadwal atau jika dijalankan manual.*`);
        } catch (err) {
            console.error("Gagal mengirim pesan offline:", err);
        }
    }
}

process.on('SIGTERM', async () => {
    await sendOfflineNotif();
    process.exit(0);
});

process.on('SIGINT', async () => {
    await sendOfflineNotif();
    process.exit(0);
});

client.login(TOKEN);
