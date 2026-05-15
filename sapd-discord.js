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
const WARGA_ROLE_ID = '1496865881651810519';
const POLICE_MAIN_ROLE_ID = '1496865881672912899';

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

    '1496865881727176763': '1496865881739890800',
    '1496865881727176762': '1496865881739890800',
    '1496865881727176761': '1496865881739890800',
    '1496865881727176760': '1496865881739890800',

    '1496865881706201280': '1496865881706201281',
    '1496865881706201279': '1496865881706201281',
    '1496865881706201278': '1496865881706201281',

    '1496865881698074694': '1496865881698074695',
    '1496865881698074693': '1496865881698074695',
    '1496865881698074692': '1496865881698074695',

    '1496865881698074690': '1496865881698074691',
    '1496865881698074689': '1496865881698074691',
    '1496865881698074688': '1496865881698074691',
    '1496865881698074687': '1496865881698074691',
    '1496865881698074686': '1496865881698074691',
    '1496865881681166466': '1496865881698074691',

    '1496865881681166464': '1496865881681166465',
    '1496865881681166463': '1496865881681166465',
    '1496865881681166462': '1496865881681166465',
    '1496865881681166461': '1496865881681166465',
    '1496865881681166460': '1496865881681166465',
    '1496865881681166459': '1496865881681166465'
};

// ==========================================
// --- ROLE GOLOGAN SAJA (UNTUK SINKRONISASI)
// ==========================================
const groupRoleIDs = [
    '1496865881739890800',
    '1496865881706201281',
    '1496865881698074695',
    '1496865881698074691',
    '1496865881681166465'
];

// ==========================================
// --- 3. DAFTAR MEMBERSIHKAN ROLE POLISI ---
// ==========================================
const allGroupIDs = [
    POLICE_MAIN_ROLE_ID,
    '1496865881739890800',
    '1496865881706201281',
    '1496865881698074695',
    '1496865881698074691',
    '1496865881681166465',
    '1496865881727176759',
    '1496865881727176758',
    '1496865881672912905',
    '1496865881672912904',
    '1496865881672912903',
    '1496865881672912902',
    '1496865881672912901'
];

// ==========================================
// --- HELPER FUNCTIONS ---
// ==========================================

function extractUserID(text) {
    if (!text) return null;
    const match = text.match(/<@!?(\d+)>/);
    return match ? match[1] : null;
}

function extractRoleIDs(text) {
    if (!text) return [];

    const roleIDArray = [];
    const regex = /<@&(\d+)>/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        roleIDArray.push(match[1]);
    }

    return roleIDArray;
}

function extractRoleID(text) {
    const ids = extractRoleIDs(text);
    return ids.length > 0 ? ids[0] : null;
}

function isEmpty(value) {
    if (!value) return true;
    const cleaned = value.trim().toLowerCase();
    return cleaned === '-' || cleaned === 'n/a' || cleaned === 'na' || cleaned === '';
}

// ==========================================
// --- PARSE PROMOTION LETTER ---
// ==========================================
function parsePromotionLetter(messageContent) {

    const pihakTerkaitStart = messageContent.indexOf('Pihak Terkait');
    if (pihakTerkaitStart === -1) return null;

    const after = messageContent.substring(pihakTerkaitStart);
    const next = after.indexOf('Bersama ini saya membuat');

    const content = next !== -1 ? after.substring(0, next) : after;

    const namaMatch = content.match(/a\.\s*Nama\s*:\s*(.+?)(?=\nb\.|$)/is);
    const pangkatLamaMatch = content.match(/b\.\s*Pangkat\s+Lama\s*:\s*(.+?)(?=\nc\.|$)/is);
    const pangkatBaruMatch = content.match(/c\.\s*Pangkat\s+Baru\s*:\s*(.+?)(?=\nd\.|$)/is);
    const jabatanLamaMatch = content.match(/d\.\s*Jabatan\s+Lama\s*:\s*(.+?)(?=\ne\.|$)/is);
    const jabatanBaruMatch = content.match(/e\.\s*Jabatan\s+Baru\s*:\s*(.+?)(?=\nf\.|$)/is);
    const satuanLamaMatch = content.match(/f\.\s*Satuan\s+Lama\s*:\s*(.+?)(?=\ng\.|$)/is);
    const satuanBaruMatch = content.match(/g\.\s*Satuan\s+Baru\s*:\s*(.+?)(?=\nh\.|$)/is);
    const statusMatch = content.match(/h\.\s*Status\s*:\s*(.+)/i);

    const nama = namaMatch ? namaMatch[1].trim() : null;
    const userIDs = []; // UBAH: Array untuk multiple users

    // TAMBAH: Extract semua user mentions
    if (nama) {
        const userRegex = /<@!?(\d+)>/g;
        let match;
        while ((match = userRegex.exec(nama)) !== null) {
            userIDs.push(match[1]);
        }
    }

    if (userIDs.length === 0) return null; // UBAH: Check array kosong

    return {
        userIDs, // UBAH: userID menjadi userIDs (array)
        pangkatLama: isEmpty(pangkatLamaMatch?.[1]) ? null : pangkatLamaMatch[1].trim(),
        pangkatBaru: isEmpty(pangkatBaruMatch?.[1]) ? null : pangkatBaruMatch[1].trim(),
        jabatanLama: isEmpty(jabatanLamaMatch?.[1]) ? null : jabatanLamaMatch[1].trim(),
        jabatanBaru: isEmpty(jabatanBaruMatch?.[1]) ? null : jabatanBaruMatch[1].trim(),
        satuanLama: isEmpty(satuanLamaMatch?.[1]) ? null : satuanLamaMatch[1].trim(),
        satuanBaru: isEmpty(satuanBaruMatch?.[1]) ? null : satuanBaruMatch[1].trim(),
        status: isEmpty(statusMatch?.[1]) ? null : statusMatch[1].trim().toUpperCase()
    };
}

// ==========================================
// --- BOT READY ---
// ==========================================
client.once('clientReady', async () => {

    console.log(`✅ Bot login sebagai ${client.user.tag}`);

    const notifChannel = client.channels.cache.get(NOTIF_CHANNEL_ID);
    if (!notifChannel) return;

    // PESAN 1
    await notifChannel.send(`✅ **Sistem SAPD Online** | ${new Date().toLocaleString('id-ID')}
Status: **Menunggu Promosi/Demotion...**

*Bot ini akan otomatis memproses promosi/demotion berdasarkan format surat resmi yang ditentukan di channel promosi.*
*Pastikan format surat benar agar bot dapat memproses dengan lancar.*
*Ketika tidak ada aktivitas yang sesuai format di channel <#${PROMOTION_CHANNEL_ID}> maka bot akan standby.*

@everyone

━━━━━━━━━━━━━━━━━━━━
📑 **Tutorial Mengisi Format Promotion**
━━━━━━━━━━━━━━━━━━━━

Gunakan format berikut:

**SURAT PROMOSI, DEMOSI, ROTASI**

27/01/2026 19:05PM
Klasifikasi: Rahasia
Lampiran Satu Lembar
Perihal : Promosi/Demosi/Rotasi

Dengan Hormat,

Yang bertanda tangan dibawah ini :
a. Nama     :
b. Pangkat  :
c. Jabatan  :
d. Satuan :

Pihak Terkait
Biro Sumber Daya Manusia
a. Nama         :
b. Pangkat Lama :
c. Pangkat Baru :
d. Jabatan Lama :
e. Jabatan Baru :
f. Satuan Lama :
g. Satuan Baru :
h. Status :
Bersama ini saya membuat surat secara
resmi dan sah, sesuai Peraturan Kepolisian Daerah, dengan pertimbangan sebagai berikut :

<@&1496865881672912899>
`);

    // PESAN 2
    await notifChannel.send(`━━━━━━━━━━━━━━━━━━━━
📌 **Contoh Pengisian**
━━━━━━━━━━━━━━━━━━━━

**SURAT PROMOSI, DEMOSI, ROTASI**

27/01/2026 19:05PM
Klasifikasi: Rahasia
Lampiran Satu Lembar
Perihal : Promosi/Demosi/Rotasi (pilih salah satunya)

Dengan Hormat,

Yang bertanda tangan dibawah ini :
a. Nama     : isi nama anda disini
b. Pangkat  : isi pangkat anda
c. Jabatan  : isi jabatan anda
d. Satuan : isi satuan atau divisi anda

Pihak Terkait
Biro Sumber Daya Manusia
a. Nama         : tag user yang bersangkutan
b. Pangkat Lama : tag pangkat lama (jika ada, jika tidak ada isi dengan -)
c. Pangkat Baru : tag pangkat baru (jika ada, jika tidak ada isi dengan -)
d. Jabatan Lama : tag jabatan lama (jika ada, jika tidak ada isi dengan -)
e. Jabatan Baru : tag jabatan baru (jika ada, jika tidak ada isi dengan -)
f. Satuan Lama : tag satuan lama (jika ada, jika tidak ada isi dengan -)
g. Satuan Baru : tag satuan baru (jika ada, jika tidak ada isi dengan -)
h. Status : tag status (PROMOSI / DEMOSI / ROTASI / RESIGN / PTDH)

Bersama ini saya membuat surat secara
resmi dan sah, sesuai Peraturan Kepolisian Daerah, dengan pertimbangan sebagai berikut :

<@&1496865881672912899>
`);

    // PESAN 3
    await notifChannel.send(`contoh pengisian PTDH ATAU RESIGN

**SURAT PROMOSI, DEMOSI, ROTASI**

27/01/2026 19:05PM
Klasifikasi: Rahasia
Lampiran Satu Lembar
Perihal : Promosi/Demosi/Rotasi (pilih salah satunya)

Dengan Hormat,

Yang bertanda tangan dibawah ini :
a. Nama     : isi nama anda disini
b. Pangkat  : isi pangkat anda
c. Jabatan  : isi jabatan anda
d. Satuan : isi satuan atau divisi anda

Pihak Terkait
Biro Sumber Daya Manusia
a. Nama         : tag user yang bersangkutan
b. Pangkat Lama : tag pangkat lama
c. Pangkat Baru : isi dengan tanda -
d. Jabatan Lama : tag jabatan lama
e. Jabatan Baru : isi dengan tanda -
f. Satuan Lama : tag satuan lama
g. Satuan Baru : isi dengan tanda -
h. Status : PTDH atau RESIGN (pilih salah satunya)

Bersama ini saya membuat surat secara
resmi dan sah, sesuai Peraturan Kepolisian Daerah, dengan pertimbangan sebagai berikut :

<@&1496865881672912899>

⚠️ **Catatan:**
• Gunakan **mention user** untuk nama
• Gunakan **mention role** untuk pangkat/jabatan/satuan
• Jika tidak ada perubahan isi dengan **-**

━━━━━━━━━━━━━━━━━━━━
🤖 **Sistem akan otomatis:**
• Menghapus pangkat lama
• Memberikan pangkat baru
• Mengubah divisi/satuan
• Menyesuaikan golongan
• Mengubah nickname sesuai pangkat
━━━━━━━━━━━━━━━━━━━━
`);

});

// ==========================================
// --- PROMOTION SYSTEM ---
// ==========================================
client.on('messageCreate', async (message) => {

    if (message.author.bot && message.author.id !== client.user.id) return;
    if (message.channel.id !== PROMOTION_CHANNEL_ID) return;

    if (!message.content.includes('Pihak Terkait')) return;

    const data = parsePromotionLetter(message.content);

    if (!data) {
        await message.react('❌');
        return;
    }

    const { userIDs, pangkatLama, pangkatBaru, jabatanLama, jabatanBaru, satuanLama, satuanBaru, status } = data;

    try {

        const botMember = message.guild.members.me;

        // TAMBAH: Loop untuk setiap user
        for (const userID of userIDs) {
            const member = await message.guild.members.fetch(userID);

            if (member.roles.highest.position >= botMember.roles.highest.position) {
                await message.react('⚠️');
                continue; // UBAH: return menjadi continue
            }

            // ======================================
            // PTDH / RESIGN SYSTEM (FULL REMOVE)
            // ======================================
            if (status === 'PTDH' || status === 'RESIGN') {

                // Hapus semua role polisi
                for (const roleID of allGroupIDs) {
                    if (member.roles.cache.has(roleID)) {
                        await member.roles.remove(roleID).catch(()=>null);
                    }
                }

                // Hapus pangkat jika ada
                if (pangkatLama) {
                    const roleID = extractRoleID(pangkatLama);
                    if (roleID) await member.roles.remove(roleID).catch(()=>null);
                }

                // Tambahkan role warga
                if (!member.roles.cache.has(WARGA_ROLE_ID)) {
                    await member.roles.add(WARGA_ROLE_ID).catch(()=>null);
                }

                // =========================
                // NICKNAME PTDH / RESIGN
                // =========================
                let clean = member.displayName || member.user.username;

                if (clean.includes('|')) {
                    clean = clean.split('|')[1].trim();
                }

                let newName = clean;

                if (status === 'RESIGN') {
                    newName = `RESIGN | ${clean}`;
                }

                if (status === 'PTDH') {
                    newName = `PTDH | ${clean}`;
                }

                await member.setNickname(newName.substring(0,32)).catch(()=>null);

                continue; // UBAH: return menjadi continue
            }

            // REMOVE OLD RANK
            if (pangkatLama) {

                const roleID = extractRoleID(pangkatLama);

                if (roleID) await member.roles.remove(roleID).catch(() => null);

            }

            // ADD NEW RANK
            let newRankID = null;

            if (pangkatBaru) {

                newRankID = extractRoleID(pangkatBaru);

                if (newRankID) await member.roles.add(newRankID);

            }

            // REMOVE OLD DIVISION
            if (satuanLama) {

                const roles = extractRoleIDs(satuanLama);

                for (const r of roles) await member.roles.remove(r).catch(()=>null);

            }

            // ADD NEW DIVISION
            if (satuanBaru) {

                const roles = extractRoleIDs(satuanBaru);

                for (const r of roles) await member.roles.add(r).catch(()=>null);

            }

            // REMOVE OLD POSITION/JABATAN
            if (jabatanLama) {

                const roles = extractRoleIDs(jabatanLama);

                for (const r of roles) await member.roles.remove(r).catch(()=>null);

            }

            // ADD NEW POSITION/JABATAN
            if (jabatanBaru) {

                const roles = extractRoleIDs(jabatanBaru);

                for (const r of roles) await member.roles.add(r).catch(()=>null);

            }

            // ======================================
            // SYNC GROUP ROLE (FIXED)
            // ======================================
            if (newRankID && groupRoles[newRankID]) {

                const targetGroupID = groupRoles[newRankID];

                for (const groupID of groupRoleIDs) {

                    if (member.roles.cache.has(groupID) && groupID !== targetGroupID) {

                        await member.roles.remove(groupID).catch(()=>null);

                    }

                }

                await member.roles.add(targetGroupID);

            }

            if (newRankID) await member.roles.add(POLICE_MAIN_ROLE_ID);

            // UPDATE NICKNAME
            if (newRankID && rankPrefixes[newRankID]) {

                const prefix = rankPrefixes[newRankID];

                let clean = member.displayName;

                if (clean.includes('|')) clean = clean.split('|')[1].trim();

                await member.setNickname(`${prefix} | ${clean}`.substring(0,32));

            }

        } // TAMBAH: Tutup loop for

        await message.react('✅');

    } catch (err) {

        console.error(err);
        await message.react('❌');

    }

});

// ==========================================
// --- BOT LOGIN ---
// ==========================================
client.login(TOKEN);
