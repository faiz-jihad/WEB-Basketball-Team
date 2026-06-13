import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, Ticket, Trophy, UserPlus, Lock, QrCode } from 'lucide-react';
import useAppStore from '../lib/store';
import { loginWithGoogle, logout } from '../lib/firebase';
import { getTranslation } from '../lib/i18n';

export const AccountPage: React.FC = () => {
  const { fan, bookedTickets, addToast, language, firebaseUser, loginFan, setFirebaseUser } = useAppStore();
  const [localUsername, setLocalUsername] = React.useState('');

  const handleLocalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localUsername.trim()) return;
    const username = localUsername.trim();
    loginFan(username);
    const mockUser = {
      uid: 'mock_' + username.toLowerCase().replace(/\s+/g, '_'),
      displayName: username,
      photoURL: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
      isMock: true
    };
    setFirebaseUser(mockUser);
    addToast('success', 'Logged In (Mock Mode)', `Welcome to the mock session, ${username}!`);
  };

  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';

  const nextLevelThreshold = (fan?.level || 1) * 100;
  const xpPercentage = Math.min(((fan?.xp || 0) / nextLevelThreshold) * 100, 100);

  if (!firebaseUser) {
    return (
      <section className="min-h-screen pt-32 pb-24 px-6 bg-brand-black flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-orange/10 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-panel-heavy rounded-3xl p-10 border border-white/10 text-center relative z-10 shadow-2xl shadow-brand-orange/5"
        >
          <div className="w-20 h-20 bg-brand-orange/10 border border-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-brand-orange" />
          </div>
          <h2 className="text-3xl font-title font-black uppercase text-white mb-3">Login Required</h2>
          <p className="text-sm text-gray-400 mb-8 font-display">
            Access your Fan Profile, Digital Tickets, and Trophy Room by logging into your account.
          </p>
          <button
            onClick={async () => {
              try {
                await loginWithGoogle();
              } catch (e: any) {
                addToast('warning', 'Login Failed', e.message || 'Unable to login with Google.');
              }
            }}
            className="w-full p-4 bg-brand-orange hover:bg-brand-burnt text-brand-black rounded-xl font-display font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 cursor-pointer mb-2"
          >
            <UserPlus size={18} />
            Login with Google
          </button>

          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[10px] text-gray-500 font-display font-bold uppercase tracking-widest">OR LOCAL TESTING</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <form onSubmit={handleLocalLogin} className="flex flex-col gap-4 text-left">
            <div>
              <label htmlFor="username" className="text-[10px] text-gray-400 uppercase tracking-widest font-bold font-display block mb-2">Username</label>
              <input
                id="username"
                type="text"
                required
                placeholder="e.g. COURT_CRUSADER"
                value={localUsername}
                onChange={(e) => setLocalUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white font-display text-sm focus:outline-none focus:border-brand-orange transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-display font-black tracking-[0.2em] uppercase transition-all cursor-pointer text-center text-xs"
            >
              Login Locally
            </button>
          </form>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-32 pb-24 px-6 bg-brand-black relative">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Profile */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel-heavy rounded-3xl p-8 lg:p-12 border border-white/10 mb-8 relative overflow-hidden flex flex-col lg:flex-row items-center gap-8 shadow-2xl shadow-brand-orange/5"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-3xl bg-brand-orange/15 border border-brand-orange/30 overflow-hidden flex-shrink-0 shadow-xl shadow-brand-orange/10 relative group p-2">
            <img src={fan?.avatar || ''} alt={fan?.username || ''} className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute -bottom-2 -right-2 bg-brand-orange text-brand-black text-xs font-black px-3 py-1 rounded-lg uppercase tracking-widest border-2 border-brand-black shadow-lg">
              LVL {fan?.level || 1}
            </div>
          </div>

          <div className={`flex-1 text-center ${isRtl ? 'lg:text-right' : 'lg:text-left'} w-full`}>
            <div className={`flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 ${isRtl ? 'lg:flex-row-reverse' : ''}`}>
              <div>
                <span className="text-brand-orange font-display text-sm font-semibold tracking-[0.25em] uppercase block mb-1">Fan Profile</span>
                <h1 className="text-4xl lg:text-5xl font-title font-black uppercase text-white drop-shadow-lg">{fan?.username || ''}</h1>
              </div>
              <button
                onClick={async () => {
                  try {
                    if (firebaseUser?.isMock) {
                      setFirebaseUser(null);
                      addToast('success', 'Logged Out', 'Mock session ended.');
                    } else {
                      await logout();
                    }
                  } catch (e) {
                    addToast('warning', 'Logout Failed', 'Unable to logout.');
                  }
                }}
                className="px-4 py-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-xl border border-white/10 transition-all text-xs font-display flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>

            <div className="bg-black/40 rounded-2xl p-6 border border-white/5 w-full">
              <div className="flex justify-between items-end mb-3 font-display">
                <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Experience Points</span>
                <span className="text-brand-orange text-lg font-black">{fan?.xp || 0} <span className="text-xs text-gray-500 font-bold">/ {nextLevelThreshold} XP</span></span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden relative shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercentage}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-brand-orange to-brand-gold relative"
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Digital Ticket Wallet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center text-brand-orange">
                <Ticket size={20} />
              </div>
              <h3 className="text-2xl font-title font-black uppercase text-white">Digital Wallet</h3>
            </div>

            {(bookedTickets || []).length === 0 ? (
              <div className="glass-panel rounded-3xl p-10 border border-white/5 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                <Ticket size={48} className="text-gray-600 mb-4 opacity-50" />
                <p className="text-gray-500 font-display uppercase tracking-widest text-xs">No tickets booked yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {(bookedTickets || []).map((ticket, idx) => (
                  <div key={idx} className="relative bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-2xl p-6 overflow-hidden group flex items-center justify-between gap-4">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-orange/10 rounded-full blur-2xl group-hover:bg-brand-orange/20 transition-all pointer-events-none" />
                    <div className="relative z-10 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-brand-orange/20 text-brand-orange text-[9px] font-black tracking-widest rounded uppercase">VS {ticket.opponent}</span>
                        <span className="text-[10px] text-gray-400 font-display font-bold uppercase">
                          {(() => {
                            const d = new Date(ticket.date);
                            return isNaN(d.getTime()) ? 'TBD' : d.toLocaleDateString();
                          })()}
                        </span>
                      </div>
                      <p className="font-display font-bold text-gray-300 text-xs mb-1">SEAT</p>
                      <h4 className="text-3xl font-title font-black text-white">{ticket.seatNumber}</h4>
                    </div>
                    <div className="relative z-10 bg-white p-2 rounded-xl shadow-lg border-2 border-transparent group-hover:border-brand-orange transition-all">
                      <QrCode size={64} className="text-brand-black" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Trophy Room (Badges) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
                <Trophy size={20} />
              </div>
              <h3 className="text-2xl font-title font-black uppercase text-white">Trophy Room</h3>
            </div>

            <div className="glass-panel-heavy rounded-3xl p-8 border border-white/5 flex-1 min-h-[300px]">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {(fan?.badges || []).map((badge) => (
                  <div
                    key={badge.id}
                    className="aspect-square bg-gradient-to-br from-white/5 to-white/2 hover:from-brand-orange/20 hover:to-brand-gold/10 border border-white/10 hover:border-brand-orange/30 rounded-2xl flex flex-col items-center justify-center text-center relative group transition-all duration-300 shadow-lg hover:shadow-brand-orange/20 cursor-default"
                  >
                    <span className="text-4xl mb-2 drop-shadow-md group-hover:scale-125 transition-transform duration-500">{badge.icon}</span>
                    <span className="text-[10px] font-bold text-gray-300 font-display truncate w-full px-2">{badge.name}</span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-brand-black border border-white/10 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-2 text-[10px] text-gray-400 z-20 shadow-2xl">
                      <strong className="text-brand-orange block mb-1 text-xs">{badge.name}</strong>
                      <p>{badge.description}</p>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-brand-black border-r border-b border-white/10 transform rotate-45" />
                    </div>
                  </div>
                ))}
                
                {/* Locked Slots */}
                {(fan?.badges || []).length < 8 && Array.from({ length: 8 - (fan?.badges || []).length }).map((_, i) => (
                  <div key={i} className="aspect-square border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-gray-700 bg-black/20">
                    <Lock size={24} className="mb-2 opacity-50" />
                    <span className="text-[9px] font-display uppercase tracking-widest">{t('fan', 'locked')}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default AccountPage;
