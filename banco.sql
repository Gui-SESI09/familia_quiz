CREATE TABLE formularios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

CREATE TABLE questoes (
    id SERIAL PRIMARY KEY,
    formulario_id INTEGER REFERENCES formularios(id) ON DELETE CASCADE,
    enunciado TEXT NOT NULL,
    opcao_a TEXT NOT NULL,
    opcao_b TEXT NOT NULL,
    opcao_c TEXT NOT NULL,
    opcao_d TEXT NOT NULL,
    resposta_correta CHAR(1) NOT NULL
);

CREATE TABLE tentativas (
    id SERIAL PRIMARY KEY,
    formulario_id INTEGER REFERENCES formularios(id) ON DELETE CASCADE,
    nome_pai VARCHAR(255) NOT NULL,
    acertos INTEGER NOT NULL
);