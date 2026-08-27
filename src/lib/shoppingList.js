import { supabase } from './supabaseClient.js'
import { getWeekEntries } from './mealEntries.js'

export async function listItems() {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function generateFromRange(startDate, endDate) {
  const entries = await getWeekEntries(startDate, endDate)
  const aggregated = new Map() // key: `${name}_${unit}` -> {name, unit, quantity}

  for (const entry of entries) {
    const ingredients = entry.recipes?.ingredients ?? []
    const multiplier = Number(entry.servings) || 1
    for (const ing of ingredients) {
      const name = (ing.name ?? '').trim()
      if (!name) continue
      const unit = (ing.unit ?? '').trim()
      const qty = (Number(ing.quantity) || 0) * multiplier
      const key = `${name.toLowerCase()}_${unit.toLowerCase()}`
      const existing = aggregated.get(key)
      if (existing) {
        existing.quantity += qty
      } else {
        aggregated.set(key, { name, unit, quantity: qty })
      }
    }
  }

  const existingItems = await listItems()
  const existingByKey = new Map(
    existingItems.map((item) => [`${item.name.toLowerCase()}_${(item.unit ?? '').toLowerCase()}`, item])
  )

  for (const { name, unit, quantity } of aggregated.values()) {
    const key = `${name.toLowerCase()}_${unit.toLowerCase()}`
    const existing = existingByKey.get(key)
    if (existing) {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ quantity: quantity || null })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('shopping_list_items')
        .insert({ name, unit: unit || null, quantity: quantity || null, checked: false })
      if (error) throw error
    }
  }

  return { entriesFound: entries.length, ingredientsAdded: aggregated.size }
}

export async function toggleChecked(id, checked) {
  const { error } = await supabase
    .from('shopping_list_items')
    .update({ checked })
    .eq('id', id)
  if (error) throw error
}

export async function deleteItem(id) {
  const { error } = await supabase.from('shopping_list_items').delete().eq('id', id)
  if (error) throw error
}

export async function clearList() {
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw error
}
