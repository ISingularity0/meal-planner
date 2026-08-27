import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getRecipe, deleteRecipe } from '../lib/recipes.js'
import Stepper from '../components/Stepper.jsx'
import OverflowMenu from '../components/OverflowMenu.jsx'

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
  const [portions, setPortions] = useState(location.state?.portions ?? 1)
  const [tab, setTab] = useState('ingredients')
  const [error, setError] = useState(null)

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
  if (!recipe) return <div className="page"><p className="empty-state">Lädt…</p></div>

  const stepLines = recipe.steps.split('\n').filter((line) => line.trim() !== '')
  const meta = [
    recipe.prep_minutes ? `${recipe.prep_minutes} Min` : null,
    `${(recipe.ingredients ?? []).length} Zutaten`,
    `${stepLines.length} Schritte`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="page">
      <div className="detail-head">
        <button className="glass icon-btn" onClick={() => navigate('/recipes')} aria-label="Zurück">
          ‹
        </button>
        <span className="detail-head-right">
          <button
            className="glass icon-btn"
            onClick={() => navigate(`/recipes/${id}/edit`)}
            aria-label="Bearbeiten"
          >
            ✎
          </button>
          <OverflowMenu items={[{ label: 'Rezept löschen', danger: true, onSelect: handleDelete }]} />
        </span>
      </div>

      {error && <p role="alert">{error}</p>}

      <motion.div
        className="detail-photo"
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {recipe.photo_url ? <img src={recipe.photo_url} alt="" /> : '🍽️'}
      </motion.div>

      {recipe.tags?.length > 0 && (
        <div className="tag-row">
          {recipe.tags.map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
        </div>
      )}

      <h1 className="detail-title">{recipe.title}</h1>
      <div className="detail-meta">{meta}</div>

      <div className="glass portions-bar">
        <span className="portions-label">Portionen</span>
        <Stepper size="lg" value={portions} onChange={setPortions} />
      </div>

      <div className="glass seg-tabs">
        <button
          className={tab === 'ingredients' ? 'seg-tab active' : 'seg-tab'}
          onClick={() => setTab('ingredients')}
        >
          {tab === 'ingredients' && (
            <motion.span layoutId="seg-pill" className="seg-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
          )}
          Zutaten
        </button>
        <button className={tab === 'steps' ? 'seg-tab active' : 'seg-tab'} onClick={() => setTab('steps')}>
          {tab === 'steps' && (
            <motion.span layoutId="seg-pill" className="seg-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
          )}
          Zubereitung
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'ingredients' ? (
          <motion.ul
            key="ingredients"
            className="ingredient-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                <span className="ingredient-amount">
                  {[scaleQuantity(ing.quantity, portions), ing.unit].filter(Boolean).join(' ')}
                </span>
                <span>{ing.name}</span>
              </li>
            ))}
            {recipe.ingredients.length === 0 && <p className="empty-state">Keine Zutaten hinterlegt.</p>}
          </motion.ul>
        ) : (
          <motion.ol
            key="steps"
            className="steps-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {stepLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
            {stepLines.length === 0 && <p className="empty-state">Keine Zubereitung hinterlegt.</p>}
          </motion.ol>
        )}
      </AnimatePresence>

    </div>
  )
}
