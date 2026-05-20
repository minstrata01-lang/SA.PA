import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';

const blue   = '#003D6B';
const orange = '#E8920A';

function IconClipboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  );
}

function IconWrench() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

const NAV_ITEMS = [
  { to: '/admin/consultations', label: 'Konsultasi',  Icon: IconClipboard },
  { to: '/admin/tools',         label: 'Tools',       Icon: IconWrench    },
  { to: '/admin/cases',         label: 'Case Study',  Icon: IconFolder    },
  { to: '/admin/consultants',   label: 'Konsultan',   Icon: IconUsers     },
];

const sidebarVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const itemVariants = {
  hidden:  { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  return (
    <aside
      className="w-64 shrink-0 min-h-screen flex flex-col"
      style={{
        background: `linear-gradient(180deg, #002447 0%, ${blue} 100%)`,
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="px-6 py-6"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: orange, boxShadow: `0 4px 12px rgba(232,146,10,0.4)` }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22" stroke="white" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
          <div>
            <p
              className="text-xs font-bold tracking-[0.22em] uppercase"
              style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'Manrope', sans-serif" }}
            >
              Stratalift
            </p>
            <p
              className="text-sm font-semibold"
              style={{ color: 'rgba(255,255,255,0.92)', fontFamily: "'Manrope', sans-serif" }}
            >
              Admin Dashboard
            </p>
          </div>
        </div>
      </motion.div>

      {/* Navigation label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-6 pt-5 pb-2 text-[10px] font-bold tracking-[0.2em] uppercase"
        style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'Manrope', sans-serif" }}
      >
        Menu
      </motion.p>

      {/* Navigation */}
      <motion.nav
        className="flex-1 px-3 space-y-1"
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <motion.div key={to} variants={itemVariants}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-white/50 hover:text-white/85'
                }`
              }
              style={({ isActive }) => ({
                fontFamily: "'Manrope', sans-serif",
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full"
                      style={{ height: '60%', background: orange }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span
                    className="transition-colors duration-200"
                    style={{ color: isActive ? orange : 'inherit' }}
                  >
                    <Icon />
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </motion.nav>

      {/* Divider */}
      <div className="mx-4 my-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

      {/* Logout */}
      <motion.div
        className="px-3 pb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{
            color: 'rgba(251,113,133,0.75)',
            fontFamily: "'Manrope', sans-serif",
            background: 'transparent',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(251,113,133,0.1)';
            e.currentTarget.style.color = 'rgba(251,113,133,1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(251,113,133,0.75)';
          }}
        >
          <IconLogout />
          <span>Logout</span>
        </button>
      </motion.div>
    </aside>
  );
}
