import { supabase } from './supabaseClient.js'

export async function listRecipes() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('title', { ascending: true })
  if (error) throw error
  return data
}

export async function getRecipe(id) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function listAllTags() {
  const { data, error } = await supabase.from('recipes').select('tags')
  if (error) throw error
  const tagSet = new Set()
  for (const row of data) {
    for (const tag of row.tags ?? []) tagSet.add(tag)
  }
  return [...tagSet].sort((a, b) => a.localeCompare(b, 'de'))
}

function generateId() {
  // crypto.randomUUID() requires a secure context (HTTPS/localhost) — this works everywhere,
  // including plain-HTTP LAN testing on a phone.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

async function uploadPhoto(photoFile) {
  const ext = photoFile.name.split('.').pop()
  const path = `${generateId()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('recipe-photos')
    .upload(path, photoFile)
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('recipe-photos').getPublicUrl(path)
  return data.publicUrl
}

export async function createRecipe({ title, ingredients, steps, photoFile, tags }) {
  const photo_url = photoFile ? await uploadPhoto(photoFile) : null
  const { data, error } = await supabase
    .from('recipes')
    .insert({ title, ingredients, steps, photo_url, tags: tags ?? [] })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRecipe(id, { title, ingredients, steps, photoFile, tags }) {
  const update = { title, ingredients, steps, tags: tags ?? [] }
  if (photoFile) {
    update.photo_url = await uploadPhoto(photoFile)
  }
  const { data, error } = await supabase
    .from('recipes')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRecipe(id) {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}

export async function deleteTagEverywhere(tag) {
  const { data, error } = await supabase.from('recipes').select('id, tags').contains('tags', [tag])
  if (error) throw error
  for (const row of data) {
    const nextTags = (row.tags ?? []).filter((t) => t !== tag)
    const { error: updateError } = await supabase
      .from('recipes')
      .update({ tags: nextTags })
      .eq('id', row.id)
    if (updateError) throw updateError
  }
}
