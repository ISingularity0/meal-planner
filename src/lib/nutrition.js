export const UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'TL',
  'EL',
  'Stück',
  'Prise',
  'Msp.',
  'Bund',
  'Zehe',
  'Scheibe',
  'Dose',
  'Packung',
  'Tasse',
]

// Fixed conversions. ml/l are treated 1:1 with grams — off for oil, close enough for
// everything else in a household recipe.
const FIXED_GRAMS = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  TL: 5,
  EL: 15,
  Prise: 0.4,
  'Msp.': 0.5,
  Tasse: 240,
}

// Units counted in pieces: only resolvable via the product's own grams_per_piece.
const PIECE_UNITS = ['Stück', 'Bund', 'Zehe', 'Scheibe', 'Dose', 'Packung']

export function unitNeedsPieceWeight(unit) {
  return PIECE_UNITS.includes(unit)
}

// Grams for one ingredient line, or null when it can't be resolved (no quantity, unknown
// unit, or a piece unit on a product without a piece weight).
export function gramsFor(ingredient, product) {
  const qty = Number(ingredient?.quantity)
  if (!Number.isFinite(qty) || qty <= 0) return null

  const unit = (ingredient?.unit ?? '').trim()
  if (FIXED_GRAMS[unit] != null) return qty * FIXED_GRAMS[unit]

  if (unitNeedsPieceWeight(unit)) {
    const perPiece = Number(product?.grams_per_piece)
    return Number.isFinite(perPiece) && perPiece > 0 ? qty * perPiece : null
  }
  return null
}

// Totals across a recipe's ingredients. `skipped` counts lines that couldn't be included,
// so the UI can say so rather than presenting an incomplete sum as complete.
export function computeNutrition(ingredients, productsById) {
  const total = { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  let counted = 0
  let skipped = 0

  for (const ing of ingredients ?? []) {
    if (!(ing?.name ?? '').trim()) continue
    const product = ing.product_id ? productsById.get(ing.product_id) : null
    const grams = product ? gramsFor(ing, product) : null
    if (!product || grams == null || product.kcal_100 == null) {
      skipped += 1
      continue
    }
    const factor = grams / 100
    total.kcal += (Number(product.kcal_100) || 0) * factor
    total.protein += (Number(product.protein_100) || 0) * factor
    total.fat += (Number(product.fat_100) || 0) * factor
    total.carbs += (Number(product.carbs_100) || 0) * factor
    counted += 1
  }

  return { ...total, counted, skipped }
}
