const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY; 
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;

// SILAKAN MASUKKAN ID ASLI DISCORD ANDA DI SINI
const FORUM_CHANNEL_ID = "1504080970696101948"; // ID Channel Induk Forum
const SIM_THREAD_ID = "1505228395963879616";   // ID Thread LOKET PEMBUATAN SIM

async function run() {
    try {
        const headersDiscord = { 'Authorization': `Bot ${DISCORD_TOKEN}` };
        const headersSupabase = {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        };

        console.log("Memulai sinkronisasi data dari Discord ke Supabase...");

        // 1. AMBIL CHAT PENDAFTARAN SIM DI THREAD
        // PERBAIKAN MUTLAK: Menggunakan tanda backtick (`) agar ${SIM_THREAD_ID} terbaca sebagai angka ID
        const simUrl = `https://discord.com{SIM_THREAD_ID}/messages?limit=100`;
        const simRes = await fetch(simUrl, { headers: headersDiscord });
        const simMessages = await simRes.json();
        
        if (simMessages && simMessages.length > 0) {
            // Bersihkan tabel lama di Supabase agar tidak duplikat
            await fetch(`${SUPABASE_URL}/rest/v1/format_sim?id=not.is.null`, { method: 'DELETE', headers: headersSupabase });

            // Baca chat dari terlama ke terbaru
            for (const msg of simMessages.reverse()) {
                const fullText = msg.content;
                if (!fullText) continue;
                
                const namaMatch = fullText.match(/NAMA LENGKAP\s*:\s*([^\n]*)/i);
                const simMatch = fullText.match(/JENIS SIM\s*:\s*([^`\n]*)/i);
                
                if (namaMatch && namaMatch[1] && namaMatch[1].trim() !== "") {
                    const nama = namaMatch[1].trim();
                    const sim = (simMatch && simMatch[1] && simMatch[1].trim() !== "") ? simMatch[1].trim() : "A";

                    // Kirim data ke Supabase
                    await fetch(`${SUPABASE_URL}/rest/v1/format_sim`, {
                        method: 'POST',
                        headers: headersSupabase,
                        body: JSON.stringify({ nama_lengkap: nama, jenis_sim: sim })
                    });
                }
            }
            console.log("Antrean SIM sukses diperbarui!");
        }

        // 2. AMBIL DAFTAR TOPIC FORUM AKTIF
        const forumUrl = `https://discord.com{FORUM_CHANNEL_ID}/threads/active`;
        const forumRes = await fetch(forumUrl, { headers: headersDiscord });
        const forumData = await forumRes.json();
        
        if (forumData && forumData.threads) {
            await fetch(`${SUPABASE_URL}/rest/v1/daftar_forum?id=not.is.null`, { method: 'DELETE', headers: headersSupabase });
            for (const thread of forumData.threads) {
                await fetch(`${SUPABASE_URL}/rest/v1/daftar_forum`, {
                    method: 'POST',
                    headers: headersSupabase,
                    body: JSON.stringify({ id: thread.id, judul: thread.name })
                });
            }
            console.log("Daftar Forum polda sukses diperbarui!");
        }

    } catch (error) {
        console.error("Terjadi error pada script sync:", error);
        process.exit(1);
    }
}

run();
