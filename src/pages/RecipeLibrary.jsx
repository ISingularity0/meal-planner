import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { listRecipes, deleteTagEverywhere } from '../lib/recipes.js'
import OverflowMenu from '../components/OverflowMenu.jsx'
import PlusIcon from '../components/PlusIcon.jsx'

const gridVariants = { animate: { transition: { staggerChildren: 0.04 } } }
const cardVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

export default function RecipeLibrary() {
  const navigate = useNavigate()
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
    const q = query.toLowerCase()
    const matchesQuery =
      r.title.toLowerCase().includes(q) ||
      (r.ingredients ?? []).some((ing) => (ing.name ?? '').toLowerCase().includes(q))
    const matchesTags = activeTags.length === 0 || activeTags.some((tag) => r.tags?.includes(tag))
    return matchesQuery && matchesTags
  })

  return (
    <div className="page">
      <div className="page-head">
        <h1>Rezepte</h1>
        {allTags.length > 0 && (
          <OverflowMenu
            items={[
              {
                label: managingTags ? 'Tags fertig bearbeiten' : 'Tags verwalten',
                onSelect: () => setManagingTags((v) => !v),
              },
            ]}
          />
        )}
      </div>

      {error && <p role="alert">{error}</p>}

      <div className="glass search-field">
        <SearchIcon />
        <input
          type="search"
          placeholder="Suchen — Titel oder Zutat"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {allTags.length > 0 && (
        <div className="tag-row" style={{ marginBottom: 14 }}>
          {allTags.map((tag) =>
            managingTags ? (
              <span key={tag} className="tag-toggle tag-manage">
                {tag}
                <button
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
                className={activeTags.includes(tag) ? 'tag-toggle active' : 'tag-toggle'}
                onClick={() => toggleTagFilter(tag)}
              >
                {tag}
              </button>
            )
          )}
        </div>
      )}

      {loading && <p className="empty-state">Lädt…</p>}

      <motion.div className="recipe-grid" variants={gridVariants} initial="initial" animate="animate">
        {filtered.map((r) => (
          <motion.div key={r.id} variants={cardVariants} layout>
            <Link to={`/recipes/${r.id}`} className="glass recipe-card">
              <span className="recipe-card-photo">
                {r.photo_url ? <img src={r.photo_url} alt="" /> : '🍽️'}
              </span>
              <span className="recipe-card-body">
                <span className="recipe-card-title">{r.title}</span>
                <span className="recipe-card-sub">
                  {(r.ingredients ?? []).length} Zutaten
                  {r.prep_minutes ? ` · ${r.prep_minutes} Min` : ''}
                </span>
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {!loading && !error && filtered.length === 0 && (
        <p className="empty-state">
          {recipes.length === 0 ? 'Noch keine Rezepte.' : 'Keine Rezepte passen zu dieser Auswahl.'}
        </p>
      )}

      <motion.button
        className="fab"
        whileTap={{ scale: 0.92 }}
        onClick={() => navigate('/recipes/new')}
        aria-label="Rezept hinzufügen"
      >
        <PlusIcon size={24} />
      </motion.button>
    </div>
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
