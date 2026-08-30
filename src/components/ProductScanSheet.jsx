import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import BarcodeScanner from './BarcodeScanner.jsx'
import { fetchProductByBarcode } from '../lib/openFoodFacts.js'

export default function ProductScanSheet({ onClose, onPick }) {
  const [barcode, setBarcode] = useState(null)
  const [product, setProduct] = useState(null)
  const [looking, setLooking] = useState(false)
  const [error, setError] = useState(null)

  const handleDetected = useCallback(async (code) => {
    setBarcode(code)
    setLooking(true)
    setError(null)
    try {
      const found = await fetchProductByBarcode(code)
      setProduct(found)
      if (!found) setError('Dieses Produkt steht nicht in der Open-Food-Facts-Datenbank.')
    } catch (e) {
      setError(e.message)
    } finally {
      setLooking(false)
    }
  }, [])

  function rescan() {
    setBarcode(null)
    setProduct(null)
    setError(null)
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
          <span className="sheet-title">Barcode scannen</span>
          <button className="sheet-done" onClick={onClose}>
            Fertig
          </button>
        </div>

        <div className="sheet-body">
          {!barcode && <BarcodeScanner onDetected={handleDetected} onError={setError} />}

          {barcode && (
            <>
              <p className="mono-label">Erkannt: {barcode}</p>
              {looking && <p className="empty-state">Wird nachgeschlagen…</p>}
              {error && <p role="alert">{error}</p>}

              {product && (
                <div className="glass picker-row" style={{ alignItems: 'flex-start' }}>
                  <span className="picker-body">
                    <span className="picker-title">{product.name}</span>
                    {product.brand && <span className="subline">{product.brand}</span>}
                    <span className="subline">
                      {product.kcal_100 != null
                        ? `${Math.round(product.kcal_100)} kcal · ${Math.round(product.protein_100 ?? 0)}g Eiweiß · ${Math.round(product.fat_100 ?? 0)}g Fett · ${Math.round(product.carbs_100 ?? 0)}g KH — je 100g`
                        : 'Keine Nährwerte hinterlegt'}
                    </span>
                  </span>
                </div>
              )}

              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn-block" onClick={rescan}>
                  Nochmal scannen
                </button>
                {product && (
                  <button className="btn-primary btn-block" onClick={() => onPick(product)}>
                    Übernehmen
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>,
    document.body
  )
}
