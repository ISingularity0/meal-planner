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

async function uploadPhoto(photoFile) {
  const ext = photoFile.name.split('.').pop()
  const path = `${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('recipe-photos')
    .upload(path, photoFile)
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('recipe-photos').getPublicUrl(path)
  return data.publicUrl
}

export async function createRecipe({ title, ingredients, steps, photoFile }) {
  const photo_url = photoFile ? await uploadPhoto(photoFile) : null
  const { data, error } = await supabase
    .from('recipes')
    .insert({ title, ingredients, steps, photo_url })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRecipe(id, { title, ingredients, steps, photoFile }) {
  const update = { title, ingredients, steps }
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
