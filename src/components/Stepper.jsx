export default function Stepper({ value, onChange, min = 1, size = 'md' }) {
  function dec() {
    onChange(Math.max(min, value - 1))
  }
  function inc() {
    onChange(value + 1)
  }
  return (
    <div className={`stepper stepper-${size}`}>
      <button type="button" onClick={dec} disabled={value <= min} aria-label="Weniger">
        −
      </button>
      <span className="stepper-value">{value}</span>
      <button type="button" onClick={inc} aria-label="Mehr">
        +
      </button>
    </div>
  )
}
