import fs from "fs";

const memoryPath = "./memoria.json";

// carregar tudo
export function loadMemory() {
    if (!fs.existsSync(memoryPath)) {
        fs.writeFileSync(memoryPath, "{}");
    }

    return JSON.parse(
        fs.readFileSync(memoryPath, "utf8")
    );
}

// salvar tudo
export function saveMemory(data) {
    fs.writeFileSync(
        memoryPath,
        JSON.stringify(data, null, 2)
    );
}

// pegar memória do usuário
export function getUserMemory(userId) {

    const memories = loadMemory();

    if (!memories[userId]) {
        memories[userId] = {
            fatos: []
        };

        saveMemory(memories);
    }

    return memories[userId];
}

// adicionar memória
export function addMemory(userId, fact) {

    const memories = loadMemory();

    if (!memories[userId]) {
        memories[userId] = {
            fatos: []
        };
    }

    if (
        !memories[userId].fatos.includes(fact)
    ) {
        memories[userId].fatos.push(fact);
    }

    // limitar
    memories[userId].fatos =
        memories[userId].fatos.slice(-30);

    saveMemory(memories);
}