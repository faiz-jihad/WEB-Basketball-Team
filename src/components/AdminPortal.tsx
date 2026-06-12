import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Key, Plus, RefreshCw, Trash2, Tv, Users, X, Shield, Tag, ChevronLeft, LogOut, Eye, EyeOff } from 'lucide-react';
import { db } from '../lib/supabase';
import type { Player, Match, Standing, Merchandise } from '../lib/supabase';
import useAppStore from '../lib/store';
import { getTranslation } from '../lib/i18n';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ isOpen, onClose }) => {
  type AdminRole = 'admin' | 'coach' | 'shop_manager';

  // Load passcodes from env with safe dev fallbacks
  const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSCODE || 'admin2026';
  const DEV_PASS = import.meta.env.VITE_DEVELOPER_PASSCODE || 'vortex2026';
  const COACH_PASS = import.meta.env.VITE_COACH_PASSCODE || 'coach2026';
  const SHOP_PASS = import.meta.env.VITE_SHOP_PASSCODE || 'shop2026';

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('bsq_admin_authenticated') === 'true';
    }
    return false;
  });

  const [authenticatedRole, setAuthenticatedRole] = useState<AdminRole | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('bsq_admin_role') as AdminRole | null;
    }
    return null;
  });

  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('bsq_admin_role') as AdminRole | null;
    }
    return null;
  });

  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'matches' | 'roster' | 'store' | 'standings'>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = sessionStorage.getItem('bsq_admin_active_tab') as any;
      if (savedTab) return savedTab;
    }
    return 'matches';
  });

  const [newPlayerPhoto, setNewPlayerPhoto] = useState('');
  const [newMerchImage, setNewMerchImage] = useState('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.7);
            setter(compressed);
          } else {
            setter(reader.result as string);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const addToast = useAppStore(state => state.addToast);
  const addXP = useAppStore(state => state.addXP);
  const language = useAppStore(state => state.language);
  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';

  const getTabLabel = (tab: string) => {
    if (tab === 'matches') return t('nav', 'matches');
    if (tab === 'roster') return t('nav', 'roster');
    if (tab === 'store') return t('nav', 'shop');
    return t('matches', 'standings');
  };

  const getRoleLabel = (role: AdminRole | null) => {
    if (!role) return '';
    if (role === 'admin') return t('admin', 'roleAdmin');
    if (role === 'coach') return t('admin', 'roleCoach');
    return t('admin', 'roleShop');
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === 'jersey') return t('shop', 'jerseys');
    if (cat === 'shoes') return t('shop', 'shoes');
    if (cat === 'caps') return t('shop', 'caps');
    return t('shop', 'accessories');
  };

  // Auth check
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    let isValid = false;
    if (selectedRole === 'admin' && (passcode === ADMIN_PASS || passcode === DEV_PASS)) {
      isValid = true;
    } else if (selectedRole === 'coach' && passcode === COACH_PASS) {
      isValid = true;
    } else if (selectedRole === 'shop_manager' && passcode === SHOP_PASS) {
      isValid = true;
    }

    if (isValid) {
      setIsAuthenticated(true);
      setAuthenticatedRole(selectedRole);
      setPassError(false);
      setPasscode('');
      setShowPasscode(false);
      
      sessionStorage.setItem('bsq_admin_authenticated', 'true');
      sessionStorage.setItem('bsq_admin_role', selectedRole);

      // Auto-set the active tab based on what permissions they have
      if (selectedRole === 'shop_manager') {
        setActiveTab('store');
        sessionStorage.setItem('bsq_admin_active_tab', 'store');
      } else {
        setActiveTab('matches');
        sessionStorage.setItem('bsq_admin_active_tab', 'matches');
      }

      addToast('success', t('admin', 'unlockedToast'), t('admin', 'unlockedToastDesc'));
      addXP(50); // XP reward for unlocking dashboard
    } else {
      setPassError(true);
      // Reset shake error state after animation finishes so it can trigger again
      setTimeout(() => setPassError(false), 500);
      addToast('warning', t('admin', 'deniedToast'), t('admin', 'deniedToastDesc'));
    }
  };

  // State caches for database
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [merchandise, setMerchandise] = useState<Merchandise[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  
  const [coachName, setCoachName] = useState('');
  const [coachRoleTitle, setCoachRoleTitle] = useState('');
  const [coachBio, setCoachBio] = useState('');
  const [coachPhoto, setCoachPhoto] = useState('');

  // Load database tables
  const loadDatabase = () => {
    (db as any).from('matches').select('*').order('date', { ascending: true }).then(({ data }: any) => {
      if (data) setMatches(data as Match[]);
    });
    (db as any).from('players').select('*').then(({ data }: any) => {
      if (data) setPlayers(data as Player[]);
    });
    (db as any).from('merchandise').select('*').then(({ data }: any) => {
      if (data) setMerchandise(data as Merchandise[]);
    });
    (db as any).from('standings').select('*').order('points', { ascending: false }).then(({ data }: any) => {
      if (data) setStandings(data as Standing[]);
    });
    (db as any).from('manager').select('*').then(({ data }: any) => {
      if (data && data[0]) {
        setCoachName(data[0].name);
        setCoachRoleTitle(data[0].title || '');
        setCoachBio(data[0].bio);
        setCoachPhoto(data[0].photo);
      }
    });
  };

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadDatabase();
    }
  }, [isAuthenticated, isOpen]);

  // Match management state
  const [isSimulating, setIsSimulating] = useState(true);
  const [newMatchOpponent, setNewMatchOpponent] = useState('');
  const [newMatchVenue, setNewMatchVenue] = useState('Al Hikmah Arena');
  const [newMatchDate, setNewMatchDate] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sim = localStorage.getItem('vbc_score_simulation');
      setIsSimulating(sim !== 'false');
    }
  }, []);

  const toggleSimulation = () => {
    const nextSim = !isSimulating;
    setIsSimulating(nextSim);
    localStorage.setItem('vbc_score_simulation', nextSim ? 'true' : 'false');
    addToast('info', 'Simulator Toggled', `Score ticker automation is now ${nextSim ? 'ENABLED' : 'PAUSED'}.`);
  };

  const handleUpdateScore = (matchId: string, team: 'home' | 'away', amount: number) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const updatedHome = team === 'home' ? match.score_home + amount : match.score_home;
    const updatedAway = team === 'away' ? match.score_away + amount : match.score_away;

    db.from('matches').update({
      score_home: updatedHome,
      score_away: updatedAway
    }).eq('id', matchId).then(() => {
      loadDatabase();
      addToast('success', 'Score Updated', `Manually adjusted scoreboard to ${updatedHome} - ${updatedAway}.`);
    });
  };

  const handleStatusChange = (matchId: string, nextStatus: Match['status']) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const updates: Partial<Match> = { status: nextStatus };
    if (nextStatus === 'LIVE') {
      updates.quarter = 1;
      updates.time_remaining = '12:00';
    }

    db.from('matches').update(updates).eq('id', matchId).then(() => {
      loadDatabase();
      addToast('success', 'Match Status Updated', `Set game against ${match.opponent} to ${nextStatus}.`);
      
      // Auto-update standings if match is finalized
      if (nextStatus === 'FINISHED') {
        const homeWon = match.score_home > match.score_away;
        
        // Find Vortex standing
        const vortexStand = standings.find(s => s.team_name === 'BSQ ALL-FIVE');
        if (vortexStand) {
          db.from('standings').update({
            wins: vortexStand.wins + (homeWon ? 1 : 0),
            losses: vortexStand.losses + (homeWon ? 0 : 1),
            points: vortexStand.points + (homeWon ? 3 : 1),
            streak: homeWon ? 'W6' : 'L1'
          }).eq('id', vortexStand.id);
        }

        // Find Opponent standing
        const oppStand = standings.find(s => s.team_name.toLowerCase().includes(match.opponent.toLowerCase()));
        if (oppStand) {
          db.from('standings').update({
            wins: oppStand.wins + (homeWon ? 0 : 1),
            losses: oppStand.losses + (homeWon ? 1 : 0),
            points: oppStand.points + (homeWon ? 1 : 3),
            streak: homeWon ? 'L1' : 'W1'
          }).eq('id', oppStand.id);
        }
      }
    });
  };

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchOpponent.trim() || !newMatchDate) return;

    db.from('matches').insert({
      opponent: newMatchOpponent.trim(),
      opponent_logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100',
      date: new Date(newMatchDate).toISOString(),
      venue: newMatchVenue,
      status: 'UPCOMING',
      score_home: 0,
      score_away: 0
    }).then(() => {
      loadDatabase();
      setNewMatchOpponent('');
      setNewMatchDate('');
      addToast('success', 'Match Scheduled', `Added matchup vs ${newMatchOpponent}.`);
    });
  };

  // Player creation state
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPos, setNewPlayerPos] = useState<Player['position']>('PG');
  const [newPlayerNum, setNewPlayerNum] = useState('0');
  const [newPlayerHeight, setNewPlayerHeight] = useState('195 cm');
  const [newPlayerWeight, setNewPlayerWeight] = useState('90 kg');
  const [newPlayerBio, setNewPlayerBio] = useState('');
  const [newPlayerPPG, setNewPlayerPPG] = useState('15');
  const [newPlayerAPG, setNewPlayerAPG] = useState('4');
  const [newPlayerRPG, setNewPlayerRPG] = useState('5');

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    db.from('players').insert({
      name: newPlayerName.trim(),
      position: newPlayerPos,
      number: parseInt(newPlayerNum),
      height: newPlayerHeight,
      weight: newPlayerWeight,
      photo: newPlayerPhoto || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600',
      bio: newPlayerBio.trim() || 'A professional athlete on the BSQ ALL-FIVE roster.',
      stats: {
        ppg: parseFloat(newPlayerPPG),
        apg: parseFloat(newPlayerAPG),
        rpg: parseFloat(newPlayerRPG),
        spg: 1.2,
        bpg: 0.8
      },
      highlight_url: 'https://www.w3schools.com/html/mov_bbb.mp4'
    }).then(() => {
      loadDatabase();
      setNewPlayerName('');
      setNewPlayerBio('');
      setNewPlayerPhoto('');
      addToast('success', 'Player Created', `Added ${newPlayerName} to team roster.`);
    });
  };

  const handleDeletePlayer = (playerId: string, name: string) => {
    if (confirm(`Remove ${name} from roster?`)) {
      (db as any).from('players').delete().eq('id', playerId).then(() => {
        loadDatabase();
        addToast('success', 'Player Removed', `Removed ${name} from roster list.`);
      });
    }
  };

  const handleUpdateCoach = (e: React.FormEvent) => {
    e.preventDefault();
    (db as any).from('manager').update({
      name: coachName.trim(),
      title: coachRoleTitle.trim(),
      bio: coachBio.trim(),
      photo: coachPhoto.trim()
    }).eq('id', 'mngr1').then(() => {
      loadDatabase();
      addToast('success', 'Manager Updated', 'Coach and Manager profile updated successfully.');
    });
  };

  // Merchandise state
  const [newMerchName, setNewMerchName] = useState('');
  const [newMerchPrice, setNewMerchPrice] = useState('50');
  const [newMerchCategory, setNewMerchCategory] = useState<Merchandise['category']>('jersey');
  const [newMerchStock, setNewMerchStock] = useState('20');
  const [newMerchDesc, setNewMerchDesc] = useState('');

  const handleCreateMerch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchName.trim()) return;

    db.from('merchandise').insert({
      name: newMerchName.trim(),
      price: parseFloat(newMerchPrice),
      image: newMerchImage || (newMerchCategory === 'shoes'
        ? 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400'
        : 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=400'),
      category: newMerchCategory,
      stock: parseInt(newMerchStock),
      description: newMerchDesc.trim() || 'Premium merchandise item.'
    }).then(() => {
      loadDatabase();
      setNewMerchName('');
      setNewMerchDesc('');
      setNewMerchImage('');
      addToast('success', 'Product Added', `Added ${newMerchName} to store catalog.`);
    });
  };

  const handleDeleteMerch = (itemId: string, name: string) => {
    if (confirm(`Remove ${name} from store?`)) {
      db.from('merchandise').delete().eq('id', itemId).then(() => {
        loadDatabase();
        addToast('success', 'Product Removed', `Removed ${name} from store catalog.`);
      });
    }
  };

  // Standings state
  const handleUpdateStanding = (teamId: string, field: 'wins' | 'losses' | 'points', val: number) => {
    const team = standings.find(s => s.id === teamId);
    if (!team) return;

    db.from('standings').update({
      [field]: Math.max(0, team[field] + val)
    }).eq('id', teamId).then(() => {
      loadDatabase();
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
        >
          {/* Backdrop closer */}
          <div className="absolute inset-0 z-0" onClick={onClose} />

          {/* Login Lock */}
          {!isAuthenticated ? (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={passError ? {
                x: [0, -10, 10, -10, 10, -5, 5, 0],
                transition: { duration: 0.4 }
              } : { scale: 1, x: 0 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-md w-full bg-bg-dark border border-brand-orange/30 rounded-3xl p-8 shadow-2xl glow-orange z-10 mx-4"
            >
              {selectedRole === null ? (
                <>
                  <button onClick={onClose} className={`absolute top-4 text-gray-500 hover:text-white cursor-pointer ${isRtl ? 'left-4' : 'right-4'}`}>
                    <X size={18} />
                  </button>
                  
                  <div className={`text-center mb-6 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <div className="w-12 h-12 bg-brand-orange/15 border border-brand-orange/20 rounded-2xl flex items-center justify-center text-brand-orange mx-auto mb-3">
                      <Key size={20} />
                    </div>
                    <h3 className="text-xl font-title font-black uppercase text-white text-center">{t('admin', 'roleSelectTitle')}</h3>
                    <p className="text-[10px] text-gray-500 font-display mt-1 text-center">{t('admin', 'roleSelectDesc')}</p>
                  </div>

                  <div className="space-y-3 mt-4">
                    {/* Super Admin Option */}
                    <button
                      onClick={() => { setSelectedRole('admin'); setPassError(false); setPasscode(''); }}
                      className={`w-full p-4 bg-white/2 hover:bg-white/5 border border-white/5 hover:border-brand-orange/30 rounded-2xl flex items-center gap-4 transition-all group cursor-pointer ${
                        isRtl ? 'flex-row-reverse text-right' : 'text-left'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-orange/15 border border-brand-orange/20 flex items-center justify-center text-brand-orange group-hover:scale-110 transition-transform flex-shrink-0">
                        <Shield size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-title font-black uppercase text-white tracking-wide">{t('admin', 'roleAdmin')}</h4>
                        <p className="text-[9px] text-gray-500 font-display mt-0.5 leading-snug">{t('admin', 'roleAdminDesc')}</p>
                      </div>
                    </button>

                    {/* Head Coach Option */}
                    <button
                      onClick={() => { setSelectedRole('coach'); setPassError(false); setPasscode(''); }}
                      className={`w-full p-4 bg-white/2 hover:bg-white/5 border border-white/5 hover:border-brand-orange/30 rounded-2xl flex items-center gap-4 transition-all group cursor-pointer ${
                        isRtl ? 'flex-row-reverse text-right' : 'text-left'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-orange/15 border border-brand-orange/20 flex items-center justify-center text-brand-orange group-hover:scale-110 transition-transform flex-shrink-0">
                        <Users size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-title font-black uppercase text-white tracking-wide">{t('admin', 'roleCoach')}</h4>
                        <p className="text-[9px] text-gray-500 font-display mt-0.5 leading-snug">{t('admin', 'roleCoachDesc')}</p>
                      </div>
                    </button>

                    {/* Inventory Manager Option */}
                    <button
                      onClick={() => { setSelectedRole('shop_manager'); setPassError(false); setPasscode(''); }}
                      className={`w-full p-4 bg-white/2 hover:bg-white/5 border border-white/5 hover:border-brand-orange/30 rounded-2xl flex items-center gap-4 transition-all group cursor-pointer ${
                        isRtl ? 'flex-row-reverse text-right' : 'text-left'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-orange/15 border border-brand-orange/20 flex items-center justify-center text-brand-orange group-hover:scale-110 transition-transform flex-shrink-0">
                        <Tag size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-title font-black uppercase text-white tracking-wide">{t('admin', 'roleShop')}</h4>
                        <p className="text-[9px] text-gray-500 font-display mt-0.5 leading-snug">{t('admin', 'roleShopDesc')}</p>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedRole(null)}
                    className={`absolute top-4 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-white cursor-pointer ${
                      isRtl ? 'right-4 flex-row-reverse' : 'left-4'
                    }`}
                  >
                    <ChevronLeft size={14} className={isRtl ? 'rotate-180' : ''} />
                    {t('admin', 'backToRoles')}
                  </button>

                  <button onClick={onClose} className={`absolute top-4 text-gray-500 hover:text-white cursor-pointer ${isRtl ? 'left-4' : 'right-4'}`}>
                    <X size={18} />
                  </button>
                  
                  <div className="text-center mb-6 mt-4">
                    <div className="w-12 h-12 bg-brand-orange/15 border border-brand-orange/20 rounded-2xl flex items-center justify-center text-brand-orange mx-auto mb-3">
                      {selectedRole === 'admin' ? <Shield size={20} /> : selectedRole === 'coach' ? <Users size={20} /> : <Tag size={20} />}
                    </div>
                    <h3 className="text-lg font-title font-black uppercase text-white">
                      {selectedRole === 'admin' ? t('admin', 'roleAdmin') : selectedRole === 'coach' ? t('admin', 'roleCoach') : t('admin', 'roleShop')}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-display mt-1">{t('admin', 'enterPasscode')}</p>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4 font-display">
                    <div>
                      <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5 text-center">{t('admin', 'keyPlaceholder')}</label>
                      <div className="relative">
                        <input
                          type={showPasscode ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={passcode}
                          onChange={(e) => setPasscode(e.target.value)}
                          className={`w-full text-center bg-black/40 border rounded-xl py-3 text-sm text-white focus:outline-none tracking-widest ${
                            passError ? 'border-red-600 focus:border-red-600' : 'border-white/10 focus:border-brand-orange'
                          } ${isRtl ? 'pl-10' : 'pr-10'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasscode(!showPasscode)}
                          className={`absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer ${
                            isRtl ? 'left-3' : 'right-3'
                          }`}
                        >
                          {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {passError && (
                        <span className="text-[9px] text-red-500 font-bold block mt-1 text-center font-display">
                          {selectedRole === 'admin' 
                            ? (language === 'id' ? 'Petunjuk: admin2026 atau vortex2026' : language === 'ar' ? 'تلميح: admin2026 أو vortex2026' : 'Hint: admin2026 or vortex2026')
                            : selectedRole === 'coach'
                            ? (language === 'id' ? 'Petunjuk: coach2026' : language === 'ar' ? 'تلميح: coach2026' : 'Hint: coach2026')
                            : (language === 'id' ? 'Petunjuk: shop2026' : language === 'ar' ? 'تلميح: shop2026' : 'Hint: shop2026')
                          }
                        </span>
                      )}
                    </div>
                    <button type="submit" className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black text-xs tracking-[0.2em] rounded-xl uppercase transition-colors cursor-pointer">
                      {t('admin', 'authBtn')}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          ) : (
            // Full Admin Dashboard
            <motion.div
              initial={{ scale: 0.95, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 50 }}
              className="relative max-w-5xl w-full h-[85vh] bg-bg-dark border border-brand-orange/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10"
            >
              {/* Header */}
              <div className={`p-6 bg-white/2 border-b border-white/5 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                  <div className="w-8 h-8 rounded bg-brand-orange flex items-center justify-center text-brand-black font-title font-black text-sm">V</div>
                  <div>
                    <h3 className="font-title font-black uppercase text-white text-sm">{t('admin', 'console')}</h3>
                    <p className="text-[9px] text-brand-gold font-display uppercase tracking-widest font-bold">
                      {t('admin', 'authenticatedAs')}: {getRoleLabel(authenticatedRole)}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-2.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <button 
                    onClick={() => {
                      setIsAuthenticated(false);
                      setAuthenticatedRole(null);
                      setSelectedRole(null);
                      setPasscode('');
                      sessionStorage.removeItem('bsq_admin_authenticated');
                      sessionStorage.removeItem('bsq_admin_role');
                      sessionStorage.removeItem('bsq_admin_active_tab');
                      addToast('info', 'Logged Out', 'Successfully logged out of Administrative Console.');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-700/20 hover:border-red-600/40 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      isRtl ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <LogOut size={12} />
                    {t('admin', 'logout')}
                  </button>
                  <button onClick={onClose} className="p-2 bg-white/3 hover:bg-brand-orange hover:text-brand-black text-white rounded-xl transition-all cursor-pointer border border-white/5">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Console Tabs */}
              <div className={`flex bg-white/2 border-b border-white/5 text-xs font-display font-semibold px-4 gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {((authenticatedRole === 'admin' 
                  ? ['matches', 'roster', 'store', 'standings'] 
                  : authenticatedRole === 'coach' 
                  ? ['matches', 'roster'] 
                  : ['store']) as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      sessionStorage.setItem('bsq_admin_active_tab', tab);
                    }}
                    className={`py-4 px-2 uppercase tracking-wider relative cursor-pointer ${
                      activeTab === tab ? 'text-brand-orange font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {getTabLabel(tab)}
                    {activeTab === tab && <motion.div layoutId="adminTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-orange" />}
                  </button>
                ))}
              </div>

              {/* Content Panels */}
              <div className="flex-1 overflow-y-auto p-8 font-display">
                
                {/* 1. MATCHES PANEL */}
                {activeTab === 'matches' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Live score controller */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className={`flex items-center justify-between border-b border-white/5 pb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <h4 className="font-title font-extrabold uppercase text-white text-sm flex items-center gap-2 text-start">
                          <Tv size={16} className="text-brand-orange" /> {t('admin', 'scoreboard')}
                        </h4>
                        
                        {/* Simulation Toggle */}
                        <button
                          onClick={toggleSimulation}
                          className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-1 ${
                            isSimulating
                              ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                          }`}
                        >
                          <RefreshCw size={10} className={isSimulating ? 'animate-spin' : ''} />
                          {isSimulating ? t('admin', 'simActive') : t('admin', 'simPaused')}
                        </button>
                      </div>

                      {matches.map((match) => (
                        <div key={match.id} className="bg-white/2 border border-white/5 p-5 rounded-2xl space-y-4">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white uppercase flex items-center gap-1.5">
                              vs {match.opponent}
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                                match.status === 'LIVE' ? 'bg-red-500/20 text-red-500' : match.status === 'FINISHED' ? 'bg-gray-500/20 text-gray-500' : 'bg-brand-gold/20 text-brand-gold'
                              }`}>{match.status}</span>
                            </span>
                            <span className="text-gray-500">{match.venue}</span>
                          </div>

                          {/* Controls based on status */}
                          {match.status === 'UPCOMING' && (
                            <button
                              onClick={() => handleStatusChange(match.id, 'LIVE')}
                              className="px-4 py-2 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black text-[10px] tracking-widest rounded uppercase cursor-pointer"
                            >
                              {language === 'ar' ? 'بدء المباراة' : language === 'id' ? 'Mulai Pertandingan' : 'Kick Off (Go Live)'}
                            </button>
                          )}

                          {match.status === 'LIVE' && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between py-2 border-y border-white/5">
                                {/* Vortex score controls */}
                                <div className="text-center">
                                  <span className="text-[9px] text-gray-500 block uppercase font-bold">VORTEX HOOPS</span>
                                  <span className="text-xl font-bold text-white">{match.score_home}</span>
                                  <div className="flex gap-1 mt-2">
                                    <button onClick={() => handleUpdateScore(match.id, 'home', 1)} className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold rounded cursor-pointer">+1</button>
                                    <button onClick={() => handleUpdateScore(match.id, 'home', 2)} className="px-2 py-1 bg-brand-orange hover:bg-brand-burnt text-brand-black text-[10px] font-bold rounded cursor-pointer">+2</button>
                                    <button onClick={() => handleUpdateScore(match.id, 'home', 3)} className="px-2 py-1 bg-brand-gold hover:bg-amber-500 text-brand-black text-[10px] font-bold rounded cursor-pointer">+3</button>
                                  </div>
                                </div>

                                <span className="font-bold text-gray-500 text-sm">vs</span>

                                {/* Opponent score controls */}
                                <div className="text-center">
                                  <span className="text-[9px] text-gray-500 block uppercase font-bold">{match.opponent.toUpperCase()}</span>
                                  <span className="text-xl font-bold text-white">{match.score_away}</span>
                                  <div className="flex gap-1 mt-2">
                                    <button onClick={() => handleUpdateScore(match.id, 'away', 1)} className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold rounded cursor-pointer">+1</button>
                                    <button onClick={() => handleUpdateScore(match.id, 'away', 2)} className="px-2 py-1 bg-brand-orange hover:bg-brand-burnt text-brand-black text-[10px] font-bold rounded cursor-pointer">+2</button>
                                    <button onClick={() => handleUpdateScore(match.id, 'away', 3)} className="px-2 py-1 bg-brand-gold hover:bg-amber-500 text-brand-black text-[10px] font-bold rounded cursor-pointer">+3</button>
                                  </div>
                                </div>
                              </div>

                              <div className={`flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <span className="text-[10px] text-gray-400">{t('matches', 'quarter')}: {match.quarter} • {t('matches', 'time')}: {match.time_remaining}</span>
                                <button
                                  onClick={() => handleStatusChange(match.id, 'FINISHED')}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] tracking-widest rounded uppercase cursor-pointer"
                                >
                                  {language === 'ar' ? 'إنهاء المباراة' : language === 'id' ? 'Akhiri Pertandingan' : 'Finalize & End Game'}
                                </button>
                              </div>
                            </div>
                          )}

                          {match.status === 'FINISHED' && (
                            <div className={`text-xs text-gray-400 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                              <span>{t('matches', 'final')}: {match.score_home} - {match.score_away}</span>
                              <button
                                onClick={() => handleStatusChange(match.id, 'UPCOMING')}
                                className="text-brand-orange text-[10px] uppercase font-bold"
                              >
                                {language === 'ar' ? 'إعادة فتح المباراة' : language === 'id' ? 'Buka Kembali Laga' : 'Re-open Game'}
                              </button>
                            </div>
                          )}

                        </div>
                      ))}
                    </div>

                    {/* Schedule match form */}
                    <div className="lg:col-span-5 bg-white/2 border border-white/5 p-6 rounded-2xl">
                      <h4 className="font-title font-extrabold uppercase text-white text-sm mb-4 flex items-center gap-1.5 text-start">
                        <Calendar size={16} className="text-brand-orange" /> {t('admin', 'schedule')}
                      </h4>
                      <form onSubmit={handleCreateMatch} className="space-y-4 text-xs">
                        <div>
                          <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'opponentLabel')}</label>
                          <input
                            type="text"
                            required
                            placeholder="E.g., Solar Flares"
                            value={newMatchOpponent}
                            onChange={(e) => setNewMatchOpponent(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'venueLabel')}</label>
                          <input
                            type="text"
                            required
                            placeholder="Al Hikmah Arena"
                            value={newMatchVenue}
                            onChange={(e) => setNewMatchVenue(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'dateTimeLabel')}</label>
                          <input
                            type="datetime-local"
                            required
                            value={newMatchDate}
                            onChange={(e) => setNewMatchDate(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                          />
                        </div>
                        <button type="submit" className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer">
                          Add Matchup
                        </button>
                      </form>
                    </div>

                  </div>
                )}

                {/* 2. ROSTER PANEL */}
                {activeTab === 'roster' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Players list */}
                    <div className="lg:col-span-7 space-y-4">
                      <h4 className="font-title font-extrabold uppercase text-white text-sm border-b border-white/5 pb-3 text-start">{t('admin', 'roster')}</h4>
                      {players.map((player) => (
                        <div key={player.id} className={`bg-white/2 border border-white/5 p-4 rounded-xl flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                            <div className="w-10 h-10 rounded bg-white/5 overflow-hidden">
                              <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="text-[9px] text-brand-orange uppercase font-bold">{player.position} • #{player.number}</span>
                              <h5 className="font-bold text-white text-sm leading-none mt-1">{player.name}</h5>
                            </div>
                          </div>
                          <div className={`flex items-center gap-4 text-xs font-bold ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <span className="text-gray-400">{player.stats.ppg} {t('roster', 'ppg')}</span>
                            <button
                              onClick={() => handleDeletePlayer(player.id, player.name)}
                              className="text-red-500 hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Forms column */}
                    <div className="lg:col-span-5 space-y-6">
                      
                      {/* Add player form */}
                      <div className="bg-white/2 border border-white/5 p-6 rounded-2xl">
                        <h4 className="font-title font-extrabold uppercase text-white text-sm mb-4 flex items-center gap-1.5 text-start">
                          <Users size={16} className="text-brand-orange" /> {t('admin', 'signPlayer')}
                        </h4>
                        <form onSubmit={handleCreatePlayer} className="space-y-4 text-xs">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'fullName')}</label>
                              <input
                                type="text"
                                required
                                placeholder="Marcus Vance"
                                value={newPlayerName}
                                onChange={(e) => setNewPlayerName(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'jerseyNum')}</label>
                              <input
                                type="number"
                                required
                                min="0"
                                max="99"
                                value={newPlayerNum}
                                onChange={(e) => setNewPlayerNum(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'position')}</label>
                              <select
                                value={newPlayerPos}
                                onChange={(e) => setNewPlayerPos(e.target.value as Player['position'])}
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                              >
                                {['PG', 'SG', 'SF', 'PF', 'C'].map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'height')}</label>
                              <input
                                type="text"
                                value={newPlayerHeight}
                                onChange={(e) => setNewPlayerHeight(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'weight')}</label>
                              <input
                                type="text"
                                value={newPlayerWeight}
                                onChange={(e) => setNewPlayerWeight(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'ppg')}</label>
                              <input
                                type="number"
                                step="0.1"
                                value={newPlayerPPG}
                                onChange={(e) => setNewPlayerPPG(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'apg')}</label>
                              <input
                                type="number"
                                step="0.1"
                                value={newPlayerAPG}
                                onChange={(e) => setNewPlayerAPG(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'rpg')}</label>
                              <input
                                type="number"
                                step="0.1"
                                value={newPlayerRPG}
                                onChange={(e) => setNewPlayerRPG(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">Player Photo</label>
                            <div className="flex items-center gap-3 bg-black/20 border border-white/10 p-2 rounded-xl">
                              {newPlayerPhoto && (
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                  <img src={newPlayerPhoto} alt="Player Preview" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(e, setNewPlayerPhoto)}
                                className="w-full text-[10px] text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-white/5 file:text-white file:hover:bg-white/10 file:cursor-pointer"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'bio')}</label>
                            <textarea
                                value={newPlayerBio}
                                onChange={(e) => setNewPlayerBio(e.target.value)}
                                placeholder="Signee profile details..."
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white h-20 resize-none text-start"
                            />
                          </div>
                          <button type="submit" className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer">
                            {t('admin', 'confirmContract')}
                          </button>
                        </form>
                      </div>

                      {/* Head Coach & Manager settings form */}
                      <div className="bg-white/2 border border-white/5 p-6 rounded-2xl">
                        <h4 className="font-title font-extrabold uppercase text-white text-sm mb-4 flex items-center gap-1.5 text-start">
                          <Users size={16} className="text-brand-orange" /> {t('admin', 'coachTitle')}
                        </h4>
                        <form onSubmit={handleUpdateCoach} className="space-y-4 text-xs">
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'coachName')}</label>
                            <input
                              type="text"
                              required
                              value={coachName}
                              onChange={(e) => setCoachName(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'coachJobTitle')}</label>
                            <input
                              type="text"
                              required
                              value={coachRoleTitle}
                              onChange={(e) => setCoachRoleTitle(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'coachPhoto')}</label>
                            <div className="flex items-center gap-3 bg-black/20 border border-white/10 p-2 rounded-xl">
                              {coachPhoto && (
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                  <img src={coachPhoto} alt="Coach Preview" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(e, setCoachPhoto)}
                                className="w-full text-[10px] text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-white/5 file:text-white file:hover:bg-white/10 file:cursor-pointer"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'coachBio')}</label>
                            <textarea
                              required
                              value={coachBio}
                              onChange={(e) => setCoachBio(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white h-20 resize-none text-start"
                            />
                          </div>
                          <button type="submit" className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer">
                            {t('admin', 'updateCoach')}
                          </button>
                        </form>
                      </div>

                    </div>

                  </div>
                )}

                {/* 3. STORE PANEL */}
                {activeTab === 'store' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Products list */}
                    <div className="lg:col-span-7 space-y-4">
                      <h4 className="font-title font-extrabold uppercase text-white text-sm border-b border-white/5 pb-3 text-start">{t('admin', 'inventory')}</h4>
                      {merchandise.map((item) => (
                        <div key={item.id} className={`bg-white/2 border border-white/5 p-4 rounded-xl flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                            <div className="w-10 h-10 rounded bg-white/5 overflow-hidden">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="text-[9px] text-brand-gold uppercase font-bold">{getCategoryLabel(item.category)} • {t('shop', 'stock')}: {item.stock}</span>
                              <h5 className="font-bold text-white text-sm leading-none mt-1">{item.name}</h5>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-bold">
                            <span className="text-white">${item.price}</span>
                            <button
                              onClick={() => handleDeleteMerch(item.id, item.name)}
                              className="text-red-500 hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add product form */}
                    <div className="lg:col-span-5 bg-white/2 border border-white/5 p-6 rounded-2xl">
                      <h4 className="font-title font-extrabold uppercase text-white text-sm mb-4 flex items-center gap-1.5 text-start">
                        <Plus size={16} className="text-brand-orange" /> {t('admin', 'addProduct')}
                      </h4>
                      <form onSubmit={handleCreateMerch} className="space-y-4 text-xs">
                        <div>
                          <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'prodName')}</label>
                          <input
                            type="text"
                            required
                            placeholder="Championship Edition Cap"
                            value={newMerchName}
                            onChange={(e) => setNewMerchName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'price')}</label>
                            <input
                              type="number"
                              required
                              value={newMerchPrice}
                              onChange={(e) => setNewMerchPrice(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'category')}</label>
                            <select
                              value={newMerchCategory}
                              onChange={(e) => setNewMerchCategory(e.target.value as Merchandise['category'])}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                            >
                              {['jersey', 'shoes', 'caps', 'accessories'].map(c => (
                                <option key={c} value={c}>{getCategoryLabel(c)}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'stock')}</label>
                            <input
                              type="number"
                              required
                              value={newMerchStock}
                              onChange={(e) => setNewMerchStock(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">Product Image</label>
                          <div className="flex items-center gap-3 bg-black/20 border border-white/10 p-2 rounded-xl">
                            {newMerchImage && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                <img src={newMerchImage} alt="Product Preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, setNewMerchImage)}
                              className="w-full text-[10px] text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-white/5 file:text-white file:hover:bg-white/10 file:cursor-pointer"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">{t('admin', 'desc')}</label>
                          <textarea
                            value={newMerchDesc}
                            onChange={(e) => setNewMerchDesc(e.target.value)}
                            placeholder="Product description and details..."
                            className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white h-20 resize-none text-start"
                          />
                        </div>
                        <button type="submit" className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer">
                          {t('admin', 'addCatalog')}
                        </button>
                      </form>
                    </div>

                  </div>
                )}

                {/* 4. STANDINGS PANEL */}
                {activeTab === 'standings' && (
                  <div className="space-y-6">
                    <h4 className="font-title font-extrabold uppercase text-white text-sm border-b border-white/5 pb-3 text-start">{t('admin', 'standings')}</h4>
                    <div className="bg-white/2 border border-white/5 rounded-2xl p-6 overflow-x-auto">
                      <table className="w-full text-start text-xs">
                        <thead>
                          <tr className={`text-gray-500 uppercase tracking-wider font-bold border-b border-white/10 pb-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                            <th className="pb-3 text-start">{t('matches', 'team')}</th>
                            <th className="pb-3 text-center">{t('matches', 'wins')}</th>
                            <th className="pb-3 text-center">{t('matches', 'losses')}</th>
                            <th className="pb-3 text-center">{t('matches', 'points')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.map((team) => (
                            <tr key={team.id} className="border-b border-white/3">
                              <td className="py-4 font-bold text-white uppercase">{team.team_name}</td>
                              <td className="py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleUpdateStanding(team.id, 'wins', -1)} className="px-1.5 py-0.5 bg-white/5 rounded">-</button>
                                  <span className="w-6 text-white font-bold">{team.wins}</span>
                                  <button onClick={() => handleUpdateStanding(team.id, 'wins', 1)} className="px-1.5 py-0.5 bg-brand-orange text-brand-black rounded font-black">+</button>
                                </div>
                              </td>
                              <td className="py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleUpdateStanding(team.id, 'losses', -1)} className="px-1.5 py-0.5 bg-white/5 rounded">-</button>
                                  <span className="w-6 text-white font-bold">{team.losses}</span>
                                  <button onClick={() => handleUpdateStanding(team.id, 'losses', 1)} className="px-1.5 py-0.5 bg-brand-orange text-brand-black rounded font-black">+</button>
                                </div>
                              </td>
                              <td className="py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleUpdateStanding(team.id, 'points', -1)} className="px-1.5 py-0.5 bg-white/5 rounded">-</button>
                                  <span className="w-8 text-brand-gold font-black">{team.points}</span>
                                  <button onClick={() => handleUpdateStanding(team.id, 'points', 1)} className="px-1.5 py-0.5 bg-brand-orange text-brand-black rounded font-black">+</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminPortal;
