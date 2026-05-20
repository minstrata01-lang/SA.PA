import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function AdminProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    // Cek session saat ini
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen perubahan auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))

    return () => subscription.unsubscribe()
  }, [])

  // Loading
  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#003D6B]/20 border-t-[#F58220] rounded-full animate-spin" />
      </div>
    )
  }

  // Belum login -> redirect ke halaman login
  if (!session) return <Navigate to="/admin/login" replace />

  return children
}
