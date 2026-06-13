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
    let lastWidth = window.innerWidth;
    const handleResize = () => {
      // Ignore height-only resizes on mobile (URL bar collapse) to prevent canvas flicker
      if (window.innerWidth < 768 && window.innerWidth === lastWidth) {
        return;
      }
      lastWidth = window.innerWidth;
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload frames progressively
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = new Array(frameUrls.length);

    if (frameUrls.length === 0) {
      setIsLoaded(true);
      return;
    }

    // Load first frame to unblock UI quickly
    const loadRemainingFrames = () => {
      frameUrls.slice(1).forEach((url, index) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          loadedCount++;
          setProgress(Math.round((loadedCount / frameUrls.length) * 100));
        };
        img.onerror = () => {
          loadedCount++;
          setProgress(Math.round((loadedCount / frameUrls.length) * 100));
        };
        images[index + 1] = img;
      });
    };

    const firstImg = new Image();
    firstImg.src = frameUrls[0];
    firstImg.onload = () => {
      images[0] = firstImg;
      loadedCount++;
      setProgress(Math.round((loadedCount / frameUrls.length) * 100));
      setIsLoaded(true); // Unblock UI immediately after first frame!
      loadRemainingFrames();
    };
    firstImg.onerror = () => {
      setIsLoaded(true);
      loadRemainingFrames();
    };

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
  }, [isRtl, preloadedImages.length]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-screen bg-bg-darker border-b border-white/5 overflow-hidden"
    >
      {/* Main Canvas for Scrollytelling Frames */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className={`w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? 'opacity-40' : 'opacity-0'}`}
      />

      {/* Scrollytelling Content Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        
        {/* Slide 1 */}
        <div className={`tactic-slide-1 absolute inset-0 flex flex-col justify-end pb-24 px-6 text-center md:justify-center md:pb-0 md:px-24 ${isRtl ? 'md:items-end md:text-right' : 'md:items-start md:text-left'}`}>
          <div className="max-w-lg w-full">
            <h2 className="text-4xl md:text-6xl font-black text-white font-title uppercase leading-none drop-shadow-2xl">
              {t('tacticScrolly', 'slide1Title')}
            </h2>
            <div className={`w-24 h-1.5 bg-brand-orange my-6 mx-auto ${isRtl ? 'md:mr-0' : 'md:ml-0'}`} />
            <p className="text-sm md:text-lg text-gray-300 font-display drop-shadow-lg leading-relaxed font-semibold">
              {t('tacticScrolly', 'slide1Desc')}
            </p>
          </div>
        </div>

        {/* Slide 2 */}
        <div className={`tactic-slide-2 absolute inset-0 flex flex-col justify-end pb-24 px-6 text-center md:justify-center md:pb-0 md:px-24 ${isRtl ? 'md:items-start md:text-left' : 'md:items-end md:text-right'}`}>
          <div className="max-w-lg w-full">
            <h2 className="text-4xl md:text-6xl font-black text-white font-title uppercase leading-none drop-shadow-2xl">
              {t('tacticScrolly', 'slide2Title')}
            </h2>
            <div className={`w-24 h-1.5 bg-brand-orange my-6 mx-auto ${isRtl ? 'md:ml-0' : 'md:mr-0'}`} />
            <p className="text-sm md:text-lg text-gray-300 font-display drop-shadow-lg leading-relaxed font-semibold">
              {t('tacticScrolly', 'slide2Desc')}
            </p>
          </div>
        </div>

        {/* Slide 3 */}
        <div className={`tactic-slide-3 absolute inset-0 flex flex-col justify-end pb-24 px-6 text-center md:justify-center md:pb-0 md:px-24 ${isRtl ? 'md:items-end md:text-right' : 'md:items-start md:text-left'}`}>
          <div className="max-w-lg w-full">
            <h2 className="text-4xl md:text-6xl font-black text-white font-title uppercase leading-none drop-shadow-2xl">
              {t('tacticScrolly', 'slide3Title')}
            </h2>
            <div className={`w-24 h-1.5 bg-brand-orange my-6 mx-auto ${isRtl ? 'md:mr-0' : 'md:ml-0'}`} />
            <p className="text-sm md:text-lg text-gray-300 font-display drop-shadow-lg leading-relaxed font-semibold">
              {t('tacticScrolly', 'slide3Desc')}
            </p>
          </div>
        </div>

        {/* Slide 4 */}
        <div className={`tactic-slide-4 absolute inset-0 flex flex-col justify-end pb-24 px-6 text-center md:justify-center md:pb-0 md:px-24 ${isRtl ? 'md:items-start md:text-left' : 'md:items-end md:text-right'}`}>
          <div className="max-w-lg w-full">
            <h2 className="text-4xl md:text-6xl font-black text-white font-title uppercase leading-none drop-shadow-2xl">
              {t('tacticScrolly', 'slide4Title')}
            </h2>
            <div className={`w-24 h-1.5 bg-brand-orange my-6 mx-auto ${isRtl ? 'md:ml-0' : 'md:mr-0'}`} />
            <p className="text-sm md:text-lg text-gray-300 font-display drop-shadow-lg leading-relaxed font-semibold">
              {t('tacticScrolly', 'slide4Desc')}
            </p>
          </div>
        </div>

      </div>

      {/* Decorative gradient overlays */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-bg-darker to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-bg-darker to-transparent pointer-events-none" />
    </div>
  );
};

export default TacticScrollytelling;
