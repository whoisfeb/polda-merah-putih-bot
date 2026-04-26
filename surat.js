require('dotenv').config();
const { 
Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, 
UserSelectMenuBuilder, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
const dataSurat = new Map();

const CHANNEL_PROMOSI = "1496865883723792564";

const ROLE_ALLOWED_PROMOSI = [
"1496865881651810521",
"1496865881739890800",
"1496865881672912905",
"1496865881727176759",
"1496865881727176758"
];

const MAPPING_ROLE = {

PANGKAT: [
{ label:'JENDPOL', value:'1496865881727176763'},
{ label:'KOMJENPOL', value:'1496865881727176762'},
{ label:'IRJENPOL', value:'1496865881727176761'},
{ label:'BRIGJENPOL', value:'1496865881727176760'},
{ label:'KOMBESPOL', value:'1496865881706201280'},
{ label:'AKBP', value:'1496865881706201279'},
{ label:'KOMPOL', value:'1496865881706201278'},
{ label:'AKP', value:'1496865881698074694'},
{ label:'IPTU', value:'1496865881698074693'},
{ label:'IPDA', value:'1496865881698074692'},
{ label:'AIPTU', value:'1496865881698074690'},
{ label:'AIPDA', value:'1496865881698074689'},
{ label:'BRIPKA', value:'1496865881698074688'},
{ label:'BRIGPOL', value:'1496865881698074687'},
{ label:'BRIPTU', value:'1496865881698074686'},
{ label:'BRIPDA', value:'1496865881681166466'},
{ label:'ABRIP', value:'1496865881681166464'},
{ label:'ABRIPTU', value:'1496865881681166463'},
{ label:'ABRIPDA', value:'1496865881681166462'},
{ label:'BHARAKA', value:'1496865881681166461'},
{ label:'BHARATU', value:'1496865881681166460'},
{ label:'BHARADA', value:'1496865881681166459'},
{ label:'-', value:'-'}
],

JABATAN:[
{ label:'Kepala Kepolisian Daerah', value:'1496865881739890801'},
{ label:'Wakil Kepala Kepolisian Daerah', value:'1496865881651810518'},
{ label:'Kepala Bidang Profesi & Pengamanan', value:'1496865881739890799'},
{ label:'Kepala Biro SDM', value:'1496865881727176757'},
{ label:'Komandan Satuan Brigade Mobile', value:'1496865881727176755'},
{ label:'Direktur Samapta Bhayangkara', value:'1496865881727176754'},
{ label:'Kepala Divisi Bareskrim', value:'1496865881706201287'},
{ label:'Direktur Lalu Lintas', value:'1496865881706201286'},
{ label:'Wakil Komandan Satuan Brigade Mobile', value:'1496865881706201285'},
{ label:'Wakil Kepala Divisi Bareskrim', value:'1496865881706201284'},
{ label:'Wakil Direktur Samapta Bhayangkara', value:'1496865881706201283'},
{ label:'Wakil Direktur Lalu Lintas', value:'1496865881706201282'},
{ label:'-', value:'-'}
],

SATUAN:[
{ label:'Bidang Profesi dan Pengamanan', value:'1496865881727176759'},
{ label:'Divisi Keuangan Polda', value:'1496865881727176758'},
{ label:'Biro SDM', value:'1496865881672912905'},
{ label:'Satuan Brigade Mobile', value:'1496865881672912904'},
{ label:'Direktorat Samapta Bhayangkara', value:'1496865881672912903'},
{ label:'Direktorat Lalu Lintas', value:'1496865881672912902'},
{ label:'Badan Reserse Kriminal', value:'1496865881672912901'},
{ label:'-', value:'-'}
]

};

function getPangkatUser(member){

const pangkatRoles = MAPPING_ROLE.PANGKAT
.map(r=>r.value)
.filter(id=>id !== '-');

const role = member.roles.cache.find(r=>pangkatRoles.includes(r.id));

return role ? role.id : '-';

}

client.once('ready',()=>{

console.log(`✅ Bot Online: ${client.user.tag}`);

client.application.commands.create(
new SlashCommandBuilder()
.setName('promosi')
.setDescription('Membuat surat promosi/demosi/rotasi')
);

});

client.on('interactionCreate', async interaction=>{

if(interaction.isChatInputCommand() && interaction.commandName === 'promosi'){

const member = interaction.member;

if(!member.roles.cache.some(role=>ROLE_ALLOWED_PROMOSI.includes(role.id))){

return interaction.reply({
content:'❌ Anda tidak memiliki izin menggunakan command ini.',
ephemeral:true
});

}

dataSurat.set(interaction.user.id,{
ttdNama:`<@${interaction.user.id}>`,
ttdPangkat:getPangkatUser(member)
});

const row = new ActionRowBuilder().addComponents(
new StringSelectMenuBuilder()
.setCustomId('status')
.setPlaceholder('1. Pilih Status')
.addOptions([
{label:'Promosi',value:'Promosi'},
{label:'Demosi',value:'Demosi'},
{label:'Rotasi',value:'Rotasi'},
{label:'PTDH',value:'PTDH'},
{label:'RESIGN',value:'RESIGN'}
])
);

await interaction.reply({
content:'### 📜 Form Pembuatan Surat',
components:[row],
ephemeral:true
});

}

if(interaction.isModalSubmit()){

const userData = dataSurat.get(interaction.user.id);
if(!userData) return;

userData.pertimbangan = interaction.fields.getTextInputValue('input_pertimbangan');

await kirimSuratFinal(interaction,userData);

}

if(!interaction.isStringSelectMenu() && !interaction.isUserSelectMenu()) return;

const userData = dataSurat.get(interaction.user.id);
if(!userData) return;

const val = interaction.values[0];

switch(interaction.customId){

case 'status':

userData.status = val;

await showStep(interaction,'s3','2. Pilih Jabatan Penandatangan',MAPPING_ROLE.JABATAN);

break;

case 's3':

userData.ttdJabatan = val;

await showStep(interaction,'s4','3. Pilih Satuan Penandatangan',MAPPING_ROLE.SATUAN);

break;

case 's4':

userData.ttdSatuan = val;

const rowTarget = new ActionRowBuilder().addComponents(
new UserSelectMenuBuilder()
.setCustomId('s5')
.setPlaceholder('4. Pilih Nama Pihak Terkait')
);

await interaction.update({content:'Pilih Pihak Terkait',components:[rowTarget]});

break;

case 's5':

userData.targetNama = `<@${val}>`;

await showStep(interaction,'s6','5. Pilih Pangkat Lama',MAPPING_ROLE.PANGKAT);

break;

case 's6':

userData.pLama = val;

if(userData.status === "PTDH" || userData.status === "RESIGN"){

userData.pBaru='-';

await showStep(interaction,'s8','6. Pilih Jabatan Lama',MAPPING_ROLE.JABATAN);
break;

}

await showStep(interaction,'s7','6. Pilih Pangkat Baru',MAPPING_ROLE.PANGKAT);
break;

case 's7':

userData.pBaru = val;

await showStep(interaction,'s8','7. Pilih Jabatan Lama',MAPPING_ROLE.JABATAN);

break;

case 's8':

userData.jLama = val;

if(userData.status === "PTDH" || userData.status === "RESIGN"){

userData.jBaru='-';

await showStep(interaction,'s10','8. Pilih Satuan Lama',MAPPING_ROLE.SATUAN);
break;

}

await showStep(interaction,'s9','8. Pilih Jabatan Baru',MAPPING_ROLE.JABATAN);

break;

case 's9':

userData.jBaru = val;

await showStep(interaction,'s10','9. Pilih Satuan Lama',MAPPING_ROLE.SATUAN);

break;

case 's10':

userData.sLama = val;

if(userData.status === "PTDH" || userData.status === "RESIGN"){

userData.sBaru='-';

return showModal(interaction);

}

await showStep(interaction,'s11','10. Pilih Satuan Baru',MAPPING_ROLE.SATUAN);

break;

case 's11':

userData.sBaru = val;

return showModal(interaction);

}

});

async function showModal(interaction){

const modal = new ModalBuilder()
.setCustomId('modal_pertimbangan')
.setTitle('Input Pertimbangan');

const input = new TextInputBuilder()
.setCustomId('input_pertimbangan')
.setLabel('Masukkan Pertimbangan')
.setStyle(TextInputStyle.Paragraph);

modal.addComponents(new ActionRowBuilder().addComponents(input));

await interaction.showModal(modal);

}

async function showStep(interaction,customId,placeholder,options){

const row = new ActionRowBuilder().addComponents(
new StringSelectMenuBuilder()
.setCustomId(customId)
.setPlaceholder(placeholder)
.addOptions(options)
);

await interaction.update({
content:`Mengisi: **${placeholder}**`,
components:[row]
});

}

async function kirimSuratFinal(interaction,data){

const role = (id)=> id === '-' ? '-' : `<@&${id}>`;

const waktu = new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});

const surat = `**SURAT PROMOSI, DEMOSI, ROTASI**

${waktu}
Klasifikasi: Rahasia
Lampiran Satu Lembar
Perihal : Promosi/Demosi/Rotasi

Dengan Hormat,

Yang bertanda tangan dibawah ini :
a. Nama     : ${data.ttdNama}
b. Pangkat  : ${role(data.ttdPangkat)}
c. Jabatan  : ${role(data.ttdJabatan)}
d. Satuan   : ${role(data.ttdSatuan)}

Pihak Terkait
Biro Sumber Daya Manusia 
a. Nama         : ${data.targetNama}
b. Pangkat Lama : ${role(data.pLama)}
c. Pangkat Baru : ${role(data.pBaru)}
d. Jabatan Lama : ${role(data.jLama)}
e. Jabatan Baru : ${role(data.jBaru)}
f. Satuan Lama  : ${role(data.sLama)}
g. Satuan Baru  : ${role(data.sBaru)}
h. Status       : ${data.status}

Bersama ini saya membuat surat secara
resmi dan sah, sesuai Peraturan Kepolisian Daerah, dengan pertimbangan sebagai berikut :

${data.pertimbangan}

<@&1496865881672912899>`;

await interaction.reply({
content:'✅ Surat berhasil diterbitkan',
ephemeral:true
});

const channel = interaction.guild.channels.cache.get(CHANNEL_PROMOSI);

if(channel){
channel.send(surat);
}

dataSurat.delete(interaction.user.id);

}

client.login(process.env.DISCORD_BOT_TOKEN);
