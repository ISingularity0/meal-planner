import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import BarcodeScanner from './BarcodeScanner.jsx'
import { getOrFetchByBarcode, saveProduct } from '../lib/products.js'
import QuantityStep from './QuantityStep.jsx'

const EMPTY_DRAFT = {
  barcode: null,
  name: '',
  brand: '',
  kcal_100: '',
  protein_100: '',
  fat_100: '',
  carbs_100: '',
  grams_per_piece: '',
}

export default function ProductSheet({ onClose, onAdd }) {
  const [tab, setTab] = useState('new')
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [chosen, setChosen] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const handleDetected = useCallback(async (code) => {
    setBusy(true)
    setError(null)
    try {
      const hit = await getOrFetchByBarcode(code)
      if (!hit) {
        // Not in Open Food Facts — fall through to the form with the barcode prefilled,
        // so the product still ends up saved and reusable.
        setError(`Barcode ${code} ist nicht in Open Food Facts. Trag das Produkt hier ein.`)
        setDraft({ ...EMPTY_DRAFT, barcode: code })
        setTab('new')
        return
      }
      setChosen(hit.product)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }, [])

  async function createProduct(e) {
    e.preventDefault()
    if (!draft.name.trim()) return
    setBusy(true)
    setError(null)
    try {
      const num = (v) => (v === '' ? null : Number(v))
      const stored = await saveProduct({
        barcode: draft.barcode,
        name: draft.name.trim(),
        brand: draft.brand.trim() || null,
        kcal_100: num(draft.kcal_100),
        protein_100: num(draft.protein_100),
        fat_100: num(draft.fat_100),
        carbs_100: num(draft.carbs_100),
        grams_per_piece: num(draft.grams_per_piece),
      })
      setChosen(stored)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

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
          <span className="sheet-title">{chosen ? 'Menge festlegen' : 'Neues Produkt'}</span>
          <button className="sheet-done" onClick={onClose}>
            Abbrechen
          </button>
        </div>

        {chosen ? (
          <QuantityStep product={chosen} onBack={() => setChosen(null)} onConfirm={onAdd} />
        ) : (
          <>
            <div className="glass seg-tabs">
              {[
                { key: 'new', label: 'Produkt hinzufügen' },
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
              {error && <p role="alert">{error}</p>}

              {tab === 'scan' && (
                <>
                  <BarcodeScanner onDetected={handleDetected} onError={setError} />
                  {busy && <p className="empty-state">Wird nachgeschlagen…</p>}
                </>
              )}

              {tab === 'new' && (
                <form onSubmit={createProduct}>
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
                  <div className="field">
                    <label>
                      Marke (optional)
                      <input
                        value={draft.brand}
                        onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="nutrition-fields">
                    {[
                      { key: 'kcal_100', label: 'kcal / 100g' },
                      { key: 'protein_100', label: 'Eiweiß / 100g' },
                      { key: 'fat_100', label: 'Fett / 100g' },
                      { key: 'carbs_100', label: 'Kohlenh. / 100g' },
                      { key: 'grams_per_piece', label: '1 Stück in g (optional)' },
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
                  <button
                    type="submit"
                    className="btn-primary btn-block"
                    disabled={busy}
                    style={{ marginTop: 16 }}
                  >
                    {busy ? 'Moment…' : 'Anlegen und verwenden'}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </motion.div>
    </>,
    document.body
  )
}
