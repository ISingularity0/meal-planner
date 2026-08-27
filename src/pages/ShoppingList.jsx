import { useEffect, useState } from 'react'
import {
  listItems,
  generateFromRange,
  addManualItem,
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
  const [newName, setNewName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  async function refresh() {
    setItems(await listItems())
  }

  useEffect(() => {
    refresh().catch((e) => setError(`Could not load the list: ${e.message}`))
  }, [])

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      await generateFromRange(startDate, endDate)
      await refresh()
    } catch (e) {
      setError(`Could not generate the list: ${e.message}`)
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
      setError(`Could not update that item: ${e.message}`)
    }
  }

  async function handleDelete(id) {
    setError(null)
    try {
      await deleteItem(id)
      await refresh()
    } catch (e) {
      setError(`Could not remove that item: ${e.message}`)
    }
  }

  async function handleAddManual(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setError(null)
    try {
      await addManualItem(newName.trim(), null, null)
      setNewName('')
      await refresh()
    } catch (e) {
      setError(`Could not add that item: ${e.message}`)
    }
  }

  async function handleClear() {
    if (!confirm('Clear the entire shopping list?')) return
    setError(null)
    try {
      await clearList()
      await refresh()
    } catch (e) {
      setError(`Could not clear the list: ${e.message}`)
    }
  }

  return (
    <div className="page">
      <h1>Shopping list</h1>
      {error && <p role="alert">{error}</p>}

      <div>
        <label>
          From
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <button onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating…' : 'Generate from this range'}
        </button>
      </div>

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <label>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => handleToggle(item)}
              />
              <span style={{ textDecoration: item.checked ? 'line-through' : 'none' }}>
                {[item.quantity, item.unit, item.name].filter(Boolean).join(' ')}
              </span>
            </label>
            <button onClick={() => handleDelete(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
      {items.length === 0 && <p>List is empty.</p>}

      <form onSubmit={handleAddManual}>
        <input
          placeholder="Add item…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <button onClick={handleClear}>Clear list</button>
    </div>
  )
}
