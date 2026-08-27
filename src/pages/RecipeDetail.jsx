import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getRecipe, deleteRecipe } from '../lib/recipes.js'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setError(null)
    getRecipe(id)
      .then(setRecipe)
      .catch((e) => setError(`Could not load this recipe: ${e.message}`))
  }, [id])

  async function handleDelete() {
    if (!confirm('Delete this recipe?')) return
    setError(null)
    try {
      await deleteRecipe(id)
      navigate('/recipes')
    } catch (e) {
      setError(`Could not delete this recipe: ${e.message}`)
    }
  }

  if (error && !recipe) return <div className="page"><p role="alert">{error}</p></div>
  if (!recipe) return <div className="page">Loading…</div>

  return (
    <div className="page">
      <h1>{recipe.title}</h1>
      {error && <p role="alert">{error}</p>}
      {recipe.photo_url && (
        <img src={recipe.photo_url} alt={recipe.title} style={{ maxWidth: '100%' }} />
      )}

      <h2>Ingredients</h2>
      <ul>
        {recipe.ingredients.map((ing, i) => (
          <li key={i}>
            {[ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ')}
          </li>
        ))}
      </ul>

      <h2>Steps</h2>
      <ol>
        {recipe.steps
          .split('\n')
          .filter((line) => line.trim() !== '')
          .map((line, i) => (
            <li key={i}>{line}</li>
          ))}
      </ol>

      <Link to={`/recipes/${id}/edit`}>Edit</Link>
      <button onClick={handleDelete}>Delete</button>
    </div>
  )
}
