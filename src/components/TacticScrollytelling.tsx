import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useAppStore from '../lib/store';
import { getTranslation } from '../lib/i18n';

gsap.registerPlugin(ScrollTrigger);

// Load all tactic frames via Vite glob
const frameModules = import.meta.glob('../assets/frame tactic/*.jpg', { eager: true });
const frameUrls = Object.keys(frameModules)
  .sort() // Ensure alphabetical sorting so 001 comes before 002
  .map(key => {
    const mod = frameModules[key] as any;
    return mod.default || mod; // Extract URL from module
  });

export const TacticScrollytelling: React.FC = () => {
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

  // Track viewport dimensions dynamically for crisp canvas
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

  // Preload all frames
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    if (frameUrls.length === 0) {
      setIsLoaded(true);
      return;
    }

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
        console.warn(`Could not preload tactic frame image at path: ${url}`);
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

  // Draw current frame on canvas (cover the screen)
  useEffect(() => {
    if (!isLoaded || preloadedImages.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = preloadedImages[frameIndex];
    if (img && img.complete) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate responsive scale to cover screen
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      
      ctx.drawImage(img, x, y, w, h);
    }
  }, [frameIndex, isLoaded, preloadedImages, dimensions]);

  // Setup GSAP scroll pinning and frame index scrub
  useEffect(() => {
    if (!isLoaded || preloadedImages.length === 0) return;

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
          end: '+=350%', // Spaced out scroll duration height
          scrub: 1.2,    // High scrub inertia for ultra-smooth momentum
          pin: true,
          anticipatePin: 1,
        }
      });

      // Scrub frame index smoothly
      tl.to(obj, {
        frame: totalFrames - 1,
        ease: 'none',
        duration: 7.0,
        onUpdate: () => {
          setFrameIndex(Math.round(obj.frame));
        }
      }, 0);

      // Slide 1 fades in from left, fades out to right
      tl.fromTo('.tactic-slide-1', 
        { opacity: 0, x: startXLeft }, 
        { opacity: 1, x: 0, ease: 'power2.out', duration: 0.8 }, 
        0.2
      );
      tl.to('.tactic-slide-1', 
        { opacity: 0, x: startXRight, ease: 'power2.in', duration: 0.8 }, 
        1.4
      );

      // Slide 2 fades in from right, fades out to left
      tl.fromTo('.tactic-slide-2', 
        { opacity: 0, x: startXRight }, 
        { opacity: 1, x: 0, ease: 'power2.out', duration: 0.8 }, 
        2.2
      );
      tl.to('.tactic-slide-2', 
        { opacity: 0, x: startXLeft, ease: 'power2.in', duration: 0.8 }, 
        3.4
      );

      // Slide 3 fades in from left, fades out to right
      tl.fromTo('.tactic-slide-3', 
        { opacity: 0, x: startXLeft }, 
        { opacity: 1, x: 0, ease: 'power2.out', duration: 0.8 }, 
        4.2
      );
      tl.to('.tactic-slide-3', 
        { opacity: 0, x: startXRight, ease: 'power2.in', duration: 0.8 }, 
        5.4
      );

      // Slide 4 fades in from right
      tl.fromTo('.tactic-slide-4', 
        { opacity: 0, x: startXRight }, 
        { opacity: 1, x: 0, ease: 'power2.out', duration: 0.8 }, 
        6.2
      );

    }, containerRef);

    return () => ctx.revert();
  }, [isLoaded, isRtl, preloadedImages.length]);

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
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-orange transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white mt-4 font-black font-display tracking-widest text-[10px] uppercase">
              {language === 'id' ? 'Memuat Taktik...' : language === 'ar' ? 'جاري تحميل التكتيك...' : 'Loading Tactics...'} {progress}%
            </p>
          </div>
        </div>
      )}

      {/* Main Canvas for Scrollytelling Frames */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className={`w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? 'opacity-40' : 'opacity-0'}`}
      />

      {/* Scrollytelling Content Overlays */}
      <div className={`absolute inset-0 pointer-events-none flex items-center p-8 md:p-24 ${isRtl ? 'justify-end text-right' : 'justify-start text-left'}`}>
        
        {/* Slide 1 */}
        <div className="tactic-slide-1 absolute max-w-lg">
          <h2 className="text-4xl md:text-6xl font-black text-white font-title uppercase leading-none drop-shadow-2xl">
            {t('tacticScrolly', 'slide1Title')}
          </h2>
          <div className={`w-24 h-1.5 bg-brand-orange my-6 ${isRtl ? 'ml-auto' : ''}`} />
          <p className="text-sm md:text-lg text-gray-300 font-display drop-shadow-lg leading-relaxed font-semibold">
            {t('tacticScrolly', 'slide1Desc')}
          </p>
        </div>

        {/* Slide 2 */}
        <div className={`tactic-slide-2 absolute max-w-lg ${isRtl ? 'left-8 md:left-24 text-left' : 'right-8 md:right-24 text-right'}`}>
          <h2 className="text-4xl md:text-6xl font-black text-white font-title uppercase leading-none drop-shadow-2xl">
            {t('tacticScrolly', 'slide2Title')}
          </h2>
          <div className={`w-24 h-1.5 bg-brand-orange my-6 ${isRtl ? '' : 'ml-auto'}`} />
          <p className="text-sm md:text-lg text-gray-300 font-display drop-shadow-lg leading-relaxed font-semibold">
            {t('tacticScrolly', 'slide2Desc')}
          </p>
        </div>

        {/* Slide 3 */}
        <div className="tactic-slide-3 absolute max-w-lg">
          <h2 className="text-4xl md:text-6xl font-black text-white font-title uppercase leading-none drop-shadow-2xl">
            {t('tacticScrolly', 'slide3Title')}
          </h2>
          <div className={`w-24 h-1.5 bg-brand-orange my-6 ${isRtl ? 'ml-auto' : ''}`} />
          <p className="text-sm md:text-lg text-gray-300 font-display drop-shadow-lg leading-relaxed font-semibold">
            {t('tacticScrolly', 'slide3Desc')}
          </p>
        </div>

        {/* Slide 4 */}
        <div className={`tactic-slide-4 absolute max-w-lg ${isRtl ? 'left-8 md:left-24 text-left' : 'right-8 md:right-24 text-right'}`}>
          <h2 className="text-4xl md:text-6xl font-black text-white font-title uppercase leading-none drop-shadow-2xl">
            {t('tacticScrolly', 'slide4Title')}
          </h2>
          <div className={`w-24 h-1.5 bg-brand-orange my-6 ${isRtl ? '' : 'ml-auto'}`} />
          <p className="text-sm md:text-lg text-gray-300 font-display drop-shadow-lg leading-relaxed font-semibold">
            {t('tacticScrolly', 'slide4Desc')}
          </p>
        </div>

      </div>

      {/* Decorative gradient overlays */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-bg-darker to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-bg-darker to-transparent pointer-events-none" />
    </div>
  );
};

export default TacticScrollytelling;
