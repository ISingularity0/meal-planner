import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import Login from './pages/Login.jsx'

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
                <Placeholder label="Calendar" />
              </RequireAuth>
            }
          />
          <Route path="/" element={<Navigate to="/calendar" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
