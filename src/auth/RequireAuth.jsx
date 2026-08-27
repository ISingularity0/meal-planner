import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

export default function RequireAuth({ children }) {
  const { session, loading } = useAuth()

  if (loading) return <div className="page">Lädt…</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}
