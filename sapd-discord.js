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
// --- 4. DAFTAR JABATAN ROLE (POSITIONS) ---
// ==========================================
const positionRoles = {
    // Tambahkan mapping jabatan role di sini jika ada
    // Format: 'roleID': 'positionName'
};


client.once('ready', () => {
    console.log(`Bot login sebagai ${client.user.tag}`);
    const notifChannel = client.channels.cache.get(NOTIF_CHANNEL_ID);
    if (notifChannel) {
        notifChannel.send(`✅ **Sistem POLDA Online** | ${new Date().toLocaleString('id-ID')} | Status: Menunggu Promosi/Demotion... \n\n*Bot ini akan otomatis memproses promosi/demotion/rotasi/PTDH/resign berdasarkan format yang ditentukan di channel promosi.*\n*Pastikan format benar agar bot dapat memproses dengan lancar.*\n*Ketika tidak ada aktivitas yang sesuai format di channel <#${PROMOTION_CHANNEL_ID}> maka bot akan offline.*\n@everyone`)
        .catch(console.error);
    }
});

/**
 * Parse format surat POLDA baru (PROMOSI/DEMOSI/ROTASI/PTDH/RESIGN)
 * Membaca pola FLEXIBLE:
 * a. Nama: <@userID> atau mention apapun
 * b. Pangkat Lama: <@&rankID> atau emoji atau text
 * c. Pangkat Baru: <@&rankID> atau emoji atau text
 * d. Jabatan Lama: <@&jabatanID> atau - atau N/A
 * e. Jabatan Baru: <@&jabatanID> atau - atau N/A
 * f. Satuan Lama: <@&divID> atau - atau N/A
 * g. Satuan Baru: <@&divID> atau - atau N/A
 * h. Status: PTDH atau RESIGN atau (kosong/-)
 */
function parseNewSuratFormat(content) {
    // 1. ISOLASI: Ambil hanya bagian setelah "Pihak Terkait"
    const splitContent = content.split(/Pihak Terkait/i);
    // Jika ada bagian "Pihak Terkait", ambil teks setelahnya. Jika tidak, gunakan content asli.
    const body = splitContent.length > 1 ? splitContent[1] : content;

    const data = {
        userID: null,
        prevRankID: null,
        newRankID: null,
        prevPositionID: null,
        newPositionID: null,
        prevDivID: null,
        newDivID: null,
        status: null
    };

    // 2. PARSING: Gunakan 'body' (bukan 'content') agar fokus pada bagian yang sudah diisolasi
    
    // a. Nama
    let namaMatch = body.match(/a\.\s*Nama\s*[:*]*\s*<@!?(\d+)>/i);
    if (namaMatch) data.userID = namaMatch[1];
    else {
        namaMatch = body.match(/a\.\s*Nama\s*[:*]*\s*([^b]*?)(?=\nb\.|$)/i);
        if (namaMatch) {
            const match = namaMatch[1].match(/<@!?(\d+)>/);
            if (match) data.userID = match[1];
        }
    }

    // b. Pangkat Lama
    let pangkatLamaMatch = body.match(/b\.\s*Pangkat\s*Lama\s*[:*]*\s*<@&(\d+)>/i);
    if (pangkatLamaMatch) data.prevRankID = pangkatLamaMatch[1];
    else {
        pangkatLamaMatch = body.match(/b\.\s*Pangkat\s*Lama\s*[:*]*\s*([^c]*?)(?=\nc\.|$)/i);
        if (pangkatLamaMatch) {
            const match = pangkatLamaMatch[1].match(/<@&(\d+)>/);
            if (match) data.prevRankID = match[1];
        }
    }

    // c. Pangkat Baru
    let pangkatBaruMatch = body.match(/c\.\s*Pangkat\s*Baru\s*[:*]*\s*<@&(\d+)>/i);
    if (pangkatBaruMatch) data.newRankID = pangkatBaruMatch[1];
    else {
        pangkatBaruMatch = body.match(/c\.\s*Pangkat\s*Baru\s*[:*]*\s*([^d]*?)(?=\nd\.|$)/i);
        if (pangkatBaruMatch) {
            const match = pangkatBaruMatch[1].match(/<@&(\d+)>/);
            if (match) data.newRankID = match[1];
        }
    }

    // d. Jabatan Lama
    let jabatanLamaMatch = body.match(/d\.\s*Jabatan\s*Lama\s*[:*]*\s*<@&(\d+)>/i);
    if (jabatanLamaMatch) data.prevPositionID = jabatanLamaMatch[1];
    else {
        jabatanLamaMatch = body.match(/d\.\s*Jabatan\s*Lama\s*[:*]*\s*([^e]*?)(?=\ne\.|$)/i);
        if (jabatanLamaMatch) {
            const match = jabatanLamaMatch[1].match(/<@&(\d+)>/);
            if (match) data.prevPositionID = match[1];
        }
    }

    // e. Jabatan Baru
    let jabatanBaruMatch = body.match(/e\.\s*Jabatan\s*Baru\s*[:*]*\s*<@&(\d+)>/i);
    if (jabatanBaruMatch) data.newPositionID = jabatanBaruMatch[1];
    else {
        jabatanBaruMatch = body.match(/e\.\s*Jabatan\s*Baru\s*[:*]*\s*([^f]*?)(?=\nf\.|$)/i);
        if (jabatanBaruMatch) {
            const match = jabatanBaruMatch[1].match(/<@&(\d+)>/);
            if (match) data.newPositionID = match[1];
        }
    }

    // f. Satuan Lama
    let satLamaMatch = body.match(/f\.\s*Satuan\s*Lama\s*[:*]*\s*<@&(\d+)>/i);
    if (satLamaMatch) data.prevDivID = satLamaMatch[1];
    else {
        satLamaMatch = body.match(/f\.\s*Satuan\s*Lama\s*[:*]*\s*([^g]*?)(?=\ng\.|$)/i);
        if (satLamaMatch) {
            const match = satLamaMatch[1].match(/<@&(\d+)>/);
            if (match) data.prevDivID = match[1];
        }
    }

    // g. Satuan Baru - DIPERBAIKI: Ubah lookahead dari 'h' menjadi 'h.' agar lebih akurat
    let satBaruMatch = body.match(/g\.\s*Satuan\s*Baru\s*[:*]*\s*<@&(\d+)>/i);
    if (satBaruMatch) {
        data.newDivID = satBaruMatch[1];
    } else {
        // PERBAIKAN: Menggunakan lookahead yang lebih akurat
        satBaruMatch = body.match(/g\.\s*Satuan\s*Baru\s*[:*]*\s*([^h]*?)(?=\nh\.|$)/i);
        if (satBaruMatch) {
            const roleMatch = satBaruMatch[1].match(/<@&(\d+)>/);
            if (roleMatch) {
                data.newDivID = roleMatch[1];
            }
        }
    }

    // h. Status
    const statusMatch = body.match(/h\.\s*Status\s*[:*]*\s*(\w+)/i);
    if (statusMatch) {
        const statusValue = statusMatch[1].toUpperCase();
        if (statusValue === 'PTDH' || statusValue === 'RESIGN' || statusValue === 'DEMOSI') {
            data.status = statusValue;
        }
    }

    return data;
}

/**
 * Cek apakah field adalah "-" atau "N/A" atau null/undefined
 * DIPERBAIKI: Menambahkan pengecekan untuk null dan undefined secara eksplisit
 */
function isNullField(value) {
    // Jika value adalah null atau undefined, dianggap sebagai null field
    if (value === null || value === undefined) {
        return true;
    }
    // Jika value adalah string literal "-" atau "N/A"
    if (value === '-' || value === 'N/A' || value === 'n/a') {
        return true;
    }
    // Jika value adalah falsy (empty string, 0, false, dll)
    if (!value) {
        return true;
    }
    return false;
}

/**
 * Get role name dari role ID (dengan caching dari rankPrefixes atau fallback ke role name)
 */
function getRankPrefix(roleID, guild) {
    // Priority 1: Check rankPrefixes mapping
    if (rankPrefixes[roleID]) {
        console.log(`  📌 Prefix dari rankPrefixes: ${rankPrefixes[roleID]}`);
        return rankPrefixes[roleID];
    }

    // Priority 2: Try to get role dari guild dan ambil nama role-nya
    if (guild) {
        const role = guild.roles.cache.get(roleID);
        if (role) {
            // Hapus emoji dan icons dari nama role
            let cleanName = role.name.replace(/[⭐🔶]/g, '').trim();
            // Ambil 10 karakter pertama sebagai prefix
            const prefix = cleanName.substring(0, 10).toUpperCase();
            console.log(`  📌 Prefix dari role name: ${prefix} (dari: "${role.name}")`);
            return prefix;
        }
    }

    // Fallback: gunakan roleID sebagai prefix jika tidak ditemukan
    console.warn(`  ⚠️ Prefix tidak ditemukan untuk roleID: ${roleID}`);
    return 'UNKNOWN';
}

client.on('messageCreate', async (message) => {
    if (message.author.bot || message.channel.id !== PROMOTION_CHANNEL_ID) return;

    let isFail = false;

    // Cek format lama
    const isOldFormat = message.content.includes('**PROMOTION**') || message.content.includes('**DEMOTION**');
    
    // Cek format baru (SURAT POLDA)
    const isNewFormat = message.content.includes('Pihak Terkait') && 
                       (message.content.includes('Pangkat') || 
                        message.content.includes('Jabatan') || 
                        message.content.includes('Status'));

    if (!isOldFormat && !isNewFormat) return;

    try {
        if (isOldFormat) {
            // ===== PROSES FORMAT LAMA =====
            const nameLine = message.content.match(/Name:\s*(.*)/i);
            const userMatches = nameLine ? nameLine[1].match(/<@!?(\d+)>/g) : null;
            const prevRankMatch = message.content.match(/Previous Rank:\s*<@&(\d+)>/i);
            const newRankMatch = message.content.match(/Rank to be (?:promoted|demoted):\s*<@&(\d+)>/i);
            
            const prevDivLine = message.content.match(/Previous Division\s*:\s*(.*)/i);
            const prevDivs = prevDivLine ? prevDivLine[1].match(/<@&(\d+)>/g) : null;
            
            const newDivLine = message.content.match(/(?:Moved to this division|Moved to this\s+division)\s*:?\s*(.*)/i);
            const newDivs = newDivLine ? newDivLine[1].match(/<@&(\d+)>/g) : null;

            if (!userMatches) {
                isFail = true;
                return;
            }

            for (const mention of userMatches) {
                const userID = mention.replace(/[<@!>]/g, '');
                const prevRankID = prevRankMatch ? prevRankMatch[1] : null;
                const newRankID = newRankMatch ? newRankMatch[1] : null;
                const prevDivID = prevDivs ? prevDivs[0].replace(/[<@&>]/g, '') : null;
                const newDivID = newDivs ? newDivs[0].replace(/[<@&>]/g, '') : null;

                await processPromotion(message, userID, prevRankID, newRankID, prevDivID, newDivID, null, null, null);
            }
        } else if (isNewFormat) {
            // ===== PROSES FORMAT BARU (SURAT POLDA) =====
            const parsed = parseNewSuratFormat(message.content);
            
            console.log(`\n📊 === PARSING DEBUG ===`);
            console.log(`userID: ${parsed.userID}`);
            console.log(`prevRankID: ${parsed.prevRankID}`);
            console.log(`newRankID: ${parsed.newRankID}`);
            console.log(`prevDivID: ${parsed.prevDivID}`);
            console.log(`newDivID: ${parsed.newDivID}`);
            console.log(`status: ${parsed.status}`);

            if (!parsed.userID) {
                console.error(`❌ userID tidak ditemukan!`);
                isFail = true;
                return;
            }

            await processPromotion(
                message,
                parsed.userID,
                isNullField(parsed.prevRankID) ? null : parsed.prevRankID,
                isNullField(parsed.newRankID) ? null : parsed.newRankID,
                isNullField(parsed.prevDivID) ? null : parsed.prevDivID,
                isNullField(parsed.newDivID) ? null : parsed.newDivID,
                isNullField(parsed.prevPositionID) ? null : parsed.prevPositionID,
                isNullField(parsed.newPositionID) ? null : parsed.newPositionID,
                parsed.status
            );
        }

        if (!isFail) {
            await message.react('✅');
        }
    } catch (error) {
        console.error(`Error memproses pesan:`, error);
        await message.react('❌').catch(() => null);
    }
});

/**
 * Process promotion/demotion/rotation/PTDH/RESIGN
 */
async function processPromotion(
    message, 
    userID, 
    prevRankID, 
    newRankID, 
    prevDivID, 
    newDivID,
    prevPositionID,
    newPositionID,
    status
) {
    try {
        const member = await message.guild.members.fetch(userID);
        const botMember = message.guild.members.me;

        // PROTEKSI HIERARKI
        if (member.roles.highest.position >= botMember.roles.highest.position) {
            console.warn(`[SKIP] Role ${member.user.tag} terlalu tinggi untuk Bot.`);
            return;
        }

        console.log(`\n📋 === Memproses ${member.user.tag} ===`);
        console.log(`Status: ${status || 'NORMAL'}`);
        console.log(`Pangkat Baru ID: ${newRankID || 'N/A'}`);

        // ===== PROSES PTDH (Pensiun Tidak Dengan Hormat) =====
        if (status === 'PTDH') {
            // 1. Cabut semua role polisi
            for (const groupID of allGroupIDs) {
                if (member.roles.cache.has(groupID)) {
                    await member.roles.remove(groupID).catch(() => null);
                }
            }

            // 2. Cabut pangkat jika ada
            if (prevRankID && member.roles.cache.has(prevRankID)) {
                await member.roles.remove(prevRankID).catch(() => null);
            }

            // 3. Cabut divisi jika ada
            if (prevDivID && member.roles.cache.has(prevDivID)) {
                await member.roles.remove(prevDivID).catch(() => null);
            }

            // 4. Cabut jabatan jika ada
            if (prevPositionID && member.roles.cache.has(prevPositionID)) {
                await member.roles.remove(prevPositionID).catch(() => null);
            }

            // 5. Tetap role Warga, ubah nickname
            if (!member.roles.cache.has(WARGA_ROLE_ID)) {
                await member.roles.add(WARGA_ROLE_ID).catch(console.error);
            }

            let cleanName = member.displayName;
            if (cleanName.includes('|')) cleanName = cleanName.split('|')[1].trim();
            const newNickname = `PTDH | ${cleanName}`.substring(0, 32);
            await member.setNickname(newNickname).catch(() => null);

            console.log(`✅ PTDH diproses: ${member.user.tag} → Nickname: ${newNickname}`);
        }
        // ===== PROSES RESIGN (Keluar/Berhenti) =====
        else if (status === 'RESIGN') {
            // 1. Cabut semua role polisi
            for (const groupID of allGroupIDs) {
                if (member.roles.cache.has(groupID)) {
                    await member.roles.remove(groupID).catch(() => null);
                }
            }

            // 2. Cabut pangkat jika ada
            if (prevRankID && member.roles.cache.has(prevRankID)) {
                await member.roles.remove(prevRankID).catch(() => null);
            }

            // 3. Cabut divisi jika ada
            if (prevDivID && member.roles.cache.has(prevDivID)) {
                await member.roles.remove(prevDivID).catch(() => null);
            }

            // 4. Cabut jabatan jika ada
            if (prevPositionID && member.roles.cache.has(prevPositionID)) {
                await member.roles.remove(prevPositionID).catch(() => null);
            }

            // 5. Tetap role Warga, ubah nickname
            if (!member.roles.cache.has(WARGA_ROLE_ID)) {
                await member.roles.add(WARGA_ROLE_ID).catch(console.error);
            }

            let cleanName = member.displayName;
            if (cleanName.includes('|')) cleanName = cleanName.split('|')[1].trim();
            const newNickname = `EX | ${cleanName}`.substring(0, 32);
            await member.setNickname(newNickname).catch(() => null);

            console.log(`✅ RESIGN diproses: ${member.user.tag} → Nickname: ${newNickname}`);
        }
        // ===== PROSES NORMAL (PROMOSI/DEMOSI/ROTASI) =====
        else {
            // Update Pangkat
            if (prevRankID && member.roles.cache.has(prevRankID)) {
                await member.roles.remove(prevRankID).catch(() => null);
                console.log(`  ❌ Pangkat lama dihapus: ${prevRankID}`);
            } else if (prevRankID) {
                console.log(`  ⚠️ Pangkat lama tidak ditemukan di member: ${prevRankID}`);
            }

            if (newRankID) {
                await member.roles.add(newRankID).catch(console.error);
                console.log(`  ✅ Pangkat baru ditambah: ${newRankID}`);
            }

            // Update Divisi - DIPERBAIKI: Menambah debug logging untuk tracking
            if (prevDivID && member.roles.cache.has(prevDivID)) {
                await member.roles.remove(prevDivID).catch(() => null);
                console.log(`  ❌ Divisi lama dihapus: ${prevDivID}`);
            } else if (prevDivID) {
                console.log(`  ⚠️ Divisi lama tidak ditemukan di member: ${prevDivID}`);
            }

            if (newDivID) {
                console.log(`  🔍 Mencoba menambah divisi baru: ${newDivID}`);
                await member.roles.add(newDivID).catch((err) => {
                    console.error(`  ❌ Gagal menambah divisi: ${err.message}`);
                });
                console.log(`  ✅ Divisi baru ditambah: ${newDivID}`);
            } else {
                console.log(`  ℹ️ Tidak ada divisi baru untuk ditambah`);
            }

            // Update Jabatan
            if (prevPositionID && member.roles.cache.has(prevPositionID)) {
                await member.roles.remove(prevPositionID).catch(() => null);
                console.log(`  ❌ Jabatan lama dihapus: ${prevPositionID}`);
            } else if (prevPositionID) {
                console.log(`  ⚠️ Jabatan lama tidak ditemukan di member: ${prevPositionID}`);
            }

            if (newPositionID) {
                await member.roles.add(newPositionID).catch(console.error);
                console.log(`  ✅ Jabatan baru ditambah: ${newPositionID}`);
            }

            // Sinkronisasi Group Role
            if (newRankID && groupRoles[newRankID]) {
                const targetGroupID = groupRoles[newRankID];
                for (const groupID of allGroupIDs) {
                    if (member.roles.cache.has(groupID) && groupID !== targetGroupID && groupID !== POLICE_MAIN_ROLE_ID) {
                        await member.roles.remove(groupID).catch(() => null);
                    }
                }
                await member.roles.add(targetGroupID).catch(console.error);
                console.log(`  🔄 Group role diperbarui: ${targetGroupID}`);
            }

            // Update Prefix Nickname DIPERBAIKI - SELALU JALANKAN
            if (newRankID) {
                console.log(`  🔍 Mencari prefix untuk rank ID: ${newRankID}`);
                const prefix = getRankPrefix(newRankID, message.guild);
                
                let cleanName = member.displayName;
                if (cleanName.includes('|')) cleanName = cleanName.split('|')[1].trim();
                
                const newNickname = `${prefix} | ${cleanName}`.substring(0, 32);
                await member.setNickname(newNickname).catch((err) => {
                    console.error(`  ❌ Gagal update nickname: ${err.message}`);
                });
                console.log(`  👤 Nickname diperbarui: ${newNickname}`);
            } else {
                console.log(`  ⚠️ Tidak ada pangkat baru, nickname tidak diupdate`);
            }

            console.log(`✅ Promosi/Demosi/Rotasi diproses: ${member.user.tag}`);
        }
    } catch (error) {
        console.error(`❌ Gagal memproses ID ${userID}:`, error);
    }
}

async function sendOfflineNotif() {
    const notifChannel = client.channels.cache.get(NOTIF_CHANNEL_ID);
    if (notifChannel) {
        try {
            await notifChannel.send(`⚠️ **Sistem SAPD Offline**\n\n*Silahkan tunggu sistem SAPD online kembali\n\n@everyone | ${new Date().toLocaleString('id-ID')} | Status: Berhenti/Timeout. \n*Bot akan aktif kembali otomatis sesuai jadwal atau jika dijalankan manual.*`);
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
