import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { listProducts } from '../lib/products.js'
import QuantityStep, { nutritionLine } from './QuantityStep.jsx'

export default function IngredientSheet({ onClose, onAdd, onAddFreeText }) {
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [chosen, setChosen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((e) => setError(`Produkte konnten nicht geladen werden: ${e.message}`))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || (p.brand ?? '').toLowerCase().includes(q)
    )
  }, [products, query])

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
          <span className="sheet-title">{chosen ? 'Menge festlegen' : 'Zutat hinzufügen'}</span>
          <button className="sheet-done" onClick={onClose}>
            Abbrechen
          </button>
        </div>

        {chosen ? (
          <QuantityStep product={chosen} onBack={() => setChosen(null)} onConfirm={onAdd} />
        ) : (
          <>
            <div className="glass search-field" style={{ marginBottom: 12 }}>
              <SearchIcon />
              <input
                type="search"
                placeholder="Produkt suchen…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="sheet-body">
              {error && <p role="alert">{error}</p>}
              {loading && <p className="empty-state">Lädt…</p>}

              {filtered.map((p) => (
                <button key={p.id} className="glass picker-row" onClick={() => setChosen(p)}>
                  <span className="picker-body">
                    <span className="picker-title">{p.name}</span>
                    {p.brand && <span className="subline">{p.brand}</span>}
                    <span className="subline">{nutritionLine(p)}</span>
                  </span>
                </button>
              ))}

              {!loading && filtered.length === 0 && (
                <p className="empty-state">
                  {products.length === 0
                    ? 'Noch keine Produkte gespeichert. Leg eines über „Neues Produkt“ an.'
                    : 'Kein Produkt passt zur Suche.'}
                </p>
              )}

              {/* Ingredients that aren't products — "Salz", "etwas Öl" — still need a way in. */}
              <button className="btn-block free-text-btn" onClick={onAddFreeText}>
                Freie Zutat ohne Produkt
              </button>
            </div>
          </>
        )}
      </motion.div>
    </>,
    document.body
  )
}

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}
