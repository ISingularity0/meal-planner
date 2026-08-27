import { useEffect, useState } from 'react'
import { getWeekSlots, assignSlot, clearSlot } from '../lib/mealSlots.js'
import { listRecipes } from '../lib/recipes.js'

const SLOTS = ['breakfast', 'lunch', 'dinner']

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day // Monday as first day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toISODate(date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export default function Calendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [slotsByKey, setSlotsByKey] = useState({})
  const [recipes, setRecipes] = useState([])
  const [pickerTarget, setPickerTarget] = useState(null) // { date, slot } | null

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = addDays(weekStart, 6)

  useEffect(() => {
    listRecipes().then(setRecipes)
  }, [])

  useEffect(() => {
    getWeekSlots(toISODate(weekStart), toISODate(weekEnd)).then((slots) => {
      const map = {}
      for (const s of slots) map[`${s.date}_${s.slot}`] = s
      setSlotsByKey(map)
    })
  }, [weekStart])

  async function handlePick(recipeId) {
    const { date, slot } = pickerTarget
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
    setPickerTarget(null)
  }

  return (
    <div className="page">
      <h1>Calendar</h1>
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
        <div role="dialog">
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
