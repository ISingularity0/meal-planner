import PlusIcon from './PlusIcon.jsx'

// Same reason as PlusIcon: the "−" glyph sits on the font's math axis, so it looks
// off-centre inside a round button. Drawn instead.
function MinusIcon({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
    </svg>
  )
}

export default function Stepper({ value, onChange, min = 1, size = 'md' }) {
  const iconSize = size === 'lg' ? 15 : 13

  return (
    <div className={`stepper stepper-${size}`}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Weniger">
        <MinusIcon size={iconSize} />
      </button>
      <span className="stepper-value">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} aria-label="Mehr">
        <PlusIcon size={iconSize} />
      </button>
    </div>
  )
}
