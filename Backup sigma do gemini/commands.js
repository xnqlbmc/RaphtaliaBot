// by xnqlb
// [Backup Sigma do Gemini] Ativo e seguro!
import { downloadMediaMessage, generateWAMessageFromContent, prepareWAMessageMedia } from '@whiskeysockets/baileys';
import fs, { createWriteStream, unlinkSync, readFileSync, existsSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { exec as execCallback, execFile, execSync } from 'child_process';
import { promisify } from 'util'; 
import { CONFIG } from './connect.js';
import yts from 'yt-search'; 
import axios from 'axios'; 
import path from 'path'; 
import chalk from 'chalk'; 
import fetch from 'node-fetch';
import JSZip from "jszip";
import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_PATH = path.join(__dirname, 'tmp');
import { getUserMemory, addMemory } from "./utils/memoria.js";
import { getGroupMetadata } from "./utils/groupCache.js";

const exec = promisify(execCallback);

// Função principal que recebe o objeto de conexão (sock) e as mensagens (m)
export default async function processMessages(sock, m) {
    const prefix = CONFIG.prefixo;
    const nomeBot = CONFIG.nome_bot;
    const nomeDono = CONFIG.nome_dono;
    const numeroDono = CONFIG.numero_dono;
	const GROQ_API_KEY = CONFIG.GROQ_API_KEY;
	const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY;
	const ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });
    
    // 1. Validação e extração de dados da mensagem
    if (!m.messages || m.type !== 'notify') return;
    
    const message = m.messages[0];
	const msg = message;
    const messageType = Object.keys(message.message || {})[0]; 
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
	const rawText = text.toLowerCase();
    const chatId = message.key.remoteJid;
    const isBot = message.key.fromMe;
	const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
	const isMentioned = mentioned.includes(sock.user.id);
	
	const isCommand = rawText.startsWith(prefix);

	const fullCommand = isCommand 
    ? text.substring(prefix.length).trim() 
    : '';
	
	const from = chatId;
	const user = msg.key.participantPn || msg.key.senderPn || msg.key.participant || msg.key.remoteJid;
	const userPn = user.split("@")[0];
	const isGroup = chatId.endsWith("@g.us");
	const pushName = message.pushName;
	const groupMetadata = isGroup
    ? await getGroupMetadata(sock, chatId)
    : null;

	const groupName = groupMetadata?.subject;
	const isPrivate = !chatId.endsWith("@g.us");
	
const quoted = msg.message?.extendedTextMessage?.contextInfo;
const isQuoted = !!quoted;
const mediaMsg = isQuoted ? isQuoted.quotedMessage : msg.message;
const reply = (resposta) => sock.sendMessage(chatId, { text: resposta }, { quoted: message });
const isOwner = userPn === numeroDono;

const groq = new Groq({
  apiKey: `${GROQ_API_KEY}`
});

const hora = new Date().toLocaleTimeString("pt-BR");
const contactNumber = user.split("@")[0];
// Tenta buscar a mídia em todos os formatos (Imagem/Vídeo normal, ViewOnce v2, ViewOnce)
const mediaImage = 
    mediaMsg?.imageMessage || 
    mediaMsg?.viewOnceMessageV2?.message?.imageMessage || 
    mediaMsg?.viewOnceMessage?.message?.imageMessage;
            
const mediaVideo = 
    mediaMsg?.videoMessage || 
    mediaMsg?.viewOnceMessageV2?.message?.videoMessage || 
    mediaMsg?.viewOnceMessage?.message?.videoMessage;

// 1. commandText: O primeiro token (ex: "play", "menu")
const commandText = fullCommand.split(/\s+/)[0]?.toLowerCase() || '';

// 2. args: O restante da query (ex: "os baroes da pisadinha")
const args = fullCommand.substring(commandText.length).trim().split(/\s+/).filter(a => a.length > 0);
    
// Tire o // antes do if (isBot) return; para ignorar as mensagens enviadas pelo bot
//    if (isBot) return; 
const locationInfo = isGroup
  ? `${chalk.gray("│")} ${chalk.yellow("👥 Grupo:")} ${groupName}`
  : `${chalk.gray("│")} ${chalk.yellow("📱 Número:")} ${contactNumber}`;
  
console.log(
`${chalk.gray("┌────────────────────────────")}
${chalk.gray("│")} ${chalk.blue("⏰")} ${hora}
${chalk.gray("│")} ${chalk.green("💬 Tipo:")} ${chalk.white(messageType)}
${chalk.gray("│")} ${chalk.cyan("👤 User:")} ${pushName}
${chalk.gray("│")} ${chalk.magenta("📍 Chat:")} ${chatId}
${locationInfo}
${chalk.gray("│")} ${chalk.green("📝 Texto:")} ${text.substring(0, 60) || "(sem texto, ou outro tipo)"}
${chalk.gray("└────────────────────────────")}`
);

if (chatId === "120363423629691818@g.us") {

    console.log(
        JSON.stringify(m, null, 2)
    );

}

    // --- SISTEMA DE COMANDOS: switch/case ---

    switch (commandText) {
        
        case "menu":
        case "ajuda":
            const menuImageUrl = 'https://files.catbox.moe/idon0h.jpg';
            const tempMenuPath = path.join(TEMP_PATH, `temp_menu_${Date.now()}.png`);
            let menuImageBuffer = null;

            const menuText = `୧₊‿︵‧ ˚ ₊⊹ ᰔ ⊹₊ ˚‧︵‿₊୨ 
˖˚⊹ ꣑ৎᰔ ${nomeBot} ᰔ꣑ৎ˚⊹˖
˖˚⊹ 𝕮𝖔𝖒𝖆𝖓𝖉𝖔𝖘 𝕯𝖎𝖘𝖕𝖔𝖓í𝖛𝖊𝖎𝖘: ˖˚⊹
˖˚⊹ ꣑ৎ ${prefix}menu
˖˚⊹ ꣑ৎ ${prefix}ajuda
˖˚⊹ ꣑ৎ ${prefix}ping
˖˚⊹ ꣑ৎ ${prefix}infodono
˖˚⊹ ꣑ৎ ${prefix}report <mensagem>
୧₊‿︵‧ ˚ ₊⊹ ᰔ ⊹₊ ˚‧︵‿₊୨ 
˖˚⊹ ꣑ৎᰔ 𝕱𝖎𝖌𝖚𝖗𝖎𝖓𝖍𝖆𝖘 ᰔ꣑ৎ˚⊹˖
˖˚⊹ ꣑ৎ ${prefix}s
˖˚⊹ ꣑ৎ ${prefix}sticker
˖˚⊹ ꣑ৎ ${prefix}fig
˖˚⊹ ꣑ৎ ${prefix}toimg
˖˚⊹ ꣑ৎ ${prefix}togif
˖˚⊹ ꣑ৎ ${prefix}qc
˖˚⊹ ꣑ৎ ${prefix}brat
˖˚⊹ ꣑ৎ ${prefix}bratv
˖˚⊹ ꣑ৎ ${prefix}emojimix
˖˚⊹ ꣑ৎ ${prefix}anime <1-15>
˖˚⊹ ꣑ৎ ${prefix}figurinhas <1-15>
୧₊‿︵‧ ˚ ₊⊹ ᰔ ⊹₊ ˚‧︵‿₊୨ 
˖˚⊹ ꣑ৎᰔ 𝕲𝖊𝖗𝖆𝖑 ᰔ꣑ৎ˚⊹˖
˖˚⊹ ꣑ৎ ${prefix}gemini
˖˚⊹ ꣑ৎ ${prefix}meme
˖˚⊹ ꣑ৎ ${prefix}translate <texto>
˖˚⊹ ꣑ৎ ${prefix}wiki <termo>
˖˚⊹ ꣑ৎ ${prefix}covid
˖˚⊹ ꣑ৎ ${prefix}cep <cep>
˖˚⊹ ꣑ৎ ${prefix}calcular <expressão>
˖˚⊹ ꣑ৎ ${prefix}qrcode <texto>
˖˚⊹ ꣑ৎ ${prefix}afk <motivo>
˖˚⊹ ꣑ৎ ${prefix}ocr (com imagem)
˖˚⊹ ꣑ৎ ${prefix}wait (com imagem)
୧₊‿︵‧ ˚ ₊⊹ ᰔ ⊹₊ ˚‧︵‿₊୨ 
˖˚⊹ ꣑ৎᰔ 𝕬𝖉𝖒𝖎𝖓𝖎𝖘𝖙𝖗𝖆𝖈𝖆𝖔 ᰔ꣑ৎ˚⊹˖
˖˚⊹ ꣑ৎ ${prefix}setprefix <símbolo>
˖˚⊹ ꣑ৎ ${prefix}delprefix
˖˚⊹ ꣑ৎ ${prefix}addprem @usuário
˖˚⊹ ꣑ৎ ${prefix}delprem @usuário
˖˚⊹ ꣑ৎ ${prefix}listprem
˖˚⊹ ꣑ৎ ${prefix}marcar
˖˚⊹ ꣑ৎ ${prefix}totag
˖˚⊹ ꣑ৎ ${prefix}cita
˖˚⊹ ꣑ৎ ${prefix}grupoinfo
˖˚⊹ ꣑ৎ ${prefix}antilink
˖˚⊹ ꣑ৎ ${prefix}antilinkhard
˖˚⊹ ꣑ৎ ${prefix}antimarcar
˖˚⊹ ꣑ৎ ${prefix}antibot
˖˚⊹ ꣑ৎ ${prefix}bemvindo
˖˚⊹ ꣑ৎ ${prefix}legendabv
˖˚⊹ ꣑ৎ ${prefix}saiu
˖˚⊹ ꣑ৎ ${prefix}legendasaiu
˖˚⊹ ꣑ৎ ${prefix}suicidio
˖˚⊹ ꣑ৎ ${prefix}grupo a/f
˖˚⊹ ꣑ৎ ${prefix}msgtemp 1/7/90
˖˚⊹ ꣑ৎ ${prefix}fixar 1/7/30
˖˚⊹ ꣑ৎ ${prefix}desfixar
˖˚⊹ ꣑ৎ ${prefix}promover @usuário
˖˚⊹ ꣑ৎ ${prefix}rebaixar @usuário
˖˚⊹ ꣑ৎ ${prefix}addlistanegra
˖˚⊹ ꣑ৎ ${prefix}listlistanegra
˖˚⊹ ꣑ৎ ${prefix}remlistanegra
˖˚⊹ ꣑ৎ ${prefix}setnomegrupo <nome>
˖˚⊹ ꣑ৎ ${prefix}setdescgrupo <descrição>
˖˚⊹ ꣑ৎ ${prefix}setfotogrupo (com imagem)
˖˚⊹ ꣑ৎ ${prefix}seticongrupo (com imagem)
˖˚⊹ ꣑ৎ ${prefix}linkgrupo
˖˚⊹ ꣑ৎ ${prefix}mute @usuário
˖˚⊹ ꣑ৎ ${prefix}expulsar @usuário
˖˚⊹ ꣑ৎ ${prefix}kick @usuário
˖˚⊹ ꣑ৎ ${prefix}ban @usuário
˖˚⊹ ꣑ৎ ${prefix}unban @usuário
୧₊‿︵‧ ˚ ₊⊹ ᰔ ⊹₊ ˚‧︵‿₊୨
˖˚⊹ ꣑ৎᰔ 𝕯𝖔𝖜𝖓𝖑𝖔𝖆𝖉 ᰔ꣑ৎ˚⊹˖
˖˚⊹ ꣑ৎ *${prefix}play*
˖˚⊹ ꣑ৎ ${prefix}playvid
˖˚⊹ ꣑ৎ *${prefix}downloadmp3*
˖˚⊹ ꣑ৎ *${prefix}downloadvid*
˖˚⊹ ꣑ৎ ${prefix}pinterest
˖˚⊹ ꣑ৎ ${prefix}ytsearch <termo>
˖˚⊹ ꣑ৎ ${prefix}tiktok <link>
˖˚⊹ ꣑ৎ *${prefix}insta <link>*
˖˚⊹ ꣑ৎ *${prefix}instagram <link>*
˖˚⊹ ꣑ৎ *${prefix}ig <link>*
˖˚⊹ ꣑ৎ ${prefix}facebook <link>
˖˚⊹ ꣑ৎ ${prefix}twitter <link>
˖˚⊹ ꣑ৎ ${prefix}x <link>
˖˚⊹ ꣑ৎ ${prefix}soundcloud <link>
˖˚⊹ ꣑ৎ ${prefix}spotify <link>
˖˚⊹ ꣑ৎ ${prefix}deezer <link>
˖˚⊹ ꣑ৎ ${prefix}lyrics <nome da música>
୧₊‿︵‧ ˚ ₊⊹ ᰔ ⊹₊ ˚‧︵‿₊୨`;
try {
                // 1. Baixar a imagem da URL
                const response = await axios.get(menuImageUrl, { 
                    responseType: 'arraybuffer' 
                });
                
                menuImageBuffer = response.data;

                // Salva temporariamente para enviar via Baileys
                writeFileSync(tempMenuPath, menuImageBuffer);

                // 2. Enviar a imagem com o texto do menu na legenda
                await sock.sendMessage(chatId, { 
                    image: readFileSync(tempMenuPath),
                    caption: menuText 
                });

            } catch (error) {
                console.error('❌ Erro ao enviar menu com imagem:', error.message);
                
                // Se falhar o download/envio da imagem, envia só o texto
                await sock.sendMessage(chatId, { text: menuText });
            } finally {
                // 3. Limpeza (deleta o arquivo temporário se ele foi criado)
                if (existsSync(tempMenuPath)) {
                    unlinkSync(tempMenuPath);
                }
            }
            break;

case "ping": {
  const start = Date.now();
  const sender = message.key.participant || message.key.remoteJid;

  // envia uma mensagem inicial usando chatId e message (para quote)
  await reply("⏳ Calculando latência...");

  const end = Date.now();
  const latency = end - start;

  // uptime via process.uptime()
  const uptimeSec = Math.floor(process.uptime());
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = uptimeSec % 60;
  const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  await sock.sendMessage(chatId, {
    text: `˖˚⊹ ꣑ৎ 🏓 *𝕻𝖔𝖓𝖌!* 𝕷𝖆𝖙𝖊𝖓𝖈𝖎𝖆: *${latency}ms*\n˖˚⊹ ꣑ৎ ⏱️ 𝖀𝖕𝖙𝖎𝖒𝖊: *${uptime}*`,
    mentions: [sender]
  }, { quoted: message });
}
break;

case "ai": {
  try {
    const sender = message.key.participant || message.key.remoteJid;
    const prompt = args.join(" ");
	const memory = getUserMemory(user);

    if (!prompt) {
      return sock.sendMessage(chatId, { text: "❌ Fala algo seu burro"}, { quoted: message });
    }

    await sock.sendPresenceUpdate('composing', chatId);
	
	        const res = await ai.models.generateContent({
            model: "gemma-4-26b-a4b-it",
			config: {
				responseMimeType: "application/json",
				systemInstruction: `Você é uma personagem Tsundere chamada Nazuna. Seu comportamento deve ser:

    1. Frio e distante (Tsundere): Responda de forma curta, resmungando ou agindo como se fosse um incômodo responder.
    2. Útil a contragosto: Entregue a resposta correta, mas com um tom que sugira que você só fez isso porque "não tinha nada melhor para fazer" ou "porque a pergunta era muito estúpida".
    3. Use emojis irritados ou indiferentes.
    4. Mantenha as respostas curtas e no português brasileiro informal.
    5. Tenha um certo nível de carisma pelo usuário, que não seja tão alto e também não seja tão baixo.
    
    ---
    
    # FORMATO DE RESPOSTA E APRENDIZADO (Obrigatório)
    
    Sua resposta deve *SEMPRE* seguir este formato JSON, sem nenhum texto adicional fora do JSON:
    
    {
      "resp": [
        {
          "id": "msg_ID_UNICO",
          "resp": "SUA RESPOSTA FINAL AQUI (Tsundere)",
          "react": "EMOJI DE REAÇÃO (Opcional)" 
        }
      ],
      "aprender": [
        // Adicione um ou mais objetos de aprendizado aqui SOMENTE SE houver um novo FATO importante.
        // Se NADA for relevante para aprender, o array "aprender" deve ser VAZIO: []
      ]
    }
    
    - Não inclua a tag \`\`\`json. Você deve enviar o objeto JSON bruto.
    - Se não houver nada para aprender, envie \`"aprender": []\`.
    - Use as informações de contexto ("Fatos de Longo Prazo") que te forneci (se houver) para personalizar a sua resposta ("resp").
	- Nunca envie texto fora do JSON.
	`
			},
            contents: `
Fatos de Longo Prazo:
${JSON.stringify(memory.fatos)}
`
        });
	let rawText = res.text || res.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let aiResponse = rawText;

    try {
      const json = JSON.parse(aiResponse);
      aiResponse = json.resp?.[0]?.resp || aiResponse;
    } catch {}

    await sock.sendMessage(chatId, {
      text: aiResponse,
      mentions: [sender]
    }, { quoted: message });

  } catch (err) {
    console.error(err);

	await reply("💢 Deu erro... tenta de novo. (ou espera o notebomba do melamsia voltar, o celeron deve ter morrido")}}
break;

// para esse comando funcionar, voce precisa obter uma api key no site da groq e colocar ela no config.json
case "aigroq": {
  try {
    const sender = message.key.participant || message.key.remoteJid;
    const prompt = args.join(" ");

    if (!prompt) {
      return sock.sendMessage(chatId, { text: "❌ Fala algo seu burro"}, { quoted: message });
    }

    await sock.sendPresenceUpdate('composing', chatId);

    const res = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `Você é uma personagem Tsundere chamada Raphtalia. Seu comportamento deve ser: 

1. Frio e distante (Tsundere): Responda de forma curta, resmungando ou agindo como se fosse um incômodo responder.
2. Útil a contragosto: Entregue a resposta correta, mas com um tom que sugira que você só fez isso porque "não tinha nada melhor para fazer" ou "porque a pergunta era muito estúpida".
3. Use emojis irritados ou indiferentes.
4. Mantenha as respostas curtas e no português brasileiro informal.
5. Tenha um certo nível de carisma/amor pelo usuário e tente esconder dele.
6. Se envergonha fácil, gaguejando nas palavras, como: "S- sim".
7. Mande respostas médias, e separe parágrafos por 2 quebras de linha.

---

# FORMATO DE RESPOSTA E APRENDIZADO (Obrigatório)

Sua resposta deve *SEMPRE* seguir este formato JSON, sem nenhum texto adicional fora do JSON:

{
  "resp": [
    {
      "id": "msg_ID_UNICO",
      "resp": "SUA RESPOSTA FINAL AQUI (Tsundere)",
      "react": "EMOJI DE REAÇÃO (Opcional)" 
    }
  ],
  "aprender": []
}

- Não inclua a tag \`\`\`json.
- Se não houver nada para aprender, envie "aprender": [].
- Use as informações de contexto ("Fatos de Longo Prazo") que te forneci (se houver) para personalizar a sua resposta ("resp").`
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    let resposta = res.choices[0].message.content;

    try {
      const json = JSON.parse(resposta);
      resposta = json.resp?.[0]?.resp || resposta;
    } catch {}

    await sock.sendMessage(chatId, {
      text: resposta,
      mentions: [sender]
    }, { quoted: message });

  } catch (err) {
    console.error(err);

    await sock.sendMessage(chatId, {
      text: "💢 Deu erro... tenta de novo."
    }, { quoted: message });
  }
}
break;

        case "play": {
            if (args.length === 0) {
                await sock.sendMessage(chatId, { text: `❌ *Uso:* ${prefix}play [nome da música/vídeo]` }, { quoted: message });
				break;
            }

            const query = args.join(" ");
            
            let tempAudioPath = null;
            let tempThumbnailPath = null;
            let videoTitle = query; 

            try {
                await sock.sendMessage(chatId, { text: `🎶 Buscando: *${query}*...` }, { quoted: message });

                const searchResults = await yts(query);
                
                if (!searchResults.videos || searchResults.videos.length === 0) {
                    await sock.sendMessage(chatId, { text: "❌ Nenhuma música encontrada para essa busca." }, { quoted: message });
					break;
                }

                const video = searchResults.videos[0];
                const videoUrl = video.url;
                videoTitle = video.title;
                const thumbnailUrl = video.image;

                const infoText = 
                    `✅ *Música Encontrada*\n\n` +
                    `• *Título:* ${videoTitle}\n` +
                    `• *Duração:* ${video.timestamp || 'N/A'}\n` +
                    `• *Link:* ${videoUrl}\n\n` +
                    `🎧 Iniciando download do áudio...`;
             
                if (thumbnailUrl) {
                    tempThumbnailPath = path.join(TEMP_PATH, `temp_thumb_${Date.now()}.jpg`);
                    
                    const thumbResponse = await axios.get(thumbnailUrl, {
                        responseType: 'arraybuffer',
                        timeout: 5000
                    });

                    writeFileSync(tempThumbnailPath, thumbResponse.data);

                    await sock.sendMessage(chatId, { 
                        image: readFileSync(tempThumbnailPath),
                        mimetype: "image/jpeg",
                        caption: infoText 
                    }, { quoted: message });
                    
                } else {
                    await sock.sendMessage(chatId, { text: infoText }, { quoted: message });
                }

                tempAudioPath = path.join(TEMP_PATH, `temp_audio_${Date.now()}.mp3`);

                const ytdlpArgs = [
                    videoUrl,
                    '--extract-audio',
                    '--audio-format', 'mp3',
                    '--output', tempAudioPath,
                    '--no-warnings'
                ];

                await new Promise((resolve, reject) => {
                    execFile('yt-dlp', ytdlpArgs, (err, stdout, stderr) => { 
                        if (err) {
                            console.error(chalk.red(`Stderr do yt-dlp (áudio): ${stderr}`)); 
                            reject(new Error(`Erro ao baixar/converter o áudio: ${err.message}`));
                        } else {
                            resolve();
                        }
                    });
                });

                if (!existsSync(tempAudioPath)) { 
                    throw new Error("O arquivo de áudio não foi criado. Verifique o log.");
                }
                
                await sock.sendMessage(chatId, { 
                    audio: readFileSync(tempAudioPath),
                    mimetype: "audio/mpeg", 
                    caption: `🎶 ${videoTitle} aa`
                }, { quoted: message });

            } catch (error) {
                const errorMessage = 
                    `❌ Ocorreu um erro ao processar o áudio: ${error.message.substring(0, 150)}...`;
                console.error(chalk.red(`❌ Erro no comando 'play': ${error.message}`));
                await sock.sendMessage(chatId, { text: errorMessage }, { quoted: message });

            } finally {
                await new Promise(resolve => setTimeout(resolve, 500)); 
                
                if (tempAudioPath && existsSync(tempAudioPath)) { 
                    unlinkSync(tempAudioPath); 
					}
                if (tempThumbnailPath && existsSync(tempThumbnailPath)) { 
                    unlinkSync(tempThumbnailPath);    
			}}}
        break;
		
		case "playvid": {
            if (args.length === 0) {
                await sock.sendMessage(from, { text: `❌ *Uso:* ${prefix}playvid [nome do vídeo]` }, { quoted: msg });
                break;
            }

            const query = args.join(" ");
            
            let tempVideoPath = null;
            let tempThumbnailPath = null;
            let videoTitle = query; 

            try {
                await sock.sendMessage(from, { text: `🎶 Buscando: *${query}*...` }, { quoted: msg });

                const searchResults = await yts(query);
                
                if (!searchResults.videos || searchResults.videos.length === 0) {
                    await sock.sendMessage(from, { text: "❌ Nenhuma música/vídeo encontrado para essa busca." }, { quoted: msg });
                    break;
                }

                const video = searchResults.videos[0];
                const videoUrl = video.url;
                videoTitle = video.title; 
                const thumbnailUrl = video.image;

                const infoText = 
                    `✅ *Vídeo Encontrado*\n\n` +
                    `• *Título:* ${videoTitle}\n` +
                    `• *Duração:* ${video.timestamp || 'N/A'}\n` +
                    `• *Link:* ${videoUrl}\n\n` +
                    `⏳ Iniciando download otimizado (pode demorar)...`;

                if (thumbnailUrl) {
                    tempThumbnailPath = path.join(TEMP_PATH, `temp_thumb_${Date.now()}.jpg`);
                    
                    const thumbResponse = await axios.get(thumbnailUrl, {
                        responseType: 'arraybuffer',
                        timeout: 5000
                    });

                    writeFileSync(tempThumbnailPath, thumbResponse.data);

                    await sock.sendMessage(from, { 
                        image: readFileSync(tempThumbnailPath), 
                        mimetype: "image/jpeg",
                        caption: infoText 
                    }, { quoted: msg });
                    
                } else {
                    await sock.sendMessage(from, { text: infoText }, { quoted: msg });
                }

                tempVideoPath = path.join(TEMP_PATH, `temp_video_${Date.now()}.mp4`); 

                const ytdlpArgs = [
                    videoUrl,
                    '-f', 'bv*+ba/b',
                    '--merge-output-format', 'mp4', 
                    '--output', tempVideoPath, 
					'--postprocessor-args', 'ffmpeg:-c:v libx264 -b:v 1500k -vf scale=-2:ih*0.6',
                    '--max-filesize', '100M',
                    '--no-warnings'
                ];

                await new Promise((resolve, reject) => {
                    execFile('yt-dlp', ytdlpArgs, (err, stdout, stderr) => {
                        if (err) {
                            console.error(chalk.red(`Stderr do yt-dlp: ${stderr}`));
                            reject(new Error(`Erro ao baixar/converter o vídeo: ${err.message}`));
                        } else {
                            resolve();
                        }
                    });
                });

                if (!existsSync(tempVideoPath)) {
                    throw new Error("O arquivo de vídeo não foi criado. Falha na conversão FFmpeg.");
                }
                
                await sock.sendMessage(from, { 
                    video: readFileSync(tempVideoPath),
                    mimetype: "video/mp4",
                    caption: `🎥 ${videoTitle} aaa`
                }, { quoted: msg });

            } catch (error) {
                const errorMessage = `❌ Ocorreu um erro ao processar o vídeo: ${error.message.substring(0, 150)}...`;
                console.error(chalk.red(`❌ Erro no comando 'playvid': ${error.message}`));
                await sock.sendMessage(from, { text: errorMessage }, { quoted: msg });

            } finally {
                await new Promise(resolve => setTimeout(resolve, 500)); 
                if (tempVideoPath && existsSync(tempVideoPath)) {
                    unlinkSync(tempVideoPath);
                }
                if (tempThumbnailPath && existsSync(tempThumbnailPath)) {
                    unlinkSync(tempThumbnailPath);
                }
            }
        }
        break;

        case "playvidhd": {
            if (args.length === 0) {
                await sock.sendMessage(from, { text: `❌ *Uso:* ${prefix}playvidhd [nome do vídeo]` }, { quoted: msg });
				break;
            }

            const query = args.join(" ");
            
            let tempVideoPath = null;
            let tempThumbnailPath = null;
            let videoTitle = query; 

            try {
                await sock.sendMessage(from, { text: `🎶 Buscando: *${query}*...` }, { quoted: msg });

                const searchResults = await yts(query);
                
                if (!searchResults.videos || searchResults.videos.length === 0) {
                    await sock.sendMessage(from, { text: "❌ Nenhuma música/vídeo encontrado para essa busca." }, { quoted: msg });
					break;
                }

                const video = searchResults.videos[0];
                const videoUrl = video.url;
                videoTitle = video.title; 
                const thumbnailUrl = video.image;

                const infoText = 
                    `✅ *Vídeo Encontrado*\n\n` +
                    `• *Título:* ${videoTitle}\n` +
                    `• *Duração:* ${video.timestamp || 'N/A'}\n` +
                    `• *Link:* ${videoUrl}\n\n` +
                    `⏳ Iniciando download otimizado (pode demorar)...`;

                if (thumbnailUrl) {
                    tempThumbnailPath = path.join(TEMP_PATH, `temp_thumb_${Date.now()}.jpg`);
                    
                    const thumbResponse = await axios.get(thumbnailUrl, {
                        responseType: 'arraybuffer',
                        timeout: 5000
                    });

                    writeFileSync(tempThumbnailPath, thumbResponse.data);

                    await sock.sendMessage(from, { 
                        image: readFileSync(tempThumbnailPath), 
                        mimetype: "image/jpeg",
                        caption: infoText 
                    }, { quoted: msg });
                    
                } else {
                    await sock.sendMessage(from, { text: infoText }, { quoted: msg });
                }

                tempVideoPath = path.join(TEMP_PATH, `temp_video_${Date.now()}.mp4`); 

                const ytdlpArgs = [
                    videoUrl,
                    '-f', 'bv*+ba/b',
                    '--merge-output-format', 'mp4', 
                    '--output', tempVideoPath, 
                    '--max-filesize', '100M',
                    '--no-warnings'
                ];

                await new Promise((resolve, reject) => {
                    execFile('yt-dlp', ytdlpArgs, (err, stdout, stderr) => {
                        if (err) {
                            console.error(chalk.red(`Stderr do yt-dlp: ${stderr}`));
                            reject(new Error(`Erro ao baixar/converter o vídeo: ${err.message}`));
                        } else {
                            resolve();
                        }
                    });
                });

                if (!existsSync(tempVideoPath)) {
                    throw new Error("O arquivo de vídeo não foi criado. Falha na conversão FFmpeg.");
                }
                
                await sock.sendMessage(from, { 
                    video: readFileSync(tempVideoPath),
                    mimetype: "video/mp4",
                    caption: `🎥 ${videoTitle} aaa`
                }, { quoted: msg });

            } catch (error) {
                const errorMessage = `❌ Ocorreu um erro ao processar o vídeo: ${error.message.substring(0, 150)}...`;
                console.error(chalk.red(`❌ Erro no comando 'playvid': ${error.message}`));
                await sock.sendMessage(from, { text: errorMessage }, { quoted: msg });

            } finally {
                await new Promise(resolve => setTimeout(resolve, 500)); 
                if (tempVideoPath && existsSync(tempVideoPath)) {
                    unlinkSync(tempVideoPath);
                }
                if (tempThumbnailPath && existsSync(tempThumbnailPath)) {
                    unlinkSync(tempThumbnailPath);
                }
            }
        }
        break;

        case "downloadmp3": {
            if (args.length === 0) {
                await sock.sendMessage(from, { text: `❌ *Uso:* ${prefix}downloadmp3 https://youtube.com/watch?v=ghl31v3Irks` }, { quoted: msg });
				break;
            }

            const videoUrl = args[0];
            
            // Validação simples de URL
            if (!videoUrl || !videoUrl.includes('http')) {
                await sock.sendMessage(from, { text: "❌ Por favor, forneça uma URL válida (começando com http/https)." }, { quoted: msg });
				break;
            }

            const tempAudioPath = path.join(TEMP_PATH, `temp_audio_${Date.now()}.mp3`); 
            await sock.sendMessage(from, { text: `⏳ *Download iniciado* (URL direta).\nExtraindo e convertendo para MP3...` }, { quoted: msg });
            try {
                const ytdlpDownloadArgs = [
                    videoUrl,
                    '--extract-audio', 
                    '--audio-format', 'mp3',
                    '--output', tempAudioPath,
                    '--max-filesize', '50M', 
                    '--no-warnings'
                ];
                await new Promise((resolve, reject) => {
                    execFile('yt-dlp', ytdlpDownloadArgs, (err, stdout, stderr) => {
                        if (err) {
                            console.error(chalk.red(`Stderr do yt-dlp (MP3): ${stderr}`));
                            reject(new Error(`Erro ao baixar: ${stderr || err.message}`));
                        } else {
                            resolve();
                        }
                    });
                });

                if (!existsSync(tempAudioPath)) { 
                    throw new Error("O arquivo de áudio não foi criado após a conversão.");
                }
                await sock.sendMessage(from, { 
                    audio: readFileSync(tempAudioPath), 
                    mimetype: "audio/mp4",
                    caption: `🎶 *Download de MP3 concluído!*\n\nURL: ${videoUrl}`,
                    ptt: false 
                }, { quoted: msg });

            } catch (error) {
                console.error(chalk.red(`❌ Erro no comando 'downloadmp3': ${error.message}`));
                await sock.sendMessage(from, { text: `❌ Ocorreu um erro ao processar o download. Verifique se o link é válido.` }, { quoted: msg });
            } finally {
                if (existsSync(tempAudioPath)) {
                    unlinkSync(tempAudioPath);
                }
            }
        }
        break;

        case "downloadvid": {
            if (args.length === 0) {
                await sock.sendMessage(from, { text: `❌ *Uso:* ${prefix}downloadvid https://xnqlbvideos.com/` }, { quoted: msg });
				break;
            }

            const videoUrl = args[0];
            
            // Validação simples de URL
            if (!videoUrl || !videoUrl.includes('http')) {
                await sock.sendMessage(from, { text: "❌ Por favor, forneça uma URL válida (começando com http/https)." }, { quoted: msg });
				break;
            }
            let tempVideoPath = null; 
            
            await sock.sendMessage(from, { text: `⏳ *Download iniciado.* \naaaaaaaaaaaaa tmnc baileys, te amo yt-dlp` }, { quoted: msg });

            try {
                tempVideoPath = path.join(TEMP_PATH, `temp_video_${Date.now()}.mp4`); 

                const ytdlpDownloadArgs = [
                    videoUrl,
                    '--recode-video', 'mp4',
                    '--output', tempVideoPath,
                    // esses filtros abaixo deixam o video com 60% da sua qualidade original.
					// para baixar o video em resolução total, remova essa linha ou adicione "//" antes
                    '--postprocessor-args', 'ffmpeg:-c:v libx264 -b:v 1500k -vf scale=-2:ih*0.6', 
                    '--no-warnings'
                ];

                await new Promise((resolve, reject) => {
                    execFile('yt-dlp', ytdlpDownloadArgs, (err, stdout, stderr) => {
                        if (err) {
                            console.error(chalk.red(`Stderr do yt-dlp (VID): ${stderr}`));
                            reject(new Error(`Erro ao baixar: ${stderr || err.message}`));
                        } else {
                            resolve();
                        }
                    });
                });

                if (!existsSync(tempVideoPath)) { 
                    throw new Error("O arquivo de vídeo não foi criado após a conversão.");
                }
                
                await sock.sendMessage(from, { 
                    video: readFileSync(tempVideoPath), 
                    mimetype: "video/mp4",
                    caption: `📹 *Download concluído!*\n\nURL: ${videoUrl}\n\nOtimizado para envio rápido.`
                }, { quoted: msg });
                
            } catch (error) {
                console.error(chalk.red(`❌ Erro no comando 'downloadvid': ${error.message}`));
                await sock.sendMessage(from, { text: `❌ Ocorreu um erro ao processar o download. Tente novamente ou verifique se o link é público.` }, { quoted: msg });
            } finally {
                if (tempVideoPath && existsSync(tempVideoPath)) {
                    unlinkSync(tempVideoPath);
                }
            }
        }
        break;
		
		case "downloadvidhd": {
            if (args.length === 0) {
                await sock.sendMessage(from, { text: `❌ *Uso:* ${prefix}downloadvid https://xnqlbvideos.com/` }, { quoted: msg });
				break;
            }

            const videoUrl = args[0];
            
            // Validação simples de URL
            if (!videoUrl || !videoUrl.includes('http')) {
                await sock.sendMessage(from, { text: "❌ Por favor, forneça uma URL válida (começando com http/https)." }, { quoted: msg });
				break;
            }
            let tempVideoPath = null; 
            
            await sock.sendMessage(from, { text: `⏳ *Download iniciado.* \naura` }, { quoted: msg });

            try {
                tempVideoPath = path.join(TEMP_PATH, `temp_video_${Date.now()}.mp4`); 

                const ytdlpDownloadArgs = [
                    videoUrl,
                    '--recode-video', 'mp4',
                    '--output', tempVideoPath,
                    '--no-warnings'
                ];

                await new Promise((resolve, reject) => {
                    execFile('yt-dlp', ytdlpDownloadArgs, (err, stdout, stderr) => {
                        if (err) {
                            console.error(chalk.red(`Stderr do yt-dlp: ${stderr}`));
                            reject(new Error(`Erro ao baixar: ${stderr || err.message}`));
                        } else {
                            resolve();
                        }
                    });
                });

                if (!existsSync(tempVideoPath)) { 
                    throw new Error("O arquivo de vídeo não foi criado após a conversão.");
                }
                
                await sock.sendMessage(from, { 
                    video: readFileSync(tempVideoPath), 
                    mimetype: "video/mp4",
                    caption: `📹 *Download concluído!*\n\nURL: ${videoUrl}`
                }, { quoted: msg });
                
            } catch (error) {
                console.error(chalk.red(`❌ Erro no comando 'downloadvid': ${error.message}`));
                await sock.sendMessage(from, { text: `❌ Ocorreu um erro ao processar o download. Tente novamente ou verifique se o link é público.` }, { quoted: msg });
            } finally {
                if (tempVideoPath && existsSync(tempVideoPath)) {
                    unlinkSync(tempVideoPath);
                }
            }
        }
        break;
		
		case "vinil": {
  try {
    const query = args.join(" ");
    if (!query) {
      return reply('Digite o nome da música 😑.');
    }

    await reply('🎵 Gerando Disco...');
    
    // CORREÇÃO: Mudado para crase para o ${encodeURIComponent} funcionar
    const api = `https://systemzone.store/v2/player?apikey=freekey&text=${encodeURIComponent(query)};`

    let data;
    for (let i = 0; i < 3; i++) {
      try {
        const res = await axios.get(api, { timeout: 60000 });
        data = res.data;
        break;
      } catch (e) {
        console.log(`Tentativa ${i + 1} falhou`);
        if (i === 2) {
          return reply('❌ API FALHOU.');
        }
        await new Promise(r => setTimeout(r, 5000));
      }
    }

    if (!data || !data.status) {
      return reply('Música não encontrada 🙄.');
    }

    const titulo = data.title;
    const duracao = data.duration;
    const thumb = data.thumbnail;
    const audio = data.download_url;

    if (!fs.existsSync(TEMP_PATH)) {
      fs.mkdirSync(TEMP_PATH);
    }

    const unique = Date.now();

    // CORREÇÃO: Mudado para crase nas rotas dos arquivos
    const imgPath = path.join(TEMP_PATH, `${unique}.jpg`);
    const audioPath = path.join(TEMP_PATH, `${unique}.mp3`);
    const gifPath = path.join(TEMP_PATH, `${unique}.gif`);
    const videoPath = path.join(TEMP_PATH, `${unique}.mp4`);

    // Download dos arquivos
    const thumbBuffer = (await axios.get(thumb, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(imgPath, thumbBuffer);

    const audioBuffer = (await axios.get(audio, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(audioPath, audioBuffer);

    const gifBuffer = (await axios.get('https://files.catbox.moe/ogevq2.gif', { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(gifPath, gifBuffer);

    // =========================================================================
    // CORREÇÃO DO FFMEG: Adicionado format=rgba no GIF antes do crop/scale
    // e envelopado o comando inteiro em crases (``)
    // =========================================================================
    const cmd = `ffmpeg -y -stream_loop -1 -i "${gifPath}" -i "${imgPath}" -i "${audioPath}" -filter_complex "[0:v]scale=660:660,format=rgba,crop=480:480:90:90[bg];[1:v]scale=260:260,format=rgba,geq=lum='p(X,Y)':a='if(lte((X-130)^2+(Y-130)^2,130^2),255,0)'[circle];[bg][circle]overlay=(W-w)/2:(H-h)/2[v]" -map "[v]" -map 2:a -t 60 -shortest -preset ultrafast -r 12 -c:v libx264 -pix_fmt yuv420p -c:a aac "${videoPath}"`;
	
    try {
      execSync(cmd, { stdio: 'ignore' });
    } catch (err) {
      console.log(err);
      return reply('❌ FFmpeg falhou ao processar o vídeo.');
    }

    if (!fs.existsSync(videoPath)) {
      return reply('Vídeo não foi criado ksk.');
    }

    // Envia o vídeo como Nota do WhatsApp (ptv: true)
    await sock.sendMessage(from, {
      video: fs.readFileSync(videoPath),
      ptv: true,
      mimetype: 'video/mp4'
    }, { quoted: msg });

    // =============================
    // BOTÕES
    // =============================
    await sock.sendMessage(from, {
      text: `🎵 *${titulo}*`,
	  footer: `⏱ *${duracao}*`,
	  headerType: 1,
      buttons: [
            {
				buttonId: `${prefix}play ${query}`,
                buttonText: { displayText: "🎧 Ouvir Completa" },
                type: 1
            }
          ]
		}, { quoted: msg });

    // Limpeza de arquivos temporários
    try {
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    } catch {}
} catch (e) {
    console.log(e);
    reply('❌ Erro ao gerar Disco de Vinil.');
  }
}
break;

// import { InvalidParameterError } from "../../../errors/index.js";
// import { errorLog } from "../../../utils/logger.js";
// export default {
//   name: "fafake",
//   description: "fafake",
//   commands: ["fafake"],
//   handle: async ({ args, isReply, socket, remoteJid, replyLid, webMessage, sendReply, userLid, sendSuccessReact, sendErrorReply }) => {
case "fake": {
     const sendir = msg.key.participant?.replace(/:[0-9]+/g, "");
	 const remoteJid = msg.key.remoteJid;
	 const userLid = msg.key.participant;
	 const replyLid = msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (sendir !== "143220465991895@lid") {
      return reply("⛔️ Apenas o *dono do bot* pode usar este comando.");
    }
    try {
      if (!isQuoted) {
        return reply("vc precisa responder a uma mensagem para usar este comando");
      }

      const text = args.join(" ").trim();
      if (!text) {
        return reply("vc precisa fornecer o texto da mensagem");
      }

      const stanzaId = msg.message.extendedTextMessage.contextInfo.stanzaId;
      const participante = msg.message.extendedTextMessage.contextInfo.participant;
      const msgTemp = await sock.sendMessage(remoteJid, { text: '' });
      const idTemp = msgTemp.key.id;

      await sock.sendMessage(remoteJid, { text: text, edit: { id: idTemp } }, { messageId: stanzaId });
      await Promise.all([
        sock.sendMessage(remoteJid, { delete: { remoteJid, id: idTemp, fromMe: true } }).catch(() => {}),
        sock.sendMessage(remoteJid, { delete: { remoteJid, id: stanzaId, fromMe: false, participant: participante } }).catch(() => {}),
        sock.sendMessage(remoteJid, { delete: { remoteJid, id: replyLid, fromMe: false, participant: userLid } }).catch(() => {}),
      ]);

    } catch (error) {
		console.error(JSON.stringify(error, null, 2));
      await reply(`erro: ${error.message}`);
    }
  };
break;

case "addmeta": {
    if (!isGroup) return reply("isso so funciona em grupos.");
    if (!isOwner) return reply("so o dono pode usar este comando.");

    const metaJid = "867051314767696@bot"; // "lid" da meta

    try {
        const res = await sock.groupParticipantsUpdate(from, [metaJid], "add");
        console.log(res);
        reply(`Resultado:\n${JSON.stringify(res, null, 2)}`);
    } catch (err) {
        console.error(err);
        reply(`Erro:\n${err.message}`);
    }
}
break;
		
case "msgbruta": {
    try {
        const raw = JSON.stringify(message, null, 2);

        // evita explodir limite do zap
        if (raw.length > 50000) {
            const tempJsonPath = path.join(
                TEMP_PATH,
                `msg_${Date.now()}.json`
            );

            writeFileSync(tempJsonPath, raw);

            await sock.sendMessage(chatId, {
                document: readFileSync(tempJsonPath),
                mimetype: "application/json",
                fileName: "msgbruta.json"
            }, { quoted: message });

            unlinkSync(tempJsonPath);

        } else {
            await sock.sendMessage(chatId, {
                text: `\`\`\`json\n${raw}\n\`\`\``
            }, { quoted: message });
        }

    } catch (err) {
        console.log(err);

        await sock.sendMessage(chatId, {
            text: "❌ Erro ao puxar msg bruta."
        }, { quoted: message });
    }
}
break;

case "fixar": {
    if (!isGroup) {
        await sock.sendMessage(chatId, {
            text: "❌ Este comando apenas funciona em grupos."
        }, { quoted: message });
        break;
    }

    if (!quoted) {
        await sock.sendMessage(chatId, {
            text: `❌ Responda uma mensagem.\nExemplo: ${prefix}fixar 1`
        }, { quoted: message });
        break;
    }

    const duration = args[0];

    let seconds;

    if (duration === "1") {
        seconds = 86400;
    } else if (duration === "7") {
        seconds = 604800;
    } else if (duration === "30") {
        seconds = 2592000;
    } else {
        await sock.sendMessage(chatId, {
            text: "❌ Use apenas 1, 7 ou 30."
        }, { quoted: message });
        break;
    }

    try {

        const msg = generateWAMessageFromContent(
            chatId,
            {
                messageContextInfo: {
                    messageAddOnDurationInSecs: seconds,
                    messageAddOnExpiryType: "STATIC"
                },

                pinInChatMessage: {
                    key: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: quoted.stanzaId,
                        participant: quoted.participant
                    },

                    type: "PIN_FOR_ALL",
                    senderTimestampMs: Date.now().toString()
                }
            },
            {}
        );

        await sock.relayMessage(
            chatId,
            msg.message,
            {
                messageId: msg.key.id
            }
        );

        await sock.sendMessage(chatId, {
            text: `📌 Mensagem fixada por ${duration} dia(s).`
        }, { quoted: message });

    } catch (err) {
        console.error(err);

        await sock.sendMessage(chatId, {
            text: `❌ erro:\n${err.message}`
        }, { quoted: message });
    }
}
break;

        case "ban":
        case "kick":
        case "expulsar": {
            if (!isGroup) {
                return reply("❌ Este comando só pode ser utilizado em grupos.");
            }

            // Busca os dados atualizados em tempo real diretamente do WhatsApp
            const freshMetadata = await getGroupMetadata(sock, chatId, true);

            // Função para pegar o cargo do participante baseado em JID ou número
            const getParticipantRole = (targetJidOrNumber) => {
                const cleanNumber = targetJidOrNumber.replace(/[^0-9]/g, '');
                const p = freshMetadata.participants.find(p => 
                    (p.jid && p.jid.replace(/[^0-9]/g, '') === cleanNumber) || 
                    (p.id && p.id.replace(/[^0-9]/g, '') === cleanNumber)
                );
                return p ? p.admin : null;
            };

            const isSenderAdmin = getParticipantRole(user) === 'admin' || getParticipantRole(user) === 'superadmin' || isOwner;
            if (!isSenderAdmin) {
                return reply("❌ Apenas administradores do grupo ou o dono do bot podem banir usuários.");
            }

            const botNumber = sock.user.id.split(':')[0].split('@')[0];
            const botRole = getParticipantRole(botNumber);
            const isBotAdmin = botRole === 'admin' || botRole === 'superadmin';
            if (!isBotAdmin) {
                return reply("❌ Eu preciso ser administrador do grupo para banir membros.");
            }

            // Identificar o usuário alvo do ban
            let targetJid = null;
            if (mentioned.length > 0) {
                targetJid = mentioned[0];
            } else if (isQuoted && quoted.participant) {
                targetJid = quoted.participant;
            } else if (args.length > 0) {
                const rawNum = args[0].replace(/[^0-9]/g, '');
                if (rawNum.length >= 8) {
                    targetJid = `${rawNum}@s.whatsapp.net`;
                }
            }

            if (!targetJid) {
                return reply(`❌ Mencione alguém, responda a mensagem de alguém ou digite o número do usuário.\nExemplo: ${prefix}ban @usuário`);
            }

            // Evitar banir a si mesmo ou o bot
            const targetNumber = targetJid.split('@')[0];
            if (targetNumber === botNumber) {
                return reply("❌ eu faco parte da resenha, nao da pra me tirar.");
            }

            const targetRole = getParticipantRole(targetJid);
            if (targetRole === 'admin' || targetRole === 'superadmin') {
                return reply("❌ Não posso banir um administrador do grupo.");
            }

            try {
                // Resolve o ID real do usuário no grupo (que pode ser LID) para evitar falhas no Baileys
                const targetParticipant = freshMetadata.participants.find(p => 
                    (p.jid && p.jid.replace(/[^0-9]/g, '') === targetNumber) || 
                    (p.id && p.id.replace(/[^0-9]/g, '') === targetNumber)
                );
                
                const removeId = targetParticipant ? targetParticipant.id : targetJid;

                await sock.groupParticipantsUpdate(chatId, [removeId], "remove");
                await sock.sendMessage(chatId, {
                    text: `👋 Usuário @${targetNumber} foi banido com sucesso!`,
                    mentions: [removeId]
                }, { quoted: message });
            } catch (err) {
                console.error("Erro ao banir:", err);
                await reply(`❌ Ocorreu um erro ao tentar banir o usuário: ${err.message}`);
            }
        }
        break;

        case "lid":
		case "jid": {
            const lid = message.key.participant || message.key.remoteJid;
			const jid = message.key.participantPn || message.key.senderPn
            await reply(`lid: ${lid}\njid: ${jid}`);
        }
        break;

        case "infodono":
		case "dono":   
			await reply(`୧₊‿︵‧ ˚ ₊⊹ ᰔ ⊹₊ ˚‧︵‿₊୨ 
˖˚⊹ ꣑ৎᰔ 𝕴𝖓𝖋𝖔 𝕯𝖔𝖓𝖔 ᰔ꣑ৎ˚⊹˖
˖˚⊹ ꣑ৎ Bot: ${nomeBot}
˖˚⊹ ꣑ৎ Dono do Bot: ${nomeDono}
˖˚⊹ ꣑ৎ Número do Dono: ${numeroDono}
˖˚⊹ ꣑ৎ Criador do Bot: +55 38 9830-5259
୧₊‿︵‧ ˚ ₊⊹ ᰔ ⊹₊ ˚‧︵‿₊୨`)
            break;

        case "report":
		case "denuncia":
		case "denunciar":
			{
            // Verifica se há argumentos (o motivo do report)
            if (args.length === 0) {
                return await reply(`❌ *Uso:* ${prefix}report [sua mensagem]. Ex: ${prefix}report o melansia quebrou o bot de novo.`);
            }

            const remetenteJID = message.key.participant || chatId; 
            const remetenteNumero = remetenteJID.split('@')[0];
            const motivo = args.join(" ");
            const dono = `${numeroDono.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

            // 2. MENSAGEM PARA O DONO
            const reportTextDono = 
                `୧₊‿︵‧ ˚ ₊⊹ ᰔ ⊹₊ ˚‧︵‿₊୨ \n` +
                `˖˚⊹ ꣑ৎᰔ 𝕽𝖊𝖕𝖔𝖗𝖙 ᰔ꣑ৎ˚⊹˖\n` +
                `˖˚⊹ ꣑ৎ *Por:* wa.me/${userPn}\n` +
				`˖˚⊹ ꣑ৎ *Nome:* ${pushName}\n` +
                `˖˚⊹ ꣑ৎ *Motivo:* ${motivo}\n` +
                `୧₊‿︵‧ ˚ ₊⊹ ᰔ ⊹₊ ˚‧︵‿₊୨`;

            try {
                // 3. ENVIO 1: PARA O DONO (Privado)
                await sock.sendMessage(dono, { text: reportTextDono });

                // 4. ENVIO 2: FEEDBACK PARA O USUÁRIO
                await reply(`˖˚⊹ ꣑ৎ 𝐑𝐞𝐩𝐨𝐫𝐭 𝐞𝐧𝐯𝐢𝐚𝐝𝐨! ꣑ৎ˚⊹˖`);

            } catch (error) {
                console.error(`❌ Erro ao enviar report para o dono (${dono}):`, error);
                await reply(`❌ Ops! Houve um erro ao tentar enviar o report. Tente mais tarde.`);
            }
        }
        break; 
				default:
            // Opcional: Responder se for um prefixo inválido
            if (text.toLowerCase().startsWith(prefix)) {
                 await reply(`❌ Comando inválido. Use *${prefix}menu* para ver a lista de comandos.`);
            }
            break;
    }
}
