// by xnqlb
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import processMessages from './commands.js';
import pino from 'pino';
import readline from 'readline/promises'; 
import { rmSync, readFileSync } from 'fs';
import cfonts from 'cfonts'; 
import qrcode from 'qrcode'; 

export const CONFIG = JSON.parse(readFileSync('./config.json', 'utf-8')); 

const colors = {
    LIGHT_CYAN: '\x1b[38;5;123m', 
    YELLOW: '\x1b[93m',
    RESET: '\x1b[0m',
};

const logger = pino({ level: 'silent' }); 

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function displayBanner() {
    cfonts.say('Raphtalia|Bot', {
        font: 'block',              
        align: 'center',            
        colors: ['#ffbb73', '#77fa6b', '#FFFF00'], 
        background: 'transparent',  
        letterSpacing: 1,           
        lineHeight: 1,              
        space: true,                
        maxLength: '0',             
        transitionGradient: true,
        figlet: false,
    });
}

const AUTH_FILE_PATH = 'baileys_auth_info'; 

async function connectToWhatsApp () {
    displayBanner(); 

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FILE_PATH);

    let phoneNumber = undefined;
    let pairingCodeRequested = false;
    let useCodePairing = false;

    // --- Lógica de Escolha do Método de Login (Somente se não estiver logado) ---
    if (!state.creds.me) {
        
        console.log(`\n--- Configuração de Login ---`);
        console.log(`${colors.LIGHT_CYAN}Escolha um modo de conexão:${colors.RESET}`);
        console.log(`${colors.YELLOW}1. 📷 Conectar com QR-Code.${colors.RESET}`);
        console.log(`${colors.YELLOW}2. 📱 Conectar com código de pareamento.${colors.RESET}`);
        
        const choice = await rl.question('Digite 1 ou 2: ');
        
        if (choice === '2') {
            useCodePairing = true;
            console.log('Você escolheu código de pareamento.');
            phoneNumber = await rl.question('Digite o número do seu telefone (Ex: 553898305259, que seria +55 38 9830-5259): ');
        } else {
            console.log('Você escolheu QR Code.');
        }
    }
    // --------------------------------------------------------------------------
const { version, isLatest } = await fetchLatestBaileysVersion();

console.log(`📱 Versão do WhatsApp: ${version.join('.')}`);
console.log(`✅ Atualizado: ${isLatest}`);

// 1. Cria a Conexão
    const sock = makeWASocket({
		version: [2, 3000, 1044006379],
        auth: state,
        logger: logger,
        printQRInTerminal: false,
		browser: ['macOS', 'Safari', '17']
    });

    // 2. Gerenciamento de Credenciais
    sock.ev.on('creds.update', saveCreds);

    // 3. Gerenciamento do Estado da Conexão
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
            
    //  4. Cria o código de conexão se o 2 for escolhido
    if (useCodePairing && phoneNumber && !pairingCodeRequested) {
    pairingCodeRequested = true;
        setTimeout(async () => {
            try {
                console.log('Gerando código de pareamento...');
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n🎉 SEU CÓDIGO: ${code}`);
                console.log('No celular: WhatsApp > Dispositivos Conectados > Conectar com número de telefone');
            } catch (err) {
                console.error('❌ Falha ao gerar pairing code:', err);
            }
        }, 3000);
    }

    if (connection === 'close') {
        // Captura o código de status do erro com segurança
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const errorName = lastDisconnect?.error?.name;
        const errorMessage = lastDisconnect?.error?.message || '';

        console.log(`⚠️ Conexão fechada. Motivo (Status): ${reason} | Erro: ${errorName}`);

        // CASO 1: Logout do usuário (Aí sim o bot deve parar)
        if (reason === DisconnectReason.loggedOut) {
            console.log('🚨 Desconectado. Sessão finalizada pelo celular. Excluindo autenticação...');
            try {
                rmSync(AUTH_FILE_PATH, { recursive: true, force: true });
                console.log(`✅ Pasta "${AUTH_FILE_PATH}" excluída!`);
            } catch (err) {
                console.error('❌ Erro ao apagar a pasta:', err.message);
            }
            console.log('Reinicie o bot para escanear um novo QR Code.');
            rl.close(); // Fecha o terminal com segurança

        // CASO 2: Rate Limit (Overlimit) ou Erros de Conexão Temporários (428, 500, etc.)
        } else if (reason === 428 || reason === 500 || errorMessage.includes('rate-overlimit')) {
            console.log(`⏳ [Anti-Crash] Erro instável detectado (${reason || 'Rate-Limit'}). Aguardando 5 segundos antes de reconectar...`);
            
            // Dá um tempo para o servidor do WhatsApp respirar e não virar um loop infinito de erros
            setTimeout(() => {
                connectToWhatsApp();
            }, 5000);

        // CASO 3: Outros motivos padrões do Baileys (Reiniciar conexão, Bad Session, etc.)
        } else {
            console.log(`🔌 Tentando reconectar automaticamente de forma padrão...`);
            connectToWhatsApp();
        }

    } else if (connection === 'open') {
        console.log('✅ Conectado ao WhatsApp! Bot pronto para uso.');
    }

        // 5. Cria o QR-Code se o 1 for escolhido
        if (qr && !useCodePairing) {
            
            console.log(`\n${colors.YELLOW}----------------------------------${colors.RESET}`);
            console.log(` ${colors.LIGHT_CYAN}📷 QR Code: ${colors.RESET}`);
            console.log(``);
            
            try {
                const qrCodeString = await qrcode.toString(qr, {
                    type: 'terminal',
                    small: true      
                });
                console.log(qrCodeString); 
                
            } catch (err) {
                console.error('❌ Erro ao gerar o QR Code no terminal:', err);
                console.log('String do QR Code (se nao gerar o ascii boladao):', qr);
            }
            console.log(`\n${colors.YELLOW}----------------------------------${colors.RESET}`);
        }
    });

    // 6. Processamento de Mensagens
    sock.ev.on('messages.upsert', (m) => {
        processMessages(sock, m);
    });

    return sock;
}

connectToWhatsApp();
