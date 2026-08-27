import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import Login from './pages/Login.jsx'
import Calendar from './pages/Calendar.jsx'
import RecipeLibrary from './pages/RecipeLibrary.jsx'
import RecipeForm from './pages/RecipeForm.jsx'
import RecipeDetail from './pages/RecipeDetail.jsx'
import ShoppingList from './pages/ShoppingList.jsx'
import PageTransition from './components/PageTransition.jsx'

const NAV_ITEMS = [
  { to: '/calendar', label: 'Kalender' },
  { to: '/recipes', label: 'Rezepte' },
  { to: '/shopping-list', label: 'Einkauf' },
]

// Position in the app's logical left-to-right order, used to pick a slide direction.
// Recipe sub-pages count as "deeper" than the library, so opening one slides in from
// the right (a push), and going back slides in from the left (a pop) — like a native
// navigation stack, layered on top of the three main tabs' own left-right order.
function routeOrder(pathname) {
  if (pathname.startsWith('/shopping-list')) return 2
  if (pathname === '/recipes') return 1
  if (pathname.startsWith('/recipes')) return 1.5
  return 0
}

function BottomNav() {
  return (
    <nav className="glass glass-strong nav">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  layout="position"
                  className="nav-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="nav-label">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  const navigate = useNavigate()
  const { session } = useAuth()

  const order = routeOrder(location.pathname)
  const prevOrderRef = useRef(order)
  const direction = order >= prevOrderRef.current ? 1 : -1
  useEffect(() => {
    prevOrderRef.current = order
  }, [order])

  // React Router doesn't reset scroll on navigation, and the scroll container is .app-main,
  // not the window.
  const mainRef = useRef(null)
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [location.pathname])

  // Horizontal swipe switches tabs, but only when the gesture didn't start on something
  // that owns a swipe of its own (week strip, entry cards).
  const swipeBlocked = useRef(false)
  const tabIndex = NAV_ITEMS.findIndex((item) => item.to === location.pathname)

  function handlePanStart(event) {
    swipeBlocked.current = Boolean(event.target?.closest?.('[data-no-tab-swipe]'))
  }

  function handlePanEnd(_, info) {
    if (swipeBlocked.current || tabIndex === -1) return
    const { x, y } = info.offset
    if (Math.abs(x) < 70 || Math.abs(x) < Math.abs(y) * 1.5) return
    const next = tabIndex + (x < 0 ? 1 : -1)
    if (next >= 0 && next < NAV_ITEMS.length) navigate(NAV_ITEMS[next].to)
  }

  const showNav = Boolean(session) && location.pathname !== '/login'

  return (
    <div className="app-shell">
      <motion.main
        className="app-main"
        ref={mainRef}
        onPanStart={handlePanStart}
        onPanEnd={handlePanEnd}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <PageTransition key={location.pathname} direction={direction}>
            <Routes location={location}>
              <Route path="/login" element={<Login />} />
              <Route
                path="/calendar"
                element={
                  <RequireAuth>
                    <Calendar />
                  </RequireAuth>
                }
              />
              <Route
                path="/recipes"
                element={
                  <RequireAuth>
                    <RecipeLibrary />
                  </RequireAuth>
                }
              />
              <Route
                path="/recipes/new"
                element={
                  <RequireAuth>
                    <RecipeForm />
                  </RequireAuth>
                }
              />
              <Route
                path="/recipes/:id/edit"
                element={
                  <RequireAuth>
                    <RecipeForm />
                  </RequireAuth>
                }
              />
              <Route
                path="/recipes/:id"
                element={
                  <RequireAuth>
                    <RecipeDetail />
                  </RequireAuth>
                }
              />
              <Route
                path="/shopping-list"
                element={
                  <RequireAuth>
                    <ShoppingList />
                  </RequireAuth>
                }
              />
              <Route path="/" element={<Navigate to="/calendar" replace />} />
              <Route path="*" element={<Navigate to="/calendar" replace />} />
            </Routes>
          </PageTransition>
        </AnimatePresence>
      </motion.main>
      {showNav && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/meal-planner">
      <AuthProvider>
        <AnimatedRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
