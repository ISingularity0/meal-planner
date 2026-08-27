import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import Login from './pages/Login.jsx'
import Calendar from './pages/Calendar.jsx'
import RecipeLibrary from './pages/RecipeLibrary.jsx'
import RecipeForm from './pages/RecipeForm.jsx'
import RecipeDetail from './pages/RecipeDetail.jsx'

function Placeholder({ label }) {
  return <div className="page">{label} (coming in a later task)</div>
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
          <Route path="/" element={<Navigate to="/calendar" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
