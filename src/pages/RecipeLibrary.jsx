import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listRecipes } from '../lib/recipes.js'

export default function RecipeLibrary() {
  const [recipes, setRecipes] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    listRecipes()
      .then(setRecipes)
      .catch((e) => setError(`Could not load recipes: ${e.message}`))
      .finally(() => setLoading(false))
  }, [])

  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="page">
      <h1>Recipes</h1>
      {error && <p role="alert">{error}</p>}
      <input
        type="search"
        placeholder="Search recipes…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Link to="/recipes/new">+ Add recipe</Link>
      {loading && <p>Loading…</p>}
      <ul>
        {filtered.map((r) => (
          <li key={r.id}>
            <Link to={`/recipes/${r.id}`}>{r.title}</Link>
          </li>
        ))}
      </ul>
      {!loading && !error && filtered.length === 0 && <p>No recipes yet.</p>}
    </div>
  )
}
