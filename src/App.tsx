import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Globe, Key } from 'lucide-react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, setupMessageListener, requestNotificationPermission } from './lib/firebase';
import db from './lib/supabase';
import useAppStore from './lib/store';
import { getTranslation } from './lib/i18n';
import { useRef } from 'react';

// Importing Custom Sections
import CustomCursor from './components/CustomCursor';
import Hero from './components/Hero';
import LogoScrollytelling from './components/LogoScrollytelling';
import PlayerInfinitySlider from './components/PlayerInfinitySlider';
import TacticalBoard from './components/TacticalBoard';
import TacticScrollytelling from './components/TacticScrollytelling';
import Storytelling from './components/Storytelling';
import PlayerShowcase from './components/PlayerShowcase';
import MatchCenter from './components/MatchCenter';
import FanCommunity from './components/FanCommunity';
import TicketBooking from './components/TicketBooking';
import MerchandiseStore from './components/MerchandiseStore';
import AdminPortal from './components/AdminPortal';
import ToastContainer from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import AccountPage from './components/AccountPage';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import ContactPage from './components/ContactPage';
import { MobileBottomNav } from './components/MobileBottomNav';

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
    <LogoScrollytelling />
    <PlayerInfinitySlider />
    <TacticalBoard />
    <TacticScrollytelling />
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

const ProfilePage = () => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
    <AccountPage />
  </motion.div>
);

function App() {
  const cart = useAppStore(state => state.cart);
  const isCartOpen = useAppStore(state => state.isCartOpen);
  const setCartOpen = useAppStore(state => state.setCartOpen);
  const fan = useAppStore(state => state.fan);
  const firebaseUser = useAppStore(state => state.firebaseUser);
  const setFirebaseUser = useAppStore(state => state.setFirebaseUser);
  const language = useAppStore(state => state.language);
  const setLanguage = useAppStore(state => state.setLanguage);
  const addToast = useAppStore(state => state.addToast);

  const currentUserRef = useRef<string | null>(null);

  // FCM Setup
  useEffect(() => {
    // Request permission and get token
    requestNotificationPermission().then(token => {
      if (token) {
        // In a real app, save this token to the user's profile in the database
        console.log("FCM Push Notifications Enabled");
      }
    });

    // Listen for foreground messages
    const unsubscribeFCM = setupMessageListener((payload: any) => {
      console.log('Received foreground message', payload);
      const title = payload.notification?.title || 'BSQ Notification';
      const body = payload.notification?.body || '';
      addToast('info', title, body);
    });

    return () => unsubscribeFCM();
  }, [addToast]);

  // Sync document direction and lang on language state changes (including hydration)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
      } else {
        // Safe guard: Do not clear mock logins on auth state changes
        const currentStoredUser = useAppStore.getState().firebaseUser;
        if (currentStoredUser && currentStoredUser.isMock) {
          return;
        }
        setFirebaseUser(null);
      }
    });

    const handleUnload = () => {
      if (currentUserRef.current) {
        db.from('active_sessions').delete().eq('id', currentUserRef.current);
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [setFirebaseUser]);

  // Synchronize active_sessions in database when firebaseUser changes
  useEffect(() => {
    if (firebaseUser) {
      const uid = firebaseUser.uid;
      currentUserRef.current = uid;
      db.from('active_sessions').delete().eq('id', uid).then(() => {
        db.from('active_sessions').insert({
          id: uid,
          username: firebaseUser.displayName || 'Google Fan',
          avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${firebaseUser.displayName || 'Google Fan'}`,
          last_active: new Date().toISOString()
        });
      });
    } else {
      if (currentUserRef.current) {
        db.from('active_sessions').delete().eq('id', currentUserRef.current);
        currentUserRef.current = null;
      }
    }
  }, [firebaseUser]);

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

  const totalCartCount = (cart || []).reduce((sum, item) => sum + item.quantity, 0);

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
            <div className="relative w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-lg shadow-brand-orange/10 group-hover:shadow-brand-orange/30 group-hover:border-brand-orange/40 group-hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange/20 to-brand-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img 
                src="/logo.png" 
                alt="BSQ Cirebon Logo" 
                className="w-full h-full object-contain p-1 group-hover:rotate-6 transition-transform duration-500" 
              />
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-widest uppercase block leading-none">{t('hero', 'title')}</span>
              <span className="text-[9px] font-bold text-brand-gold tracking-[0.2em] uppercase mt-1 block">AL HIKMAH CIREBON</span>
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
                      language === lang ? 'text-brand-orange bg-brand-orange/5' : 'text-gray-400'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'id' ? 'Bahasa' : 'العربية'}
                  </button>
                ))}
              </div>
            </div>

            {/* Club member badge / Account Link */}
            <NavLink to="/account" className={`hidden sm:flex items-center gap-2 bg-white/2 hover:bg-brand-orange/15 hover:border-brand-orange/30 border border-white/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-5 h-5 rounded overflow-hidden bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center text-brand-orange text-xs">
                {firebaseUser ? (
                  <img src={fan?.avatar || ''} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  '⭐'
                )}
              </div>
              <span className="text-[10px] font-bold font-display uppercase tracking-wider text-gray-300">
                {firebaseUser ? (fan?.username || 'Google Fan') : t('fan', 'level') + ' ' + (fan?.level || 1)}
              </span>
            </NavLink>

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
      <main className="min-h-screen pt-20 pb-24 lg:pb-0">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/roster" element={<RosterPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/account" element={<ProfilePage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </AnimatePresence>
      </main>

      <MobileBottomNav />

      {/* 11. Footer details */}
      <footer className="bg-bg-darker border-t border-white/5 py-12 px-6 font-display pb-28 lg:pb-12">
        <div className={`max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-500 ${isRtl ? 'md:flex-row-reverse text-right' : ''}`}>
          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="BSQ Cirebon Logo" className="w-full h-full object-contain p-0.5" />
            </div>
            <span>© 2026 BSQ ALL-FIVE Basketball Club. All Rights Reserved.</span>
          </div>
          <div className={`flex gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <NavLink to="/privacy" className="hover:text-white transition-colors">Privacy Policy</NavLink>
            <NavLink to="/terms" className="hover:text-white transition-colors">Terms of Service</NavLink>
            <NavLink to="/contact" className="hover:text-white transition-colors">Media Relations</NavLink>
            <a href="#admin" onClick={(e) => { e.preventDefault(); setIsAdminOpen(true); }} className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
              <Key size={12} className="text-brand-orange" />
              <span>{t('admin', 'console')}</span>
            </a>
          </div>
        </div>
      </footer>

      {/* 12. Floating Toast alerts center */}
      <ToastContainer />

      {/* Admin Panel Modal Overlay */}
      <ErrorBoundary>
        <AdminPortal isOpen={isAdminOpen} onClose={() => { setIsAdminOpen(false); window.location.reload(); }} />
      </ErrorBoundary>

    </div>
  );
}

// Small helper icon component
const X = ({ size }: { size: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default App;
