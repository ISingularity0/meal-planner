import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  listItems,
  generateFromRange,
  toggleChecked,
  deleteItem,
  clearList,
} from '../lib/shoppingList.js'
import { toLocalISODate } from '../lib/dates.js'

function todayISO() {
  return toLocalISODate(new Date())
}

function weekAheadISO() {
  const d = new Date()
  d.setDate(d.getDate() + 6)
  return toLocalISODate(d)
}

export default function ShoppingList() {
  const [items, setItems] = useState([])
  const [startDate, setStartDate] = useState(todayISO())
  const [endDate, setEndDate] = useState(weekAheadISO())
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [generateInfo, setGenerateInfo] = useState(null)

  async function refresh() {
    setItems(await listItems())
  }

  useEffect(() => {
    refresh().catch((e) => setError(`Liste konnte nicht geladen werden: ${e.message}`))
  }, [])

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    setGenerateInfo(null)
    try {
      const { entriesFound, ingredientsAdded } = await generateFromRange(startDate, endDate)
      await refresh()
      if (entriesFound === 0) {
        setGenerateInfo('Für diesen Zeitraum ist im Kalender nichts geplant.')
      } else if (ingredientsAdded === 0) {
        setGenerateInfo('Die geplanten Rezepte in diesem Zeitraum haben noch keine Zutaten.')
      } else {
        setGenerateInfo(`${ingredientsAdded} Zutat${ingredientsAdded === 1 ? '' : 'en'} hinzugefügt/aktualisiert.`)
      }
    } catch (e) {
      setError(`Liste konnte nicht erstellt werden: ${e.message}`)
    } finally {
      setGenerating(false)
    }
  }

  async function handleToggle(item) {
    setError(null)
    try {
      await toggleChecked(item.id, !item.checked)
      await refresh()
    } catch (e) {
      setError(`Eintrag konnte nicht aktualisiert werden: ${e.message}`)
    }
  }

  async function handleDelete(id) {
    setError(null)
    try {
      await deleteItem(id)
      await refresh()
    } catch (e) {
      setError(`Eintrag konnte nicht entfernt werden: ${e.message}`)
    }
  }

  async function handleClear() {
    if (!confirm('Die gesamte Einkaufsliste leeren?')) return
    setError(null)
    try {
      await clearList()
      await refresh()
    } catch (e) {
      setError(`Liste konnte nicht geleert werden: ${e.message}`)
    }
  }

  const allChecked = items.length > 0 && items.every((item) => item.checked)

  return (
    <div className="page">
      <h1>Einkaufsliste</h1>
      {error && <p role="alert">{error}</p>}

      <div className="row date-range">
        <label>
          Von
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          Bis
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
      </div>
      <motion.button
        className="btn-primary btn-block"
        onClick={handleGenerate}
        disabled={generating}
        whileTap={{ scale: 0.97 }}
      >
        {generating ? 'Erstellt…' : 'Für diesen Zeitraum erstellen'}
      </motion.button>

      <AnimatePresence>
        {generateInfo && (
          <motion.p
            className="generate-info"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {generateInfo}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {allChecked && (
          <motion.p
            className="celebration"
            initial={{ opacity: 0, scale: 0.8, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            🎉 Alles erledigt!
          </motion.p>
        )}
      </AnimatePresence>

      {items.length > 0 ? (
        <ul className="card checklist" style={{ marginTop: '1.25rem' }}>
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
              >
                <label>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggle(item)}
                  />
                  <motion.span
                    className={item.checked ? 'item-name checked' : 'item-name'}
                    animate={{ scale: item.checked ? [1, 1.08, 1] : 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    {[item.quantity, item.unit, item.name].filter(Boolean).join(' ')}
                  </motion.span>
                </label>
                <button className="btn-ghost" onClick={() => handleDelete(item.id)}>✕</button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <p className="empty-state" style={{ marginTop: '1.25rem' }}>Liste ist leer.</p>
      )}

      <motion.button
        className="btn-danger btn-block"
        onClick={handleClear}
        whileTap={{ scale: 0.97 }}
        style={{ marginTop: '1rem' }}
      >
        Liste leeren
      </motion.button>
    </div>
  )
}
