import { useEffect, useState } from 'react'
import { getWeekSlots, assignSlot, clearSlot } from '../lib/mealSlots.js'
import { listRecipes } from '../lib/recipes.js'
import { toLocalISODate as toISODate, startOfWeek, addDays } from '../lib/dates.js'

const SLOTS = ['breakfast', 'lunch', 'dinner']

export default function Calendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [slotsByKey, setSlotsByKey] = useState({})
  const [recipes, setRecipes] = useState([])
  const [pickerTarget, setPickerTarget] = useState(null) // { date, slot } | null
  const [error, setError] = useState(null)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = addDays(weekStart, 6)

  useEffect(() => {
    listRecipes()
      .then(setRecipes)
      .catch((e) => setError(`Could not load recipes: ${e.message}`))
  }, [])

  useEffect(() => {
    setError(null)
    getWeekSlots(toISODate(weekStart), toISODate(weekEnd))
      .then((slots) => {
        const map = {}
        for (const s of slots) map[`${s.date}_${s.slot}`] = s
        setSlotsByKey(map)
      })
      .catch((e) => setError(`Could not load this week: ${e.message}`))
  }, [weekStart])

  async function handlePick(recipeId) {
    const { date, slot } = pickerTarget
    setError(null)
    try {
      if (recipeId === null) {
        await clearSlot(date, slot)
        setSlotsByKey((prev) => {
          const next = { ...prev }
          delete next[`${date}_${slot}`]
          return next
        })
      } else {
        const saved = await assignSlot(date, slot, recipeId)
        setSlotsByKey((prev) => ({ ...prev, [`${date}_${slot}`]: saved }))
      }
    } catch (e) {
      setError(`Could not save that meal: ${e.message}`)
    } finally {
      setPickerTarget(null) // the dialog is an opaque overlay; close it so the error is visible
    }
  }

  return (
    <div className="page">
      <h1>Calendar</h1>
      {error && <p role="alert">{error}</p>}
      <div>
        <button onClick={() => setWeekStart(addDays(weekStart, -7))}>&larr; Prev week</button>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))}>Next week &rarr;</button>
      </div>

      {days.map((day) => {
        const iso = toISODate(day)
        return (
          <div key={iso}>
            <h2>{day.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
            {SLOTS.map((slot) => {
              const entry = slotsByKey[`${iso}_${slot}`]
              return (
                <div key={slot}>
                  <strong>{slot}: </strong>
                  <button onClick={() => setPickerTarget({ date: iso, slot })}>
                    {entry?.recipes?.title ?? 'Tap to assign'}
                  </button>
                </div>
              )
            })}
          </div>
        )
      })}

      {pickerTarget && (
        <div role="dialog" aria-modal="true" className="dialog">
          <h2>
            Pick a recipe for {pickerTarget.slot} on {pickerTarget.date}
          </h2>
          <button onClick={() => handlePick(null)}>Clear</button>
          <ul>
            {recipes.map((r) => (
              <li key={r.id}>
                <button onClick={() => handlePick(r.id)}>{r.title}</button>
              </li>
            ))}
          </ul>
          <button onClick={() => setPickerTarget(null)}>Cancel</button>
        </div>
      )}
    </div>
  )
}
