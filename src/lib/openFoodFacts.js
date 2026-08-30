// Open Food Facts: open database, no API key, CORS-enabled, good German coverage.
// Called straight from the browser — fits the app's no-backend setup.

const FIELDS = 'code,product_name,product_name_de,brands,quantity,serving_quantity,nutriments'

function num(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// Maps one Open Food Facts record onto the shape this app stores.
function toProduct(off) {
  if (!off) return null
  const n = off.nutriments ?? {}
  const name = (off.product_name_de || off.product_name || '').trim()
  if (!name) return null
  return {
    barcode: off.code ?? null,
    name,
    brand: (off.brands ?? '').split(',')[0]?.trim() || null,
    kcal_100: num(n['energy-kcal_100g']),
    protein_100: num(n.proteins_100g),
    fat_100: num(n.fat_100g),
    carbs_100: num(n.carbohydrates_100g),
    // Only useful when the serving really is "one piece"; the user can correct it.
    grams_per_piece: num(off.serving_quantity),
  }
}

export async function fetchProductByBarcode(barcode) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open Food Facts antwortet nicht (${res.status})`)
  const data = await res.json()
  if (data.status !== 1) return null
  return toProduct(data.product)
}

export async function searchProducts(query, limit = 20) {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=${limit}&fields=${FIELDS}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Suche fehlgeschlagen (${res.status})`)
  const data = await res.json()
  return (data.products ?? []).map(toProduct).filter(Boolean)
}
