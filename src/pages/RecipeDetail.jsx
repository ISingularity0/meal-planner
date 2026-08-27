import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getRecipe, deleteRecipe } from '../lib/recipes.js'

function scaleQuantity(quantity, factor) {
  const num = Number(quantity)
  if (!num || !factor || factor === 1) return quantity
  return Number((num * factor).toFixed(2)).toString()
}

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [recipe, setRecipe] = useState(null)
  const [error, setError] = useState(null)

  const portions = location.state?.portions ?? null

  useEffect(() => {
    setError(null)
    getRecipe(id)
      .then(setRecipe)
      .catch((e) => setError(`Rezept konnte nicht geladen werden: ${e.message}`))
  }, [id])

  async function handleDelete() {
    if (!confirm('Dieses Rezept löschen?')) return
    setError(null)
    try {
      await deleteRecipe(id)
      navigate('/recipes')
    } catch (e) {
      setError(`Rezept konnte nicht gelöscht werden: ${e.message}`)
    }
  }

  if (error && !recipe) return <div className="page"><p role="alert">{error}</p></div>
  if (!recipe) return <div className="page">Lädt…</div>

  return (
    <div className="page">
      {error && <p role="alert">{error}</p>}

      {recipe.photo_url ? (
        <motion.div
          className="hero-photo"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src={recipe.photo_url} alt="" />
          <div className="hero-scrim" />
          <h1 className="hero-title">{recipe.title}</h1>
        </motion.div>
      ) : (
        <h1>{recipe.title}</h1>
      )}

      {recipe.tags?.length > 0 && (
        <div className="tag-row" style={{ marginBottom: '1rem' }}>
          {recipe.tags.map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
        </div>
      )}

      {portions && (
        <p className="portions-note">
          Für {portions} Portion{portions === 1 ? '' : 'en'} — Mengen angepasst
        </p>
      )}

      <h2>Zutaten</h2>
      <ul className="ingredient-list">
        {recipe.ingredients.map((ing, i) => (
          <li key={i}>
            <span className="ingredient-dot" />
            {[scaleQuantity(ing.quantity, portions), ing.unit, ing.name].filter(Boolean).join(' ')}
          </li>
        ))}
      </ul>

      <h2>Zubereitung</h2>
      <ol className="steps-list">
        {recipe.steps
          .split('\n')
          .filter((line) => line.trim() !== '')
          .map((line, i) => (
            <li key={i}>{line}</li>
          ))}
      </ol>

      <div className="row detail-actions">
        <Link to={`/recipes/${id}/edit`} className="btn btn-secondary-accent">
          ✎ Bearbeiten
        </Link>
        <motion.button onClick={handleDelete} className="btn-danger" whileTap={{ scale: 0.96 }}>
          🗑 Löschen
        </motion.button>
      </div>
    </div>
  )
}
