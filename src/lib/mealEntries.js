import { supabase } from './supabaseClient.js'

export async function getWeekEntries(startDate, endDate) {
  const { data, error } = await supabase
    .from('meal_entries')
    .select('*, recipes(id, title, ingredients, photo_url)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addEntry(date, recipeId, servings = 1) {
  const { data, error } = await supabase
    .from('meal_entries')
    .insert({ date, recipe_id: recipeId, servings })
    .select('*, recipes(id, title, ingredients, photo_url)')
    .single()
  if (error) throw error
  return data
}

export async function removeEntry(id) {
  const { error } = await supabase.from('meal_entries').delete().eq('id', id)
  if (error) throw error
}

export async function updateEntryServings(id, servings) {
  const { data, error } = await supabase
    .from('meal_entries')
    .update({ servings })
    .eq('id', id)
    .select('*, recipes(id, title, ingredients, photo_url)')
    .single()
  if (error) throw error
  return data
}
