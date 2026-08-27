import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { listRecipes, deleteTagEverywhere } from '../lib/recipes.js'

const listVariants = {
  animate: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
}

export default function RecipeLibrary() {
  const [recipes, setRecipes] = useState([])
  const [query, setQuery] = useState('')
  const [activeTags, setActiveTags] = useState([])
  const [managingTags, setManagingTags] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    listRecipes()
      .then(setRecipes)
      .catch((e) => setError(`Rezepte konnten nicht geladen werden: ${e.message}`))
      .finally(() => setLoading(false))
  }, [])

  const allTags = useMemo(() => {
    const set = new Set()
    for (const r of recipes) for (const tag of r.tags ?? []) set.add(tag)
    return [...set].sort((a, b) => a.localeCompare(b, 'de'))
  }, [recipes])

  function toggleTagFilter(tag) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  async function handleDeleteTag(tag) {
    if (!confirm(`Tag "${tag}" von allen Rezepten entfernen?`)) return
    setError(null)
    try {
      await deleteTagEverywhere(tag)
      setRecipes((prev) => prev.map((r) => ({ ...r, tags: (r.tags ?? []).filter((t) => t !== tag) })))
      setActiveTags((prev) => prev.filter((t) => t !== tag))
    } catch (e) {
      setError(`Tag konnte nicht gelöscht werden: ${e.message}`)
    }
  }

  const filtered = recipes.filter((r) => {
    const matchesQuery = r.title.toLowerCase().includes(query.toLowerCase())
    const matchesTags = activeTags.length === 0 || activeTags.some((tag) => r.tags?.includes(tag))
    return matchesQuery && matchesTags
  })

  return (
    <div className="page">
      <h1>Rezepte</h1>
      {error && <p role="alert">{error}</p>}
      <input
        className="search-input"
        type="search"
        placeholder="Rezepte durchsuchen…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {allTags.length > 0 && (
        <>
          <div className="tag-row" style={{ marginBottom: '0.5rem' }}>
            {allTags.map((tag) =>
              managingTags ? (
                <span key={tag} className="tag-toggle tag-manage">
                  {tag}
                  <button
                    type="button"
                    className="tag-delete"
                    onClick={() => handleDeleteTag(tag)}
                    aria-label={`Tag ${tag} löschen`}
                  >
                    ✕
                  </button>
                </span>
              ) : (
                <button
                  key={tag}
                  type="button"
                  className={activeTags.includes(tag) ? 'tag-toggle active' : 'tag-toggle'}
                  onClick={() => toggleTagFilter(tag)}
                >
                  {tag}
                </button>
              )
            )}
          </div>
          <button
            type="button"
            className="tag-manage-toggle"
            style={{ marginBottom: '1rem' }}
            onClick={() => setManagingTags((v) => !v)}
          >
            {managingTags ? '✓ Fertig' : '🏷️ Tags verwalten'}
          </button>
        </>
      )}

      <Link to="/recipes/new" className="btn btn-primary btn-block" style={{ marginBottom: '1.25rem' }}>
        + Rezept hinzufügen
      </Link>
      {loading && <p>Lädt…</p>}
      <motion.ul className="recipe-list" variants={listVariants} initial="initial" animate="animate">
        {filtered.map((r) => (
          <motion.li key={r.id} variants={itemVariants} layout>
            <Link to={`/recipes/${r.id}`} className="card recipe-card">
              <div className="recipe-thumb">
                {r.photo_url ? (
                  <img src={r.photo_url} alt="" />
                ) : (
                  <span className="recipe-thumb-placeholder">🍽️</span>
                )}
              </div>
              <div className="recipe-card-body">
                <span className="recipe-card-title">{r.title}</span>
                {r.tags?.length > 0 && (
                  <div className="tag-row">
                    {r.tags.map((tag) => (
                      <span key={tag} className="tag-pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
      {!loading && !error && filtered.length === 0 && (
        <p className="empty-state">
          {recipes.length === 0 ? 'Noch keine Rezepte.' : 'Keine Rezepte passen zu dieser Auswahl.'}
        </p>
      )}
    </div>
  )
}
