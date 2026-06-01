/**
 * db.ts — Camada de acesso ao Supabase (Multi-tenant)
 * Todas as operações incluem user_id para isolamento de dados.
 */
import { supabase } from './supabase';

// ─── Helper: pega o user_id da sessão atual ────────────────
async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Usuário não autenticado');
  return data.user.id;
}

// ─── Helpers de mapeamento ─────────────────────────────────

function toFavorecido(row: any) {
  return {
    id: row.id, 
    cliente_id: row.cliente_id,
    nome: row.nome, 
    nasc: row.data_nascimento ?? '',
    parentesco: row.parentesco ?? '',
    telefone: row.telefone ?? '',
    obs: row.obs ?? '',
  };
}
function fromFavorecido(f: any, uid: string) {
  return {
    id: f.id, 
    user_id: uid, 
    cliente_id: f.cliente_id,
    nome: f.nome, 
    data_nascimento: f.nasc || null,
    parentesco: f.parentesco ?? '',
    telefone: f.telefone ?? '',
    obs: f.obs ?? '',
  };
}

function toCliente(row: any) {
  return {
    id: row.id, nome: row.nome, cpf: row.cpf ?? '', estadoCivil: row.estado_civil ?? '',
    nacionalidade: row.nacionalidade ?? 'brasileira', nasc: row.nasc ?? '', tel: row.tel ?? '',
    email: row.email ?? '', endereco: row.endereco ?? '', cidade: row.cidade ?? '',
    parceiro: row.parceiro ?? '',
    telParceiro: row.tel_parceiro ?? '', 
    obs: row.obs ?? '',
  };
}
function fromCliente(c: any, uid: string) {
  return {
    id: c.id, user_id: uid, nome: c.nome, cpf: c.cpf ?? '',
    estado_civil: c.estado_civil ?? c.estadoCivil ?? '', nacionalidade: c.nacionalidade ?? 'brasileira',
    nasc: c.nasc ?? '', tel: c.tel ?? '', email: c.email ?? '',
    endereco: c.endereco ?? '', cidade: c.cidade ?? '', 
    parceiro: c.parceiro ?? '',
    tel_parceiro: c.telParceiro ?? '', obs: c.obs ?? '',
  };
}
function toContrato(row: any) {
  return {
    id: row.id, cid: row.cid, srv: row.srv ?? '', nomeExp: row.nome_exp ?? '',
    qtdFotos: row.qtd_fotos ?? '', duracao: row.duracao ?? '',
    val: Number(row.val ?? 0), ent: Number(row.ent ?? 0),
    formaPagamento: row.forma_pagamento ?? '', dc: row.dc ?? '', ds: row.ds ?? '',
    st: row.st ?? 'Pendente', obs: row.obs ?? '', etapa: row.etapa ?? '',
    dataEntrega: row.data_entrega ?? '',
    favorecido_id: row.favorecido_id ?? null,
    historico: row.historico ?? [],
  };
}
function fromContrato(c: any, uid: string) {
  return {
    id: c.id, user_id: uid, cid: c.cid, srv: c.srv ?? '',
    nome_exp: c.nomeExp ?? '', qtd_fotos: c.qtd_fotos ?? '', duracao: c.duracao ?? '',
    val: Number(c.val ?? 0), ent: Number(c.ent ?? 0),
    forma_pagamento: c.formaPagamento ?? '', dc: c.dc ?? '', ds: c.ds ?? '',
    st: c.st ?? 'Pendente', obs: c.obs ?? '', etapa: c.etapa ?? '',
    data_entrega: c.dataEntrega ?? '',
    favorecido_id: c.favorecido_id ?? null,
    historico: c.historico ?? [],
  };
}
function toLead(row: any) {
  return {
    id: row.id, nome: row.nome, tel: row.tel ?? '', email: row.email ?? '',
    servico: row.servico ?? '', origem: row.origem ?? '',
    valor: Number(row.valor ?? 0), etapa: row.etapa ?? 'contato',
    proximoFollowup: row.proximo_followup ?? '', favorecido: row.favorecido ?? '',
    favorecido_id: row.favorecido_id ?? null,
    obs: row.obs ?? '', dataCriacao: row.data_criacao ?? '',
    historico: row.historico ?? [],
  };
}
function fromLead(l: any, uid: string) {
  return {
    id: l.id, user_id: uid, nome: l.nome, tel: l.tel ?? '', email: l.email ?? '',
    servico: l.servico ?? '', origem: l.origem ?? '',
    valor: Number(l.valor ?? 0), etapa: l.etapa ?? 'contato',
    proximo_followup: l.proximoFollowup ?? '', favorecido: l.favorecido ?? '',
    favorecido_id: l.favorecido_id ?? null,
    obs: l.obs ?? '', data_criacao: l.dataCriacao ?? '',
    historico: l.historico ?? [],
  };
}
function toDespesa(row: any) {
  return {
    id: row.id, tipo: row.tipo ?? 'Variável', nome: row.nome,
    valor: Number(row.valor ?? 0), dia: row.dia ?? null, data: row.data ?? '',
    categoria: row.categoria ?? '', obs: row.obs ?? '', ativo: row.ativo ?? true,
  };
}
function fromDespesa(d: any, uid: string) {
  return {
    id: d.id, user_id: uid, tipo: d.tipo ?? 'Variável', nome: d.nome,
    valor: Number(d.valor ?? 0), dia: d.dia ?? null, data: d.data ?? '',
    categoria: d.categoria ?? '', obs: d.obs ?? '', ativo: d.ativo ?? true,
  };
}

// ─── CLIENTES ──────────────────────────────────────────────

export async function fetchClientes() {
  const uid = await getUserId();
  const { data, error } = await supabase.from('clientes').select('*').eq('user_id', uid).order('nome');
  if (error) throw error;
  return (data ?? []).map(toCliente);
}
export async function upsertCliente(cliente: any) {
  const uid = await getUserId();
  const { error } = await supabase.from('clientes').upsert(fromCliente(cliente, uid));
  if (error) throw error;
}
export async function deleteCliente(id: string) {
  const uid = await getUserId();
  const { error } = await supabase.from('clientes').delete().eq('id', id).eq('user_id', uid);
  if (error) throw error;
}

// ─── CONTRATOS ─────────────────────────────────────────────

export async function fetchContratos() {
  const uid = await getUserId();
  const { data, error } = await supabase.from('contratos').select('*').eq('user_id', uid).order('ds', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toContrato);
}
export async function upsertContrato(contrato: any) {
  const uid = await getUserId();
  const { error } = await supabase.from('contratos').upsert(fromContrato(contrato, uid));
  if (error) throw error;
}
export async function deleteContrato(id: string) {
  const uid = await getUserId();
  const { error } = await supabase.from('contratos').delete().eq('id', id).eq('user_id', uid);
  if (error) throw error;
}
export async function deleteContratosPorCliente(cid: string) {
  const uid = await getUserId();
  const { error } = await supabase.from('contratos').delete().eq('cid', cid).eq('user_id', uid);
  if (error) throw error;
}

// ─── LEADS ─────────────────────────────────────────────────

export async function fetchLeads() {
  const uid = await getUserId();
  const { data, error } = await supabase.from('leads').select('*').eq('user_id', uid).order('data_criacao', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toLead);
}
export async function upsertLead(lead: any) {
  const uid = await getUserId();
  const { error } = await supabase.from('leads').upsert(fromLead(lead, uid));
  if (error) throw error;
}
export async function deleteLead(id: string) {
  const uid = await getUserId();
  const { error } = await supabase.from('leads').delete().eq('id', id).eq('user_id', uid);
  if (error) throw error;
}

// ─── DESPESAS ──────────────────────────────────────────────

export async function fetchDespesas() {
  const uid = await getUserId();
  const { data, error } = await supabase.from('despesas').select('*').eq('user_id', uid).order('nome');
  if (error) throw error;
  return (data ?? []).map(toDespesa);
}
export async function upsertDespesa(despesa: any) {
  const uid = await getUserId();
  const { error } = await supabase.from('despesas').upsert(fromDespesa(despesa, uid));
  if (error) throw error;
}
export async function deleteDespesa(id: string) {
  const uid = await getUserId();
  const { error } = await supabase.from('despesas').delete().eq('id', id).eq('user_id', uid);
  if (error) throw error;
}

// ─── CONFIGURAÇÕES ─────────────────────────────────────────

export async function fetchConfig(chave: string): Promise<string | null> {
  const uid = await getUserId();
  const { data, error } = await supabase.from('configuracoes')
    .select('valor').eq('chave', chave).eq('user_id', uid).limit(1);
  if (error) return null;
  return data?.[0]?.valor ?? null;
}
export async function saveConfig(chave: string, valor: string) {
  const uid = await getUserId();
  const { error } = await supabase.from('configuracoes')
    .upsert({ 
      chave, 
      valor, 
      user_id: uid, 
      updated_at: new Date().toISOString() 
    }, { onConflict: 'user_id,chave' });
    
  if (error) throw error;
}

// ─── SERVIÇOS DO PORTFÓLIO ─────────────────────────────────

export async function fetchServicosPortfolio() {
  const uid = await getUserId();
  const { data, error } = await supabase.from('servicos_portfolio').select('*').eq('user_id', uid).order('nome');
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id, nome: row.nome, desc: row.descricao ?? '', pacotes: row.pacotes ?? [],
  }));
}
export async function upsertServicoPortfolio(srv: any) {
  const uid = await getUserId();
  const { error } = await supabase.from('servicos_portfolio').upsert({
    id: srv.id, user_id: uid, nome: srv.nome, descricao: srv.desc ?? '',
    pacotes: srv.pacotes ?? [],
  });
  if (error) throw error;
}
export async function deleteServicoPortfolio(id: string) {
  const uid = await getUserId();
  const { error } = await supabase.from('servicos_portfolio').delete().eq('id', id).eq('user_id', uid);
  if (error) throw error;
}

// ─── FAVORECIDOS ───────────────────────────────────────────

export async function fetchFavorecidos() {
  const uid = await getUserId();
  const { data, error } = await supabase.from('favorecidos').select('*').eq('user_id', uid).order('nome');
  if (error) throw error;
  return (data ?? []).map(toFavorecido);
}
export async function upsertFavorecido(fav: any) {
  const uid = await getUserId();
  const { error } = await supabase.from('favorecidos').upsert(fromFavorecido(fav, uid));
  if (error) throw error;
}
export async function deleteFavorecido(id: string) {
  const uid = await getUserId();
  const { error } = await supabase.from('favorecidos').delete().eq('id', id).eq('user_id', uid);
  if (error) throw error;
}
