import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function JoinPage() {
  const [searchParams] = useSearchParams()
  const key = searchParams.get('key')

  useEffect(() => {
    if (key) {
      // Redirect ke Edge Function join-session
      window.location.href = 
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/join-session?key=${key}`
    }
  }, [key])

  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <p>Memverifikasi sesi konsultasi kamu...</p>
    </div>
  )
}
