import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ChevronDown, Trophy, Zap } from 'lucide-react';
import Basketball3D from './3d/Basketball3D';
import useAppStore from '../lib/store';
import { getTranslation } from '../lib/i18n';
import { useNavigate } from 'react-router-dom';

export const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();
  const { language } = useAppStore();
  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';

  // Parallax scrolling hooks using Framer Motion
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const ySmoke = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const yPlayers = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const yBall = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);
  const yText = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const opacityFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Magnetic CTA Button physics
  const ctaButtonRef = useRef<HTMLButtonElement | null>(null);
  const handleMagneticMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = ctaButtonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Lerp translation towards mouse cursor (magnetic attraction)
    gsap.to(btn, {
      x: x * 0.35,
      y: y * 0.35,
      scale: 1.05,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const handleMagneticLeave = () => {
    const btn = ctaButtonRef.current;
    if (!btn) return;
    gsap.to(btn, {
      x: 0,
      y: 0,
      scale: 1.0,
      duration: 0.5,
      ease: 'elastic.out(1.1, 0.4)'
    });
  };

  // Intro sequences on load
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. Initial logo glow flash
      tl.fromTo(logoRef.current,
        { scale: 0.6, opacity: 0, filter: 'drop-shadow(0 0 0px rgba(255,90,0,0))' },
        { scale: 1, opacity: 1, filter: 'drop-shadow(0 0 25px rgba(255,90,0,0.8))', duration: 1.5, ease: 'power4.out' }
      );

      // 2. Letter-by-letter reveal of team name "VORTEX"
      if (titleRef.current) {
        const letters = titleRef.current.querySelectorAll('.letter');
        tl.fromTo(letters,
          { opacity: 0, y: 50, rotateX: -90 },
          { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.08, ease: 'back.out(1.7)' },
          '-=0.6'
        );
      }

      // 3. Slogan & CTA fade-in
      tl.fromTo([textRef.current, ctaRef.current],
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' },
        '-=0.4'
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-bg-darker overflow-hidden flex items-center justify-center border-b border-brand-orange/5"
      style={{ perspective: '1000px' }}
    >
      {/* LAYER 1: Arena Background (Parallax) */}
      <motion.div
        style={{ y: yBg, opacity: opacityFade }}
        className="absolute inset-0 z-0 bg-cover bg-center select-none pointer-events-none"
      >
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img
          src="https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&q=80&w=1920"
          alt="Arena Spotlight Backdrop"
          className="w-full h-full object-cover opacity-35 filter brightness-50"
        />
        {/* Arena Spotlights (Simulated via gradients) */}
        <div className="absolute top-0 left-1/4 w-[20vw] h-[80vh] bg-gradient-to-b from-brand-orange/20 to-transparent blur-[120px] transform -rotate-12" />
        <div className="absolute top-0 right-1/4 w-[25vw] h-[90vh] bg-gradient-to-b from-brand-burnt/15 to-transparent blur-[140px] transform rotate-12" />
      </motion.div>

      {/* LAYER 2: Smoke Overlay (Parallax) */}
      <motion.div
        style={{ y: ySmoke, opacity: opacityFade }}
        className="absolute inset-0 z-[1] select-none pointer-events-none"
      >
        {/* Floating clouds/smoke blobs */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[50%] bg-gradient-radial from-brand-orange/10 to-transparent blur-[80px] animate-pulse duration-[6s]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[60%] bg-gradient-radial from-brand-red/10 to-transparent blur-[100px] animate-pulse duration-[8s]" />
      </motion.div>

      {/* LAYER 3: Players Silhouettes (Parallax) */}
      <motion.div
        style={{ y: yPlayers, opacity: opacityFade }}
        className="absolute bottom-0 inset-x-0 h-[60%] z-[2] select-none pointer-events-none flex items-end justify-center"
      >
        {/* Gradient backdrop to blend players */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-bg-darker to-transparent z-10" />
        
        {/* Vector-like glow layers of basketball players */}
        <div className="w-[1200px] max-w-full flex justify-between px-10 md:px-32 opacity-20 filter blur-xs">
          <div className="w-40 h-[280px] bg-brand-orange/25 rounded-t-full transform rotate-3" />
          <div className="w-48 h-[380px] bg-brand-burnt/30 rounded-t-full transform -rotate-2" />
          <div className="w-56 h-[460px] bg-brand-orange/35 rounded-t-full" />
          <div className="w-48 h-[360px] bg-brand-burnt/30 rounded-t-full transform rotate-3" />
          <div className="w-40 h-[250px] bg-brand-orange/25 rounded-t-full transform -rotate-6" />
        </div>
      </motion.div>

      {/* LAYER 4: 3D Basketball (Parallax) */}
      <motion.div
        style={{ y: yBall, opacity: opacityFade }}
        className="absolute inset-0 z-[3] flex items-center justify-center pointer-events-none"
      >
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 h-full">
          {/* Shift 3D Ball canvas to the right side on large screens */}
          <div className="lg:col-span-6 lg:col-start-7 flex items-center justify-center pointer-events-auto h-[45vh] lg:h-full mt-12 lg:mt-0">
            <Basketball3D className="w-[300px] h-[300px] sm:w-[450px] sm:h-[450px]" interactive={true} />
          </div>
        </div>
      </motion.div>

      {/* LAYER 5: Hero Text & CTA (Parallax) */}
      <motion.div
        style={{ y: yText, opacity: opacityFade }}
        className="absolute inset-0 z-[4] flex items-center justify-center pointer-events-none"
      >
        <div className={`w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 items-center ${isRtl ? 'lg:flex-row-reverse text-right' : 'text-left'}`}>
          <div className={`lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left ${isRtl ? 'lg:items-end lg:text-right' : ''}`}>
            {/* Logo Badge */}
            <div ref={logoRef} className={`opacity-0 mb-6 flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center text-brand-black font-title font-black text-xl shadow-lg shadow-brand-orange/40">B</span>
              <span className="text-xs font-display tracking-[0.3em] font-extrabold uppercase text-brand-gold">BSQ ALL-FIVE</span>
            </div>

            {/* Letter-by-Letter Franchise Title */}
            <h1
              ref={titleRef}
              className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-title font-black uppercase tracking-tight text-white leading-[0.85] flex flex-wrap justify-center lg:justify-start ${isRtl ? 'flex-row-reverse justify-end' : ''}`}
            >
              {t('hero', 'title').split("").map((letter, idx) => (
                <span
                  key={idx}
                  className="letter inline-block transform origin-bottom text-glow-orange filter drop-shadow-[0_0_15px_rgba(255,90,0,0.5)]"
                >
                  {letter}
                </span>
              ))}
            </h1>

            {/* Cinematic Slogan */}
            <div ref={textRef} className={`opacity-0 mt-6 max-w-md ${isRtl ? 'text-right' : 'text-left'}`}>
              <p className="text-gray-300 font-display text-sm md:text-base leading-relaxed font-semibold">
                {t('hero', 'slogan')}
              </p>
              <div className={`flex gap-6 mt-4 justify-center lg:justify-start text-xs font-display tracking-widest text-brand-gold ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
                <span className="flex items-center gap-1.5"><Trophy size={14} /> {t('hero', 'champions')}</span>
                <span className="flex items-center gap-1.5"><Zap size={14} /> {t('hero', 'liveMatch')}</span>
              </div>
            </div>

            {/* CTAs with Magnetic Hover */}
            <div ref={ctaRef} className={`opacity-0 mt-8 flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto pointer-events-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
              <button
                ref={ctaButtonRef}
                onMouseMove={handleMagneticMove}
                onMouseLeave={handleMagneticLeave}
                onClick={() => navigate('/matches')}
                className="px-8 py-4 bg-brand-orange hover:bg-brand-burnt text-brand-black font-display font-black text-xs tracking-[0.2em] uppercase rounded-xl transition-colors shadow-lg shadow-brand-orange/20 cursor-pointer w-full sm:w-auto text-center"
              >
                {t('hero', 'matchesBtn')}
              </button>
              
              <button
                onClick={() => navigate('/tickets')}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-display font-black text-xs tracking-[0.2em] uppercase rounded-xl border border-white/10 hover:border-brand-orange/30 transition-all cursor-pointer w-full sm:w-auto text-center"
              >
                {t('hero', 'ticketsBtn')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-gray-500 animate-bounce duration-[2s]">
        <span className="text-[9px] font-display uppercase tracking-[0.35em] font-semibold">{t('hero', 'scroll')}</span>
        <ChevronDown size={16} className="text-brand-orange" />
      </div>
    </div>
  );
};

export default Hero;
