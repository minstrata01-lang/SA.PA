import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { motion } from 'framer-motion'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setError('Email atau password salah.')
      setLoading(false)
      return
    }

    navigate('/admin')
  }

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-linear-to-b from-[#F3F7FB] via-white to-[#F6FAFF]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(rgba(0,61,107,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,61,107,0.05) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      <motion.div
        className="relative z-10 w-full max-w-sm mx-4"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="rounded-4xl border border-[#003D6B]/15 bg-white/95 p-8 shadow-[0_20px_55px_rgba(0,61,107,0.14)] backdrop-blur-sm">
          <p className="inline-flex rounded-full border border-[#003D6B]/20 bg-[#003D6B]/8 px-3 py-1 text-xs font-semibold text-[#003D6B]">
            Admin Panel
          </p>
          <h1 className="mt-3 text-2xl font-extrabold text-[#003D6B]">Stratalift Dashboard</h1>
          <p className="mt-1 text-sm text-[#003D6B]/60">Masuk untuk mengelola sesi konsultasi</p>

          <div className="mt-6 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-[#003D6B]/70 uppercase tracking-wide">Email</label>
              <input
                type="email"
                placeholder="admin@stratalift.com"
                className="mt-1.5 w-full rounded-2xl border border-[#003D6B]/20 bg-[#F8FBFF] px-4 py-3 text-sm text-[#003D6B] outline-none focus:border-[#003D6B]/50 focus:ring-2 focus:ring-[#003D6B]/10"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#003D6B]/70 uppercase tracking-wide">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-2xl border border-[#003D6B]/20 bg-[#F8FBFF] px-4 py-3 text-sm text-[#003D6B] outline-none focus:border-[#003D6B]/50 focus:ring-2 focus:ring-[#003D6B]/10"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
                {error}
              </p>
            )}

            <motion.button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="cursor-pointer mt-1 w-full rounded-2xl bg-[#F58220] py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(245,130,32,0.35)] disabled:opacity-60"
              whileHover={{ y: -2, boxShadow: '0 12px 28px rgba(245,130,32,0.45)' }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Masuk...' : 'Masuk ke Dashboard'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </section>
  )
}