import { useEffect, useState } from 'react'
import {
  listItems,
  generateFromRange,
  addManualItem,
  toggleChecked,
  deleteItem,
  clearList,
} from '../lib/shoppingList.js'

function toLocalISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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

  async function refresh() {
    setItems(await listItems())
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleGenerate() {
    setGenerating(true)
    await generateFromRange(startDate, endDate)
    await refresh()
    setGenerating(false)
  }

  async function handleToggle(item) {
    await toggleChecked(item.id, !item.checked)
    await refresh()
  }

  async function handleDelete(id) {
    await deleteItem(id)
    await refresh()
  }

  async function handleAddManual(e) {
    e.preventDefault()
    if (!newName.trim()) return
    await addManualItem(newName.trim(), null, null)
    setNewName('')
    await refresh()
  }

  async function handleClear() {
    if (!confirm('Clear the entire shopping list?')) return
    await clearList()
    await refresh()
  }

  return (
    <div className="page">
      <h1>Shopping list</h1>

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
