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
      style={{ 
        perspective: '1000px',
        backgroundImage: 'radial-gradient(rgba(255,90,0,0.025) 15%, transparent 20%)',
        backgroundSize: '10px 10px'
      }}
    >
      {/* LAYER 1: Arena Background (Parallax) */}
      <motion.div
        style={{ y: yBg, opacity: opacityFade }}
        className="absolute inset-0 z-0 bg-cover bg-center select-none pointer-events-none"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/70 to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1920"
          alt="Basketball Court Arena Spotlight"
          className="w-full h-full object-cover opacity-30 filter grayscale mix-blend-overlay"
        />
        <div className="absolute top-0 left-1/4 w-[25vw] h-[80vh] bg-gradient-to-b from-brand-orange/10 to-transparent transform -rotate-12" />
        <div className="absolute top-0 right-1/4 w-[30vw] h-[90vh] bg-gradient-to-b from-brand-burnt/10 to-transparent transform rotate-12" />
      </motion.div>



      {/* Glowing Neon Basketball Hoop in background */}
      <div className={`absolute top-[12%] ${isRtl ? 'left-[8%]' : 'right-[8%]'} z-[1] opacity-25 select-none pointer-events-none`}>
        <svg viewBox="0 0 100 100" className="w-48 h-48 stroke-brand-orange/60 fill-none stroke-[1.5] filter drop-shadow-[0_0_12px_rgba(255,90,0,0.4)]">
          {/* Backboard */}
          <rect x="5" y="10" width="90" height="55" rx="3" />
          <rect x="25" y="25" width="50" height="40" />
          {/* Rim */}
          <ellipse cx="50" cy="65" rx="16" ry="5" className="stroke-brand-orange" />
          {/* Net */}
          <path d="M34 65 L40 90 L50 98 L60 90 L66 65 M40 65 L45 90 L55 90 L60 65 M50 65 L50 98 M42 75 L58 75 M46 85 L54 85" className="stroke-brand-orange/40" />
        </svg>
      </div>

      {/* Glowing Neon Basketball Court Lines (Bottom floor underlay in 3D perspective) */}
      <div className="absolute bottom-0 inset-x-0 h-[28vh] z-[1] pointer-events-none overflow-hidden opacity-30 select-none">
        <svg 
          viewBox="0 0 1000 300" 
          className="w-full h-full stroke-brand-orange/40 fill-none stroke-[2.5] filter drop-shadow-[0_0_10px_rgba(255,90,0,0.5)]"
          style={{ transform: 'perspective(180px) rotateX(62deg) scale(1.45)', transformOrigin: 'bottom center' }}
        >
          {/* Outer Boundary */}
          <rect x="50" y="-120" width="900" height="420" />
          {/* Mid-court line */}
          <line x1="500" y1="-120" x2="500" y2="300" />
          {/* Center Circle */}
          <circle cx="500" cy="90" r="100" />
          <circle cx="500" cy="90" r="25" />
          {/* Three-point line Left */}
          <path d="M 50,-120 A 250,250 0 0,0 300,130 L 300,300" />
          {/* Three-point line Right */}
          <path d="M 950,-120 A 250,250 0 0,1 700,130 L 700,300" />
          {/* Key Left */}
          <rect x="50" y="40" width="180" height="100" />
          <path d="M 230,40 A 50,50 0 0,1 230,140 Z" />
          {/* Key Right */}
          <rect x="770" y="40" width="180" height="100" />
          <path d="M 770,40 A 50,50 0 0,0 770,140 Z" />
        </svg>
      </div>



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
            <div ref={logoRef} className={`opacity-0 mb-6 flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="relative w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-xl shadow-brand-orange/20 backdrop-blur-md">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange/30 to-brand-gold/20 opacity-80" />
                <img 
                  src="/logo.png" 
                  alt="BSQ Cirebon Logo" 
                  className="w-full h-full object-contain p-1.5 z-10 relative opacity-90" 
                />
              </div>
              <div className={`flex flex-col ${isRtl ? 'items-end text-right' : 'items-start text-left'}`}>
                <span className="text-sm font-display tracking-[0.35em] font-black uppercase text-white leading-none">BSQ ALL-FIVE</span>
                <span className="text-[10px] font-display tracking-[0.2em] font-bold uppercase text-brand-gold mt-1.5">Al Hikmah Cirebon</span>
              </div>
            </div>

            {/* Letter-by-Letter Franchise Title */}
            <h1
              ref={titleRef}
              className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-title font-black uppercase tracking-tight text-white leading-[0.85] flex flex-wrap justify-center lg:justify-start gap-y-2 gap-x-[0.2em] ${isRtl ? 'flex-row-reverse justify-end' : ''}`}
            >
              {t('hero', 'title').split(" ").map((word, wordIdx) => (
                <span key={wordIdx} className="whitespace-nowrap inline-flex">
                  {word.split("").map((letter, idx) => (
                    <span
                      key={idx}
                      className="letter inline-block transform origin-bottom bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-500 drop-shadow-sm"
                    >
                      {letter}
                    </span>
                  ))}
                </span>
              ))}
            </h1>

            {/* Cinematic Slogan */}
            <div ref={textRef} className={`opacity-0 mt-8 max-w-lg ${isRtl ? 'text-right' : 'text-left'}`}>
              <p className="text-gray-300 font-display uppercase text-xs sm:text-sm md:text-base tracking-[0.4em] font-light mb-6 opacity-80">
                {t('hero', 'slogan')}
              </p>
              <div className={`flex gap-8 mt-2 justify-center lg:justify-start text-[10px] font-display tracking-[0.2em] text-gray-500 uppercase ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
                <span className="flex items-center gap-2"><Trophy size={12} className="text-brand-gold opacity-70" /> {t('hero', 'champions')}</span>
                <span className="flex items-center gap-2"><Zap size={12} className="text-brand-orange opacity-70" /> {t('hero', 'liveMatch')}</span>
              </div>
            </div>

            {/* CTAs with Magnetic Hover */}
            <div ref={ctaRef} className={`opacity-0 mt-8 flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto pointer-events-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
              <button
                ref={ctaButtonRef}
                onMouseMove={handleMagneticMove}
                onMouseLeave={handleMagneticLeave}
                onClick={() => navigate('/matches')}
                className="relative px-10 py-4 bg-white text-brand-black hover:bg-gray-200 font-display font-semibold text-[10px] tracking-[0.25em] uppercase transition-all duration-300 cursor-pointer w-full sm:w-auto text-center"
              >
                <span className="relative z-10">{t('hero', 'matchesBtn')}</span>
              </button>
              
              <button
                onClick={() => navigate('/tickets')}
                className="px-10 py-4 bg-transparent border border-gray-600 hover:border-white text-gray-300 hover:text-white font-display font-semibold text-[10px] tracking-[0.25em] uppercase transition-all duration-300 cursor-pointer w-full sm:w-auto text-center"
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
