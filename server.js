import Fastify from 'fastify';
import cors from '@fastify/cors';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const app = Fastify();
const { Pool } = pg;

// Configuração do CORS usando a variável 'app' correta
await app.register(cors, {
    origin: '*'
});

// Configuração do Banco de Dados (Neon/PostgreSQL)
const pool = new Pool({
    connectionString: process.env.url_bd,
    ssl: {
        rejectUnauthorized: false
    }
});

// --- ROTAS ---

app.post('/formularios', async (request, reply) => {
    const { nome } = request.body;
    const query = 'INSERT INTO formularios (nome) VALUES ($1) RETURNING *';
    const result = await pool.query(query, [nome]);
    return reply.code(201).send(result.rows[0]);
});

app.post('/questoes', async (request, reply) => {
    const { formulario_id, enunciado, a, b, c, d, correta } = request.body;
    const query = `
        INSERT INTO questoes (formulario_id, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const result = await pool.query(query, [formulario_id, enunciado, a, b, c, d, correta]);
    return reply.code(201).send(result.rows[0]);
});

app.get('/formularios/:id/questoes', async (request, reply) => {
    const { id } = request.params;
    const result = await pool.query('SELECT * FROM questoes WHERE formulario_id = $1', [id]);
    return result.rows;
});

app.post('/tentativas', async (request, reply) => {
    const { formulario_id, nome_pai, respostas_pai } = request.body;
    
    const { rows: questoes } = await pool.query(
        'SELECT id, resposta_correta FROM questoes WHERE formulario_id = $1',
        [formulario_id]
    );

    const acertos = respostas_pai.reduce((total, resposta) => {
        const questao = questoes.find(q => q.id === resposta.questao_id);
        return (questao && questao.resposta_correta === resposta.escolha) ? total + 1 : total;
    }, 0);

    const queryTentativa = 'INSERT INTO tentativas (formulario_id, nome_pai, acertos) VALUES ($1, $2, $3) RETURNING *';
    const result = await pool.query(queryTentativa, [formulario_id, nome_pai, acertos]);
    
    return result.rows[0];
});

app.get('/ranking/:formulario_id', async (request, reply) => {
    const { formulario_id } = request.params;
    const query = 'SELECT nome_pai, acertos FROM tentativas WHERE formulario_id = $1 ORDER BY acertos DESC';
    const result = await pool.query(query, [formulario_id]);
    return result.rows;
});

app.get('/formularios', async (request, reply) => {
    const result = await pool.query('SELECT * FROM formularios ORDER BY id DESC');
    return result.rows;
});

// --- INICIALIZAÇÃO (Configurada para o Render) ---

const start = async () => {
    try {
        await app.listen({ 
            port: process.env.PORT || 3000, 
            host: '0.0.0.0' 
        });
        console.log(`Servidor rodando na porta ${process.env.PORT || 3000}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();