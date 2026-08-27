import { motion } from 'framer-motion'

const variants = {
  initial: (direction) => ({ opacity: 0, x: direction >= 0 ? 36 : -36 }),
  animate: { opacity: 1, x: 0 },
  exit: (direction) => ({ opacity: 0, x: direction >= 0 ? -36 : 36 }),
}

export default function PageTransition({ children, direction = 0 }) {
  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
