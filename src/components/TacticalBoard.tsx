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

// Initial positions of players (bench coordinates relative to 600x400 SVG court)
const PLAY_STEPS = {
  bench: [
    { id: 'p1', x: 300, y: 380, label: 'PG' },
    { id: 'p2', x: 300, y: 380, label: 'SG' },
    { id: 'p3', x: 300, y: 380, label: 'SF' },
    { id: 'p4', x: 300, y: 380, label: 'PF' },
    { id: 'p5', x: 300, y: 380, label: 'C' }
  ],
  offensive: [
    { id: 'p1', x: 300, y: 280, label: 'PG', title: 'Marcus Vance' }, // Top of key
    { id: 'p2', x: 120, y: 220, label: 'SG', title: 'Jalen Ross' },   // Left wing
    { id: 'p3', x: 480, y: 220, label: 'SF', title: 'Kaelen Carter' }, // Right wing
    { id: 'p4', x: 220, y: 120, label: 'PF', title: 'Tariq Stone' },   // Low post left
    { id: 'p5', x: 380, y: 80, label: 'C', title: 'Nikolai Volkov' }   // Low post right
  ]
};

export const TacticalBoard: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [activePlay, setActivePlay] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const addXP = useAppStore(state => state.addXP);
  const language = useAppStore(state => state.language);
  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';

  const containerRef = useRef<HTMLDivElement | null>(null);
  const courtRef = useRef<SVGSVGElement | null>(null);
  const pgRef = useRef<SVGGElement | null>(null);
  const sgRef = useRef<SVGGElement | null>(null);
  const sfRef = useRef<SVGGElement | null>(null);
  const pfRef = useRef<SVGGElement | null>(null);
  const cRef = useRef<SVGGElement | null>(null);


  // Fetch players
  useEffect(() => {
    (db as any).from('players').select('*').then(({ data }: any) => {
      if (data) setPlayers(data as Player[]);
    });
  }, []);

  // Trigger strategy animation on scroll
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Animate court appearing from below with rotation
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
  }, []);

  const runStrategyAnimation = () => {
    setActivePlay(true);
    const tl = gsap.timeline();

    // Reset player positions back to the bench (x:0, y:0 translation) and reset dash offsets
    const playersRefs = [pgRef.current, sgRef.current, sfRef.current, pfRef.current, cRef.current];
    gsap.set(playersRefs, { x: 0, y: 0, opacity: 0, scale: 0.5 });
    gsap.set('.strategy-line-1', { strokeDashoffset: 200 });
    gsap.set('.strategy-line-2', { strokeDashoffset: 400 });
    gsap.set('.strategy-line-3', { strokeDashoffset: 300 });

    // 2. 5 players run to positions one-by-one with glow and trails
    PLAY_STEPS.offensive.forEach((pos, index) => {
      const targetRef = playersRefs[index];
      tl.to(targetRef, {
        x: pos.x - 300, // Relative translation from bench
        y: pos.y - 380,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: 'power2.out'
      }, index * 0.25); // staggered entrance
    });

    // 3. Strategy dashed lines & arrows animate (PG passes to SG, SG drives, crosses to SF, alley-oop to PF)
    tl.to('.strategy-line-1', { strokeDashoffset: 0, duration: 0.8, ease: 'none' }, '+=0.2');
    tl.to('.strategy-line-2', { strokeDashoffset: 0, duration: 0.8, ease: 'none' });
    tl.to('.strategy-line-3', { strokeDashoffset: 0, duration: 0.8, ease: 'none' });
  };

  const handlePlayerClickByPosition = (position: 'PG' | 'SG' | 'SF' | 'PF' | 'C') => {
    const player = players.find(p => p.position === position);
    if (player) {
      setSelectedPlayer(player);
      addXP(15); // grant user XP for exploring tactical sheet
    }
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
              {t('tactical', 'title')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-burnt">
                {t('tactical', 'subtitle')}
              </span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl font-medium">
              {t('tactical', 'desc')}
            </p>
          </div>

          {/* SVG Tactical Court */}
          <div className="relative w-full aspect-[3/2] max-w-[650px] bg-brand-black border-2 border-brand-orange/20 rounded-2xl p-4 glow-orange overflow-hidden perspective-1000">
            <svg
              ref={courtRef}
              viewBox="0 0 600 400"
              className="w-full h-full opacity-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Tactical Grid Background */}
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 90, 0, 0.04)" strokeWidth="1" />
                </pattern>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <rect width="100%" height="100%" fill="none" stroke="rgba(255,90,0,0.15)" strokeWidth="2" />

              {/* Court Markings */}
              {/* Three Point Line (Outer Arc) */}
              <path d="M 50,150 A 210,210 0 0,1 550,150" fill="none" stroke="rgba(255,90,0,0.2)" strokeWidth="2" />
              {/* Center Line & Circle */}
              <line x1="0" y1="150" x2="600" y2="150" stroke="rgba(255,90,0,0.2)" strokeWidth="2" />
              <circle cx="300" cy="150" r="50" fill="none" stroke="rgba(255,90,0,0.2)" strokeWidth="2" />
              {/* Key / Paint */}
              <rect x="220" y="0" width="160" height="120" fill="none" stroke="rgba(255,90,0,0.2)" strokeWidth="2" />
              <circle cx="300" cy="120" r="30" fill="none" stroke="rgba(255,90,0,0.2)" strokeWidth="2" />
              {/* Hoop and Backboard */}
              <line x1="270" y1="20" x2="330" y2="20" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
              <circle cx="300" cy="30" r="10" fill="none" stroke="#FF5A00" strokeWidth="2.5" />

              {/* Strategy Action Paths (dashed arrows) */}
              {/* PG -> SG Pass */}
              <path
                className="strategy-line-1"
                d="M 300,280 Q 200,280 120,220"
                fill="none"
                stroke="#FF5A00"
                strokeWidth="3"
                strokeDasharray="8,8"
                strokeDashoffset="200"
              />
              {/* SG -> SF Cross pass */}
              <path
                className="strategy-line-2"
                d="M 120,220 C 220,180 380,220 480,220"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3"
                strokeDasharray="6,6"
                strokeDashoffset="400"
              />
              {/* SF -> PF Alley-oop Dunk lob */}
              <path
                className="strategy-line-3"
                d="M 480,220 Q 350,150 220,120"
                fill="none"
                stroke="#8B0000"
                strokeWidth="3.5"
                strokeDasharray="6,6"
                strokeDashoffset="300"
              />

              {/* SVG Markers (Arrows) */}
              <polygon points="120,220 126,228 132,223" fill="#FF5A00" />
              <polygon points="480,220 472,224 476,214" fill="#D4AF37" />
              <polygon points="220,120 228,124 224,114" fill="#8B0000" />

              {/* Interactive Player Nodes */}
              {/* Point Guard (Vance) */}
              <g
                ref={pgRef}
                transform="translate(300, 380)"
                className="cursor-pointer group"
                onClick={() => handlePlayerClickByPosition('PG')}
              >
                <circle r="22" fill="#080808" stroke="#FF5A00" strokeWidth="2.5" filter="url(#glow)" />
                <circle r="18" fill="rgba(255,90,0,0.15)" />
                <text textAnchor="middle" dy=".3em" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="Outfit">PG</text>
                <circle r="6" cx="15" cy="-15" fill="#FF5A00" />
                <text textAnchor="middle" x="15" y="-12" fill="#080808" fontSize="8" fontWeight="bold">3</text>
              </g>

              {/* Shooting Guard (Ross) */}
              <g
                ref={sgRef}
                transform="translate(300, 380)"
                className="cursor-pointer group"
                onClick={() => handlePlayerClickByPosition('SG')}
              >
                <circle r="22" fill="#080808" stroke="#FF5A00" strokeWidth="2.5" filter="url(#glow)" />
                <circle r="18" fill="rgba(255,90,0,0.15)" />
                <text textAnchor="middle" dy=".3em" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="Outfit">SG</text>
                <circle r="6" cx="15" cy="-15" fill="#FF5A00" />
                <text textAnchor="middle" x="15" y="-12" fill="#080808" fontSize="8" fontWeight="bold">11</text>
              </g>

              {/* Small Forward (Carter) */}
              <g
                ref={sfRef}
                transform="translate(300, 380)"
                className="cursor-pointer group"
                onClick={() => handlePlayerClickByPosition('SF')}
              >
                <circle r="22" fill="#080808" stroke="#FF5A00" strokeWidth="2.5" filter="url(#glow)" />
                <circle r="18" fill="rgba(255,90,0,0.15)" />
                <text textAnchor="middle" dy=".3em" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="Outfit">SF</text>
                <circle r="6" cx="15" cy="-15" fill="#FF5A00" />
                <text textAnchor="middle" x="15" y="-12" fill="#080808" fontSize="8" fontWeight="bold">8</text>
              </g>

              {/* Power Forward (Stone) */}
              <g
                ref={pfRef}
                transform="translate(300, 380)"
                className="cursor-pointer group"
                onClick={() => handlePlayerClickByPosition('PF')}
              >
                <circle r="22" fill="#080808" stroke="#FF5A00" strokeWidth="2.5" filter="url(#glow)" />
                <circle r="18" fill="rgba(255,90,0,0.15)" />
                <text textAnchor="middle" dy=".3em" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="Outfit">PF</text>
                <circle r="6" cx="15" cy="-15" fill="#FF5A00" />
                <text textAnchor="middle" x="15" y="-12" fill="#080808" fontSize="8" fontWeight="bold">23</text>
              </g>

              {/* Center (Volkov) */}
              <g
                ref={cRef}
                transform="translate(300, 380)"
                className="cursor-pointer group"
                onClick={() => handlePlayerClickByPosition('C')}
              >
                <circle r="22" fill="#080808" stroke="#FF5A00" strokeWidth="2.5" filter="url(#glow)" />
                <circle r="18" fill="rgba(255,90,0,0.15)" />
                <text textAnchor="middle" dy=".3em" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="Outfit">C</text>
                <circle r="6" cx="15" cy="-15" fill="#FF5A00" />
                <text textAnchor="middle" x="15" y="-12" fill="#080808" fontSize="8" fontWeight="bold">41</text>
              </g>
            </svg>

            {/* Tactical overlay tags */}
            <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} flex gap-2`}>
              <button
                onClick={runStrategyAnimation}
                className="px-3 py-1 bg-brand-orange hover:bg-brand-burnt text-brand-black text-[10px] font-display font-black tracking-widest rounded uppercase transition-colors cursor-pointer"
              >
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
                <video
                  src={selectedPlayer.highlight_url}
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
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
