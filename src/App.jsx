import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import Login from './pages/Login.jsx'
import Calendar from './pages/Calendar.jsx'
import RecipeLibrary from './pages/RecipeLibrary.jsx'
import RecipeForm from './pages/RecipeForm.jsx'
import RecipeDetail from './pages/RecipeDetail.jsx'
import ShoppingList from './pages/ShoppingList.jsx'

function BottomNav() {
  return (
    <nav className="nav">
      <NavLink to="/calendar" className={({ isActive }) => (isActive ? 'active' : '')}>
        Calendar
      </NavLink>
      <NavLink to="/recipes" className={({ isActive }) => (isActive ? 'active' : '')}>
        Recipes
      </NavLink>
      <NavLink to="/shopping-list" className={({ isActive }) => (isActive ? 'active' : '')}>
        Shopping list
      </NavLink>
    </nav>
  )
}

function AuthedLayout({ children }) {
  return (
    <RequireAuth>
      {children}
      <BottomNav />
    </RequireAuth>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/meal-planner">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/calendar"
            element={
              <AuthedLayout>
                <Calendar />
              </AuthedLayout>
            }
          />
          <Route
            path="/recipes"
            element={
              <AuthedLayout>
                <RecipeLibrary />
              </AuthedLayout>
            }
          />
          <Route
            path="/recipes/new"
            element={
              <AuthedLayout>
                <RecipeForm />
              </AuthedLayout>
            }
          />
          <Route
            path="/recipes/:id/edit"
            element={
              <AuthedLayout>
                <RecipeForm />
              </AuthedLayout>
            }
          />
          <Route
            path="/recipes/:id"
            element={
              <AuthedLayout>
                <RecipeDetail />
              </AuthedLayout>
            }
          />
          <Route
            path="/shopping-list"
            element={
              <AuthedLayout>
                <ShoppingList />
              </AuthedLayout>
            }
          />
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route path="*" element={<Navigate to="/calendar" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
