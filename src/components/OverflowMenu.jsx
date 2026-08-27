import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function OverflowMenu({ items }) {
  const [open, setOpen] = useState(false)

  function run(action) {
    setOpen(false)
    action()
  }

  return (
    <span className="overflow-wrap">
      {open && <span className="overflow-backdrop" onClick={() => setOpen(false)} />}
      <button className="glass icon-btn" onClick={() => setOpen((v) => !v)} aria-label="Mehr">
        ⋯
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="glass overflow-menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                className={item.danger ? 'danger' : undefined}
                onClick={() => run(item.onSelect)}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
