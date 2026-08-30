import { supabase } from './supabaseClient.js'
import { fetchProductByBarcode } from './openFoodFacts.js'

export async function listProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function findByBarcode(barcode) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveProduct(fields) {
  const { data, error } = await supabase.from('products').insert(fields).select().single()
  if (error) throw error
  return data
}

export async function updateProduct(id, fields) {
  const { data, error } = await supabase
    .from('products')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

/**
 * Own database first, Open Food Facts only as a fallback — and whatever comes back from
 * there is stored locally, so the database grows with what the family actually buys and
 * later scans of the same product are instant and work offline.
 * Deliberately never refreshes an existing row: local corrections must not be overwritten.
 *
 * @returns {{product: object, source: 'local'|'openfoodfacts'} | null}
 */
export async function getOrFetchByBarcode(barcode) {
  const known = await findByBarcode(barcode)
  if (known) return { product: known, source: 'local' }

  const fetched = await fetchProductByBarcode(barcode)
  if (!fetched) return null

  const stored = await saveProduct(fetched)
  return { product: stored, source: 'openfoodfacts' }
}
