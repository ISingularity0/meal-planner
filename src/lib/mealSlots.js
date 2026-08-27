import { supabase } from './supabaseClient.js'

export async function getWeekSlots(startDate, endDate) {
  const { data, error } = await supabase
    .from('meal_slots')
    .select('*, recipes(id, title, ingredients)')
    .gte('date', startDate)
    .lte('date', endDate)
  if (error) throw error
  return data
}

export async function assignSlot(date, slot, recipeId) {
  const { data, error } = await supabase
    .from('meal_slots')
    .upsert({ date, slot, recipe_id: recipeId }, { onConflict: 'date,slot' })
    .select('*, recipes(id, title, ingredients)')
    .single()
  if (error) throw error
  return data
}

export async function clearSlot(date, slot) {
  const { error } = await supabase
    .from('meal_slots')
    .delete()
    .eq('date', date)
    .eq('slot', slot)
  if (error) throw error
}
