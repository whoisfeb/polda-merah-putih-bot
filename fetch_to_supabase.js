const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// GANTI DENGAN ID ASLI DARI DISCORD ANDA
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

        // 1. AMBIL CHAT PENDAFTARAN SIM DI THREAD
        const simRes = await fetch(`https://discord.com{SIM_THREAD_ID}/messages?limit=100`, { headers: headersDiscord });
        const simMessages = await simRes.json();
        
        if (simMessages && simMessages.length > 0) {
            // Bersihkan data lama di Supabase agar tidak duplikat
            await fetch(`${SUPABASE_URL}/rest/v1/format_sim?id=not.is.null`, { method: 'DELETE', headers: headersSupabase });

            // Proses membaca chat dari yang paling lama ke paling baru
            for (const msg of simMessages.reverse()) {
                const fullText = msg.content;
                
                const namaMatch = fullText.match(/NAMA LENGKAP\s*:\s*([^\n]*)/i);
                const simMatch = fullText.match(/JENIS SIM\s*:\s*([^`\n]*)/i);
                
                if (namaMatch && namaMatch[1].trim() !== "") {
                    const nama = namaMatch[1].trim();
                    const sim = simMatch ? simMatch[1].trim() : "A";

                    // Kirim ke database Supabase
                    await fetch(`${SUPABASE_URL}/rest/v1/format_sim`, {
                        method: 'POST',
                        headers: headersSupabase,
                        body: JSON.stringify({ nama_lengkap: nama, jenis_sim: sim })
                    });
                }
            }
            console.log("Daftar pendaftar SIM berhasil disinkronisasi!");
        }

        // 2. AMBIL DAFTAR POST FORUM AKTIF
        const forumRes = await fetch(`https://discord.com{FORUM_CHANNEL_ID}/threads/active`, { headers: headersDiscord });
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
            console.log("Daftar forum berhasil disinkronisasi!");
        }

    } catch (error) {
        console.error("Terjadi error sistem:", error);
        process.exit(1);
    }
}

run();
