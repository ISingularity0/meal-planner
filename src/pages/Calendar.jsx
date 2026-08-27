import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getWeekEntries, addEntry, removeEntry, updateEntryServings } from '../lib/mealEntries.js'
import { listRecipes } from '../lib/recipes.js'
import { toLocalISODate as toISODate, startOfWeek, addDays } from '../lib/dates.js'
import Stepper from '../components/Stepper.jsx'

const listVariants = {
  animate: { transition: { staggerChildren: 0.06 } },
}

const cardVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
}

const stepVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, delay: 0.08 } },
  exit: { opacity: 0, transition: { duration: 0.08 } },
}

export default function Calendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [entriesByDate, setEntriesByDate] = useState({})
  const [recipes, setRecipes] = useState([])
  const [pickerDay, setPickerDay] = useState(null) // Date | null
  const [pickerStep, setPickerStep] = useState('recipe') // 'recipe' | 'portions'
  const [pickerQuery, setPickerQuery] = useState('')
  const [pickerTags, setPickerTags] = useState([])
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [portions, setPortions] = useState(1)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = addDays(weekStart, 6)

  useEffect(() => {
    listRecipes()
      .then(setRecipes)
      .catch((e) => setError(`Rezepte konnten nicht geladen werden: ${e.message}`))
  }, [])

  useEffect(() => {
    setError(null)
    getWeekEntries(toISODate(weekStart), toISODate(weekEnd))
      .then((entries) => {
        const map = {}
        for (const entry of entries) {
          if (!map[entry.date]) map[entry.date] = []
          map[entry.date].push(entry)
        }
        setEntriesByDate(map)
      })
      .catch((e) => setError(`Diese Woche konnte nicht geladen werden: ${e.message}`))
  }, [weekStart])

  function openPicker(day) {
    setPickerDay(day)
    setPickerStep('recipe')
    setPickerQuery('')
    setPickerTags([])
    setSelectedRecipe(null)
    setPortions(1)
  }

  function closePicker() {
    setPickerDay(null)
  }

  function selectRecipe(recipe) {
    setSelectedRecipe(recipe)
    setPortions(1)
    setPickerStep('portions')
  }

  function backToRecipes() {
    setPickerStep('recipe')
    setSelectedRecipe(null)
  }

  async function confirmAdd() {
    const iso = toISODate(pickerDay)
    setAdding(true)
    setError(null)
    try {
      const saved = await addEntry(iso, selectedRecipe.id, portions)
      setEntriesByDate((prev) => ({
        ...prev,
        [iso]: [...(prev[iso] ?? []), saved],
      }))
      closePicker()
    } catch (e) {
      setError(`Das Gericht konnte nicht gespeichert werden: ${e.message}`)
    } finally {
      setAdding(false)
    }
  }

  function handleServingsChange(iso, entryId, value) {
    setEntriesByDate((prev) => ({
      ...prev,
      [iso]: (prev[iso] ?? []).map((entry) => (entry.id === entryId ? { ...entry, servings: value } : entry)),
    }))
    updateEntryServings(entryId, value).catch((e) =>
      setError(`Portionen konnten nicht gespeichert werden: ${e.message}`)
    )
  }

  async function handleRemove(iso, entryId) {
    setError(null)
    try {
      await removeEntry(entryId)
      setEntriesByDate((prev) => ({
        ...prev,
        [iso]: (prev[iso] ?? []).filter((entry) => entry.id !== entryId),
      }))
    } catch (e) {
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
    const matchesQuery = r.title.toLowerCase().includes(pickerQuery.toLowerCase())
    const matchesTags = pickerTags.length === 0 || pickerTags.some((tag) => r.tags?.includes(tag))
    return matchesQuery && matchesTags
  })

  return (
    <div className="page">
      <h1>Kalender</h1>
      {error && <p role="alert">{error}</p>}

      <div className="row week-nav">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setWeekStart(addDays(weekStart, -7))}>
          &larr; Vorige Woche
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setWeekStart(addDays(weekStart, 7))}>
          Nächste Woche &rarr;
        </motion.button>
      </div>

      <motion.div variants={listVariants} initial="initial" animate="animate" key={toISODate(weekStart)}>
        {days.map((day) => {
          const iso = toISODate(day)
          const entries = entriesByDate[iso] ?? []
          return (
            <motion.div key={iso} className="card day-card" variants={cardVariants} layout>
              <h2>{day.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' })}</h2>
              {entries.length === 0 && <p className="empty-state">Noch nichts geplant.</p>}
              <ul className="entry-list">
                <AnimatePresence initial={false}>
                  {entries.map((entry) => (
                    <motion.li
                      key={entry.id}
                      className="entry-row"
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Link
                        to={`/recipes/${entry.recipe_id}`}
                        state={{ portions: entry.servings ?? 1 }}
                        className="entry-info"
                      >
                        <span className="entry-thumb">
                          {entry.recipes?.photo_url ? (
                            <img src={entry.recipes.photo_url} alt="" />
                          ) : (
                            <span className="recipe-thumb-placeholder">🍽️</span>
                          )}
                        </span>
                        <span className="entry-title">{entry.recipes?.title ?? 'Unbekanntes Rezept'}</span>
                      </Link>
                      <Stepper
                        size="sm"
                        value={entry.servings ?? 1}
                        onChange={(v) => handleServingsChange(iso, entry.id, v)}
                      />
                      <button className="btn-ghost" onClick={() => handleRemove(iso, entry.id)}>
                        ✕
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              <button className="btn-block" onClick={() => openPicker(day)}>
                + Rezept hinzufügen
              </button>
            </motion.div>
          )
        })}
      </motion.div>

      <AnimatePresence>
        {pickerDay && (
          <motion.div
            role="dialog"
            aria-modal="true"
            className="dialog"
            layout
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ y: { type: 'spring', stiffness: 320, damping: 34 }, layout: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
          >
            <div className="dialog-handle" />

            <AnimatePresence mode="wait">
              {pickerStep === 'recipe' ? (
                <motion.div key="recipe-step" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                  <div className="dialog-header">
                    <h2>
                      Rezept für {pickerDay.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h2>
                    <button className="btn-ghost" onClick={closePicker}>
                      Abbrechen
                    </button>
                  </div>

                  <input
                    className="search-input"
                    type="search"
                    placeholder="Rezepte durchsuchen…"
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                  />

                  {pickerTagOptions.length > 0 && (
                    <div className="tag-row" style={{ marginBottom: '0.9rem' }}>
                      {pickerTagOptions.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className={pickerTags.includes(tag) ? 'tag-toggle active' : 'tag-toggle'}
                          onClick={() => togglePickerTag(tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}

                  <ul className="dialog-list">
                    {pickerResults.map((r) => (
                      <motion.li key={r.id} whileTap={{ scale: 0.98 }}>
                        <button className="picker-card" onClick={() => selectRecipe(r)}>
                          <span className="recipe-thumb">
                            {r.photo_url ? (
                              <img src={r.photo_url} alt="" />
                            ) : (
                              <span className="recipe-thumb-placeholder">🍽️</span>
                            )}
                          </span>
                          <span className="recipe-card-body">
                            <span className="recipe-card-title">{r.title}</span>
                            {r.tags?.length > 0 && (
                              <span className="tag-row">
                                {r.tags.map((tag) => (
                                  <span key={tag} className="tag-pill">
                                    {tag}
                                  </span>
                                ))}
                              </span>
                            )}
                          </span>
                        </button>
                      </motion.li>
                    ))}
                    {pickerResults.length === 0 && <p className="empty-state">Keine Rezepte gefunden.</p>}
                  </ul>
                </motion.div>
              ) : (
                <motion.div key="portions-step" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                  <div className="dialog-header">
                    <h2>Wie viele Portionen?</h2>
                    <button className="btn-ghost" onClick={closePicker}>
                      Abbrechen
                    </button>
                  </div>

                  <div className="portions-recipe">
                    <span className="recipe-thumb">
                      {selectedRecipe?.photo_url ? (
                        <img src={selectedRecipe.photo_url} alt="" />
                      ) : (
                        <span className="recipe-thumb-placeholder">🍽️</span>
                      )}
                    </span>
                    <span className="recipe-card-title">{selectedRecipe?.title}</span>
                  </div>

                  <div className="portions-stepper-wrap">
                    <Stepper size="lg" value={portions} onChange={setPortions} />
                  </div>

                  <div className="row detail-actions" style={{ marginTop: '1.5rem' }}>
                    <button onClick={backToRecipes}>Zurück</button>
                    <motion.button
                      className="btn-primary"
                      onClick={confirmAdd}
                      disabled={adding}
                      whileTap={{ scale: 0.97 }}
                    >
                      {adding ? 'Speichert…' : 'Hinzufügen'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
