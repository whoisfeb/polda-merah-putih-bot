require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

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
const { handleReady, handlePromotionMessage } = require('./handlers/sapd-discord');
const { handlePromotionReady, handlePromotionInteraction } = require('./handlers/promotion');

client.once('ready', async () => {
  console.log(`✅ Bot berhasil online sebagai ${client.user.tag}!`);

  // Verify handler (interaction setup)
  try { if (typeof handleVerify === 'function') await handleVerify(client); } catch (err) { console.error('handleVerify error:', err); }

  // Old-style promotion ready (sapd-discord) e.g. send notifications
  try { if (typeof handleReady === 'function') await handleReady(client); } catch (err) { console.error('sapd-discord handleReady error:', err); }

  // New-style promotion ready (register slash command, etc.)
  try { if (typeof handlePromotionReady === 'function') await handlePromotionReady(client); } catch (err) { console.error('promotion handlePromotionReady error:', err); }
});

client.on('messageCreate', async (message) => {
  // Abaikan pesan bot lain (tetap proses jika dari self)
  if (message.author.bot && message.author.id !== client.user.id) return;

  // Pesan-based promotion handler (sapd-discord)
  try {
    if (typeof handlePromotionMessage === 'function') {
      await handlePromotionMessage(message);
    }
  } catch (err) {
    console.error('handlePromotionMessage error:', err);
  }

  // Text/command verify handler
  try {
    if (typeof handleVerifyCommand === 'function') {
      await handleVerifyCommand(message);
    }
  } catch (err) {
    console.error('handleVerifyCommand error:', err);
  }
});

// Interactions (select menus, modals, slash commands)
client.on('interactionCreate', async (interaction) => {
  try {
    if (typeof handlePromotionInteraction === 'function') {
      await handlePromotionInteraction(interaction);
    }
  } catch (err) {
    console.error('handlePromotionInteraction error:', err);
  }

  // If verify module needs to handle interactions directly, call here (optional)
  // try { if (typeof handleVerifyInteraction === 'function') await handleVerifyInteraction(interaction); } catch (err) { console.error(err); }
});

process.on('unhandledRejection', (err) => console.error('UnhandledRejection:', err));

// Jalankan bot
client.login(process.env.DISCORD_BOT_TOKEN);
