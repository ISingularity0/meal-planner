import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { listItems, generateFromRange, toggleChecked, deleteItem, clearList } from '../lib/shoppingList.js'
import { toLocalISODate, startOfWeek, addDays } from '../lib/dates.js'
import OverflowMenu from '../components/OverflowMenu.jsx'

function currentWeekRange() {
  const start = startOfWeek(new Date())
  return { start: toLocalISODate(start), end: toLocalISODate(addDays(start, 6)) }
}

function formatRangeLabel(startIso, endIso) {
  const start = new Date(`${startIso}T00:00:00`)
  const end = new Date(`${endIso}T00:00:00`)
  const startMonth = start.toLocaleDateString('de-DE', { month: 'short' })
  const endMonth = end.toLocaleDateString('de-DE', { month: 'short' })
  if (startMonth === endMonth) return `${start.getDate()}.–${end.getDate()}. ${endMonth}`
  return `${start.getDate()}. ${startMonth} – ${end.getDate()}. ${endMonth}`
}

export default function ShoppingList() {
  const initialRange = currentWeekRange()
  const [items, setItems] = useState([])
  const [startDate, setStartDate] = useState(initialRange.start)
  const [endDate, setEndDate] = useState(initialRange.end)
  const [editingRange, setEditingRange] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [mealCount, setMealCount] = useState(null)
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
      setMealCount(entriesFound)
      await refresh()
      if (entriesFound === 0) {
        setGenerateInfo('Für diesen Zeitraum ist im Kalender nichts geplant.')
      } else if (ingredientsAdded === 0) {
        setGenerateInfo('Die geplanten Rezepte haben noch keine Zutaten.')
      } else {
        setGenerateInfo(`${ingredientsAdded} Zutat${ingredientsAdded === 1 ? '' : 'en'} aktualisiert.`)
      }
    } catch (e) {
      setError(`Liste konnte nicht erstellt werden: ${e.message}`)
    } finally {
      setGenerating(false)
    }
  }

  async function handleToggle(item) {
    setError(null)
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)))
    try {
      await toggleChecked(item.id, !item.checked)
    } catch (e) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: item.checked } : i)))
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

  const doneCount = items.filter((i) => i.checked).length
  const allChecked = items.length > 0 && doneCount === items.length

  return (
    <div className="page">
      <div className="page-head">
        <h1>Einkauf</h1>
        <span className="row" style={{ gap: 8 }}>
          <span className="mono-label">
            {items.length > 0 ? `${doneCount} / ${items.length} erledigt` : ''}
          </span>
          <OverflowMenu items={[{ label: 'Liste leeren', danger: true, onSelect: handleClear }]} />
        </span>
      </div>

      {error && <p role="alert">{error}</p>}

      {items.length > 0 && (
        <div className="progress-track">
          {items.map((item) => (
            <span key={item.id} className={item.checked ? 'progress-seg done' : 'progress-seg'} />
          ))}
        </div>
      )}

      <div className="glass range-bar" onClick={() => setEditingRange((v) => !v)}>
        <div>
          <div className="range-title">
            {startDate === initialRange.start && endDate === initialRange.end ? 'Diese Woche' : 'Zeitraum'}
          </div>
          <div className="range-meta">
            {formatRangeLabel(startDate, endDate)}
            {mealCount !== null ? ` · ${mealCount} Gerichte` : ''}
          </div>
        </div>
        <motion.button
          className="btn-primary"
          whileTap={{ scale: 0.96 }}
          disabled={generating}
          onClick={(e) => {
            e.stopPropagation()
            handleGenerate()
          }}
        >
          {generating ? '…' : 'Aktualisieren'}
        </motion.button>
      </div>

      <AnimatePresence>
        {editingRange && (
          <motion.div
            className="glass range-edit"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label>
              Von
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label>
              Bis
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </motion.div>
        )}
      </AnimatePresence>

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

      {items.length > 0 ? (
        <ul className="glass checklist" style={{ marginTop: 16 }}>
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.18 }}
                onClick={() => handleToggle(item)}
              >
                <motion.span
                  className={item.checked ? 'check-box checked' : 'check-box'}
                  animate={{ scale: item.checked ? [1, 1.18, 1] : 1 }}
                  transition={{ duration: 0.25 }}
                >
                  {item.checked ? '✓' : ''}
                </motion.span>
                {[item.quantity, item.unit].filter(Boolean).length > 0 && (
                  <span className="check-amount">
                    {[item.quantity, item.unit].filter(Boolean).join(' ')}
                  </span>
                )}
                <span className={item.checked ? 'check-name checked' : 'check-name'}>{item.name}</span>
                <button
                  className="btn-ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(item.id)
                  }}
                  aria-label="Entfernen"
                >
                  ✕
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <p className="empty-state" style={{ marginTop: 16 }}>Liste ist leer.</p>
      )}

      <AnimatePresence>
        {allChecked && (
          <motion.p
            className="celebration"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            🎉 Alles erledigt!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
