function round(value) {
  return Math.round(Number(value) || 0)
}

// Shared by the calendar day total and the recipe detail so both stay identical.
export default function NutritionBar({ kcal, protein, fat, carbs, label }) {
  const stats = [
    { key: 'kcal', value: round(kcal), unit: '', label: 'kcal' },
    { key: 'protein', value: round(protein), unit: 'g', label: 'Eiweiß' },
    { key: 'fat', value: round(fat), unit: 'g', label: 'Fett' },
    { key: 'carbs', value: round(carbs), unit: 'g', label: 'Kohlenh.' },
  ]

  return (
    <div className="glass nutrition-bar">
      {label && <span className="nutrition-caption mono-label">{label}</span>}
      <div className="nutrition-grid">
        {stats.map((stat) => (
          <div key={stat.key} className="nutrition-stat">
            <span className="nutrition-value">
              {stat.value}
              {stat.unit}
            </span>
            <span className="nutrition-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
