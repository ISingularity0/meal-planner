import { useState } from 'react'
import { updateProduct } from '../lib/products.js'
import { UNITS, unitNeedsPieceWeight } from '../lib/nutrition.js'

export function nutritionLine(p) {
  if (p.kcal_100 == null) return 'Keine Nährwerte hinterlegt'
  return `${Math.round(p.kcal_100)} kcal · ${Math.round(p.protein_100 ?? 0)}g E · ${Math.round(
    p.fat_100 ?? 0
  )}g F · ${Math.round(p.carbs_100 ?? 0)}g KH je 100g`
}

// Shared by both sheets so the flow after picking a product is identical either way.
export default function QuantityStep({ product, onBack, onConfirm }) {
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('g')
  const [pieceWeight, setPieceWeight] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const needsPieceWeight = unitNeedsPieceWeight(unit) && !product?.grams_per_piece

  async function confirm() {
    const qty = Number(amount)
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Bitte eine Menge eintragen.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      let result = product
      // A piece weight entered here is worth keeping on the product itself.
      if (needsPieceWeight && pieceWeight !== '') {
        result = await updateProduct(product.id, { grams_per_piece: Number(pieceWeight) })
      }
      onConfirm(result, { quantity: String(qty), unit })
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="sheet-body">
      {error && <p role="alert">{error}</p>}

      <div className="glass picker-row">
        <span className="picker-body">
          <span className="picker-title">{product.name}</span>
          {product.brand && <span className="subline">{product.brand}</span>}
          <span className="subline">{nutritionLine(product)}</span>
        </span>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <input
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          placeholder="Menge"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select value={unit} onChange={(e) => setUnit(e.target.value)}>
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {needsPieceWeight && (
        <label style={{ marginTop: 12 }}>
          Wie viel wiegt 1 {unit}? (in g — wird am Produkt gespeichert)
          <input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder="z. B. 60"
            value={pieceWeight}
            onChange={(e) => setPieceWeight(e.target.value)}
          />
        </label>
      )}

      <div className="row" style={{ marginTop: 16 }}>
        <button onClick={onBack}>Zurück</button>
        <button className="btn-primary btn-block" onClick={confirm} disabled={busy}>
          {busy ? 'Moment…' : 'Zur Zutatenliste'}
        </button>
      </div>
    </div>
  )
}
