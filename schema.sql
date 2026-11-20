-- schema.sql — Caderneta da Cláudia (PostgreSQL 14+)
-- Execute ANTES de dados.sql.
-- Atenção: os DROP abaixo apagam as tabelas existentes (e os dados nelas).

DROP VIEW IF EXISTS saldo_contas;
DROP TABLE IF EXISTS lancamentos;
DROP TABLE IF EXISTS recorrencias;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS contas;
DROP TABLE IF EXISTS usuarios;

-- R1 — Acesso por pessoa
CREATE TABLE usuarios (
    usuario_id  INTEGER PRIMARY KEY,
    nome        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    senha_hash  TEXT    NOT NULL,
    criado_em   DATE    NOT NULL
);

-- R2 — Contas: cada conta tem exatamente um dono e um saldo inicial (nunca nulo)
CREATE TABLE contas (
    conta_id       INTEGER       PRIMARY KEY,
    usuario_id     INTEGER       NOT NULL REFERENCES usuarios (usuario_id),
    nome           TEXT          NOT NULL,
    tipo           TEXT          NOT NULL CHECK (tipo IN ('corrente', 'cartao', 'especie', 'poupanca')),
    saldo_inicial  NUMERIC(10,2) NOT NULL,
    data_abertura  DATE          NOT NULL,
    CONSTRAINT contas_nome_por_usuario UNIQUE (usuario_id, nome),
    -- par de chaves usado pelas FKs compostas (R8: mesmo dono)
    CONSTRAINT contas_id_usuario_uk UNIQUE (conta_id, usuario_id)
);

-- R3 — Categorias: cor em #RRGGBB, tipo entrada/saída, nome único por pessoa
CREATE TABLE categorias (
    categoria_id  INTEGER PRIMARY KEY,
    usuario_id    INTEGER NOT NULL REFERENCES usuarios (usuario_id),
    nome          TEXT    NOT NULL,
    tipo          TEXT    NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    cor_hex       TEXT    NOT NULL CHECK (cor_hex ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT categorias_nome_por_usuario UNIQUE (usuario_id, nome),
    CONSTRAINT categorias_id_usuario_uk UNIQUE (categoria_id, usuario_id)
);

-- R6 — Recorrências: cadastradas uma vez, lançadas pela pessoa a cada mês
CREATE TABLE recorrencias (
    recorrencia_id   INTEGER       PRIMARY KEY,
    usuario_id       INTEGER       NOT NULL REFERENCES usuarios (usuario_id),
    conta_id         INTEGER       NOT NULL,
    categoria_id     INTEGER       NOT NULL,
    descricao        TEXT          NOT NULL,
    valor_previsto   NUMERIC(10,2) NOT NULL CHECK (valor_previsto > 0),
    dia_do_mes       INTEGER       NOT NULL CHECK (dia_do_mes BETWEEN 1 AND 28),
    data_inicio      DATE          NOT NULL,
    data_fim         DATE          NULL,
    CONSTRAINT recorrencias_fim_valido CHECK (data_fim IS NULL OR data_fim >= data_inicio),
    CONSTRAINT recorrencias_id_usuario_uk UNIQUE (recorrencia_id, usuario_id),
    -- R8: conta e categoria precisam pertencer ao mesmo dono da recorrência
    CONSTRAINT recorrencias_conta_fk
        FOREIGN KEY (conta_id, usuario_id) REFERENCES contas (conta_id, usuario_id),
    CONSTRAINT recorrencias_categoria_fk
        FOREIGN KEY (categoria_id, usuario_id) REFERENCES categorias (categoria_id, usuario_id)
);

-- R4, R7, R8, R9 — Lançamentos
-- valor sempre positivo: o sinal vem de tipo ('entrada' / 'saida')
CREATE TABLE lancamentos (
    lancamento_id    INTEGER       PRIMARY KEY,
    usuario_id       INTEGER       NOT NULL REFERENCES usuarios (usuario_id),
    conta_id         INTEGER       NOT NULL,
    categoria_id     INTEGER       NOT NULL,
    recorrencia_id   INTEGER       NULL,   -- NULL = lançamento avulso (R7)
    tipo             TEXT          NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor            NUMERIC(10,2) NOT NULL CHECK (valor > 0),
    data_lancamento  DATE          NOT NULL,
    descricao        TEXT          NULL,   -- pode ser vazio na planilha antiga
    -- R8: conta, categoria e recorrência do mesmo dono do lançamento
    CONSTRAINT lancamentos_conta_fk
        FOREIGN KEY (conta_id, usuario_id) REFERENCES contas (conta_id, usuario_id),
    -- R9: ON DELETE RESTRICT impede apagar categoria já usada
    CONSTRAINT lancamentos_categoria_fk
        FOREIGN KEY (categoria_id, usuario_id) REFERENCES categorias (categoria_id, usuario_id)
        ON DELETE RESTRICT,
    CONSTRAINT lancamentos_recorrencia_fk
        FOREIGN KEY (recorrencia_id, usuario_id) REFERENCES recorrencias (recorrencia_id, usuario_id)
);

-- R11 — Índices para as consultas mais frequentes
-- "lançamentos de uma pessoa num mês"
CREATE INDEX lancamentos_usuario_data_idx
    ON lancamentos (usuario_id, data_lancamento);
-- "total por categoria no período"
CREATE INDEX lancamentos_usuario_categoria_data_idx
    ON lancamentos (usuario_id, categoria_id, data_lancamento);
-- Índices nas colunas de FK, para junções e para checar RESTRICT/ON DELETE rapidamente
CREATE INDEX lancamentos_conta_idx       ON lancamentos (conta_id);
CREATE INDEX lancamentos_categoria_idx   ON lancamentos (categoria_id, usuario_id);
CREATE INDEX lancamentos_recorrencia_idx ON lancamentos (recorrencia_id);
CREATE INDEX recorrencias_conta_idx      ON recorrencias (conta_id, usuario_id);
CREATE INDEX recorrencias_categoria_idx  ON recorrencias (categoria_id, usuario_id);

-- R5 — Saldo calculado na hora (não é armazenado):
-- saldo = saldo_inicial + entradas − saídas, a partir da data de abertura
CREATE VIEW saldo_contas AS
SELECT
    c.conta_id,
    c.usuario_id,
    c.nome,
    c.saldo_inicial
      + COALESCE(SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor
                          WHEN l.tipo = 'saida'   THEN -l.valor END), 0) AS saldo_atual
FROM contas c
LEFT JOIN lancamentos l
       ON l.conta_id = c.conta_id
      AND l.data_lancamento >= c.data_abertura
GROUP BY c.conta_id, c.usuario_id, c.nome, c.saldo_inicial;
