import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getRecipe, deleteRecipe } from '../lib/recipes.js'
import Stepper from '../components/Stepper.jsx'
import OverflowMenu from '../components/OverflowMenu.jsx'
import NutritionBar from '../components/NutritionBar.jsx'

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

  const hasNutrition =
    recipe.kcal != null || recipe.protein_g != null || recipe.fat_g != null || recipe.carbs_g != null
  const stepLines = recipe.steps.split('\n').filter((line) => line.trim() !== '')
  const meta = [
    recipe.prep_minutes ? `${recipe.prep_minutes} Min` : null,
    `${(recipe.ingredients ?? []).length} Zutaten`,
    `${stepLines.length} Schritte`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    // Horizontal swipe flips between the two tabs. No conflict with the app-level tab
    // swipe: that one only runs on the three main routes.
    <motion.div
      className="page"
      onPanEnd={(_, info) => {
        const { x, y } = info.offset
        if (Math.abs(x) < 60 || Math.abs(x) < Math.abs(y) * 1.5) return
        setTab(x < 0 ? 'steps' : 'ingredients')
      }}
    >
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

      {/* Not scaled by portions: that stepper is about how much to cook, while the useful
          nutrition figure is what one person eats. Matches the calendar's day total. */}
      {hasNutrition && (
        <NutritionBar
          label="Pro Portion"
          kcal={recipe.kcal}
          protein={recipe.protein_g}
          fat={recipe.fat_g}
          carbs={recipe.carbs_g}
        />
      )}

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
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.16 }}
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
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.16 }}
          >
            {stepLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
            {stepLines.length === 0 && <p className="empty-state">Keine Zubereitung hinterlegt.</p>}
          </motion.ol>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
