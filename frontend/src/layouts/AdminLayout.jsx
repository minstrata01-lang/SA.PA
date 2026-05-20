import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import AdminSidebar from '../components/admin/AdminSidebar';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) navigate('/admin/login');
      setChecking(false);
    });
  }, [navigate]);

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #F0F5FA 0%, #EAF1F8 100%)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(0,61,107,0.2)', borderTopColor: '#003D6B' }}
          />
          <p
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'rgba(0,61,107,0.4)', fontFamily: "'Manrope', sans-serif" }}
          >
            Memuat…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen"
      style={{ background: 'linear-gradient(135deg, #F0F5FA 0%, #EAF1F8 100%)' }}
    >
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
