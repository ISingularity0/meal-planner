import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRecipe, createRecipe, updateRecipe } from '../lib/recipes.js'

const emptyIngredient = { name: '', quantity: '', unit: '' }

export default function RecipeForm() {
  const { id } = useParams()
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [ingredients, setIngredients] = useState([{ ...emptyIngredient }])
  const [steps, setSteps] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    getRecipe(id).then((r) => {
      setTitle(r.title)
      setIngredients(r.ingredients.length ? r.ingredients : [{ ...emptyIngredient }])
      setSteps(r.steps)
      setExistingPhotoUrl(r.photo_url)
    })
  }, [id, isEdit])

  function updateIngredient(index, field, value) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    )
  }

  function addIngredientRow() {
    setIngredients((prev) => [...prev, { ...emptyIngredient }])
  }

  function removeIngredientRow(index) {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const cleanIngredients = ingredients.filter((ing) => ing.name.trim() !== '')
    const payload = { title, ingredients: cleanIngredients, steps, photoFile }
    const saved = isEdit ? await updateRecipe(id, payload) : await createRecipe(payload)
    setSaving(false)
    navigate(`/recipes/${saved.id}`)
  }

  return (
    <div className="page">
      <h1>{isEdit ? 'Edit recipe' : 'New recipe'}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
        </div>

        <h2>Ingredients</h2>
        {ingredients.map((ing, i) => (
          <div key={i}>
            <input
              placeholder="Name"
              value={ing.name}
              onChange={(e) => updateIngredient(i, 'name', e.target.value)}
            />
            <input
              placeholder="Qty"
              value={ing.quantity}
              onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
            />
            <input
              placeholder="Unit"
              value={ing.unit}
              onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
            />
            <button type="button" onClick={() => removeIngredientRow(i)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addIngredientRow}>
          + Add ingredient
        </button>

        <h2>Steps</h2>
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          rows={8}
          placeholder="One step per line"
        />

        <h2>Photo</h2>
        {existingPhotoUrl && !photoFile && (
          <img src={existingPhotoUrl} alt={title} style={{ maxWidth: '100%' }} />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
        />

        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save recipe'}
        </button>
      </form>
    </div>
  )
}
