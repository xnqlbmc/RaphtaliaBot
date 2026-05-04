// by xnqlb
import { downloadMediaMessage, generateWAMessageFromContent, prepareWAMessageMedia } from '@whiskeysockets/baileys';
import { createWriteStream, unlinkSync, readFileSync, existsSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { exec as execCallback, execFile } from 'child_process';
import { promisify } from 'util'; 
import { CONFIG } from './connect.js';
import yts from 'yt-search'; 
import axios from 'axios'; 
import path from 'path'; 
import chalk from 'chalk'; 
import fetch from 'node-fetch';
import JSZip from "jszip";
import Groq from "groq-sdk";

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exec = promisify(execCallback);

// Função principal que recebe o objeto de conexão (sock) e as mensagens (m)
export default async function processMessages(sock, m) {
    const prefix = CONFIG.prefixo;
    const nomeBot = CONFIG.nome_bot;
    const nomeDono = CONFIG.nome_dono;
    const numeroDono = CONFIG.numero_dono;
	const GROQ_API_KEY = CONFIG.GROQ_API_KEY;
    
    // 1. Validação e extração de dados da mensagem
    if (!m.messages || m.type !== 'notify') return;
    
    const message = m.messages[0];
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
	const msg = message;
	const user = msg.key.participant || msg.key.remoteJid
	const isGroup = chatId.endsWith("@g.us");
	const pushName = message.pushName;
	const groupMetadata = isGroup
    ? await sock.groupMetadata(chatId)
    : null;

	const groupName = groupMetadata?.subject;
	const isPrivate = !chatId.endsWith("@g.us");
	
const quoted = msg.message?.extendedTextMessage?.contextInfo;
const isQuoted = !!quoted;
const mediaMsg = isQuoted ? isQuoted.quotedMessage : msg.message;

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

// 2. args: O restante da query (ex: "the blessing yoasobi")
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

    // --- SISTEMA DE COMANDOS: switch/case ---

    switch (commandText) {
        
        case "menu":
        case "ajuda":
            const menuImageUrl = 'https://files.catbox.moe/idon0h.jpg';
            const tempMenuPath = path.join(__dirname, `temp_menu_${Date.now()}.png`);
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
˖˚⊹ ꣑ৎ *${prefix}crunchyroll email:senha*
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
  await sock.sendMessage(chatId, { text: "⏳ Calculando latência..." }, { quoted: message });

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

// para esse comando funcionar, voce precisa obter uma api key no site da groq e colocar ela no config.json
case "ai": {
  try {
    const sender = message.key.participant || message.key.remoteJid;
    const prompt = args.join(" ");

    if (!prompt) {
      return sock.sendMessage(chatId, {
        text: "❌ Fala algo seu burro da porra, sou aurudinha e tumtum sarrur i💀🩷❌sjfuihjadsu8jhtg89se o xnqlb/melansia e um viado inutil do carai e nao era pra voce ta leno isso carainho🧱"
      }, { quoted: message });
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

    let reply = res.choices[0].message.content;

    try {
      const json = JSON.parse(reply);
      reply = json.resp?.[0]?.resp || reply;
    } catch {}

    await sock.sendMessage(chatId, {
      text: reply,
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
                    tempThumbnailPath = path.join(__dirname, `temp_thumb_${Date.now()}.jpg`);
                    
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

                tempAudioPath = path.join(__dirname, `temp_audio_${Date.now()}.mp3`);

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
                    mimetype: "audio/mp4", 
                    caption: `🎶 ${videoTitle} (Download Concluído)`
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
                }
            }
        }
        break;

        case "playvid": {
            if (args.length === 0) {
                await sock.sendMessage(from, { text: `❌ *Uso:* ${prefix}playvid [nome do vídeo]` }, { quoted: msg });
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
                    tempThumbnailPath = path.join(__dirname, `temp_thumb_${Date.now()}.jpg`);
                    
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

                tempVideoPath = path.join(__dirname, `temp_video_${Date.now()}.mp4`); 

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
                    caption: `🎥 ${videoTitle} (Download Concluído)`
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
                await sock.sendMessage(from, { text: `❌ *Uso:* ${prefix}downloadmp3 https://www.youtube.com/music?app=desktop&gl=BR&hl=pt` }, { quoted: msg });
            }

            const videoUrl = args[0];
            
            // Validação simples de URL
            if (!videoUrl || !videoUrl.includes('http')) {
                await sock.sendMessage(from, { text: "❌ Por favor, forneça uma URL válida (começando com http/https)." }, { quoted: msg });
            }

            const tempAudioPath = path.join(__dirname, `temp_audio_${Date.now()}.mp3`); 
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
            }

            const videoUrl = args[0];
            
            // Validação simples de URL
            if (!videoUrl || !videoUrl.includes('http')) {
                await sock.sendMessage(from, { text: "❌ Por favor, forneça uma URL válida (começando com http/https)." }, { quoted: msg });
            }
            let tempVideoPath = null; 
            
            await sock.sendMessage(from, { text: `⏳ *Download iniciado.* \naaaaaaaaaaaaa tmnc baileys, te amo yt-dlp` }, { quoted: msg });

            try {
                tempVideoPath = path.join(__dirname, `temp_video_${Date.now()}.mp4`); 

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

        case "infodono":

            const infoDonoText = 
                `୧₊‿︵‧ ˚ ₊⊹ ᰔ ⊹₊ ˚‧︵‿₊୨ \n` +
                `˖˚⊹ ꣑ৎᰔ 𝕴𝖓𝖋𝖔 𝕯𝖔𝖓𝖔 ᰔ꣑ৎ˚⊹˖\n` +
                `˖˚⊹ ꣑ৎ Bot: ${nomeBot}\n` +
                `˖˚⊹ ꣑ৎ Dono do Bot: ${nomeDono}\n` +
                `˖˚⊹ ꣑ৎ Número do Dono: ${numeroDono}\n` +
                `˖˚⊹ ꣑ৎ Criador do Bot: +55 38 9830-5259\n` +
                `୧₊‿︵‧ ˚ ₊⊹ ᰔ ⊹₊ ˚‧︵‿₊୨`;
            
            await sock.sendMessage(chatId, { text: infoDonoText }, { quoted: message });
            break;

            case "report": {
            // Verifica se há argumentos (o motivo do report)
            if (args.length === 0) {
                await sock.sendMessage(chatId, { text: `❌ *Uso:* ${prefix}report [sua mensagem]. Ex: ${prefix}report o melansia quebrou o bot de novo.` }, { quoted: message });
            }

            const remetenteJID = message.key.participant || chatId; 
            const remetenteNumero = remetenteJID.split('@')[0];
            const motivo = args.join(" ");
            const dono = `${numeroDono.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

            // 2. MENSAGEM PARA O DONO
            const reportTextDono = 
                `୧₊‿︵‧ ˚ ₊⊹ ᰔ ⊹₊ ˚‧︵‿₊୨ \n` +
                `˖˚⊹ ꣑ৎᰔ 𝕽𝖊𝖕𝖔𝖗𝖙 ᰔ꣑ৎ˚⊹˖\n` +
                `˖˚⊹ ꣑ৎ *Por:* wa.me/${remetenteNumero}\n` +
                `˖˚⊹ ꣑ৎ *Motivo:* ${motivo}\n` +
                `୧₊‿︵‧ ˚ ₊⊹ ᰔ ⊹₊ ˚‧︵‿₊୨`;

            try {
                // 3. ENVIO 1: PARA O DONO (Privado)
                await sock.sendMessage(dono, { text: reportTextDono });

                // 4. ENVIO 2: FEEDBACK PARA O USUÁRIO
                const feedbackText = `˖˚⊹ ꣑ৎ 𝐑𝐞𝐩𝐨𝐫𝐭 𝐞𝐧𝐯𝐢𝐚𝐝𝐨! ꣑ৎ˚⊹˖`;
                await sock.sendMessage(chatId, { text: feedbackText }, { quoted: message });

            } catch (error) {
                console.error(`❌ Erro ao enviar report para o dono (${dono}):`, error);
                await sock.sendMessage(chatId, { text: `❌ Ops! Houve um erro ao tentar enviar o report. Tente mais tarde.` }, { quoted: message });
            }
        }
        break; 
				default:
            // Opcional: Responder se for um prefixo inválido
            if (text.toLowerCase().startsWith(prefix)) {
                 await sock.sendMessage(chatId, { text: `❌ Comando inválido. Use *${prefix}menu* para ver a lista de comandos.` });
            }
            break;
    }
}
