import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dribbble, Instagram, Play, Twitter, X, Zap, Search, 
  ArrowLeftRight, Check, Sparkles, Volume2, VolumeX, Lock, Unlock, Trophy,
  Award, FileText
} from 'lucide-react';
import { db } from '../lib/supabase';
import type { Player } from '../lib/supabase';
import useAppStore from '../lib/store';
import { getTranslation } from '../lib/i18n';
import gsap from 'gsap';

// Web Audio API Synthesizer for premium court & dashboard SFX
const playSound = (type: 'click' | 'whoosh' | 'success' | 'laser' | 'draft', enabled: boolean) => {
  if (typeof window === 'undefined' || !enabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'draft') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'whoosh') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === 'laser') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else if (type === 'success') {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);
        gain.gain.setValueAtTime(0.06, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.22);
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.22);
      });
    }
  } catch (e) {
    console.warn('AudioContext sound playing failed:', e);
  }
};

const getYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Performant GSAP-driven counting stats component to avoid React render lags on hover
const StatCounter: React.FC<{ value: number; active: boolean }> = ({ value, active }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const prevActive = useRef(active);

  useEffect(() => {
    if (active && !prevActive.current) {
      const obj = { val: 0 };
      gsap.fromTo(obj, 
        { val: 0 },
        {
          val: value,
          duration: 0.5,
          ease: 'power1.out',
          onUpdate: () => {
            if (ref.current) {
              ref.current.textContent = obj.val.toFixed(1);
            }
          }
        }
      );
    }
    prevActive.current = active;
  }, [active, value]);

  return <span ref={ref}>0.0</span>;
};

export const PlayerShowcase: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'achieve' | 'video' | 'social'>('stats');
  const [manager, setManager] = useState<any>(null);
  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<'all' | 'PG' | 'SG' | 'SF' | 'PF' | 'C'>('all');

  // Compare states
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareList, setCompareList] = useState<Player[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Lineup Builder States
  const [lineup, setLineup] = useState<{ [pos in 'PG' | 'SG' | 'SF' | 'PF' | 'C']: Player | null }>({
    PG: null,
    SG: null,
    SF: null,
    PF: null,
    C: null
  });
  const [selectedSlot, setSelectedSlot] = useState<'PG' | 'SG' | 'SF' | 'PF' | 'C' | null>(null);
  const [isLineupLocked, setIsLineupLocked] = useState(false);
  const [sfxEnabled, setSfxEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bsq_sfx_muted') !== 'true';
    }
    return true;
  });

  // Scoreboard Animated States
  const scoreboardRef = useRef({ ovr: 0, off: 0, def: 0, chem: 0 });
  const [animatedScoreboard, setAnimatedScoreboard] = useState({ ovr: 0, off: 0, def: 0, chem: 0 });

  // GSAP Comparison modal elements references
  const p1CardRef = useRef<HTMLDivElement>(null);
  const p2CardRef = useRef<HTMLDivElement>(null);
  const vsLogoRef = useRef<HTMLDivElement>(null);
  const statBarsRef = useRef<HTMLDivElement>(null);

  const addXP = useAppStore(state => state.addXP);
  const unlockBadge = useAppStore(state => state.unlockBadge);
  const addToast = useAppStore(state => state.addToast);
  const language = useAppStore(state => state.language);
  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';

  const fan = useAppStore(state => state.fan);
  const lineupKey = fan?.username ? `bsq_dream_lineup_${fan.username.toLowerCase()}` : 'bsq_dream_lineup';
  const lockKey = fan?.username ? `bsq_dream_lineup_locked_${fan.username.toLowerCase()}` : 'bsq_dream_lineup_locked';

  useEffect(() => {
    const fetchPlayers = () => {
      db.from('players').select('*').then(({ data }: any) => {
        if (data && data.length > 0) {
          setPlayers(data as Player[]);
        } else {
          const localVal = localStorage.getItem('bsq_db_v2_players');
          const localPlayers = localVal ? JSON.parse(localVal) : [];
          setPlayers(localPlayers as Player[]);
        }
      }).catch((err: any) => {
        console.error("PlayerShowcase: error fetching players", err);
        const localVal = localStorage.getItem('bsq_db_v2_players');
        const localPlayers = localVal ? JSON.parse(localVal) : [];
        setPlayers(localPlayers as Player[]);
      });
    };

    fetchPlayers();

    window.addEventListener('bsq_players_updated', fetchPlayers);

    // Fetch manager
    db.from('manager').select('*').then(({ data }: any) => {
      if (data && data[0]) {
        setManager(data[0]);
      } else {
        const localVal = localStorage.getItem('bsq_db_v2_manager');
        const localManager = localVal ? JSON.parse(localVal) : [];
        if (localManager && localManager[0]) {
          setManager(localManager[0]);
        }
      }
    }).catch(() => {
      const localVal = localStorage.getItem('bsq_db_v2_manager');
      const localManager = localVal ? JSON.parse(localVal) : [];
      if (localManager && localManager[0]) setManager(localManager[0]);
    });

    // Subscribe to manager updates
    const channelName = `manager_update_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const channel = db.channel(channelName)
      .on('postgres_changes' as any, { event: 'UPDATE', table: 'manager', schema: 'public' }, (payload: any) => {
        setManager(payload.new);
      })
      .subscribe();

    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
      window.removeEventListener('bsq_players_updated', fetchPlayers);
    };
  }, []);

  // Restore Lineup from Storage on load
  useEffect(() => {
    if (players.length > 0) {
      const savedLineup = localStorage.getItem(lineupKey);
      const savedLock = localStorage.getItem(lockKey);
      if (savedLineup) {
        try {
          const parsed = JSON.parse(savedLineup);
          const reconstructed: any = {};
          for (const pos of ['PG', 'SG', 'SF', 'PF', 'C'] as const) {
            if (parsed[pos]) {
              let matched = players.find(p => p.id === parsed[pos]);
              if (!matched) {
                // Fallback: match by position if exact ID from localStorage doesn't exist anymore
                matched = players.find(p => p.position.toUpperCase() === pos);
              }
              if (matched) reconstructed[pos] = matched;
            }
          }
          setLineup(prev => ({ PG: null, SG: null, SF: null, PF: null, C: null, ...reconstructed }));
          setIsLineupLocked(savedLock === 'true');
        } catch (e) {
          console.error('Error restoring lineup:', e);
        }
      } else {
        // Clear lineup and unlock for new session/user with no saved lineup
        setLineup({ PG: null, SG: null, SF: null, PF: null, C: null });
        setIsLineupLocked(false);
      }
    }
  }, [players, lineupKey, lockKey]);

  // Handle SFX volume state persistence
  const toggleSfx = () => {
    setSfxEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('bsq_sfx_muted', String(!newValue));
      return newValue;
    });
  };

  // GSAP Staggered entry animation on load / filter change
  useEffect(() => {
    if (players.length > 0) {
      gsap.fromTo('.player-card',
        { opacity: 0, scale: 0.85, y: 40, rotateX: -15 },
        { opacity: 1, scale: 1, y: 0, rotateX: 0, duration: 0.55, stagger: 0.06, ease: 'back.out(1.2)' }
      );
    }
  }, [players, selectedPosition, searchQuery]);

  // Calculate Team Stats for Lineup
  const getLineupStats = () => {
    const drafted = Object.values(lineup).filter(Boolean) as Player[];
    if (drafted.length === 0) {
      return { ovr: 0, off: 0, def: 0, chem: 0 };
    }

    // Map individual ratings
    const offScores = drafted.map(p => Math.min(99, Math.round((p.stats.ppg / 28) * 55 + (p.stats.apg / 9) * 44)));
    const defScores = drafted.map(p => Math.min(99, Math.round((p.stats.rpg / 13) * 35 + (p.stats.bpg / 3.3) * 35 + (p.stats.spg / 2.4) * 29)));

    const avgOff = Math.round(offScores.reduce((a, b) => a + b, 0) / drafted.length);
    const avgDef = Math.round(defScores.reduce((a, b) => a + b, 0) / drafted.length);

    // Chemistry Points
    let chemPoints = 20; // Base
    chemPoints += drafted.length * 10; // +10 per drafted player
    
    // Position Match Bonus (+10 points if drafted in their natural matching court position)
    Object.entries(lineup).forEach(([slot, player]) => {
      if (player && player.position === slot) {
        chemPoints += 10;
      }
    });

    // Duo Chemistry Check
    if (lineup.PG && lineup.SG) chemPoints += 5;
    if (lineup.PF && lineup.C) chemPoints += 5;

    const chem = Math.min(100, chemPoints);

    // OVR calculation factoring in Chemistry
    const baseOvr = Math.round((avgOff + avgDef) / 2);
    const chemFactor = 0.9 + (chem / 100) * 0.2; // 0.9x to 1.1x multiplier
    const ovr = Math.min(99, Math.round(baseOvr * chemFactor));

    return { ovr, off: avgOff, def: avgDef, chem };
  };

  const currentStats = getLineupStats();

  // Smooth scoreboard GSAP interpolation
  useEffect(() => {
    gsap.to(scoreboardRef.current, {
      ovr: currentStats.ovr,
      off: currentStats.off,
      def: currentStats.def,
      chem: currentStats.chem,
      duration: 0.65,
      ease: 'power2.out',
      onUpdate: () => {
        setAnimatedScoreboard({
          ovr: Math.round(scoreboardRef.current.ovr),
          off: Math.round(scoreboardRef.current.off),
          def: Math.round(scoreboardRef.current.def),
          chem: Math.round(scoreboardRef.current.chem)
        });
      }
    });
  }, [currentStats.ovr, currentStats.off, currentStats.def, currentStats.chem]);

  // Card dynamic 3D tilt & glare coordinates
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xPercent = (x / rect.width - 0.5) * 2; // -1 to 1
    const yPercent = (y / rect.height - 0.5) * 2; // -1 to 1
    
    gsap.to(card, {
      rotateY: xPercent * 12,
      rotateX: -yPercent * 12,
      transformPerspective: 800,
      ease: 'power2.out',
      duration: 0.25
    });
    
    card.style.setProperty('--x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--y', `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    gsap.to(card, {
      rotateY: 0,
      rotateX: 0,
      ease: 'elastic.out(1.2, 0.5)',
      duration: 0.6
    });
  };

  const handleCardClick = (player: Player) => {
    if (isCompareMode) {
      playSound('click', sfxEnabled);
      const exists = compareList.find(p => p.id === player.id);
      if (exists) {
        setCompareList(prev => prev.filter(p => p.id !== player.id));
      } else {
        if (compareList.length < 2) {
          setCompareList(prev => [...prev, player]);
          addXP(5);
        } else {
          setCompareList(prev => [prev[0], player]);
        }
      }
    } else if (selectedSlot) {
      // Draft directly into selected slot
      draftPlayer(player, selectedSlot);
    } else {
      playSound('whoosh', sfxEnabled);
      setSelectedPlayer(player);
      setActiveTab('stats');
      addXP(10);
    }
  };

  const draftPlayer = (player: Player, position: 'PG' | 'SG' | 'SF' | 'PF' | 'C') => {
    if (isLineupLocked) return;
    playSound('draft', sfxEnabled);
    
    // Check if player is already drafted elsewhere in the lineup, if so, remove them first
    const cleanLineup = { ...lineup };
    Object.keys(cleanLineup).forEach((k) => {
      const posKey = k as 'PG' | 'SG' | 'SF' | 'PF' | 'C';
      if (cleanLineup[posKey]?.id === player.id) {
        cleanLineup[posKey] = null;
      }
    });

    const updated = {
      ...cleanLineup,
      [position]: player
    };

    setLineup(updated);
    setSelectedSlot(null);

    // Save ids to localStorage
    const idsMap: any = {};
    Object.keys(updated).forEach(k => {
      idsMap[k] = updated[k as 'PG' | 'SG' | 'SF' | 'PF' | 'C']?.id || null;
    });
    localStorage.setItem(lineupKey, JSON.stringify(idsMap));
    window.dispatchEvent(new CustomEvent('bsq_dream_lineup_updated'));

    // Stagger animation on court node addition
    setTimeout(() => {
      gsap.fromTo(`.court-avatar-${position}`,
        { scale: 0, rotate: -45 },
        { scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(1.5)' }
      );
    }, 50);

    addXP(15);
    addToast('success', 'Player Drafted', `${player.name.split(' "')[0]} assigned as ${position}!`);
  };

  const undraftPlayer = (position: 'PG' | 'SG' | 'SF' | 'PF' | 'C') => {
    if (isLineupLocked) return;
    playSound('whoosh', sfxEnabled);

    const updated = {
      ...lineup,
      [position]: null
    };
    setLineup(updated);

    const idsMap: any = {};
    Object.keys(updated).forEach(k => {
      idsMap[k] = updated[k as 'PG' | 'SG' | 'SF' | 'PF' | 'C']?.id || null;
    });
    localStorage.setItem(lineupKey, JSON.stringify(idsMap));
    window.dispatchEvent(new CustomEvent('bsq_dream_lineup_updated'));

    addToast('info', 'Slot Cleared', `${position} slot is now vacant.`);
  };

  const toggleLockLineup = () => {
    if (isLineupLocked) {
      playSound('click', sfxEnabled);
      setIsLineupLocked(false);
      localStorage.setItem(lockKey, 'false');
    } else {
      // Check if starting 5 is complete
      const complete = Object.values(lineup).every(Boolean);
      if (!complete) {
        playSound('click', sfxEnabled);
        addToast('warning', 'Incomplete Squad', 'Please assign players to all 5 slots before locking.');
        return;
      }

      playSound('success', sfxEnabled);
      setIsLineupLocked(true);
      localStorage.setItem(lockKey, 'true');

      // GSAP energy line sweep animation
      gsap.fromTo('.court-energy-line',
        { strokeDashoffset: 100 },
        { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut', stagger: 0.1 }
      );

      // Flash court background
      gsap.fromTo('.court-overlay-flash',
        { opacity: 0 },
        { opacity: 0.35, duration: 0.15, yoyo: true, repeat: 3 }
      );

      addXP(100);
      unlockBadge(
        'lvl_dream_team',
        language === 'ar' ? 'مدرب تشكيلة الأحلام' : language === 'id' ? 'Pelatih Skuad Impian' : 'Dream Team Coach',
        '👑',
        language === 'ar' ? 'صممت تشكيلة خماسية كاملة' : language === 'id' ? 'Membangun lima utama skuad impian' : 'Built a 5-star starting lineup'
      );
      addToast('success', t('roster', 'lineupLocked'), 'Check clubhouse to inspect your new badge!');
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          player.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = selectedPosition === 'all' || player.position === selectedPosition;
    return matchesSearch && matchesPosition;
  });

  // Calculate comparisons metrics
  const getCompareAdvantage = () => {
    if (compareList.length < 2) return null;
    const p1 = compareList[0];
    const p2 = compareList[1];

    const score1 = p1.stats.ppg * 1.0 + p1.stats.apg * 1.5 + p1.stats.rpg * 1.2 + p1.stats.spg * 2.0 + p1.stats.bpg * 2.0;
    const score2 = p2.stats.ppg * 1.0 + p2.stats.apg * 1.5 + p2.stats.rpg * 1.2 + p2.stats.spg * 2.0 + p2.stats.bpg * 2.0;

    const winProb1 = Math.max(10, Math.min(90, Math.round((score1 / (score1 + score2)) * 100)));
    const winProb2 = 100 - winProb1;

    // Dominate stat check
    let advantageText = '';
    if (p1.stats.ppg > p2.stats.ppg + 3) {
      advantageText = `${p1.name.split(' "')[0]} dominates the scoring average with ${p1.stats.ppg} PPG.`;
    } else if (p2.stats.ppg > p1.stats.ppg + 3) {
      advantageText = `${p2.name.split(' "')[0]} leads the matchup in scoring with ${p2.stats.ppg} PPG.`;
    } else if (p1.stats.apg > p2.stats.apg + 2) {
      advantageText = `${p1.name.split(' "')[0]} has significantly better court vision (+${(p1.stats.apg - p2.stats.apg).toFixed(1)} APG).`;
    } else if (p2.stats.apg > p1.stats.apg + 2) {
      advantageText = `${p2.name.split(' "')[0]} handles playmaking with ${p2.stats.apg} assists per game.`;
    } else if (p1.stats.bpg > p2.stats.bpg + 1) {
      advantageText = `${p1.name.split(' "')[0]} provides elite interior rim protection.`;
    } else if (p2.stats.bpg > p1.stats.bpg + 1) {
      advantageText = `${p2.name.split(' "')[0]} controls the paint with ${p2.stats.bpg} blocks per game.`;
    } else {
      advantageText = `Extremely close matchup. ${p1.name.split(' "')[0]} and ${p2.name.split(' "')[0]} share matching performance indexes.`;
    }

    return { winProb1, winProb2, advantageText };
  };

  const matchAdv = getCompareAdvantage();

  // Mock Achievements
  const getAchievements = (player: Player) => {
    // If the player has database-customized awards, prioritize them!
    if (player.awards && player.awards.length > 0) {
      return player.awards;
    }
    const nameLower = player.name.toLowerCase();
    
    // Hardcoded achievements for the original mock players by matching their names
    if (nameLower.includes('marcus')) {
      return ['2x Finals MVP', '3x All-Star', 'All-NBA First Team (2024)', 'Steals Leader (2025)'];
    }
    if (nameLower.includes('candra')) {
      return ['3-Point Contest Champion (2024)', '4x All-Star', 'All-NBA Second Team (2025)', 'Most Improved Player (2021)'];
    }
    if (nameLower.includes('fikri')) {
      return ['Defensive Player of the Year (2025)', '3x All-Defensive First Team', 'NBA Champion (2024, 2025)', 'Teammate of the Year (2024)'];
    }
    if (nameLower.includes('rian')) {
      return ['Slam Dunk Contest Winner (2023)', '1x All-Star', 'All-Rookie First Team (2022)', 'NBA Champion (2025)'];
    }
    if (nameLower.includes('bagas')) {
      return ['Blocks Leader (2024, 2025)', '1x All-Star', 'All-Defensive Second Team (2023)', 'Rebounds Leader (2025)'];
    }

    // Dynamic generation based on position, number, stats
    const list: string[] = [];
    
    // MVP / All-Star logic based on PPG
    if (player.stats.ppg >= 18) {
      list.push('DBL League MVP (2025)');
      list.push('2x All-Star First Team');
    } else if (player.stats.ppg >= 14) {
      list.push('DBL All-Star Selected (2025)');
      list.push('All-Tournament First Team (2024)');
    } else {
      list.push('Most Improved Player Candidate');
      list.push('All-Tournament Honorable Mention');
    }

    // Position-specific achievements
    if (player.position === 'PG') {
      list.push(player.stats.apg >= 6 ? 'League Assists Leader (2025)' : 'Elite Playmaker of the Year');
      list.push('Clutch Assist Trophy');
    } else if (player.position === 'SG') {
      list.push('Three-Point Contest Champion (2025)');
      list.push('Perimeter Shooting Honors');
    } else if (player.position === 'SF') {
      list.push(player.stats.spg >= 1.5 ? 'All-Defensive First Team (2025)' : 'Two-Way Impact Player');
      list.push('Highlight Dunk of the Year');
    } else if (player.position === 'PF') {
      list.push(player.stats.rpg >= 8 ? 'Rebounding Title (2025)' : 'Interior Force Award');
      list.push('High-Percentage Finisher');
    } else if (player.position === 'C') {
      list.push(player.stats.bpg >= 2.0 ? 'Defensive Player of the Year (2025)' : 'Rim Protector of the Year');
      list.push('Double-Double Machine Record');
    }

    // Jersey number legacy
    list.push(`Jersey #${player.number} Franchise Legacy Award`);

    return list;
  };

  return (
    <section id="roster" className="py-24 px-6 bg-brand-black relative select-none">
      
      {/* Floating Audio & Lineup shortcuts */}
      <div className={`fixed top-24 ${isRtl ? 'left-6' : 'right-6'} z-[90] flex flex-col gap-2`}>
        <button
          onClick={toggleSfx}
          className="p-3 bg-white/2 hover:bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all flex items-center justify-center shadow-lg backdrop-blur-md cursor-pointer"
          title="Toggle SFX Audio"
        >
          {sfxEnabled ? <Volume2 size={16} className="text-brand-orange" /> : <VolumeX size={16} />}
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/* Header & Search Controls */}
        <div className={`flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 ${isRtl ? 'md:flex-row-reverse text-right' : 'text-left'}`}>
          <div>
            <span className="text-brand-orange font-display text-sm font-semibold tracking-[0.25em] uppercase block mb-2">
              {t('roster', 'title')}
            </span>
            <h2 className="text-4xl md:text-5xl font-title font-extrabold uppercase tracking-tight">
              {(() => {
                const subtitleText = t('roster', 'subtitle');
                const subtitleParts = subtitleText.split(' ');
                const subtitleHighlight = subtitleParts[subtitleParts.length - 1];
                const subtitleNormal = subtitleParts.slice(0, -1).join(' ');
                return (
                  <>
                    {subtitleNormal}{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-gold">
                      {subtitleHighlight}
                    </span>
                  </>
                );
              })()}
            </h2>
          </div>

          <div className={`flex flex-wrap items-center gap-4 self-start md:self-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className={`absolute top-1/2 -translate-y-1/2 text-gray-500 ${isRtl ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                placeholder={t('roster', 'searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`bg-white/2 border border-white/10 rounded-xl py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange font-display w-44 md:w-56 transition-all focus:w-60 ${
                  isRtl ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4 text-left'
                }`}
              />
            </div>

            {/* Compare Trigger Button */}
            <button
              onClick={() => {
                playSound('click', sfxEnabled);
                setIsCompareMode(!isCompareMode);
                setCompareList([]);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-display font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                isCompareMode
                  ? 'bg-brand-orange/20 border-brand-orange text-brand-orange'
                  : 'bg-white/2 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
              } ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <ArrowLeftRight size={14} /> {t('roster', 'compareMode')}
            </button>
          </div>
        </div>

        {/* Position Filters */}
        <div className={`flex flex-wrap gap-1.5 mb-10 bg-white/2 border border-white/5 p-1 rounded-2xl text-[10px] font-display font-black tracking-widest uppercase w-max max-w-full ${isRtl ? 'flex-row-reverse self-end ml-auto' : ''}`}>
          {(['all', 'PG', 'SG', 'SF', 'PF', 'C'] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => {
                playSound('click', sfxEnabled);
                setSelectedPosition(pos);
              }}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                selectedPosition === pos
                  ? 'bg-brand-orange text-brand-black shadow-lg shadow-brand-orange/20 font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {pos === 'all' ? (language === 'ar' ? 'الكل' : language === 'id' ? 'Semua' : 'All') : pos}
            </button>
          ))}
        </div>

        {/* Roster Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-24">
          {filteredPlayers.map((player) => {
            const isSelectedForCompare = compareList.some(p => p.id === player.id);
            const isDrafted = Object.values(lineup).some(p => p?.id === player.id);

            return (
              <div
                key={player.id}
                onMouseEnter={() => setHoveredPlayerId(player.id)}
                onMouseLeave={() => setHoveredPlayerId(null)}
                onMouseMove={handleMouseMove}
                onClick={() => handleCardClick(player)}
                className={`player-card group bg-bg-card border rounded-3xl overflow-hidden cursor-pointer relative aspect-[3/4] flex flex-col justify-end p-3 sm:p-5 transition-all duration-300 ${
                  isSelectedForCompare ? 'border-brand-orange glow-orange' : 'border-white/5 hover:border-brand-orange/20'
                }`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* 3D Holographic glare layer */}
                <div 
                  className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-color-dodge"
                  style={{
                    background: 'radial-gradient(circle 120px at var(--x, 50%) var(--y, 50%), rgba(255, 90, 0, 0.25) 0%, rgba(214, 122, 0, 0.1) 50%, transparent 80%)'
                  }}
                />

                {/* Photo and Overlay */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent z-10" />
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  />
                </div>

                {/* Compare Checkbox Indicator */}
                {isCompareMode && (
                  <div className="absolute top-4 right-4 z-30">
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isSelectedForCompare
                        ? 'bg-brand-orange border-brand-orange text-brand-black'
                        : 'bg-black/60 border-white/20'
                    }`}>
                      {isSelectedForCompare && <Check size={12} className="stroke-[3]" />}
                    </div>
                  </div>
                )}

                {/* Jersey Number & Natural Position */}
                <div className="absolute top-4 left-4 z-20 flex gap-1.5">
                  <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-xs font-title font-black text-brand-orange">
                    #{player.number}
                  </div>
                  {!isCompareMode && (
                    <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-[10px] font-display font-bold text-brand-gold">
                      {player.position}
                    </div>
                  )}
                </div>

                {/* Quick Draft Button Overlay */}
                {!isCompareMode && (
                  <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isDrafted ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const foundKey = Object.keys(lineup).find(k => lineup[k as 'PG' | 'SG' | 'SF' | 'PF' | 'C']?.id === player.id);
                          if (foundKey) undraftPlayer(foundKey as any);
                        }}
                        className="p-1.5 bg-red-950/80 hover:bg-red-900 border border-red-700/30 text-red-100 rounded-lg transition-colors cursor-pointer"
                        title={t('roster', 'undraftBtn')}
                      >
                        <X size={12} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          draftPlayer(player, player.position);
                        }}
                        className="px-2.5 py-1 bg-brand-orange hover:bg-brand-burnt border border-brand-burnt/30 text-brand-black font-display font-black text-[9px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-lg shadow-brand-orange/20"
                        title={t('roster', 'draftBtn')}
                      >
                        <Sparkles size={9} /> {t('roster', 'draftBtn')}
                      </button>
                    )}
                  </div>
                )}

                {/* Text Details */}
                <div className="relative z-20 flex flex-col text-start">
                  <span className="text-brand-gold font-display text-[9px] font-black tracking-widest uppercase block mb-1">
                    {player.position}
                  </span>
                  <h3 className="text-base sm:text-xl font-title font-extrabold uppercase text-white leading-none">
                    {player.name.split(' "')[0]}
                  </h3>
                  
                  {/* Skill Stat Meters with GSAP Counter */}
                  <div className="h-0 opacity-0 group-hover:h-12 group-hover:opacity-100 group-hover:mt-3 overflow-hidden transition-all duration-300 flex items-center justify-between border-t border-white/10 pt-2 text-[10px]">
                    <div className="text-center">
                      <span className="text-gray-500 block">PPG</span>
                      <span className="font-bold text-brand-orange">
                        <StatCounter value={player.stats.ppg} active={hoveredPlayerId === player.id} />
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-gray-500 block">APG</span>
                      <span className="font-bold text-white">
                        <StatCounter value={player.stats.apg} active={hoveredPlayerId === player.id} />
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-gray-500 block">RPG</span>
                      <span className="font-bold text-white">
                        <StatCounter value={player.stats.rpg} active={hoveredPlayerId === player.id} />
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-gray-500 block">BPG</span>
                      <span className="font-bold text-brand-gold">
                        <StatCounter value={player.stats.bpg} active={hoveredPlayerId === player.id} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ======================================= */}
        {/* NEW SECTION: DREAM 5 SQUAD LINEUP BUILDER */}
        {/* ======================================= */}
        <div className="mb-24 border-t border-white/5 pt-16">
          <div className="text-center mb-12">
            <span className="text-brand-orange font-display text-sm font-semibold tracking-[0.25em] uppercase block mb-2">
              {t('roster', 'lineupTitle')}
            </span>
            <h2 className="text-3xl md:text-4xl font-title font-extrabold uppercase tracking-tight text-white mb-3">
              {t('roster', 'lineupSubtitle')}
            </h2>
            <p className="text-gray-400 font-display text-xs max-w-xl mx-auto leading-relaxed">
              {t('roster', 'lineupDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Interactive Basketball Court (SVG + Nodes) */}
            <div className="lg:col-span-8 relative bg-gradient-to-b from-brand-black to-brand-burnt/5 border border-white/5 rounded-3xl p-6 overflow-hidden min-h-[460px] flex items-center justify-center shadow-2xl">
              
              {/* Flash overlay for Lock Animation */}
              <div className="court-overlay-flash absolute inset-0 bg-brand-orange/40 pointer-events-none opacity-0 z-10" />

              {/* Vector Court Outlines */}
              <svg className="absolute inset-0 w-full h-full stroke-white/5 fill-none stroke-[2]" viewBox="0 0 800 500">
                {/* Court Boundary */}
                <rect x="10" y="10" width="780" height="480" rx="15" />
                
                {/* Center Circle */}
                <circle cx="400" cy="250" r="70" />
                <circle cx="400" cy="250" r="1.5" className="fill-white/10" />
                
                {/* Mid Court Line */}
                <line x1="400" y1="10" x2="400" y2="490" />
                
                {/* Free Throw circles */}
                <path d="M 170 190 A 60 60 0 0 1 170 310" />
                <path d="M 170 190 A 60 60 0 0 0 170 310" strokeDasharray="6,6" />
                
                <path d="M 630 190 A 60 60 0 0 0 630 310" />
                <path d="M 630 190 A 60 60 0 0 1 630 310" strokeDasharray="6,6" />
                
                {/* Three-point Arcs */}
                <path d="M 10 70 C 130 70, 250 150, 250 250 C 250 350, 130 430, 10 430" />
                <path d="M 790 70 C 670 70, 550 150, 550 250 C 550 350, 670 430, 790 430" />
                
                {/* Hoop keys */}
                <rect x="10" y="170" width="160" height="160" />
                <rect x="630" y="170" width="160" height="160" />

                {/* ANIMATED ENERGY LINES (rendered when locked) */}
                {isLineupLocked && (
                  <>
                    {/* PG to SG */}
                    <line x1="400" y1="90" x2={isRtl ? "624" : "176"} y2="155" className="court-energy-line stroke-brand-orange stroke-[2] opacity-80" strokeDasharray="5,5" style={{ filter: 'drop-shadow(0 0 4px #FF5A00)' }} />
                    {/* PG to SF */}
                    <line x1="400" y1="90" x2={isRtl ? "176" : "624"} y2="155" className="court-energy-line stroke-brand-orange stroke-[2] opacity-80" strokeDasharray="5,5" style={{ filter: 'drop-shadow(0 0 4px #FF5A00)' }} />
                    {/* SG to PF */}
                    <line x1={isRtl ? "624" : "176"} y1="155" x2={isRtl ? "576" : "224"} y2="310" className="court-energy-line stroke-brand-gold stroke-[2] opacity-75" strokeDasharray="5,5" style={{ filter: 'drop-shadow(0 0 4px #D4AF37)' }} />
                    {/* SF to PF */}
                    <line x1={isRtl ? "176" : "624"} y1="155" x2={isRtl ? "224" : "576"} y2="310" className="court-energy-line stroke-brand-gold stroke-[2] opacity-75" strokeDasharray="5,5" style={{ filter: 'drop-shadow(0 0 4px #D4AF37)' }} />
                    {/* PF to C */}
                    <line x1={isRtl ? "224" : "576"} y1="310" x2={isRtl ? "520" : "280"} y2="330" className="court-energy-line stroke-brand-orange stroke-[2] opacity-80" strokeDasharray="5,5" style={{ filter: 'drop-shadow(0 0 4px #FF5A00)' }} />
                    {/* C to PG */}
                    <line x1={isRtl ? "520" : "280"} y1="330" x2="400" y2="90" className="court-energy-line stroke-brand-gold stroke-[2] opacity-70" strokeDasharray="5,5" style={{ filter: 'drop-shadow(0 0 4px #D4AF37)' }} />
                  </>
                )}
              </svg>

              {/* Court Positions Nodes */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                {([
                  { pos: 'PG', top: '18%', left: '50%' },
                  { pos: 'SG', top: '31%', left: isRtl ? '78%' : '22%' },
                  { pos: 'SF', top: '31%', left: isRtl ? '22%' : '78%' },
                  { pos: 'PF', top: '62%', left: isRtl ? '28%' : '72%' },
                  { pos: 'C', top: '66%', left: isRtl ? '65%' : '35%' }
                ] as const).map(({ pos, top, left }) => {
                  const player = lineup[pos];
                  const isDrafted = !!player;
                  const isSelected = selectedSlot === pos;

                  return (
                    <div
                      key={pos}
                      style={{ top, left }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                    >
                      {isDrafted ? (
                        /* DRAFTED SLOT CARD */
                        <div className="relative flex flex-col items-center group/slot">
                          
                          {/* Photo Sphere */}
                          <div className={`court-avatar-${pos} w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 bg-brand-black shadow-xl transition-all duration-300 relative ${
                            isLineupLocked
                              ? 'border-brand-orange glow-orange'
                              : 'border-white/20 hover:border-brand-orange/40 hover:scale-105'
                          }`}>
                            <img
                              src={player.photo}
                              alt={player.name}
                              className="w-full h-full object-cover grayscale group-hover/slot:grayscale-0 transition-all"
                            />
                            
                            {/* Overlay remove button */}
                            {!isLineupLocked && (
                              <button
                                onClick={() => undraftPlayer(pos)}
                                className="absolute inset-0 bg-black/70 opacity-0 group-hover/slot:opacity-100 flex items-center justify-center text-red-500 transition-opacity cursor-pointer text-xs font-black uppercase tracking-wider"
                              >
                                {t('shop', 'remove')}
                              </button>
                            )}

                            {/* Jersey Number badge */}
                            <div className="absolute bottom-1 right-1 w-6 h-6 rounded-md bg-brand-orange text-brand-black text-[9px] font-title font-black flex items-center justify-center">
                              #{player.number}
                            </div>
                          </div>

                          {/* Position Badge & Name */}
                          <span className="px-2 py-0.5 bg-black/80 border border-white/10 rounded text-[8px] font-display font-black text-brand-gold uppercase tracking-widest mt-2">
                            {pos}
                          </span>
                          <span className="text-[10px] font-title font-bold text-white truncate max-w-[80px] mt-1 drop-shadow-md">
                            {player.name.split(' "')[0]}
                          </span>
                        </div>
                      ) : (
                        /* EMPTY VACANT SLOT */
                        <button
                          onClick={() => {
                            if (isLineupLocked) return;
                            playSound('click', sfxEnabled);
                            setSelectedSlot(isSelected ? null : pos);
                          }}
                          className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-dashed flex flex-col items-center justify-center transition-all bg-brand-black/40 backdrop-blur-md cursor-pointer ${
                            isSelected
                              ? 'border-brand-orange bg-brand-orange/5 glow-orange scale-105'
                              : 'border-white/10 hover:border-white/20 hover:bg-white/2'
                          }`}
                        >
                          <span className={`text-[10px] font-display font-black tracking-widest ${
                            isSelected ? 'text-brand-orange' : 'text-gray-500'
                          }`}>
                            {pos}
                          </span>
                          <span className="text-[8px] text-gray-600 mt-1 font-semibold uppercase tracking-wider">
                            {t('roster', 'emptySlot').split(' ')[0]}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulated Neon Scoreboard */}
            <div className="lg:col-span-4 flex flex-col justify-between">
              <div className="glass-panel rounded-3xl border border-white/5 p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden shadow-2xl h-full justify-between">
                
                {/* Grid Scanlines Effect */}
                <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-5" />

                {/* Scoreboard Jumbotron Header */}
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
                    <span className="text-[10px] font-display font-bold text-gray-500 tracking-widest uppercase">
                      VBC STAT SIMULATOR
                    </span>
                  </div>
                  <Trophy size={14} className="text-brand-gold" />
                </div>

                {/* Big Overall Rating Dial */}
                <div className="flex flex-col items-center py-6">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    
                    {/* Glowing outer circle indicator */}
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="66"
                        stroke="rgba(255, 90, 0, 0.05)"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="72"
                        cy="72"
                        r="66"
                        stroke="#FF5A00"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={414}
                        animate={{ strokeDashoffset: 414 - (414 * animatedScoreboard.ovr) / 99 }}
                        transition={{ duration: 0.8 }}
                        style={{ filter: 'drop-shadow(0 0 6px rgba(255, 90, 0, 0.4))' }}
                      />
                    </svg>

                    <div className="text-center z-10">
                      <span className="text-5xl font-title font-black text-white tracking-tighter leading-none block">
                        {animatedScoreboard.ovr}
                      </span>
                      <span className="text-[9px] font-display font-black text-brand-gold tracking-widest uppercase mt-1 block">
                        {t('roster', 'ovr')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Attributes list */}
                <div className="space-y-4 flex-1">
                  
                  {/* Offense Rating */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-display font-bold uppercase tracking-wider text-gray-400">
                      <span>{t('roster', 'off')}</span>
                      <span className="text-white font-black">{animatedScoreboard.off}</span>
                    </div>
                    <div className="h-2 bg-white/5 border border-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-brand-orange to-brand-gold rounded-full"
                        animate={{ width: `${animatedScoreboard.off}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>

                  {/* Defense Rating */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-display font-bold uppercase tracking-wider text-gray-400">
                      <span>{t('roster', 'def')}</span>
                      <span className="text-white font-black">{animatedScoreboard.def}</span>
                    </div>
                    <div className="h-2 bg-white/5 border border-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-brand-gold to-yellow-600 rounded-full"
                        animate={{ width: `${animatedScoreboard.def}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>

                  {/* Chemistry Rating */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-display font-bold uppercase tracking-wider text-gray-400">
                      <span>{t('roster', 'chem')}</span>
                      <span className="text-brand-orange font-black">{animatedScoreboard.chem}%</span>
                    </div>
                    <div className="h-2 bg-white/5 border border-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full"
                        animate={{ width: `${animatedScoreboard.chem}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Scoreboard Actions controls */}
                <div className="mt-8 flex flex-col gap-3">
                  <button
                    onClick={toggleLockLineup}
                    className={`w-full py-3 rounded-xl font-display font-black text-xs tracking-widest uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                      isLineupLocked
                        ? 'bg-red-950/40 hover:bg-red-900/40 border border-red-900/30 text-red-500 shadow-none'
                        : 'bg-brand-orange hover:bg-brand-burnt text-brand-black shadow-brand-orange/15 hover:shadow-brand-orange/25'
                    }`}
                  >
                    {isLineupLocked ? (
                      <>
                        <Lock size={12} /> {t('roster', 'unlockBtn')}
                      </>
                    ) : (
                      <>
                        <Unlock size={12} /> {t('roster', 'lockBtn')}
                      </>
                    )}
                  </button>

                  <div className="text-center text-[9px] font-display text-gray-600 uppercase tracking-widest">
                    Locking starting five yields 100 Clubhouse XP
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Head Coach & Manager Showcase Card */}
        {manager && (
          <div className="mt-24 border-t border-white/5 pt-16">
            <div className="text-center mb-12">
              <span className="text-brand-orange font-display text-sm font-semibold tracking-[0.25em] uppercase block mb-2">
                {t('roster', 'managerTitle')}
              </span>
              <h2 className="text-3xl md:text-4xl font-title font-extrabold uppercase tracking-tight text-white">
                {t('roster', 'managerSubtitle')}
              </h2>
            </div>
            
            <div className={`glass-panel rounded-3xl border border-white/5 p-8 md:p-12 max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center ${isRtl ? 'md:flex-row-reverse text-right' : 'text-left'}`}>
              
              {/* Photo */}
              <div className="relative group w-48 h-64 md:w-64 md:h-80 rounded-2xl overflow-hidden border border-white/10 shadow-xl flex-shrink-0">
                <img
                  src={manager.photo}
                  alt={manager.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-4 inset-x-4 text-center">
                  <span className="px-3 py-1 bg-brand-orange text-brand-black font-display font-black text-[9px] uppercase tracking-wider rounded-full shadow">
                    {t('roster', 'coachBadge')}
                  </span>
                </div>
              </div>

              {/* Bio */}
              <div className="flex-1 space-y-4 text-start">
                <div>
                  <h3 className="text-3xl font-title font-black uppercase text-white tracking-tight leading-none">{manager.name}</h3>
                  <span className="text-brand-gold font-display text-xs font-bold uppercase tracking-widest mt-1 block">
                    {manager.title}
                  </span>
                </div>
                <p className="text-gray-400 font-display text-sm leading-relaxed font-medium">
                  {manager.bio}
                </p>
                <div className={`flex gap-6 text-[10px] text-brand-orange font-display tracking-widest pt-4 ${isRtl ? 'justify-end' : 'justify-start'}`}>
                  <span className="flex items-center gap-1.5">
                    <Trophy size={14} className="text-brand-gold" />
                    <span>5X CHAMPION</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText size={14} className="text-brand-orange" />
                    <span>ACTIVE LICENSE</span>
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Compare Mode sticky control panel bar */}
      <AnimatePresence>
        {isCompareMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={`fixed bottom-6 inset-x-6 z-[100] max-w-4xl mx-auto glass-panel-heavy border border-brand-orange/30 rounded-3xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 ${
              isRtl ? 'md:flex-row-reverse' : ''
            }`}
          >
            <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <div className="w-10 h-10 rounded-full bg-brand-orange/20 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
                <ArrowLeftRight size={18} />
              </div>
              <div>
                <h4 className="text-sm font-title font-black uppercase text-white leading-none">{t('roster', 'compareMode')}</h4>
                <p className="text-[10px] text-gray-500 font-display mt-1">{t('roster', 'selectToCompare')}</p>
              </div>
            </div>

            {/* Selected Slots */}
            <div className={`flex items-center gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
              {/* Player 1 Slot */}
              <div className={`flex items-center gap-2.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                  {compareList[0] ? (
                    <img src={compareList[0].photo} alt={compareList[0].name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-600 text-xs">?</span>
                  )}
                </div>
                {compareList[0] && (
                  <div className={isRtl ? 'text-right' : 'text-left'}>
                    <span className="text-brand-orange block font-display font-black text-[9px]">#{compareList[0].number}</span>
                    <span className="font-bold text-white truncate max-w-[100px] block">{compareList[0].name.split(' "')[0]}</span>
                  </div>
                )}
              </div>

              <span className="text-gray-600 font-bold text-xs">{t('roster', 'versus')}</span>

              {/* Player 2 Slot */}
              <div className={`flex items-center gap-2.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                  {compareList[1] ? (
                    <img src={compareList[1].photo} alt={compareList[1].name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-600 text-xs">?</span>
                  )}
                </div>
                {compareList[1] && (
                  <div className={isRtl ? 'text-right' : 'text-left'}>
                    <span className="text-brand-gold block font-display font-black text-[9px]">#{compareList[1].number}</span>
                    <span className="font-bold text-white truncate max-w-[100px] block">{compareList[1].name.split(' "')[0]}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className={`flex items-center gap-2.5 w-full md:w-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => {
                  playSound('click', sfxEnabled);
                  setCompareList([]);
                }}
                disabled={compareList.length === 0}
                className="flex-1 md:flex-initial px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-white font-display font-bold text-[10px] uppercase rounded-xl border border-white/10 transition-colors cursor-pointer"
              >
                {t('roster', 'clearCompare')}
              </button>
              <button
                onClick={() => {
                  setShowCompareModal(true);
                }}
                disabled={compareList.length < 2}
                className="flex-1 md:flex-initial px-6 py-2.5 bg-brand-orange hover:bg-brand-burnt disabled:opacity-40 disabled:pointer-events-none text-brand-black font-display font-black text-[10px] tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-brand-orange/20 cursor-pointer"
              >
                {t('roster', 'compareBtn')}
              </button>
              <button
                onClick={() => {
                  playSound('whoosh', sfxEnabled);
                  setIsCompareMode(false);
                  setCompareList([]);
                }}
                className="p-2.5 bg-red-950/20 hover:bg-red-900/40 text-red-500 rounded-xl border border-red-900/20 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2-Player Battle Arena Comparison Modal */}
      <AnimatePresence>
        {showCompareModal && compareList.length === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 80 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 80 }}
              className="relative max-w-4xl w-full max-h-[90vh] md:h-auto bg-bg-dark border border-brand-orange/20 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-10 flex flex-col justify-between"
            >
              <button
                onClick={() => {
                  playSound('whoosh', sfxEnabled);
                  setShowCompareModal(false);
                }}
                className="absolute top-6 right-6 p-2 bg-black/60 hover:bg-brand-orange hover:text-brand-black text-white rounded-xl border border-white/10 transition-all cursor-pointer z-50"
              >
                <X size={18} />
              </button>

              <div className="text-center mb-6 border-b border-white/5 pb-4">
                <span className="text-brand-orange font-display text-[10px] font-bold tracking-[0.3em] uppercase block mb-1">
                  BSQ ALL-FIVE Battle Arena
                </span>
                <h3 className="text-2xl font-title font-black uppercase text-white tracking-wider">
                  {t('roster', 'statsComparison')}
                </h3>
              </div>

              {/* Side-by-Side Arena */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center flex-1 overflow-y-auto pr-2">
                
                {/* Player 1 Left */}
                <div ref={p1CardRef} className="md:col-span-3 flex flex-col items-center text-center">
                  <div className="w-32 h-44 rounded-2xl overflow-hidden border border-brand-orange/30 bg-black/40 shadow-xl shadow-brand-orange/5 relative group mb-4">
                    <img src={compareList[0].photo} alt={compareList[0].name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 bg-brand-orange text-brand-black font-title font-black text-[9px] w-6 h-6 rounded-md flex items-center justify-center shadow">
                      #{compareList[0].number}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-brand-orange/20 text-brand-orange text-[9px] font-black tracking-widest rounded uppercase font-display">{compareList[0].position}</span>
                  <h4 className="text-lg font-title font-black text-white mt-2 leading-none uppercase">{compareList[0].name.split(' "')[0]}</h4>
                  <p className="text-[10px] text-gray-500 font-display mt-1">{compareList[0].height} • {compareList[0].weight}</p>
                  
                  {/* Win probability gauge */}
                  {matchAdv && (
                    <div className="mt-4 bg-brand-orange/5 border border-brand-orange/15 rounded-xl px-4 py-2 w-full">
                      <span className="text-[8px] font-display font-black text-gray-500 block uppercase">{t('roster', 'winProbable')}</span>
                      <span className="text-xl font-title font-black text-brand-orange mt-0.5 block">{matchAdv.winProb1}%</span>
                    </div>
                  )}
                </div>

                {/* Central Stat Bars */}
                <div ref={statBarsRef} className="md:col-span-6 space-y-4">
                  {(['ppg', 'apg', 'rpg', 'spg', 'bpg'] as const).map((statKey) => {
                    const val1 = compareList[0].stats[statKey];
                    const val2 = compareList[1].stats[statKey];
                    const is1Superior = val1 > val2;
                    const is2Superior = val2 > val1;
                    
                    const statMaxes = { ppg: 35, apg: 15, rpg: 15, spg: 5, bpg: 5 };
                    const maxVal = statMaxes[statKey];

                    return (
                      <div key={statKey} className="stat-row-item space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-display font-semibold">
                          <span className={`w-12 text-left font-black ${is1Superior ? 'text-brand-orange' : 'text-gray-400'}`}>
                            {val1} {is1Superior && '⚡'}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">
                            {t('roster', statKey)}
                          </span>
                          <span className={`w-12 text-right font-black ${is2Superior ? 'text-brand-gold' : 'text-gray-400'}`}>
                            {is2Superior && '⚡'} {val2}
                          </span>
                        </div>

                        <div className="flex gap-2 items-center">
                          {/* Player 1 progress */}
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden flex justify-end">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(val1 / maxVal) * 100}%` }}
                              transition={{ duration: 0.8 }}
                              className={`h-full rounded-full ${is1Superior ? 'bg-brand-orange' : 'bg-white/20'}`}
                            />
                          </div>

                          <span className="text-[8px] font-bold text-gray-650">{t('roster', 'versus')}</span>

                          {/* Player 2 progress */}
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden flex justify-start">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(val2 / maxVal) * 100}%` }}
                              transition={{ duration: 0.8 }}
                              className={`h-full rounded-full ${is2Superior ? 'bg-brand-gold' : 'bg-white/20'}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Player 2 Right */}
                <div ref={p2CardRef} className="md:col-span-3 flex flex-col items-center text-center">
                  <div className="w-32 h-44 rounded-2xl overflow-hidden border border-brand-gold/30 bg-black/40 shadow-xl shadow-brand-gold/5 relative group mb-4">
                    <img src={compareList[1].photo} alt={compareList[1].name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 bg-brand-gold text-brand-black font-title font-black text-[9px] w-6 h-6 rounded-md flex items-center justify-center shadow">
                      #{compareList[1].number}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-brand-gold/20 text-brand-gold text-[9px] font-black tracking-widest rounded uppercase font-display">{compareList[1].position}</span>
                  <h4 className="text-lg font-title font-black text-white mt-2 leading-none uppercase">{compareList[1].name.split(' "')[0]}</h4>
                  <p className="text-[10px] text-gray-500 font-display mt-1">{compareList[1].height} • {compareList[1].weight}</p>
                  
                  {/* Win probability gauge */}
                  {matchAdv && (
                    <div className="mt-4 bg-brand-gold/5 border border-brand-gold/15 rounded-xl px-4 py-2 w-full">
                      <span className="text-[8px] font-display font-black text-gray-500 block uppercase">{t('roster', 'winProbable')}</span>
                      <span className="text-xl font-title font-black text-brand-gold mt-0.5 block">{matchAdv.winProb2}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Matchup advantage report card */}
              {matchAdv && (
                <div ref={vsLogoRef} className="mt-6 bg-white/2 border border-white/5 rounded-2xl p-4 text-center">
                  <span className="text-[9px] font-display font-black text-brand-orange uppercase tracking-widest block mb-1">
                    {t('roster', 'matchupAdvantage')}
                  </span>
                  <p className="text-xs text-gray-300 font-medium">
                    {matchAdv.advantageText}
                  </p>
                </div>
              )}

              <div className="mt-6 border-t border-white/5 pt-3 text-center text-[9px] font-display text-gray-600 uppercase tracking-widest">
                BSQ ALL-FIVE Battle Simulator • Matchup calculations based on simulated stats
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Netflix-style Details Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.9, y: 60 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 60 }}
              transition={{ type: 'spring', damping: 25, stiffness: 150 }}
              className="relative max-w-4xl w-full h-[90vh] md:h-auto md:min-h-[550px] bg-bg-dark border border-brand-orange/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >
              <button
                onClick={() => {
                  setSelectedPlayer(null);
                  window.location.reload();
                }}
                className="absolute top-6 right-6 p-2.5 bg-black/60 hover:bg-brand-orange hover:text-brand-black text-white rounded-full transition-all z-50 border border-white/5 cursor-pointer"
              >
                <X size={20} />
              </button>

              {/* Left Column: Player Artwork Card */}
              <div className="w-full md:w-2/5 relative h-64 md:h-auto min-h-[300px] bg-black">
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-bg-dark via-bg-dark/40 to-transparent z-10" />
                <img
                  src={selectedPlayer.photo}
                  alt={selectedPlayer.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-6 left-6 z-20 text-start">
                  <span className="px-2 py-0.5 bg-brand-orange/25 text-brand-orange text-[10px] font-bold tracking-wider rounded uppercase">
                    Position: {selectedPlayer.position}
                  </span>
                  <h3 className="text-3xl font-title font-black uppercase text-white mt-2 leading-none">
                    {selectedPlayer.name}
                  </h3>
                  <span className="text-5xl font-title font-black text-white/10 mt-2 block">
                    JERSEY #{selectedPlayer.number}
                  </span>
                </div>
              </div>

              {/* Right Column: Dynamic Stats Tabs */}
              <div className="w-full md:w-3/5 p-8 flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="flex border-b border-white/10 pb-2 mb-6 gap-6 text-sm font-display font-bold">
                    <button
                      onClick={() => {
                        playSound('click', sfxEnabled);
                        setActiveTab('stats');
                      }}
                      className={`pb-2 transition-all cursor-pointer relative ${
                        activeTab === 'stats' ? 'text-brand-orange' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Metrics
                      {activeTab === 'stats' && <motion.div layoutId="modalTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-orange" />}
                    </button>
                    <button
                      onClick={() => {
                        playSound('click', sfxEnabled);
                        setActiveTab('achieve');
                      }}
                      className={`pb-2 transition-all cursor-pointer relative ${
                        activeTab === 'achieve' ? 'text-brand-orange' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Awards
                      {activeTab === 'achieve' && <motion.div layoutId="modalTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-orange" />}
                    </button>
                    <button
                      onClick={() => {
                        playSound('click', sfxEnabled);
                        setActiveTab('video');
                      }}
                      className={`pb-2 transition-all cursor-pointer relative ${
                        activeTab === 'video' ? 'text-brand-orange' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Highlights
                      {activeTab === 'video' && <motion.div layoutId="modalTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-orange" />}
                    </button>
                    <button
                      onClick={() => {
                        playSound('click', sfxEnabled);
                        setActiveTab('social');
                      }}
                      className={`pb-2 transition-all cursor-pointer relative ${
                        activeTab === 'social' ? 'text-brand-orange' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Socials
                      {activeTab === 'social' && <motion.div layoutId="modalTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-orange" />}
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="min-h-[220px]">
                    {/* Metrics Section */}
                    {activeTab === 'stats' && (
                      <div className="space-y-4">
                        <p className="text-xs text-gray-400 leading-relaxed italic mb-4 text-start">
                          {selectedPlayer.bio}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { label: t('roster', 'ppg'), value: selectedPlayer.stats.ppg, max: 35, color: 'from-brand-orange to-brand-burnt' },
                            { label: t('roster', 'apg'), value: selectedPlayer.stats.apg, max: 15, color: 'from-white to-gray-400' },
                            { label: t('roster', 'rpg'), value: selectedPlayer.stats.rpg, max: 15, color: 'from-brand-gold to-yellow-600' },
                            { label: t('roster', 'bpg'), value: selectedPlayer.stats.bpg, max: 5, color: 'from-orange-500 to-red-600' },
                            { label: t('roster', 'spg'), value: selectedPlayer.stats.spg, max: 5, color: 'from-brand-orange to-brand-gold' },
                          ].map((stat) => (
                            <div key={stat.label} className="space-y-1 text-start">
                              <div className="flex justify-between items-center text-[10px] font-display font-bold text-gray-500">
                                <span className="uppercase">{stat.label}</span>
                                <span className="text-white font-black">{stat.value}</span>
                              </div>
                              <div className="h-2 bg-white/5 border border-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(stat.value / stat.max) * 100}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Achievements */}
                    {activeTab === 'achieve' && (
                      <ul className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {getAchievements(selectedPlayer).map((award, i) => (
                          <li key={i} className="flex items-center gap-3 bg-white/2 p-3 border border-white/5 rounded-xl text-xs text-white text-start animate-fade-in">
                            <Award size={16} className="text-brand-orange flex-shrink-0" />
                            <span>{award}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Highlights */}
                    {activeTab === 'video' && (
                      <div className="space-y-4">
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-lg">
                          {selectedPlayer.highlight_url ? (
                            (() => {
                              const ytId = getYoutubeId(selectedPlayer.highlight_url);
                              if (ytId) {
                                return (
                                  <iframe
                                    src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                                    title={`${selectedPlayer.name} Highlight Video`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className="w-full h-full"
                                  />
                                );
                              }
                              return (
                                <video
                                  src={selectedPlayer.highlight_url}
                                  controls
                                  className="w-full h-full object-cover"
                                  poster={selectedPlayer.photo}
                                  playsInline
                                />
                              );
                            })()
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white/2">
                              <Play size={32} className="text-gray-500 mb-2" />
                              <p className="text-xs text-gray-400">No highlight video available for this player.</p>
                            </div>
                          )}
                        </div>
                        <div className="text-start">
                          <h4 className="text-xs font-title font-black uppercase text-brand-orange">
                            Highlight Reel • Season 2024-2025
                          </h4>
                          <p className="text-[10px] text-gray-500 font-display mt-1 leading-relaxed">
                            Watch {selectedPlayer.name.split(' "')[0]}'s key defensive plays, court assists, and clutch scoring clips.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Social links */}
                    {activeTab === 'social' && (
                      <div className="space-y-4">
                        {/* Profile Header */}
                        <div className="flex items-center justify-between bg-white/2 p-3 border border-white/5 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-brand-orange/30 flex-shrink-0">
                              <img src={selectedPlayer.photo} alt={selectedPlayer.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-start">
                              <h4 className="text-xs font-bold text-white leading-none">{selectedPlayer.name.split(' "')[0]}</h4>
                              <span className="text-[10px] text-brand-orange font-mono">
                                @{selectedPlayer.social_handle || selectedPlayer.name.toLowerCase().split(' ').join('_').replace(/[^a-z0-9_]/g, '')}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-white block">
                              {selectedPlayer.followers || (Math.round(selectedPlayer.stats.ppg * 12.5) + 'K')}
                            </span>
                            <span className="text-[8px] text-gray-500 font-display block uppercase">Followers</span>
                          </div>
                        </div>

                        {/* Feed Posts */}
                        <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                          {(selectedPlayer.social_feed && selectedPlayer.social_feed.filter(Boolean).length > 0
                            ? selectedPlayer.social_feed.filter(Boolean).map((postText, index) => ({
                                id: index + 1,
                                time: index === 0 ? '3 hours ago' : index === 1 ? '1 day ago' : '3 days ago',
                                text: postText,
                                likes: Math.round(selectedPlayer.stats.ppg * (150 - index * 30))
                              }))
                            : [
                                {
                                  id: 1,
                                  time: '3 hours ago',
                                  text: `Big win tonight! Shoutout to the home crowd. The energy at the arena was unmatched. Let's keep the streak going! 🏀🔥 #BSQAllFive`,
                                  likes: Math.round(selectedPlayer.stats.ppg * 150)
                                },
                                {
                                  id: 2,
                                  time: '1 day ago',
                                  text: `Appreciate the guidance from Coach Gunawan. Locked in for the next practice. We keep improving daily. 📈💪`,
                                  likes: Math.round(selectedPlayer.stats.ppg * 90)
                                },
                                {
                                  id: 3,
                                  time: '3 days ago',
                                  text: selectedPlayer.position === 'PG' 
                                    ? `Playmaking feels good. Good to find my teammates in their sweet spots last night! 🎯`
                                    : selectedPlayer.position === 'SG'
                                    ? `Left hand, right hand, midrange, corner three... just keep shooting! 🏹`
                                    : selectedPlayer.position === 'SF'
                                    ? `Defense wins championships. Locking down the perimeter is my favorite part of the game. 🔒`
                                    : selectedPlayer.position === 'PF'
                                    ? `Winning the battle on the boards. Let's dominate the paint. 🛡️`
                                    : `No easy buckets in my house. Protected the rim and locked it down. ⛔`,
                                  likes: Math.round(selectedPlayer.stats.ppg * 110)
                                }
                              ]
                          ).map((post) => (
                            <div key={post.id} className="bg-white/2 border border-white/5 rounded-xl p-3 text-start space-y-2">
                              <div className="flex justify-between items-center text-[8px] text-gray-500">
                                <span className="font-mono">@{selectedPlayer.social_handle || selectedPlayer.name.toLowerCase().split(' ').join('_').replace(/[^a-z0-9_]/g, '')}</span>
                                <span>{post.time}</span>
                              </div>
                              <p className="text-xs text-white leading-relaxed">{post.text}</p>
                              <div className="flex items-center gap-4 text-[9px] text-gray-500 pt-1">
                                <button className="flex items-center gap-1 hover:text-brand-orange transition-colors animate-pulse-subtle">
                                  <span>❤️</span> {post.likes}
                                </button>
                                <button className="flex items-center gap-1 hover:text-brand-gold transition-colors">
                                  <span>💬</span> {Math.round(post.likes / 10)}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-6 text-[10px] text-gray-500 uppercase tracking-widest font-display">
                  <span>BSQ ALL-FIVE franchise player dossier</span>
                  <span className="flex items-center gap-1 text-brand-orange font-black"><Zap size={10} /> +10 XP</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PlayerShowcase;
