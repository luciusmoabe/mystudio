-- ============================================================
-- MyStudio — Brenda Monteiro Photography
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Habilitar extensão UUID (já vem habilitada no Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- CLIENTES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id            TEXT PRIMARY KEY,
  nome          TEXT NOT NULL,
  cpf           TEXT,
  estado_civil  TEXT,
  nacionalidade TEXT DEFAULT 'brasileira',
  nasc          TEXT,
  tel           TEXT,
  email         TEXT,
  endereco      TEXT,
  cidade        TEXT,
  bebe          TEXT,
  nasc_bebe     TEXT,
  parceiro      TEXT,
  tel_parceiro  TEXT,
  obs           TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- CONTRATOS / SESSÕES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contratos (
  id              TEXT PRIMARY KEY,
  cid             TEXT REFERENCES clientes(id) ON DELETE CASCADE,
  srv             TEXT,
  nome_exp        TEXT,
  qtd_fotos       TEXT,
  duracao         TEXT,
  val             NUMERIC DEFAULT 0,
  ent             NUMERIC DEFAULT 0,
  forma_pagamento TEXT,
  dc              TEXT,
  ds              TEXT,
  st              TEXT DEFAULT 'Pendente',
  obs             TEXT,
  etapa           TEXT,
  data_entrega    TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- LEADS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                TEXT PRIMARY KEY,
  nome              TEXT NOT NULL,
  tel               TEXT,
  email             TEXT,
  servico           TEXT,
  origem            TEXT,
  valor             NUMERIC DEFAULT 0,
  etapa             TEXT DEFAULT 'contato',
  proximo_followup  TEXT,
  obs               TEXT,
  data_criacao      TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- DESPESAS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS despesas (
  id         TEXT PRIMARY KEY,
  tipo       TEXT DEFAULT 'Variável',
  nome       TEXT NOT NULL,
  valor      NUMERIC DEFAULT 0,
  dia        INTEGER,
  data       TEXT,
  categoria  TEXT,
  obs        TEXT,
  ativo      BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- CONFIGURAÇÕES (chave-valor genérico)
-- Para: templates de contrato, etapas, serviços, assinatura
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracoes (
  chave      TEXT PRIMARY KEY,
  valor      TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- SERVIÇOS / PACOTES (portfólio)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS servicos_portfolio (
  id         TEXT PRIMARY KEY,
  nome       TEXT NOT NULL,
  descricao  TEXT,
  pacotes    JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- PERFIL DO ESTÚDIO
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS perfil_estudio (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID UNIQUE NOT NULL,
  nome_estudio      TEXT NOT NULL,
  nome_profissional TEXT NOT NULL,
  cpf               TEXT,
  cnpj              TEXT,
  endereco          TEXT,
  cidade            TEXT,
  uf                TEXT,
  telefone          TEXT,
  email             TEXT,
  logo_url          TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- FAVORECIDOS (Alvos da Sessão / Filhos / Modelos)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorecidos (
  id              TEXT PRIMARY KEY,
  user_id         UUID NOT NULL,
  cliente_id      TEXT REFERENCES clientes(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  data_nascimento TEXT,
  parentesco      TEXT,
  telefone        TEXT,
  obs             TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- RLS — Acesso público (sem auth por enquanto)
-- ─────────────────────────────────────────
ALTER TABLE clientes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfil_estudio     ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorecidos        ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (acesso total via anon key)
CREATE POLICY "allow_all_clientes"           ON clientes           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_contratos"          ON contratos          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_leads"              ON leads              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_despesas"           ON despesas           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_configuracoes"      ON configuracoes      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_servicos_portfolio" ON servicos_portfolio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_perfil_estudio"     ON perfil_estudio     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_favorecidos"        ON favorecidos        FOR ALL USING (true) WITH CHECK (true);
