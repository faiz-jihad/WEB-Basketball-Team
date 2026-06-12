import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, ChevronDown } from 'lucide-react';
import useAppStore from '../lib/store';
import { getTranslation } from '../lib/i18n';

gsap.registerPlugin(ScrollTrigger);

const frameNames = [
  'frame_001.png', 'frame_003.png', 'frame_004.png', 'frame_005.png', 'frame_006.png', 
  'frame_007.png', 'frame_008.png', 'frame_009.png', 'frame_011.png', 'frame_013.png', 
  'frame_014.png', 'frame_015.png', 'frame_016.png', 'frame_017.png', 'frame_018.png', 
  'frame_019.png', 'frame_020.png', 'frame_021.png', 'frame_022.png', 'frame_023.png', 
  'frame_024.png', 'frame_026.png', 'frame_027.png', 'frame_028.png', 'frame_030.png', 
  'frame_031.png', 'frame_033.png', 'frame_034.png', 'frame_035.png', 'frame_036.png', 
  'frame_037.png', 'frame_038.png', 'frame_039.png', 'frame_042.png', 'frame_044.png', 
  'frame_045.png', 'frame_047.png', 'frame_048.png', 'frame_050.png', 'frame_051.png', 
  'frame_054.png', 'frame_055.png', 'frame_056.png', 'frame_060.png', 'frame_061.png', 
  'frame_062.png', 'frame_063.png', 'frame_064.png', 'frame_066.png'
];

const frameUrls = frameNames.map(name => 
  new URL(`../assets/frame logo/${name}`, import.meta.url).href
);

export const LogoScrollytelling: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const { language } = useAppStore();
  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';

  const [progress, setProgress] = useState(0);
  const [preloadedImages, setPreloadedImages] = useState<HTMLImageElement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });

  // Track viewport dimensions dynamically for a pixel-perfect crisp canvas
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload all logo frames
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    frameUrls.forEach((url, index) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedCount++;
        setProgress(Math.round((loadedCount / frameUrls.length) * 100));
        if (loadedCount === frameUrls.length) {
          setIsLoaded(true);
        }
      };
      img.onerror = () => {
        console.warn(`Could not preload frame logo image at path: ${url}`);
        loadedCount++;
        setProgress(Math.round((loadedCount / frameUrls.length) * 100));
        if (loadedCount === frameUrls.length) {
          setIsLoaded(true);
        }
      };
      images[index] = img;
    });

    setPreloadedImages(images);
  }, []);

  // Draw current frame on canvas
  useEffect(() => {
    if (!isLoaded || preloadedImages.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = preloadedImages[frameIndex];
    if (img && img.complete) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate responsive logo scale to make it look prominent and "full screen"
      // Since standard PNG logo frames have transparent margins, we apply a responsive multiplier
      const isMobile = canvas.width < 768;
      const multiplier = isMobile ? 1.05 : 1.35;
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * multiplier;
      
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      
      ctx.drawImage(img, x, y, w, h);
    }
  }, [frameIndex, isLoaded, preloadedImages, dimensions]);

  // Setup GSAP scroll pinning and frame index scrub
  useEffect(() => {
    if (!isLoaded) return;

    const totalFrames = frameUrls.length;
    const obj = { frame: 0 };
    
    // Invert slide directions for RTL languages
    const startXLeft = isRtl ? 150 : -150;
    const startXRight = isRtl ? -150 : 150;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=350%', // Spaced out scroll duration height for less rushed transitions
          scrub: 1.2,    // High scrub inertia for ultra-smooth momentum/dampening
          pin: true,
          anticipatePin: 1,
        }
      });

      // Scrub frame index smoothly (removed snap for continuous sub-pixel float updates)
      tl.to(obj, {
        frame: totalFrames - 1,
        ease: 'none',
        duration: 7.0,
        onUpdate: () => {
          setFrameIndex(Math.round(obj.frame));
        }
      }, 0);

      // Text slides timeline transitions with premium easing (power2.out for arrival, power2.in for departure)
      // Slide 1 fades in from left, fades out to right
      tl.fromTo('.scrolly-slide-1', 
        { opacity: 0, x: startXLeft }, 
        { opacity: 1, x: 0, ease: 'power2.out', duration: 0.8 }, 
        0.2
      );
      tl.to('.scrolly-slide-1', 
        { opacity: 0, x: startXRight, ease: 'power2.in', duration: 0.8 }, 
        1.4
      );

      // Slide 2 fades in from right, fades out to left
      tl.fromTo('.scrolly-slide-2', 
        { opacity: 0, x: startXRight }, 
        { opacity: 1, x: 0, ease: 'power2.out', duration: 0.8 }, 
        2.2
      );
      tl.to('.scrolly-slide-2', 
        { opacity: 0, x: startXLeft, ease: 'power2.in', duration: 0.8 }, 
        3.4
      );

      // Slide 3 fades in from left, fades out to right
      tl.fromTo('.scrolly-slide-3', 
        { opacity: 0, x: startXLeft }, 
        { opacity: 1, x: 0, ease: 'power2.out', duration: 0.8 }, 
        4.2
      );
      tl.to('.scrolly-slide-3', 
        { opacity: 0, x: startXRight, ease: 'power2.in', duration: 0.8 }, 
        5.4
      );

      // Slide 4 fades in from right
      tl.fromTo('.scrolly-slide-4', 
        { opacity: 0, x: startXRight }, 
        { opacity: 1, x: 0, ease: 'power2.out', duration: 0.8 }, 
        6.2
      );

    }, containerRef);

    return () => ctx.revert();
  }, [isLoaded, isRtl]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-screen bg-bg-darker border-b border-white/5 overflow-hidden"
    >
      {/* Loading Cover */}
      {!isLoaded && (
        <div className="absolute inset-0 z-[1000] bg-bg-darker flex flex-col items-center justify-center p-6">
          <div className="flex flex-col items-center max-w-xs w-full">
            <div className="w-12 h-12 rounded-full border-2 border-brand-orange/20 border-t-brand-orange animate-spin mb-6" />
            <span className="text-xs font-display tracking-[0.25em] font-black uppercase text-brand-orange animate-pulse flex items-center gap-1.5">
              <Sparkles size={14} /> FORGING BRAND LEGACY
            </span>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-4">
              <div 
                className="h-full bg-brand-orange transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-display font-semibold text-brand-gold/60 mt-2 tracking-widest">{progress}% LOADED</span>
          </div>
        </div>
      )}

      {/* Main Scrollytelling Container */}
      {isLoaded && (
        <div className="w-full h-screen relative flex items-center justify-center">
          
          {/* 1. Full-Screen Canvas Image Sequence Background */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center z-0 overflow-hidden bg-bg-darker">
            {/* Spotlight Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full bg-gradient-radial from-brand-orange/20 to-transparent blur-[140px] pointer-events-none" />
            
            {/* Canvas player filling the screen background */}
            <canvas
              ref={canvasRef}
              width={dimensions.width}
              height={dimensions.height}
              className="absolute inset-0 w-full h-full object-cover drop-shadow-[0_0_100px_rgba(255,90,0,0.3)] opacity-85 select-none pointer-events-none transition-all duration-300 scale-100"
            />
          </div>

          {/* 2. Dark contrast protection overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-bg-darker via-black/20 to-bg-darker z-5 pointer-events-none" />

          {/* 3. Centered Storytelling Slides Content Overlay */}
          <div className="relative z-10 w-full max-w-3xl mx-auto px-6 h-[400px] flex items-center justify-center">
            
            {/* Slide 1 */}
            <div className="scrolly-slide-1 absolute inset-0 flex flex-col items-center justify-center text-center opacity-0">
              <span className="text-brand-orange font-display text-xs font-semibold tracking-[0.25em] uppercase mb-4 flex items-center gap-1.5 justify-center">
                <Sparkles size={14} /> 01 / BRAND FORGING
              </span>
              <h3 className="text-4xl sm:text-5xl md:text-6xl font-title font-black uppercase text-white leading-tight tracking-tight max-w-xl text-glow-orange">
                {t('scrollytelling', 'slide1Title')}
              </h3>
              <p className="text-gray-300 mt-6 text-sm md:text-base leading-relaxed font-semibold max-w-lg">
                {t('scrollytelling', 'slide1Desc')}
              </p>
            </div>

            {/* Slide 2 */}
            <div className="scrolly-slide-2 absolute inset-0 flex flex-col items-center justify-center text-center opacity-0">
              <span className="text-brand-orange font-display text-xs font-semibold tracking-[0.25em] uppercase mb-4 flex items-center gap-1.5 justify-center">
                <Sparkles size={14} /> 02 / STUDENT SPIRIT
              </span>
              <h3 className="text-4xl sm:text-5xl md:text-6xl font-title font-black uppercase text-white leading-tight tracking-tight max-w-xl text-glow-orange">
                {t('scrollytelling', 'slide2Title')}
              </h3>
              <p className="text-gray-300 mt-6 text-sm md:text-base leading-relaxed font-semibold max-w-lg">
                {t('scrollytelling', 'slide2Desc')}
              </p>
            </div>

            {/* Slide 3 */}
            <div className="scrolly-slide-3 absolute inset-0 flex flex-col items-center justify-center text-center opacity-0">
              <span className="text-brand-orange font-display text-xs font-semibold tracking-[0.25em] uppercase mb-4 flex items-center gap-1.5 justify-center">
                <Sparkles size={14} /> 03 / LOCAL MASCOT
              </span>
              <h3 className="text-4xl sm:text-5xl md:text-6xl font-title font-black uppercase text-white leading-tight tracking-tight max-w-xl text-glow-orange">
                {t('scrollytelling', 'slide3Title')}
              </h3>
              <p className="text-gray-300 mt-6 text-sm md:text-base leading-relaxed font-semibold max-w-lg">
                {t('scrollytelling', 'slide3Desc')}
              </p>
            </div>

            {/* Slide 4 */}
            <div className="scrolly-slide-4 absolute inset-0 flex flex-col items-center justify-center text-center opacity-0">
              <span className="text-brand-orange font-display text-xs font-semibold tracking-[0.25em] uppercase mb-4 flex items-center gap-1.5 justify-center">
                <Sparkles size={14} /> 04 / THE JOURNEY
              </span>
              <h3 className="text-4xl sm:text-5xl md:text-6xl font-title font-black uppercase text-white leading-tight tracking-tight max-w-xl text-glow-orange">
                {t('scrollytelling', 'slide4Title')}
              </h3>
              <p className="text-gray-300 mt-6 text-sm md:text-base leading-relaxed font-semibold max-w-lg">
                {t('scrollytelling', 'slide4Desc')}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Scroll indicator overlay */}
      {isLoaded && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-gray-500 pointer-events-none">
          <span className="text-[9px] font-display uppercase tracking-[0.35em] font-semibold">SCROLL TO SPIN</span>
          <ChevronDown size={14} className="text-brand-orange animate-bounce" />
        </div>
      )}
    </div>
  );
};

export default LogoScrollytelling;
