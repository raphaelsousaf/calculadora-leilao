import { supabase } from './supabase'

// ---------- Profile (whatsapp) ----------
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('whatsapp, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data || null
}

export async function updateProfile(userId, patch) {
  const { error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
  if (error) throw error
}

// ---------- Auctioneer settings (PDF/WhatsApp header) ----------
export async function fetchSettings(userId) {
  const { data, error } = await supabase
    .from('auctioneer_settings')
    .select('nome, telefone, email, documento, default_surety_pct, viability_t1, viability_t2, viability_t3')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data ? {
    nome: data.nome,
    telefone: data.telefone,
    email: data.email,
    documento: data.documento,
    defaultSuretyPct: data.default_surety_pct,
    viabilityT1: data.viability_t1,
    viabilityT2: data.viability_t2,
    viabilityT3: data.viability_t3,
  } : {}
}

export async function upsertSettings(userId, s) {
  const payload = {
    user_id: userId,
    nome: s.nome ?? null,
    telefone: s.telefone ?? null,
    email: s.email ?? null,
    documento: s.documento ?? null,
    default_surety_pct: s.defaultSuretyPct ?? null,
    viability_t1: s.viabilityT1 ?? null,
    viability_t2: s.viabilityT2 ?? null,
    viability_t3: s.viabilityT3 ?? null,
  }
  const { error } = await supabase
    .from('auctioneer_settings')
    .upsert(payload, { onConflict: 'user_id' })
  if (error) throw error
}

// ---------- Calculations history ----------
export async function fetchCalculations(userId) {
  const { data, error } = await supabase
    .from('calculations')
    .select('id, calc, meta, saved_at')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
  if (error) throw error
  return (data || []).map(row => ({
    id: row.id,
    savedAt: row.saved_at,
    calc: row.calc,
    meta: row.meta || {},
  }))
}

export async function insertCalculation(userId, { calc, meta }) {
  const { data, error } = await supabase
    .from('calculations')
    .insert({ user_id: userId, calc, meta })
    .select('id, saved_at')
    .single()
  if (error) throw error
  return { id: data.id, savedAt: data.saved_at, calc, meta }
}

export async function deleteCalculation(id) {
  const { error } = await supabase.from('calculations').delete().eq('id', id)
  if (error) throw error
}
