import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Globe, Key } from 'lucide-react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import useAppStore from './lib/store';
import { getTranslation } from './lib/i18n';

// Importing Custom Sections
import CustomCursor from './components/CustomCursor';
import Hero from './components/Hero';
import PlayerInfinitySlider from './components/PlayerInfinitySlider';
import TacticalBoard from './components/TacticalBoard';
import Storytelling from './components/Storytelling';
import PlayerShowcase from './components/PlayerShowcase';
import MatchCenter from './components/MatchCenter';
import FanCommunity from './components/FanCommunity';
import TicketBooking from './components/TicketBooking';
import MerchandiseStore from './components/MerchandiseStore';
import AdminPortal from './components/AdminPortal';

// Scroll To Top Component for smooth page transition resets
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Sub-pages grouping
const HomePage = () => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Hero />
    <PlayerInfinitySlider />
    <TacticalBoard />
    <Storytelling />
  </motion.div>
);

const RosterPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
    <PlayerShowcase />
  </motion.div>
);

const MatchesPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
    <MatchCenter />
    <FanCommunity />
  </motion.div>
);

const TicketsPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
    <TicketBooking />
  </motion.div>
);

const ShopPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
    <MerchandiseStore />
  </motion.div>
);

function App() {
  const { cart, isCartOpen, setCartOpen, toasts, removeToast, fan, language, setLanguage } = useAppStore();
  const [scrolled, setScrolled] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const location = useLocation();

  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      lenis.destroy();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={`relative min-h-screen bg-brand-black text-gray-100 overflow-x-hidden ${isRtl ? 'font-arabic text-right' : 'text-left'}`}>
      <ScrollToTop />
      
      {/* 1. Custom Interactive Sparks Cursor */}
      <CustomCursor />

      {/* 2. Floating Glassmorphic Navbar */}
      <nav className={`fixed top-0 inset-x-0 z-[100] transition-all duration-500 font-display ${
        scrolled
          ? 'py-4 bg-brand-black/80 backdrop-blur-md border-b border-brand-orange/15 shadow-lg shadow-brand-orange/2'
          : 'py-6 bg-transparent border-b border-transparent'
      }`}>
        <div className={`max-w-7xl mx-auto px-6 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
          
          {/* Brand Logo */}
          <NavLink to="/" className={`flex items-center gap-3 group select-none ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
            <div className="w-10 h-10 rounded-xl bg-brand-orange border border-brand-burnt/30 flex items-center justify-center text-brand-black font-title font-black text-xl shadow-lg shadow-brand-orange/30 group-hover:scale-105 transition-transform">
              B
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-widest uppercase block leading-none">{t('hero', 'title')}</span>
              <span className="text-[9px] font-bold text-brand-gold tracking-[0.2em] uppercase mt-1 block">HOOPS CLUB</span>
            </div>
          </NavLink>
          
          {/* Navigation Links */}
          <div className={`hidden lg:flex items-center gap-8 text-[11px] font-black tracking-widest uppercase text-gray-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <NavLink to="/" className={({ isActive }) => isActive ? 'text-brand-orange' : 'hover:text-brand-orange transition-colors'}>
              {t('nav', 'home')}
            </NavLink>
            <NavLink to="/roster" className={({ isActive }) => isActive ? 'text-brand-orange' : 'hover:text-brand-orange transition-colors'}>
              {t('nav', 'roster')}
            </NavLink>
            <NavLink to="/matches" className={({ isActive }) => isActive ? 'text-brand-orange' : 'hover:text-brand-orange transition-colors'}>
              {t('nav', 'matches')}
            </NavLink>
            <NavLink to="/tickets" className={({ isActive }) => isActive ? 'text-brand-orange' : 'hover:text-brand-orange transition-colors'}>
              {t('nav', 'tickets')}
            </NavLink>
            <NavLink to="/shop" className={({ isActive }) => isActive ? 'text-brand-orange' : 'hover:text-brand-orange transition-colors'}>
              {t('nav', 'shop')}
            </NavLink>
            <a
              href="#admin"
              onClick={(e) => { e.preventDefault(); setIsAdminOpen(true); }}
              className="hover:text-brand-orange transition-colors text-brand-gold flex items-center gap-1.5"
            >
              <Key size={13} className="text-brand-orange" />
              <span>{t('nav', 'admin')}</span>
            </a>
          </div>

          {/* User Club status, Language, & Cart Drawer Toggle */}
          <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            
            {/* Language Selector Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/2 hover:bg-white/5 border border-white/10 rounded-xl text-xs font-bold font-display uppercase tracking-wider text-gray-300 transition-all cursor-pointer">
                <Globe size={13} className="text-gray-400" />
                <span className="uppercase">{language}</span>
              </button>
              <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-full mt-2 w-24 bg-bg-dark border border-white/10 rounded-xl shadow-xl py-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 z-[1000] font-display text-xs`}>
                {(['en', 'id', 'ar'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`w-full px-4 py-2 hover:bg-brand-orange/15 hover:text-brand-orange transition-colors uppercase font-bold text-center ${
                      language === lang ? 'text-brand-orange bg-brand-orange/5' : 'text-gray-405'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'id' ? 'Bahasa' : 'العربية'}
                  </button>
                ))}
              </div>
            </div>

            {/* Club member badge */}
            <div className={`hidden sm:flex items-center gap-2 bg-white/2 border border-white/10 px-3 py-1.5 rounded-xl ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-5 h-5 rounded bg-brand-orange/20 flex items-center justify-center text-brand-orange text-xs">
                ⭐
              </div>
              <span className="text-[10px] font-bold font-display uppercase tracking-wider text-gray-300">
                {t('fan', 'level')} {fan.level}
              </span>
            </div>

            {/* Shopping Bag Button */}
            <button
              onClick={() => setCartOpen(!isCartOpen)}
              className="p-3 bg-white/3 hover:bg-brand-orange/15 border border-white/10 hover:border-brand-orange/30 rounded-xl transition-all cursor-pointer relative text-white hover:text-brand-orange flex items-center justify-center"
            >
              <ShoppingBag size={16} />
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-orange text-brand-black font-bold font-display text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-brand-black">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </nav>

      {/* Main Pages Router with AnimatePresence Page Transitions */}
      <main className="min-h-screen pt-20">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/roster" element={<RosterPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/shop" element={<ShopPage />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* 11. Footer details */}
      <footer className="bg-bg-darker border-t border-white/5 py-12 px-6 font-display">
        <div className={`max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-500 ${isRtl ? 'md:flex-row-reverse text-right' : ''}`}>
          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span className="w-8 h-8 rounded-lg bg-brand-orange/25 border border-brand-orange/30 flex items-center justify-center text-brand-orange font-title font-black text-sm">B</span>
            <span>© 2026 BSQ ALL-FIVE Basketball Club. All Rights Reserved.</span>
          </div>
          <div className={`flex gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#contact" className="hover:text-white transition-colors">Media Relations</a>
            <a href="#admin" onClick={(e) => { e.preventDefault(); setIsAdminOpen(true); }} className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
              <Key size={12} className="text-brand-orange" />
              <span>{t('admin', 'console')}</span>
            </a>
          </div>
        </div>
      </footer>

      {/* 12. Floating Toast alerts center */}
      <div className={`fixed top-24 ${isRtl ? 'left-6' : 'right-6'} z-[3000] w-full max-w-sm space-y-3 pointer-events-none`}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: isRtl ? -50 : 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: isRtl ? -50 : 50, scale: 0.9 }}
              className={`p-4 rounded-2xl shadow-xl flex items-start gap-3 border pointer-events-auto backdrop-blur-md ${isRtl ? 'flex-row-reverse text-right' : 'text-left'} ${
                toast.type === 'success'
                  ? 'bg-green-950/80 border-green-700/30 text-green-100 shadow-green-950/20'
                  : toast.type === 'xp'
                  ? 'bg-brand-orange/90 border-brand-burnt/35 text-brand-black shadow-brand-orange/15 font-black'
                  : toast.type === 'warning'
                  ? 'bg-red-950/80 border-red-700/30 text-red-100'
                  : 'bg-bg-card/90 border-brand-orange/20 text-white glow-orange'
              }`}
            >
              <div className="flex-1">
                <h5 className="text-xs font-bold font-title uppercase tracking-wide">{toast.title}</h5>
                <p className="text-[10px] opacity-80 mt-1 font-display font-medium">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Admin Panel Modal Overlay */}
      <AdminPortal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />

    </div>
  );
}

// Small helper icon component
const X = ({ size }: { size: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default App;
