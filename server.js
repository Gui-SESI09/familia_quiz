import Fastify from 'fastify';
import cors from '@fastify/cors';
import pg from 'pg';

const app = Fastify();
const { Pool } = pg;

const db = new Pool({
    user: 'postgres',
    password: 'senai',
    host: 'localhost',
    database: 'familia_quiz',
    port: 5432
});

app.register(cors, { origin: '*' });

app.post('/formularios', async (request, reply) => {
    const { nome } = request.body;
    const query = 'INSERT INTO formularios (nome) VALUES ($1) RETURNING *';
    const result = await db.query(query, [nome]);
    return reply.code(201).send(result.rows[0]);
});

app.post('/questoes', async (request, reply) => {
    const { formulario_id, enunciado, a, b, c, d, correta } = request.body;
    const query = `
        INSERT INTO questoes (formulario_id, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const result = await db.query(query, [formulario_id, enunciado, a, b, c, d, correta]);
    return reply.code(201).send(result.rows[0]);
});

app.get('/formularios/:id/questoes', async (request, reply) => {
    const { id } = request.params;
    const result = await db.query('SELECT * FROM questoes WHERE formulario_id = $1', [id]);
    return result.rows;
});

app.post('/tentativas', async (request, reply) => {
    const { formulario_id, nome_pai, respostas_pai } = request.body;
    
    const { rows: questoes } = await db.query(
        'SELECT id, resposta_correta FROM questoes WHERE formulario_id = $1',
        [formulario_id]
    );

    const acertos = respostas_pai.reduce((total, resposta) => {
        const questao = questoes.find(q => q.id === resposta.questao_id);
        return (questao && questao.resposta_correta === resposta.escolha) ? total + 1 : total;
    }, 0);

    const queryTentativa = 'INSERT INTO tentativas (formulario_id, nome_pai, acertos) VALUES ($1, $2, $3) RETURNING *';
    const result = await db.query(queryTentativa, [formulario_id, nome_pai, acertos]);
    
    return result.rows[0];
});

app.get('/ranking/:formulario_id', async (request, reply) => {
    const { formulario_id } = request.params;
    const query = 'SELECT nome_pai, acertos FROM tentativas WHERE formulario_id = $1 ORDER BY acertos DESC';
    const result = await db.query(query, [formulario_id]);
    return result.rows;
});

app.get('/formularios', async (request, reply) => {
    const result = await db.query('SELECT * FROM formularios ORDER BY id DESC');
    return result.rows;
});

app.listen({ port: 3000 }).then(() => {
    console.log('Servidor rodando em http://localhost:3000');
});