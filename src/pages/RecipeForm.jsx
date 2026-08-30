import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  getRecipe,
  createRecipe,
  updateRecipe,
  listAllTags,
  listAllIngredientNames,
} from '../lib/recipes.js'
import ProductScanSheet from '../components/ProductScanSheet.jsx'

const emptyIngredient = { name: '', quantity: '', unit: '' }

const UNITS = ['g', 'kg', 'ml', 'l', 'TL', 'EL', 'Stück', 'Prise', 'Msp.', 'Bund', 'Zehe', 'Scheibe', 'Dose', 'Packung', 'Tasse']

// Keeps a unit that isn't in the preset list (typed before this existed) selectable,
// so editing an old recipe can't silently blank it out.
function unitOptions(current) {
  const value = (current ?? '').trim()
  return value && !UNITS.includes(value) ? [...UNITS, value] : UNITS
}

export default function RecipeForm() {
  const { id } = useParams()
  const isEdit = id !== undefined
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [title, setTitle] = useState('')
  const [ingredients, setIngredients] = useState([{ ...emptyIngredient, key: 0 }])
  const [nextKey, setNextKey] = useState(1)
  const [steps, setSteps] = useState('')
  const [prepMinutes, setPrepMinutes] = useState('')
  const [nutrition, setNutrition] = useState({ kcal: '', protein: '', fat: '', carbs: '' })
  const [tags, setTags] = useState([])
  const [allTags, setAllTags] = useState([])
  const [knownIngredients, setKnownIngredients] = useState([])
  const [focusedIngredient, setFocusedIngredient] = useState(null)
  const [scanOpen, setScanOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    listAllTags()
      .then(setAllTags)
      .catch(() => {})
    listAllIngredientNames()
      .then(setKnownIngredients)
      .catch(() => {})
  }, [])

  function suggestionsFor(value) {
    const query = (value ?? '').trim().toLowerCase()
    if (query.length < 2) return []
    return knownIngredients
      .filter((name) => {
        const lower = name.toLowerCase()
        return lower.includes(query) && lower !== query
      })
      .slice(0, 5)
  }

  useEffect(() => {
    if (!isEdit) return
    getRecipe(id)
      .then((r) => {
        setTitle(r.title)
        const loaded = r.ingredients.length ? r.ingredients : [{ ...emptyIngredient }]
        setIngredients(loaded.map((ing, i) => ({ ...ing, key: i })))
        setNextKey(loaded.length)
        setSteps(r.steps)
        setPrepMinutes(r.prep_minutes ?? '')
        setNutrition({
          kcal: r.kcal ?? '',
          protein: r.protein_g ?? '',
          fat: r.fat_g ?? '',
          carbs: r.carbs_g ?? '',
        })
        setTags(r.tags ?? [])
        setExistingPhotoUrl(r.photo_url)
      })
      .catch((e) => setError(`Rezept konnte nicht geladen werden: ${e.message}`))
  }, [id, isEdit])

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(photoFile)
    setPhotoPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  function updateIngredient(index, field, value) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    )
  }

  function addIngredientRow() {
    setIngredients((prev) => [...prev, { ...emptyIngredient, key: nextKey }])
    setNextKey((k) => k + 1)
  }

  function removeIngredientRow(index) {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  function handleIngredientKeyDown(e, index) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (index === ingredients.length - 1) addIngredientRow()
  }

  function toggleTag(tag) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  function handleAddNewTag(e) {
    e.preventDefault()
    const trimmed = newTag.trim()
    if (!trimmed) return
    if (!tags.includes(trimmed)) setTags((prev) => [...prev, trimmed])
    setNewTag('')
  }

  const suggestedTags = [...new Set([...allTags, ...tags])].sort((a, b) => a.localeCompare(b, 'de'))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const cleanIngredients = ingredients
        .filter((ing) => ing.name.trim() !== '')
        .map(({ name, quantity, unit }) => ({ name, quantity, unit }))
      const payload = {
        title,
        ingredients: cleanIngredients,
        steps,
        tags,
        photoFile,
        prepMinutes: prepMinutes === '' ? null : Number(prepMinutes),
        nutrition,
      }
      const saved = isEdit ? await updateRecipe(id, payload) : await createRecipe(payload)
      // replace: the form must not stay in history, otherwise "back" from the detail
      // screen lands on the form you just submitted instead of the recipe list.
      navigate(`/recipes/${saved.id}`, { replace: true })
    } catch (e) {
      setError(`Rezept konnte nicht gespeichert werden: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const displayPhotoUrl = photoPreviewUrl ?? existingPhotoUrl

  return (
    <div className="page">
      <div className="form-head">
        <button
          type="button"
          className="glass icon-btn"
          onClick={() => navigate(isEdit ? `/recipes/${id}` : '/recipes')}
          aria-label="Zurück"
        >
          ‹
        </button>
        <h1>{isEdit ? 'Rezept bearbeiten' : 'Neues Rezept'}</h1>
      </div>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>
            Titel
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
        </div>

        <div className="field">
          <label>
            Zubereitungszeit in Minuten (optional)
            <input
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="z. B. 30"
              value={prepMinutes}
              onChange={(e) => setPrepMinutes(e.target.value)}
            />
          </label>
        </div>

        <h2>Nährwerte pro Portion</h2>
        <div className="nutrition-fields">
          {[
            { key: 'kcal', label: 'kcal', placeholder: 'z. B. 520' },
            { key: 'protein', label: 'Eiweiß (g)', placeholder: 'z. B. 32' },
            { key: 'fat', label: 'Fett (g)', placeholder: 'z. B. 18' },
            { key: 'carbs', label: 'Kohlenhydrate (g)', placeholder: 'z. B. 45' },
          ].map((field) => (
            <label key={field.key}>
              {field.label}
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder={field.placeholder}
                value={nutrition[field.key]}
                onChange={(e) =>
                  setNutrition((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            </label>
          ))}
        </div>

        <h2>Foto</h2>
        <motion.div
          className="photo-picker"
          onClick={() => fileInputRef.current?.click()}
          whileTap={{ scale: 0.98 }}
        >
          <AnimatePresence mode="wait">
            {displayPhotoUrl ? (
              <motion.img
                key="preview"
                src={displayPhotoUrl}
                alt=""
                className="photo-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            ) : (
              <motion.div
                key="placeholder"
                className="photo-picker-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="photo-picker-icon">📷</span>
                <span>Foto auswählen</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
        />

        <h2>Tags</h2>
        <div className="tag-row" style={{ marginBottom: '0.6rem' }}>
          {suggestedTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={tags.includes(tag) ? 'tag-toggle active' : 'tag-toggle'}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="row">
          <input
            placeholder="Neuer Tag…"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddNewTag(e)
            }}
          />
          <button type="button" onClick={handleAddNewTag}>
            Hinzufügen
          </button>
        </div>

        <h2>Zutaten</h2>
        <AnimatePresence initial={false}>
          {ingredients.map((ing, i) => (
            <motion.div
              key={ing.key}
              className="ingredient-row"
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="ingredient-name-wrap">
                <input
                  placeholder="Zutat"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                  onKeyDown={(e) => handleIngredientKeyDown(e, i)}
                  onFocus={() => setFocusedIngredient(i)}
                  onBlur={() => setFocusedIngredient((prev) => (prev === i ? null : prev))}
                />
                {focusedIngredient === i && suggestionsFor(ing.name).length > 0 && (
                  <div className="glass ingredient-suggestions">
                    {suggestionsFor(ing.name).map((name) => (
                      <button
                        key={name}
                        type="button"
                        // Keeps the input from blurring before the click lands.
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => updateIngredient(i, 'name', name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                className="ingredient-qty"
                placeholder="Menge"
                value={ing.quantity}
                onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                onKeyDown={(e) => handleIngredientKeyDown(e, i)}
              />
              <select
                className="ingredient-unit"
                value={ing.unit ?? ''}
                onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
              >
                <option value="">Einheit</option>
                {unitOptions(ing.unit).map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <button type="button" className="btn-ghost" onClick={() => removeIngredientRow(i)}>
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="row">
          <button type="button" className="btn-block" onClick={addIngredientRow}>
            + Zutat hinzufügen
          </button>
          <button type="button" className="btn-block" onClick={() => setScanOpen(true)}>
            Barcode scannen
          </button>
        </div>

        <AnimatePresence>
          {scanOpen && (
            <ProductScanSheet
              onClose={() => setScanOpen(false)}
              onPick={(product) => {
                // Spike stage: only the name is taken over. Product storage and the
                // nutrition maths come next, once the camera is confirmed working.
                setIngredients((prev) => [
                  ...prev,
                  { ...emptyIngredient, name: product.name, key: nextKey },
                ])
                setNextKey((k) => k + 1)
                setScanOpen(false)
              }}
            />
          )}
        </AnimatePresence>

        <h2>Zubereitung</h2>
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          rows={8}
          placeholder="Ein Schritt pro Zeile"
        />

        <motion.button
          type="submit"
          className="btn-primary btn-block"
          disabled={saving}
          whileTap={{ scale: 0.97 }}
          style={{ marginTop: '1.5rem' }}
        >
          {saving ? 'Speichert…' : 'Rezept speichern'}
        </motion.button>
      </form>
    </div>
  )
}
