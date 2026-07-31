import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Salvando na pasta 'dados/grupos' na raiz do projeto
const CACHE_DIR = path.join(__dirname, '..', 'dados', 'grupos');
const CACHE_EXPIRY = 30 * 60 * 1000; // Cache de 30 minutos

// Garante de forma assíncrona que a pasta de cache exista
async function ensureCacheDir() {
    if (!existsSync(CACHE_DIR)) {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    }
}

/**
 * Busca metadados de um grupo de forma otimizada com cache persistente.
 * Salva informações estruturadas e legíveis em dados/grupos/<id>.json.
 * @param {import('@whiskeysockets/baileys').WASocket} sock - Instância de conexão do Baileys
 * @param {string} chatId - ID do grupo
 * @param {boolean} forceRefresh - Força a busca direta no WhatsApp ignorando o cache temporal
 */
export async function getGroupMetadata(sock, chatId, forceRefresh = false) {
    await ensureCacheDir();
    const cleanChatId = chatId.replace(/[^a-zA-Z0-9-@]/g, '');
    const cachePath = path.join(CACHE_DIR, `${cleanChatId}.json`);

    let cachedData = null;

    // Se o arquivo existir, lê os dados (para verificação normal de validade ou para servir de fallback)
    if (existsSync(cachePath)) {
        try {
            const raw = await fs.readFile(cachePath, 'utf8');
            cachedData = JSON.parse(raw);
            
            // 1. Se NÃO for forceRefresh e estiver na validade, usa o cache local
            if (!forceRefresh && (Date.now() - cachedData.timestamp < CACHE_EXPIRY)) {
                return cachedData.rawMetadata;
            }
        } catch (err) {
            console.error(`[Cache] Erro ao ler cache do grupo ${chatId}:`, err.message);
        }
    }

    // 2. Se for forceRefresh, não existir ou tiver expirado, busca via API do WhatsApp
    try {
        console.log(`[Cache] Buscando metadados do grupo ${chatId} no WhatsApp (forceRefresh: ${forceRefresh})...`);
        const metadata = await sock.groupMetadata(chatId);
        
        // Mantém configurações salvas anteriormente (como o estado do audioai)
        const oldInfo = cachedData?.info || {};

        // Estrutura os dados de forma legível e organizada
        const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        const structuredInfo = {
            id: metadata.id,
            nome: metadata.subject,
            descricao: metadata.desc || '',
            criado_em: metadata.creation ? new Date(metadata.creation * 1000).toLocaleString('pt-BR') : 'Desconhecido',
            criador: metadata.owner || 'Desconhecido',
            quantidade_membros: metadata.participants.length,
            quantidade_admins: admins.length,
            admins: admins.map(p => ({
                id: p.id,
                numero: p.id.split('@')[0],
                cargo: p.admin
            })),
            membros: metadata.participants.map(p => ({
                id: p.id,
                numero: p.id.split('@')[0],
                cargo: p.admin || 'membro'
            })),
            restrito: metadata.restrict || false,
            anuncio: metadata.announce || false,
            
            // Preserva o estado do audioai_ativo ou inicializa como false
            audioai_ativo: oldInfo.audioai_ativo !== undefined ? oldInfo.audioai_ativo : false
        };

        // Salva os dados estruturados e o rawMetadata (para compatibilidade interna)
        await fs.writeFile(cachePath, JSON.stringify({
            timestamp: Date.now(),
            info: structuredInfo,
            rawMetadata: metadata
        }, null, 2));

        return metadata;
    } catch (err) {
        console.error(`[Cache] Erro ao buscar grupo ${chatId} no WhatsApp:`, err.message);
        
        // 3. Fallback: Se der erro (ex: rate-limit temporário), retorna o expirado em vez de quebrar o bot
        if (cachedData) {
            console.log(`[Cache] Retornando cache expirado de fallback para o grupo ${chatId}`);
            return cachedData.rawMetadata;
        }
        
        throw err;
    }
}

/**
 * Lê uma configuração customizada do grupo no arquivo JSON de dados.
 * @param {string} chatId - ID do grupo
 * @param {string} key - Chave da configuração
 */
export async function getGroupConfig(chatId, key) {
    await ensureCacheDir();
    const cleanChatId = chatId.replace(/[^a-zA-Z0-9-@]/g, '');
    const cachePath = path.join(CACHE_DIR, `${cleanChatId}.json`);
    
    if (existsSync(cachePath)) {
        try {
            const raw = await fs.readFile(cachePath, 'utf8');
            const data = JSON.parse(raw);
            return data.info?.[key];
        } catch {}
    }
    return null;
}

/**
 * Atualiza um campo customizado no arquivo JSON do grupo de forma assíncrona.
 * @param {string} chatId - ID do grupo
 * @param {string} key - Chave a ser atualizada
 * @param {any} value - Valor da chave
 */
export async function updateGroupCacheField(chatId, key, value) {
    await ensureCacheDir();
    const cleanChatId = chatId.replace(/[^a-zA-Z0-9-@]/g, '');
    const cachePath = path.join(CACHE_DIR, `${cleanChatId}.json`);

    try {
        let data = { timestamp: Date.now(), info: {}, rawMetadata: {} };
        
        if (existsSync(cachePath)) {
            const raw = await fs.readFile(cachePath, 'utf8');
            data = JSON.parse(raw);
        }
        
        if (!data.info) data.info = {};
        data.info[key] = value;
        
        await fs.writeFile(cachePath, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error(`[Cache] Erro ao atualizar campo ${key} no grupo ${chatId}:`, err.message);
        return false;
    }
}
