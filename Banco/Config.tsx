import * as SQLite from 'expo-sqlite';

export type Pocao = {
    id: number;
    nome: string;
    tipo: string;
    efeito: string;
    raridade: string;
};

export type PocaoInput = Omit<Pocao, 'id'>;

const INITIAL_POTIONS: PocaoInput[] = [
    { nome: 'Elixir de Cura', tipo: 'Cura', efeito: 'Recupera 50 pontos de vida', raridade: 'Comum' },
    { nome: 'Poção de Mana', tipo: 'Mana', efeito: 'Restaura 40 pontos de mana', raridade: 'Comum' },
    { nome: 'Essência de Fogo', tipo: 'Ataque', efeito: 'Aumenta o dano de fogo', raridade: 'Raro' },
    { nome: 'Lágrima de Gelo', tipo: 'Defesa', efeito: 'Resiste a ataques congelantes', raridade: 'Raro' },
    { nome: 'Tônico da Força', tipo: 'Atributo', efeito: 'Aumenta a força por 30 minutos', raridade: 'Comum' },
    { nome: 'Elixir da Velocidade', tipo: 'Atributo', efeito: 'Aumenta a velocidade de movimento', raridade: 'Raro' },
    { nome: 'Poção de Invisibilidade', tipo: 'Utilidade', efeito: 'Torna o usuário invisível', raridade: 'Muito Raro' },
    { nome: 'Antídoto Universal', tipo: 'Cura', efeito: 'Remove venenos e maldições leves', raridade: 'Raro' },
    { nome: 'Néctar do Dragão', tipo: 'Ataque', efeito: 'Concede sopro de fogo', raridade: 'Muito Raro' },
    { nome: 'Poção de Proteção', tipo: 'Defesa', efeito: 'Cria uma barreira mágica', raridade: 'Comum' },
];

export async function Banco(): Promise<SQLite.SQLiteDatabase> {
    return SQLite.openDatabaseAsync('pocoes.db');
}

export async function createTable(db: SQLite.SQLiteDatabase) {
    await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS pocoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            tipo TEXT NOT NULL,
            efeito TEXT NOT NULL,
            raridade TEXT NOT NULL
        );
    `);

    const result = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM pocoes');
    if (!result?.total) {
        for (const pocao of INITIAL_POTIONS) {
            await insertPocao(db, pocao);
        }
    }
}

export async function insertPocao(db: SQLite.SQLiteDatabase, pocao: PocaoInput) {
    await db.runAsync(
        'INSERT INTO pocoes (nome, tipo, efeito, raridade) VALUES (?, ?, ?, ?)',
        pocao.nome.trim(),
        pocao.tipo.trim(),
        pocao.efeito.trim(),
        pocao.raridade,
    );
}

export async function selectPocoes(db: SQLite.SQLiteDatabase, limit: number, offset: number) {
    return db.getAllAsync<Pocao>(
        'SELECT id, nome, tipo, efeito, raridade FROM pocoes ORDER BY id DESC LIMIT ? OFFSET ?',
        limit,
        offset,
    );
}

export async function countPocoes(db: SQLite.SQLiteDatabase) {
    const result = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM pocoes');
    return result?.total ?? 0;
}

export async function updatePocao(db: SQLite.SQLiteDatabase, id: number, pocao: PocaoInput) {
    await db.runAsync(
        'UPDATE pocoes SET nome = ?, tipo = ?, efeito = ?, raridade = ? WHERE id = ?',
        pocao.nome.trim(),
        pocao.tipo.trim(),
        pocao.efeito.trim(),
        pocao.raridade,
        id,
    );
}

export async function deletePocao(db: SQLite.SQLiteDatabase, id: number) {
    await db.runAsync('DELETE FROM pocoes WHERE id = ?', id);
}
