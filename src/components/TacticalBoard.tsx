import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Activity, Shield, Flame, Award, Play, X, User } from 'lucide-react';
import { db } from '../lib/supabase';
import type { Player } from '../lib/supabase';
import useAppStore from '../lib/store';
import { getTranslation } from '../lib/i18n';

gsap.registerPlugin(ScrollTrigger);

const getYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Benchmark/Default Positions relative to 600x400 SVG court
const PLAY_STEPS = {
  bench: [
    { id: 'p1', x: 300, y: 380, label: 'PG' },
    { id: 'p2', x: 300, y: 380, label: 'SG' },
    { id: 'p3', x: 300, y: 380, label: 'SF' },
    { id: 'p4', x: 300, y: 380, label: 'PF' },
    { id: 'p5', x: 300, y: 380, label: 'C' }
  ]
};

export const TacticalBoard: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [lineup, setLineup] = useState<{ [pos: string]: Player | null }>({});
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [activePlay, setActivePlay] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [playType, setPlayType] = useState<'alley_oop' | 'outside_three' | 'pick_roll' | 'fast_break' | 'five_out' | 'give_go'>('alley_oop');

  const addXP = useAppStore(state => state.addXP);
  const language = useAppStore(state => state.language);
  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';

  const fan = useAppStore(state => state.fan);
  const lineupKey = fan?.username ? `bsq_dream_lineup_${fan.username.toLowerCase()}` : 'bsq_dream_lineup';

  const containerRef = useRef<HTMLDivElement | null>(null);
  const courtRef = useRef<SVGSVGElement | null>(null);
  const pgRef = useRef<SVGGElement | null>(null);
  const sgRef = useRef<SVGGElement | null>(null);
  const sfRef = useRef<SVGGElement | null>(null);
  const pfRef = useRef<SVGGElement | null>(null);
  const cRef = useRef<SVGGElement | null>(null);

  const ballRef = useRef<SVGCircleElement | null>(null);
  const backboardRef = useRef<SVGLineElement | null>(null);
  const hoopRef = useRef<SVGCircleElement | null>(null);

  // Fetch players from database
  useEffect(() => {
    const fetchPlayers = () => {
      (db as any).from('players').select('*').then(({ data }: any) => {
        if (data && data.length > 0) {
          console.log("TacticalBoard: Fetched players from DB:", data.length, data);
          setPlayers(data as Player[]);
        } else {
          const localVal = localStorage.getItem('bsq_db_v2_players');
          const localPlayers = localVal ? JSON.parse(localVal) : [];
          console.log("TacticalBoard: Fallback to localStorage players:", localPlayers.length);
          setPlayers(localPlayers as Player[]);
        }
      }).catch((err: any) => {
        console.error("TacticalBoard: Error fetching players:", err);
        const localVal = localStorage.getItem('bsq_db_v2_players');
        const localPlayers = localVal ? JSON.parse(localVal) : [];
        setPlayers(localPlayers as Player[]);
      });
    };

    fetchPlayers();

    window.addEventListener('bsq_players_updated', fetchPlayers);
    return () => {
      window.removeEventListener('bsq_players_updated', fetchPlayers);
    };
  }, []);

  // Load and subscribe to dream starting 5 lineup
  useEffect(() => {
    const loadLineup = () => {
      const savedLineup = localStorage.getItem(lineupKey);
      console.log("TacticalBoard: LocalStorage raw starting 5:", savedLineup);
      if (savedLineup && players.length > 0) {
        try {
          const parsed = JSON.parse(savedLineup);
          const reconstructed: any = {};
          for (const pos of ['PG', 'SG', 'SF', 'PF', 'C'] as const) {
            if (parsed[pos]) {
              let matched = players.find(p => p.id === parsed[pos]);
              if (!matched) {
                // Fallback: if the exact ID is not found (due to sync/re-creation ID changes), match by position
                matched = players.find(p => p.position.toUpperCase() === pos);
              }
              if (matched) reconstructed[pos] = matched;
            }
          }
          console.log("TacticalBoard: Reconstructed lineup matching database:", reconstructed);
          setLineup(reconstructed);
        } catch (e) {
          console.error('Error loading lineup in TacticalBoard:', e);
        }
      } else if (!savedLineup && players.length > 0) {
        // Self-healing: if no roster is locked yet, pre-populate lineup with first 5 matching players
        const reconstructed: any = {};
        for (const pos of ['PG', 'SG', 'SF', 'PF', 'C'] as const) {
          const matched = players.find(p => p.position.toUpperCase() === pos);
          if (matched) reconstructed[pos] = matched;
        }
        setLineup(reconstructed);
      }
    };

    loadLineup();
    window.addEventListener('storage', loadLineup);
    window.addEventListener('bsq_dream_lineup_updated', loadLineup);

    return () => {
      window.removeEventListener('storage', loadLineup);
      window.removeEventListener('bsq_dream_lineup_updated', loadLineup);
    };
  }, [players, lineupKey]);

  // Trigger strategy animation on scroll
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(courtRef.current,
        { y: 150, opacity: 0, rotateX: 20 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 75%',
            end: 'bottom 25%',
            toggleActions: 'play none none none'
          },
          onComplete: () => runStrategyAnimation()
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [playType]); // re-trigger if strategy changes

  const getDefaultPosition = (pos: 'PG' | 'SG' | 'SF' | 'PF' | 'C', type: typeof playType) => {
    if (type === 'outside_three') {
      if (pos === 'PG') return { x: 150, y: 260 };
      if (pos === 'SG') return { x: 450, y: 260 };
      if (pos === 'SF') return { x: 300, y: 280 };
      if (pos === 'PF') return { x: 250, y: 100 };
      return { x: 350, y: 100 }; // C
    }
    if (type === 'pick_roll') {
      if (pos === 'PG') return { x: 300, y: 280 };
      if (pos === 'SG') return { x: 150, y: 220 };
      if (pos === 'SF') return { x: 450, y: 220 };
      if (pos === 'PF') return { x: 220, y: 120 };
      return { x: 350, y: 250 }; // C
    }
    if (type === 'fast_break') {
      if (pos === 'PG') return { x: 300, y: 320 };
      if (pos === 'SG') return { x: 100, y: 220 };
      if (pos === 'SF') return { x: 500, y: 150 };
      if (pos === 'PF') return { x: 200, y: 300 };
      return { x: 380, y: 200 }; // C
    }
    if (type === 'five_out') {
      if (pos === 'PG') return { x: 300, y: 300 };
      if (pos === 'SG') return { x: 100, y: 240 };
      if (pos === 'SF') return { x: 500, y: 240 };
      if (pos === 'PF') return { x: 180, y: 120 };
      return { x: 420, y: 120 }; // C
    }
    if (type === 'give_go') {
      if (pos === 'PG') return { x: 300, y: 280 };
      if (pos === 'SG') return { x: 150, y: 220 };
      if (pos === 'SF') return { x: 450, y: 220 };
      if (pos === 'PF') return { x: 220, y: 120 };
      return { x: 300, y: 150 }; // C
    }
    // alley_oop
    if (pos === 'PG') return { x: 300, y: 280 };
    if (pos === 'SG') return { x: 120, y: 220 };
    if (pos === 'SF') return { x: 480, y: 220 };
    if (pos === 'PF') return { x: 220, y: 120 };
    return { x: 380, y: 80 }; // C
  };

  // Auto-run strategy animation when players or lineup changes
  useEffect(() => {
    if (players.length > 0) {
      runStrategyAnimation();
    }
  }, [players, lineup]);

  // Pre-select the first available player from the lineup by default when it loads
  useEffect(() => {
    if (!selectedPlayer && Object.keys(lineup).length > 0) {
      const firstPos = (['PG', 'SG', 'SF', 'PF', 'C'] as const).find(pos => lineup[pos]);
      if (firstPos && lineup[firstPos]) {
        setSelectedPlayer(lineup[firstPos]);
      }
    }
  }, [lineup, selectedPlayer]);

  const runStrategyAnimation = () => {
    setActivePlay(true);
    const tl = gsap.timeline();

    const playersRefs = [pgRef.current, sgRef.current, sfRef.current, pfRef.current, cRef.current];
    const positionsKeys = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
    
    // Default coordinates (Alley Oop)
    let pgPos = { x: 300, y: 280 };
    let sgPos = { x: 120, y: 220 };
    let sfPos = { x: 480, y: 220 };
    let pfPos = { x: 220, y: 120 };
    let cPos = { x: 380, y: 80 };

    if (playType === 'outside_three') {
      pgPos = { x: 150, y: 260 };
      sgPos = { x: 450, y: 260 };
      sfPos = { x: 300, y: 280 };
      pfPos = { x: 250, y: 100 };
      cPos = { x: 350, y: 100 };
    } else if (playType === 'pick_roll') {
      pgPos = { x: 300, y: 280 };
      sgPos = { x: 150, y: 220 };
      sfPos = { x: 450, y: 220 };
      pfPos = { x: 220, y: 120 };
      cPos = { x: 350, y: 250 };
    }

    const targetPos = [pgPos, sgPos, sfPos, pfPos, cPos];

    // Reset positions, dashed lines, and ball
    gsap.set(ballRef.current, { cx: 300, cy: 380, opacity: 0, scale: 0.5 });
    gsap.set('.strategy-line-1', { strokeDashoffset: 400 });
    gsap.set('.strategy-line-2', { strokeDashoffset: 400 });
    gsap.set('.strategy-line-3', { strokeDashoffset: 400 });

    // 1. Players run from bench (300, 380) to court positions
    positionsKeys.forEach((pos, index) => {
      const targetRef = playersRefs[index];
      if (!targetRef) return;

      const defaultPos = getDefaultPosition(pos, playType);

      tl.fromTo(targetRef, 
        { x: 300, y: 380, opacity: 0, scale: 0.5 },
        { x: defaultPos.x, y: defaultPos.y, opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' },
        index * 0.12
      );
    });

    // 2. Ball movement depending on playbook selection
    if (playType === 'alley_oop') {
      tl.set(ballRef.current, { cx: pgPos.x, cy: pgPos.y, opacity: 1, scale: 1 }, "+=0.1");
      
      // PG -> SG
      tl.to('.strategy-line-1', { strokeDashoffset: 0, duration: 0.6, ease: 'none' }, "<");
      tl.to(ballRef.current, { cx: sgPos.x, cy: sgPos.y, duration: 0.6, ease: 'power1.out' }, "<");

      // SG -> SF
      tl.to('.strategy-line-2', { strokeDashoffset: 0, duration: 0.6, ease: 'none' });
      tl.to(ballRef.current, { cx: sfPos.x, cy: sfPos.y, duration: 0.6, ease: 'power1.out' }, "<");

      // SF -> PF (Lob)
      tl.to('.strategy-line-3', { strokeDashoffset: 0, duration: 0.7, ease: 'none' });
      tl.to(ballRef.current, { cx: pfPos.x, cy: pfPos.y, duration: 0.7, ease: 'power1.in' }, "<");

      // Slam Dunk! (Ball + PF to hoop)
      tl.to(pfRef.current, { x: 300, y: 30, duration: 0.25, ease: 'power2.in' });
      tl.to(ballRef.current, { cx: 300, cy: 30, duration: 0.25, ease: 'power2.in' }, "<");
      
      // Rim shake
      tl.to([backboardRef.current, hoopRef.current], { y: 6, duration: 0.08, yoyo: true, repeat: 5, ease: 'power1.inOut' });
      tl.to('.court-overlay-flash', { opacity: 0.4, duration: 0.1, yoyo: true, repeat: 1 });
      tl.to(ballRef.current, { cy: 80, opacity: 0, duration: 0.4, ease: 'power1.out' }, "+=0.1");
      
      // PF rolls back to its default position
      tl.to(pfRef.current, { x: pfPos.x, y: pfPos.y, duration: 0.4, ease: 'power2.out' });

    } else if (playType === 'outside_three') {
      // C -> PF -> PG -> SG (Shooter)
      tl.set(ballRef.current, { cx: cPos.x, cy: cPos.y, opacity: 1, scale: 1 }, "+=0.1");
      
      tl.to('.strategy-line-1', { strokeDashoffset: 0, duration: 0.5, ease: 'none' }, "<");
      tl.to(ballRef.current, { cx: pfPos.x, cy: pfPos.y, duration: 0.5 }, "<");

      tl.to('.strategy-line-2', { strokeDashoffset: 0, duration: 0.5, ease: 'none' });
      tl.to(ballRef.current, { cx: pgPos.x, cy: pgPos.y, duration: 0.5 }, "<");

      tl.to('.strategy-line-3', { strokeDashoffset: 0, duration: 0.6, ease: 'none' });
      tl.to(ballRef.current, { cx: sgPos.x, cy: sgPos.y, duration: 0.6 }, "<");

      // Shot to the hoop (high arc simulated by scale)
      tl.to(ballRef.current, { 
        cx: 300, 
        cy: 30, 
        duration: 0.9, 
        ease: 'power1.out',
        scale: 1.6
      });
      tl.to(ballRef.current, { scale: 0.8, duration: 0.45 }, "<+=0.45");

      // Swish!
      tl.to([hoopRef.current], { scale: 1.2, duration: 0.08, yoyo: true, repeat: 3 });
      tl.to(ballRef.current, { cy: 70, opacity: 0, duration: 0.4, ease: 'power1.out' });
      
    } else if (playType === 'pick_roll') {
      // C sets screen, PG drives left, passes to rolling C for basket
      tl.set(ballRef.current, { cx: pgPos.x, cy: pgPos.y, opacity: 1, scale: 1 }, "+=0.1");
      
      // C moves to PG side to set screen: target is (270, 250).
      tl.to(cRef.current, { x: 270, y: 250, duration: 0.5, ease: 'power1.out' });
      
      // PG drives left past screen: target is (180, 200).
      tl.to(pgRef.current, { x: 180, y: 200, duration: 0.6, ease: 'power1.inOut' }, "+=0.1");
      tl.to(ballRef.current, { cx: 180, cy: 200, duration: 0.6 }, "<");

      // C rolls to basket: target is (300, 80)
      tl.to(cRef.current, { x: 300, y: 80, duration: 0.6, ease: 'power1.in' });

      // PG passes to C
      tl.to(ballRef.current, { cx: 300, cy: 80, duration: 0.4, ease: 'power1.out' });

      // C layups: target is (300, 40)
      tl.to(cRef.current, { x: 300, y: 40, duration: 0.25, ease: 'power2.out' });
      tl.to(ballRef.current, { cx: 300, cy: 30, duration: 0.25, ease: 'power2.out' }, "<");

      // Score
      tl.to([backboardRef.current, hoopRef.current], { y: 3, duration: 0.08, yoyo: true, repeat: 3 });
      tl.to(ballRef.current, { cy: 80, opacity: 0, duration: 0.4 });
      
      // Reset players to their default positions
      tl.to(cRef.current, { x: cPos.x, y: cPos.y, duration: 0.5 });
      tl.to(pgRef.current, { x: pgPos.x, y: pgPos.y, duration: 0.5 }, "<");
    } else if (playType === 'fast_break') {
      // PG rebounds/gets ball -> passes to SG -> passes to running SF -> SF dunks/layups
      const pgPos = targetPos[0];
      const sgPos = targetPos[1];
      const sfPos = targetPos[2];

      tl.set(ballRef.current, { cx: pgPos.x, cy: pgPos.y, opacity: 1, scale: 1 }, "+=0.1");

      // PG -> SG
      tl.to('.strategy-line-1', { strokeDashoffset: 0, duration: 0.5, ease: 'none' }, "<");
      tl.to(ballRef.current, { cx: sgPos.x, cy: sgPos.y, duration: 0.5 }, "<");

      // SG -> SF
      tl.to('.strategy-line-2', { strokeDashoffset: 0, duration: 0.5, ease: 'none' });
      tl.to(ballRef.current, { cx: sfPos.x, cy: sfPos.y, duration: 0.5 }, "<");

      // SF runs to basket for layup: target is (300, 30)
      tl.to(sfRef.current, { x: 300, y: 30, duration: 0.6, ease: 'power1.in' });
      tl.to('.strategy-line-3', { strokeDashoffset: 0, duration: 0.6, ease: 'none' }, "<");
      tl.to(ballRef.current, { cx: 300, cy: 30, duration: 0.6, ease: 'power1.in' }, "<");

      // Score
      tl.to([backboardRef.current, hoopRef.current], { y: 4, duration: 0.08, yoyo: true, repeat: 4 });
      tl.to(ballRef.current, { cy: 80, opacity: 0, duration: 0.4 });
      
      // Reset SF
      tl.to(sfRef.current, { x: sfPos.x, y: sfPos.y, duration: 0.5 });

    } else if (playType === 'five_out') {
      // PG drives to key -> kicks out to corner C -> C shots three
      const pgPos = targetPos[0];
      const cPos = targetPos[4];

      tl.set(ballRef.current, { cx: pgPos.x, cy: pgPos.y, opacity: 1, scale: 1 }, "+=0.1");

      // PG drives to key: target is (300, 120)
      tl.to(pgRef.current, { x: 300, y: 120, duration: 0.6, ease: 'power1.inOut' });
      tl.to('.strategy-line-1', { strokeDashoffset: 0, duration: 0.6, ease: 'none' }, "<");
      tl.to(ballRef.current, { cx: 300, cy: 120, duration: 0.6 }, "<");

      // Kick out pass to corner C
      tl.to('.strategy-line-2', { strokeDashoffset: 0, duration: 0.4, ease: 'none' });
      tl.to(ballRef.current, { cx: cPos.x, cy: cPos.y, duration: 0.4 }, "<");

      // C shots three to hoop (300, 30) with high arc
      tl.to('.strategy-line-3', { strokeDashoffset: 0, duration: 0.8, ease: 'none' });
      tl.to(ballRef.current, { 
        cx: 300, 
        cy: 30, 
        duration: 0.8, 
        ease: 'power1.out',
        scale: 1.5
      }, "<");
      tl.to(ballRef.current, { scale: 0.8, duration: 0.4 }, "<+=0.4");

      // Swish!
      tl.to([hoopRef.current], { scale: 1.2, duration: 0.08, yoyo: true, repeat: 3 });
      tl.to(ballRef.current, { cy: 70, opacity: 0, duration: 0.4 });

      // Reset PG
      tl.to(pgRef.current, { x: pgPos.x, y: pgPos.y, duration: 0.5 });

    } else if (playType === 'give_go') {
      // SG passes to high-post C -> SG cuts to hoop -> C passes back -> SG layup
      const sgPos = targetPos[1];
      const cPos = targetPos[4];

      tl.set(ballRef.current, { cx: sgPos.x, cy: sgPos.y, opacity: 1, scale: 1 }, "+=0.1");

      // Pass to C
      tl.to('.strategy-line-1', { strokeDashoffset: 0, duration: 0.4, ease: 'none' }, "<");
      tl.to(ballRef.current, { cx: cPos.x, cy: cPos.y, duration: 0.4 }, "<");

      // SG cuts to hoop: target (300, 40)
      tl.to(sgRef.current, { x: 300, y: 40, duration: 0.6, ease: 'power1.in' });
      tl.to('.strategy-line-2', { strokeDashoffset: 0, duration: 0.6, ease: 'none' }, "<");

      // C passes back to SG at hoop
      tl.to('.strategy-line-3', { strokeDashoffset: 0, duration: 0.3, ease: 'none' });
      tl.to(ballRef.current, { cx: 300, cy: 40, duration: 0.3 }, "<");

      // SG layup to hoop (300, 30)
      tl.to(ballRef.current, { cx: 300, cy: 30, duration: 0.15 });

      // Score
      tl.to([backboardRef.current, hoopRef.current], { y: 3, duration: 0.08, yoyo: true, repeat: 3 });
      tl.to(ballRef.current, { cy: 80, opacity: 0, duration: 0.4 });

      // Reset SG
      tl.to(sgRef.current, { x: sgPos.x, y: sgPos.y, duration: 0.5 });
    }
  };

  const handlePlayerClickByPosition = (position: 'PG' | 'SG' | 'SF' | 'PF' | 'C') => {
    // Check if player exists in starting 5 lineup
    let player = lineup[position];
    // Fallback to database query if slot is vacant
    if (!player) {
      player = players.find(p => p.position.toUpperCase() === position.toUpperCase()) || null;
    }

    if (player) {
      setSelectedPlayer(player);
      addXP(15);
    } else {
      const addToast = useAppStore.getState().addToast;
      addToast(
        "info", 
        "No Player Registered", 
        `There is no player registered under position ${position} in Supabase yet. Add one in Admin -> Roster!`
      );
    }
  };

  const getPlayTitle = () => {
    if (playType === 'alley_oop') return language === 'id' ? 'Alley-Oop Slam Dunk' : 'Alley-Oop Slam Dunk';
    if (playType === 'outside_three') return language === 'id' ? 'Tembakan Tiga Angka Luar' : 'Outside Three-Pointer';
    if (playType === 'pick_roll') return language === 'id' ? 'Taktik Pick & Roll Layup' : 'Pick & Roll Drive';
    if (playType === 'fast_break') return language === 'id' ? 'Transisi Cepat (Fast Break)' : 'Transition Fast Break';
    if (playType === 'five_out') return language === 'id' ? 'Kemudi & Tendang (Five-Out)' : 'Five-Out Drive & Kick';
    return language === 'id' ? 'Beri & Pergi (Give & Go)' : 'Give & Go Cut';
  };

  return (
    <section ref={containerRef} className="py-24 px-4 bg-bg-darker relative overflow-hidden border-y border-brand-orange/10">
      <div className="absolute inset-0 bg-radial-gradient from-brand-orange/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Interactive SVG Tactical Board */}
        <div className={`lg:col-span-7 flex flex-col items-center ${isRtl ? 'lg:order-2' : 'lg:order-1'}`}>
          <div className={`text-center lg:text-left w-full mb-8 ${isRtl ? 'lg:text-right text-right font-arabic' : ''}`}>
            <span className="text-brand-orange font-display text-sm font-semibold tracking-[0.25em] uppercase block mb-2">{t('tactical', 'title')}</span>
            <h2 className="text-4xl md:text-5xl font-title font-extrabold uppercase leading-tight text-white tracking-tight">
              {language === 'id' ? 'Papan Taktik' : 'Playbook'}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-burnt">
                {language === 'id' ? 'Strategi Lapangan' : 'Tactical Board'}
              </span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl font-medium">
              {language === 'id' 
                ? 'Analisis visual skema penyerangan Sekolah Al Hikmah Cirebon. Dilengkapi detail pemain dari starting 5 pilihan pelatih.' 
                : 'Interactive playbook strategy builder for the Al Hikmah school team. Integrates your live drafted starter lineup.'}
            </p>
          </div>

          {/* Play Selector and Action Bar */}
          <div className="w-full flex items-center justify-between gap-4 mb-4 max-w-[650px] font-display">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-gray-500">{language === 'id' ? 'Pilih Strategi:' : 'Play:'}</span>
              <select
                value={playType}
                onChange={(e) => setPlayType(e.target.value as any)}
                className="bg-brand-black border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-orange font-semibold uppercase cursor-pointer"
              >
                <option value="alley_oop">Alley-Oop Lob</option>
                <option value="outside_three">Outside Three</option>
                <option value="pick_roll">Pick & Roll</option>
                <option value="fast_break">Transition Fast Break</option>
                <option value="five_out">Five-Out Drive & Kick</option>
                <option value="give_go">Give & Go Cut</option>
              </select>
            </div>
            <div className="text-[10px] font-bold text-brand-gold uppercase tracking-widest bg-brand-gold/10 px-3 py-1.5 rounded-xl border border-brand-gold/20">
              {getPlayTitle()}
            </div>
          </div>

          {/* SVG Tactical Court */}
          <div className="relative w-full aspect-[3/2] max-w-[650px] bg-brand-black border-2 border-brand-orange/20 rounded-2xl p-4 glow-orange overflow-hidden perspective-1000">
            {/* Flash overlay */}
            <div className="court-overlay-flash absolute inset-0 bg-brand-orange/40 pointer-events-none opacity-0 z-10" />

            <svg
              ref={courtRef}
              viewBox="0 0 600 400"
              className="w-full h-full opacity-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 90, 0, 0.04)" strokeWidth="1" />
                </pattern>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {/* Image Clips for dynamic player face spheres */}
                {['PG', 'SG', 'SF', 'PF', 'C'].map(pos => (
                  <clipPath id={`clip-${pos}`} key={pos}>
                    <circle cx="0" cy="0" r="19" />
                  </clipPath>
                ))}
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <rect width="100%" height="100%" fill="none" stroke="rgba(255,90,0,0.15)" strokeWidth="2" />

              {/* Court Outlines */}
              <path d="M 50,150 A 210,210 0 0,1 550,150" fill="none" stroke="rgba(255,90,0,0.2)" strokeWidth="2" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="rgba(255,90,0,0.2)" strokeWidth="2" />
              <circle cx="300" cy="150" r="50" fill="none" stroke="rgba(255,90,0,0.2)" strokeWidth="2" />
              <rect x="220" y="0" width="160" height="120" fill="none" stroke="rgba(255,90,0,0.2)" strokeWidth="2" />
              <circle cx="300" cy="120" r="30" fill="none" stroke="rgba(255,90,0,0.2)" strokeWidth="2" />
              
              {/* Backboard and Hoop */}
              <line ref={backboardRef} x1="270" y1="20" x2="330" y2="20" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
              <circle ref={hoopRef} cx="300" cy="30" r="10" fill="none" stroke="#FF5A00" strokeWidth="2.5" />

              {/* Strategy dashed lines */}
              {/* Path 1 */}
              <path
                className="strategy-line-1"
                d={playType === 'outside_three' ? "M 350,100 Q 300,90 250,100" : "M 300,280 Q 200,280 120,220"}
                fill="none"
                stroke="#FF5A00"
                strokeWidth="3"
                strokeDasharray="8,8"
                strokeDashoffset="400"
              />
              {/* Path 2 */}
              <path
                className="strategy-line-2"
                d={playType === 'outside_three' ? "M 250,100 C 200,160 180,220 150,260" : "M 120,220 C 220,180 380,220 480,220"}
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3"
                strokeDasharray="6,6"
                strokeDashoffset="400"
              />
              {/* Path 3 */}
              <path
                className="strategy-line-3"
                d={playType === 'outside_three' ? "M 150,260 Q 300,280 450,260" : playType === 'pick_roll' ? "M 180,200 Q 240,140 300,80" : "M 480,220 Q 350,150 220,120"}
                fill="none"
                stroke="#8B0000"
                strokeWidth="3.5"
                strokeDasharray="6,6"
                strokeDashoffset="400"
              />

              {/* Animated Basketball */}
              <circle
                ref={ballRef}
                r="7"
                fill="#FF7A00"
                stroke="#080808"
                strokeWidth="1.5"
                opacity="0"
                style={{ filter: 'drop-shadow(0 0 4px #FF7A00)' }}
              />

              {/* Player nodes rendering (reads actual face photos from Lineup) */}
              {[
                { ref: pgRef, pos: 'PG' as const },
                { ref: sgRef, pos: 'SG' as const },
                { ref: sfRef, pos: 'SF' as const },
                { ref: pfRef, pos: 'PF' as const },
                { ref: cRef, pos: 'C' as const }
              ].map(({ ref, pos }) => {
                const player = lineup[pos];
                const defaultPos = getDefaultPosition(pos, playType);
                return (
                  <g
                      key={pos}
                      ref={ref}
                      className="cursor-pointer group"
                      onClick={() => handlePlayerClickByPosition(pos)}
                      style={{ transform: `translate(${defaultPos.x}px, ${defaultPos.y}px)`, opacity: 1, transformOrigin: 'center' }}
                    >
                    <circle r="23" fill="#080808" stroke={player ? "#FF5A00" : "#ffffff15"} strokeWidth="2.5" filter="url(#glow)" />
                    {player ? (
                      // Display dynamic circular photo sphere
                      <image
                        href={player.photo}
                        x="-19"
                        y="-19"
                        width="38"
                        height="38"
                        clipPath={`url(#clip-${pos})`}
                        className="grayscale group-hover:grayscale-0 transition-all"
                      />
                    ) : (
                      // Fallback text position name
                      <>
                        <circle r="18" fill="rgba(255,90,0,0.08)" />
                        <text textAnchor="middle" dy=".3em" fill="#555" fontSize="10" fontWeight="black" fontFamily="Outfit">{pos}</text>
                      </>
                    )}
                    {/* Jersey number mini badge */}
                    <circle r="6" cx="16" cy="-16" fill="#FF5A00" />
                    <text textAnchor="middle" x="16" y="-13" fill="#080808" fontSize="8" fontWeight="black" fontFamily="Outfit">
                      {player ? player.number : '?'}
                    </text>
                    
                    {/* Player Name Text Label */}
                    <text
                      textAnchor="middle"
                      y="33"
                      fill={player ? "#ffffff" : "#ffffff40"}
                      fontSize="8"
                      fontWeight="black"
                      fontFamily="Outfit"
                      letterSpacing="0.05em"
                      className="uppercase"
                      style={{ pointerEvents: 'none' }}
                    >
                      {player ? player.name.split(' "')[0] : `(${pos})`}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Tactical overlay tags */}
            <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} flex gap-2`}>
              <button
                onClick={runStrategyAnimation}
                className="px-3.5 py-2 bg-brand-orange hover:bg-brand-burnt text-brand-black text-[9px] font-display font-black tracking-widest rounded-xl uppercase transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Play size={10} fill="#080808" />
                {t('tactical', 'runPlay')}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Dynamic Player Metric card */}
        <div className={`lg:col-span-5 h-full flex flex-col justify-center ${isRtl ? 'lg:order-1 text-right' : 'lg:order-2 text-left'}`}>
          <AnimatePresence mode="wait">
            {selectedPlayer ? (
              <motion.div
                key={selectedPlayer.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="glass-panel-heavy rounded-3xl p-8 border border-brand-orange/30 glow-orange flex flex-col relative overflow-hidden"
              >
                {/* Back jersey glow number */}
                <div className="absolute -top-12 -right-12 text-[150px] font-black text-white/3 font-display select-none">
                  #{selectedPlayer.number}
                </div>

                {/* Header */}
                <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-brand-orange/20 border border-brand-orange/30 overflow-hidden flex items-center justify-center">
                    <img
                      src={selectedPlayer.photo}
                      alt={selectedPlayer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 bg-brand-orange/20 text-brand-orange text-[10px] font-bold tracking-wider rounded uppercase">
                      {selectedPlayer.position} • Jersey #{selectedPlayer.number}
                    </span>
                    <h3 className="text-2xl font-title font-extrabold uppercase mt-1">
                      {selectedPlayer.name.split(' "')[0]}
                    </h3>
                    <p className="text-brand-gold text-xs font-display italic">
                      {selectedPlayer.name.includes('"') ? selectedPlayer.name.match(/"([^"]+)"/)?.[0] : ''}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Height</span>
                    <span className="text-base font-bold text-white">{selectedPlayer.height}</span>
                  </div>
                  <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Weight</span>
                    <span className="text-base font-bold text-white">{selectedPlayer.weight}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="space-y-4 mb-8">
                  <h4 className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Season Averages</h4>
                  
                  {/* PPG */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 text-gray-400"><Flame size={12} className="text-brand-orange" /> Points Per Game</span>
                      <span className="font-bold text-white">{selectedPlayer.stats.ppg}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(selectedPlayer.stats.ppg / 30) * 100}%` }} className="h-full bg-brand-orange" />
                    </div>
                  </div>

                  {/* APG */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 text-gray-400"><Activity size={12} className="text-brand-gold" /> Assists Per Game</span>
                      <span className="font-bold text-white">{selectedPlayer.stats.apg}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(selectedPlayer.stats.apg / 12) * 100}%` }} className="h-full bg-brand-gold" />
                    </div>
                  </div>

                  {/* RPG */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 text-gray-400"><Shield size={12} className="text-brand-burnt" /> Rebounds Per Game</span>
                      <span className="font-bold text-white">{selectedPlayer.stats.rpg}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(selectedPlayer.stats.rpg / 15) * 100}%` }} className="h-full bg-brand-burnt" />
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <button
                  onClick={() => setShowVideo(true)}
                  className="w-full py-4 bg-brand-orange hover:bg-brand-burnt text-brand-black font-display font-black tracking-widest rounded-xl uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-orange/10 cursor-pointer"
                >
                  <Play size={16} fill="#080808" /> Play Highlights
                </button>
              </motion.div>
            ) : (
              <div className="glass-panel rounded-3xl p-8 border border-white/5 h-[380px] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-4 text-brand-orange">
                  <User size={32} />
                </div>
                <h3 className="text-xl font-title font-extrabold uppercase mb-2">No Player Selected</h3>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Select a tactical playbook node (PG, SG, SF, PF, C) on the board to unlock detailed statistics, heights, jerseys, and highlights.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Video Highlights Drawer Modal */}
      <AnimatePresence>
        {showVideo && selectedPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="relative max-w-4xl w-full bg-brand-black border border-brand-orange/30 rounded-3xl overflow-hidden shadow-2xl glow-orange"
            >
              <button
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 p-2 bg-brand-black/80 hover:bg-brand-orange hover:text-brand-black text-white rounded-full transition-all z-10"
              >
                <X size={20} />
              </button>

              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/3">
                <h4 className="font-title font-extrabold uppercase tracking-wide flex items-center gap-2 text-white">
                  <Award size={18} className="text-brand-orange" />
                  {selectedPlayer.name} Highlight reel
                </h4>
              </div>

              {/* Video frame */}
              <div className="aspect-video w-full bg-black">
                {(() => {
                  const ytId = getYoutubeId(selectedPlayer.highlight_url);
                  if (ytId) {
                    return (
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
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
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  );
                })()}
              </div>

              <div className="p-6 bg-white/3 text-xs text-gray-400 flex items-center justify-between">
                <span>Playbook ID: {selectedPlayer.id} • BSQ ALL-FIVE Media</span>
                <span className="text-brand-orange">Gain 15 XP community reward</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default TacticalBoard;
