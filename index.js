const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// Inisialisasi client bot dengan intent lengkap
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// --- IMPORT HANDLER FILE TERPISAH ---
const { handleVerify, handleVerifyCommand } = require('./handlers/verify');

// Event saat bot berhasil online
client.once('ready', () => {
    console.log(`✅ Bot berhasil online sebagai ${client.user.tag}!`);
    
    // Jalankan handler interaksi (Tombol & Modal)
    handleVerify(client);
    
    // Jika handler lain (seperti reminder) butuh dijalankan saat bot ready, pasang di sini:
    // handleReminder(client);
});

// Event saat ada pesan masuk (Membaca perintah teks dengan prefix seperti !)
client.on('messageCreate', async (message) => {
    // Abaikan jika pesan berasal dari bot lain atau bot itu sendiri
    if (message.author.bot) return;

    // Jalankan pengecekan perintah teks dari masing-masing handler
    await handleVerifyCommand(message);
});

// Jalankan bot menggunakan token dari file .env
client.login(process.env.TOKEN);
