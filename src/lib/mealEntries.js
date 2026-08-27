import { supabase } from './supabaseClient.js'
import { toLocalISODate, addDays } from './dates.js'

// Powers the calendar's one-tap quick chips: most-planned recipes of the last 30 days.
export async function getRecentRecipes(limit = 3) {
  const since = toLocalISODate(addDays(new Date(), -30))
  const { data, error } = await supabase
    .from('meal_entries')
    .select('recipe_id, recipes(id, title, photo_url)')
    .gte('date', since)
  if (error) throw error

  const counts = new Map()
  for (const row of data) {
    if (!row.recipes) continue
    const entry = counts.get(row.recipe_id) ?? { recipe: row.recipes, count: 0 }
    entry.count += 1
    counts.set(row.recipe_id, entry)
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((e) => e.recipe)
}

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
