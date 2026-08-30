import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import BarcodeScanner from './BarcodeScanner.jsx'
import { getOrFetchByBarcode, listProducts, saveProduct, updateProduct } from '../lib/products.js'
import { UNITS, unitNeedsPieceWeight } from '../lib/nutrition.js'

const EMPTY_DRAFT = {
  name: '',
  brand: '',
  kcal_100: '',
  protein_100: '',
  fat_100: '',
  carbs_100: '',
  grams_per_piece: '',
}

function nutritionLine(p) {
  if (p.kcal_100 == null) return 'Keine Nährwerte hinterlegt'
  return `${Math.round(p.kcal_100)} kcal · ${Math.round(p.protein_100 ?? 0)}g E · ${Math.round(
    p.fat_100 ?? 0
  )}g F · ${Math.round(p.carbs_100 ?? 0)}g KH je 100g`
}

export default function ProductSheet({ onClose, onAdd }) {
  const [tab, setTab] = useState('own')
  const [own, setOwn] = useState([])
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [chosen, setChosen] = useState(null) // product row, once picked
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('g')
  const [pieceWeight, setPieceWeight] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    listProducts()
      .then(setOwn)
      .catch((e) => setError(`Produkte konnten nicht geladen werden: ${e.message}`))
  }, [])

  const handleDetected = useCallback(async (code) => {
    setBusy(true)
    setError(null)
    try {
      const hit = await getOrFetchByBarcode(code)
      if (!hit) {
        setError(`Barcode ${code} ist nicht in Open Food Facts. Leg das Produkt selbst an.`)
        setDraft({ ...EMPTY_DRAFT, barcode: code })
        setTab('own-new')
        return
      }
      setChosen(hit.product)
      if (hit.source === 'openfoodfacts') setOwn((prev) => [...prev, hit.product])
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }, [])

  async function createOwn(e) {
    e.preventDefault()
    if (!draft.name.trim()) return
    setBusy(true)
    setError(null)
    try {
      const num = (v) => (v === '' ? null : Number(v))
      const stored = await saveProduct({
        barcode: draft.barcode ?? null,
        name: draft.name.trim(),
        brand: draft.brand.trim() || null,
        kcal_100: num(draft.kcal_100),
        protein_100: num(draft.protein_100),
        fat_100: num(draft.fat_100),
        carbs_100: num(draft.carbs_100),
        grams_per_piece: num(draft.grams_per_piece),
      })
      setOwn((prev) => [...prev, stored])
      setChosen(stored)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    const qty = Number(amount)
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Bitte eine Menge eintragen.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      let product = chosen
      // A piece weight entered here is worth keeping on the product itself.
      if (unitNeedsPieceWeight(unit) && pieceWeight !== '' && !product.grams_per_piece) {
        product = await updateProduct(product.id, { grams_per_piece: Number(pieceWeight) })
      }
      onAdd(product, { quantity: String(qty), unit })
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const needsPieceWeight = unitNeedsPieceWeight(unit) && !chosen?.grams_per_piece

  return createPortal(
    <>
      <motion.div
        className="sheet-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        className="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      >
        <div className="sheet-handle" />
        <div className="sheet-head">
          <span className="sheet-title">{chosen ? 'Menge festlegen' : 'Produkt wählen'}</span>
          <button className="sheet-done" onClick={onClose}>
            Abbrechen
          </button>
        </div>

        {error && <p role="alert">{error}</p>}

        {chosen ? (
          <div className="sheet-body">
            <div className="glass picker-row">
              <span className="picker-body">
                <span className="picker-title">{chosen.name}</span>
                {chosen.brand && <span className="subline">{chosen.brand}</span>}
                <span className="subline">{nutritionLine(chosen)}</span>
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
              <button onClick={() => setChosen(null)}>Zurück</button>
              <button className="btn-primary btn-block" onClick={confirm} disabled={busy}>
                {busy ? 'Moment…' : 'Zur Zutatenliste'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="glass seg-tabs">
              {[
                { key: 'own', label: 'Gespeichert' },
                { key: 'scan', label: 'Scannen' },
              ].map((t) => (
                <button
                  key={t.key}
                  className={tab === t.key ? 'seg-tab active' : 'seg-tab'}
                  onClick={() => setTab(t.key)}
                >
                  {tab === t.key && (
                    <motion.span
                      layoutId="product-seg"
                      className="seg-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  {t.label}
                </button>
              ))}
            </div>

            <div className="sheet-body">
              {tab === 'scan' && (
                <>
                  <BarcodeScanner onDetected={handleDetected} onError={setError} />
                  {busy && <p className="empty-state">Wird nachgeschlagen…</p>}
                </>
              )}

              {(tab === 'own' || tab === 'own-new') && (
                <>
                  {own.map((p) => (
                    <button key={p.id} className="glass picker-row" onClick={() => setChosen(p)}>
                      <span className="picker-body">
                        <span className="picker-title">{p.name}</span>
                        {p.brand && <span className="subline">{p.brand}</span>}
                        <span className="subline">{nutritionLine(p)}</span>
                      </span>
                    </button>
                  ))}
                  {own.length === 0 && (
                    <p className="empty-state">Noch keine Produkte. Scanne eines oder leg es unten an.</p>
                  )}

                  <form onSubmit={createOwn} className="own-form">
                    <h2>Eigenes Produkt</h2>
                    <div className="field">
                      <label>
                        Name
                        <input
                          value={draft.name}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                          required
                        />
                      </label>
                    </div>
                    <div className="nutrition-fields">
                      {[
                        { key: 'kcal_100', label: 'kcal / 100g' },
                        { key: 'protein_100', label: 'Eiweiß / 100g' },
                        { key: 'fat_100', label: 'Fett / 100g' },
                        { key: 'carbs_100', label: 'Kohlenh. / 100g' },
                        { key: 'grams_per_piece', label: '1 Stück in g' },
                      ].map((f) => (
                        <label key={f.key}>
                          {f.label}
                          <input
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            value={draft[f.key]}
                            onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                          />
                        </label>
                      ))}
                    </div>
                    <button type="submit" className="btn-primary btn-block" disabled={busy}>
                      Anlegen und verwenden
                    </button>
                  </form>
                </>
              )}
            </div>
          </>
        )}
      </motion.div>
    </>,
    document.body
  )
}
