import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useDragControls, useMotionValue, useTransform } from 'framer-motion'
import {
  getWeekEntries,
  addEntry,
  removeEntry,
  updateEntryServings,
  getRecentRecipes,
} from '../lib/mealEntries.js'
import { listRecipes } from '../lib/recipes.js'
import { toLocalISODate as toISODate, startOfWeek, addDays } from '../lib/dates.js'
import Stepper from '../components/Stepper.jsx'
import PlusIcon from '../components/PlusIcon.jsx'

const DAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function formatRange(start, end) {
  const startMonth = start.toLocaleDateString('de-DE', { month: 'short' })
  const endMonth = end.toLocaleDateString('de-DE', { month: 'short' })
  if (startMonth === endMonth) return `${start.getDate()}.–${end.getDate()}. ${endMonth}`
  return `${start.getDate()}. ${startMonth} – ${end.getDate()}. ${endMonth}`
}

export default function Calendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [entriesByDate, setEntriesByDate] = useState({})
  const [recipes, setRecipes] = useState([])
  const [recent, setRecent] = useState([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [pickerTags, setPickerTags] = useState([])
  const [error, setError] = useState(null)
  const dragControls = useDragControls()

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const weekEnd = addDays(weekStart, 6)
  const selectedIso = toISODate(selectedDay)
  const entries = entriesByDate[selectedIso] ?? []

  useEffect(() => {
    listRecipes()
      .then(setRecipes)
      .catch((e) => setError(`Rezepte konnten nicht geladen werden: ${e.message}`))
    getRecentRecipes(3)
      .then(setRecent)
      .catch(() => {})
  }, [])

  useEffect(() => {
    setError(null)
    getWeekEntries(toISODate(weekStart), toISODate(weekEnd))
      .then((rows) => {
        const map = {}
        for (const entry of rows) {
          if (!map[entry.date]) map[entry.date] = []
          map[entry.date].push(entry)
        }
        setEntriesByDate(map)
      })
      .catch((e) => setError(`Diese Woche konnte nicht geladen werden: ${e.message}`))
  }, [weekStart])

  function changeWeek(delta) {
    const index = days.findIndex((d) => toISODate(d) === selectedIso)
    const nextStart = addDays(weekStart, delta * 7)
    setWeekStart(nextStart)
    setSelectedDay(addDays(nextStart, index >= 0 ? index : 0))
  }

  async function quickAdd(recipe) {
    const iso = selectedIso
    const tempId = `temp-${recipe.id}-${entries.length}`
    const optimistic = { id: tempId, date: iso, recipe_id: recipe.id, servings: 1, recipes: recipe }
    setError(null)
    setEntriesByDate((prev) => ({ ...prev, [iso]: [...(prev[iso] ?? []), optimistic] }))
    try {
      const saved = await addEntry(iso, recipe.id, 1)
      setEntriesByDate((prev) => ({
        ...prev,
        [iso]: (prev[iso] ?? []).map((e) => (e.id === tempId ? saved : e)),
      }))
    } catch (e) {
      setEntriesByDate((prev) => ({ ...prev, [iso]: (prev[iso] ?? []).filter((e) => e.id !== tempId) }))
      setError(`Das Gericht konnte nicht gespeichert werden: ${e.message}`)
    }
  }

  function handleServingsChange(entryId, value) {
    setEntriesByDate((prev) => ({
      ...prev,
      [selectedIso]: (prev[selectedIso] ?? []).map((e) => (e.id === entryId ? { ...e, servings: value } : e)),
    }))
    updateEntryServings(entryId, value).catch((e) =>
      setError(`Portionen konnten nicht gespeichert werden: ${e.message}`)
    )
  }

  async function handleRemove(entryId) {
    const iso = selectedIso
    const previous = entriesByDate[iso] ?? []
    setError(null)
    setEntriesByDate((prev) => ({ ...prev, [iso]: previous.filter((e) => e.id !== entryId) }))
    try {
      await removeEntry(entryId)
    } catch (e) {
      setEntriesByDate((prev) => ({ ...prev, [iso]: previous }))
      setError(`Konnte nicht entfernt werden: ${e.message}`)
    }
  }

  function togglePickerTag(tag) {
    setPickerTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const pickerTagOptions = useMemo(() => {
    const set = new Set()
    for (const r of recipes) for (const tag of r.tags ?? []) set.add(tag)
    return [...set].sort((a, b) => a.localeCompare(b, 'de'))
  }, [recipes])

  const pickerResults = recipes.filter((r) => {
    const q = pickerQuery.toLowerCase()
    const matchesQuery =
      r.title.toLowerCase().includes(q) ||
      (r.ingredients ?? []).some((ing) => (ing.name ?? '').toLowerCase().includes(q))
    const matchesTags = pickerTags.length === 0 || pickerTags.some((tag) => r.tags?.includes(tag))
    return matchesQuery && matchesTags
  })

  return (
    <div className="page">
      {error && <p role="alert">{error}</p>}

      <motion.div
        className="glass glass-strong week-head"
        data-no-tab-swipe
        onPanEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 60 && Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
            changeWeek(info.offset.x < 0 ? 1 : -1)
          }
        }}
      >
        <div className="week-head-row" style={{ position: 'relative', zIndex: 1 }}>
          <h1>Diese Woche</h1>
          <span className="week-range">{formatRange(weekStart, weekEnd)}</span>
        </div>
        <div className="week-strip" style={{ position: 'relative', zIndex: 1 }}>
          {days.map((day, i) => {
            const iso = toISODate(day)
            const isSelected = iso === selectedIso
            const hasEntries = (entriesByDate[iso] ?? []).length > 0
            return (
              <button
                key={iso}
                className={isSelected ? 'week-day selected' : 'week-day'}
                onClick={() => setSelectedDay(day)}
              >
                {isSelected && (
                  <motion.span
                    layoutId="week-day-pill"
                    className="week-day-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="week-day-name">{DAY_NAMES[i]}</span>
                <span className="week-day-num">{day.getDate()}</span>
                <span className={hasEntries ? 'week-day-dot filled' : 'week-day-dot'} />
              </button>
            )
          })}
        </div>
      </motion.div>

      <div className="day-title-row">
        <h2>{selectedDay.toLocaleDateString('de-DE', { weekday: 'long' })}</h2>
        <span className="day-count">
          {entries.length === 1 ? '1 Gericht' : `${entries.length} Gerichte`}
        </span>
      </div>

      {entries.length === 0 && <p className="empty-state">Noch nichts geplant.</p>}

      <ul className="entry-list">
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.li
              key={entry.id}
              className="entry-swipe"
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: -10 }}
              transition={{ duration: 0.2 }}
            >
              <EntryCard
                entry={entry}
                onRemove={() => handleRemove(entry.id)}
                onServings={(v) => handleServingsChange(entry.id, v)}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className="quick-section">
        <span className="mono-label">Zuletzt geplant · 1 Tap</span>
        <div className="quick-chips">
          {recent.map((r) => (
            <motion.button
              key={r.id}
              className="glass quick-chip"
              whileTap={{ scale: 0.96 }}
              onClick={() => quickAdd(r)}
            >
              <span className="quick-chip-thumb">
                {r.photo_url ? <img src={r.photo_url} alt="" /> : '🍽️'}
              </span>
              <span className="quick-chip-label">{r.title}</span>
            </motion.button>
          ))}
          <motion.button
            className="quick-chip quick-chip-all"
            whileTap={{ scale: 0.96 }}
            onClick={() => setSheetOpen(true)}
          >
            + Alle Rezepte
          </motion.button>
        </div>
      </div>

      {/* Portaled to <body>: inside the page it would be trapped under the transformed
          transition wrapper and paint behind the nav bar. */}
      {createPortal(
        <AnimatePresence>
          {sheetOpen && (
            <>
              <motion.div
                className="sheet-scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSheetOpen(false)}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                className="sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                drag="y"
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.7 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 70 || info.velocity.y > 350) setSheetOpen(false)
                }}
              >
                {/* The whole top block drags, not just the handle — the body below scrolls,
                    so the drag zone can't extend into it without fighting that scroll. */}
                <div
                  className="sheet-grip"
                  onPointerDown={(e) => dragControls.start(e)}
                  style={{ touchAction: 'none' }}
                >
                  <div className="sheet-handle" />
                  <div className="sheet-head">
                    <span className="sheet-title">
                      Für{' '}
                      {selectedDay.toLocaleDateString('de-DE', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <button className="sheet-done" onClick={() => setSheetOpen(false)}>
                      Fertig
                    </button>
                  </div>
                </div>

                <div className="glass search-field">
                  <SearchIcon />
                  <input
                    type="search"
                    placeholder="Suchen — Titel oder Zutat"
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                  />
                </div>

                {pickerTagOptions.length > 0 && (
                  <div className="tag-row" style={{ marginBottom: 12 }}>
                    {pickerTagOptions.map((tag) => (
                      <button
                        key={tag}
                        className={pickerTags.includes(tag) ? 'tag-toggle active' : 'tag-toggle'}
                        onClick={() => togglePickerTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="sheet-body">
                  {pickerResults.map((r) => (
                    <div key={r.id} className="glass picker-row">
                      <span className="picker-thumb">
                        {r.photo_url ? <img src={r.photo_url} alt="" /> : '🍽️'}
                      </span>
                      <span className="picker-body">
                        <span className="picker-title">{r.title}</span>
                        <span className="subline">{(r.ingredients ?? []).length} Zutaten</span>
                      </span>
                      <motion.button
                        className="picker-add"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => quickAdd(r)}
                        aria-label={`${r.title} hinzufügen`}
                      >
                        <PlusIcon size={15} />
                      </motion.button>
                    </div>
                  ))}
                  {pickerResults.length === 0 && (
                    <p className="empty-state">Keine Rezepte gefunden.</p>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

function EntryCard({ entry, onRemove, onServings }) {
  const x = useMotionValue(0)
  // The card is translucent glass, so the delete backdrop has to fade in with the drag —
  // otherwise it would tint every card red at rest.
  const bgOpacity = useTransform(x, [-80, -10], [1, 0])

  return (
    <>
      <motion.div className="entry-swipe-bg" style={{ opacity: bgOpacity }}>
        🗑
      </motion.div>
      <motion.div
        className="glass entry-card"
        data-no-tab-swipe
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -110, right: 0 }}
        dragElastic={0.12}
        dragSnapToOrigin
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) onRemove()
        }}
      >
        <Link
          to={`/recipes/${entry.recipe_id}`}
          state={{ portions: entry.servings ?? 1 }}
          className="entry-link"
        >
          <span className="entry-thumb">
            {entry.recipes?.photo_url ? <img src={entry.recipes.photo_url} alt="" /> : '🍽️'}
          </span>
          <span className="entry-body">
            <span className="entry-title">{entry.recipes?.title ?? 'Unbekanntes Rezept'}</span>
            <span className="subline">{(entry.recipes?.ingredients ?? []).length} Zutaten</span>
          </span>
        </Link>
        <Stepper size="sm" value={entry.servings ?? 1} onChange={onServings} />
      </motion.div>
    </>
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
