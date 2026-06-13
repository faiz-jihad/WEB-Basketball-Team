import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronRight, Sparkles } from 'lucide-react';
import Trophy3D from './3d/Trophy3D';
import useAppStore from '../lib/store';
import { getTranslation } from '../lib/i18n';
import { db } from '../lib/supabase';
import type { Milestone } from '../lib/supabase';

gsap.registerPlugin(ScrollTrigger);

const getMilestones = (lang: string) => {
  const data = {
    en: [
      { id: '1', year: '2015', title: 'Foundation Era', desc: 'BSQ basketball team is founded under the Al Hikmah school sports program in Cirebon, starting on a humble outdoor court.', icon: '🏫' },
      { id: '2', year: '2018', title: 'First Regional Cup', desc: 'Won the first regional school tournament cup in Cirebon, establishing our name among school teams.', icon: '🏆' },
      { id: '3', year: '2020', title: 'Golden Stallions Rebrand', desc: 'Adopted the Golden Stallions identity and opened our premium indoor school basketball hall with professional facilities.', icon: '🎨' },
      { id: '4', year: '2023', title: 'DBL Cup Glory', desc: 'Captured the prestigious DBL regional school championship for the first time in an epic final match.', icon: '📈' },
      { id: '5', year: '2026', title: '5th National Crown', desc: 'Completed an undefeated season, securing our 5th championship cup and cementing the school\'s sports legacy.', icon: '👑' }
    ],
    id: [
      { id: '1', year: '2015', title: 'Era Pendirian', desc: 'Tim basket BSQ didirikan di bawah program olahraga sekolah Al Hikmah Cirebon, dimulai dari lapangan luar ruangan sederhana.', icon: '🏫' },
      { id: '2', year: '2018', title: 'Piala Regional Pertama', desc: 'Memenangkan piala kejuaraan sekolah regional pertama di Cirebon, menancapkan nama kami di antara tim sekolah lainnya.', icon: '🏆' },
      { id: '3', year: '2020', title: 'Rebranding Golden Stallions', desc: 'Mengadopsi identitas Golden Stallions (Kuda Emas) dan meresmikan aula basket sekolah dalam ruangan dengan fasilitas premium.', icon: '🎨' },
      { id: '4', year: '2023', title: 'Kejayaan Piala DBL', desc: 'Meraih piala bergengsi DBL regional antar-sekolah untuk pertama kalinya dalam pertandingan final yang epik.', icon: '📈' },
      { id: '5', year: '2026', title: 'Gelar Nasional Ke-5', desc: 'Menutup musim tanpa kekalahan, mengamankan trofi kejuaraan ke-5 berturut-turut dan memperkuat warisan olahraga sekolah.', icon: '👑' }
    ],
    ar: [
      { id: '1', year: '2015', title: 'عصر التأسيس', desc: 'تأسس فريق BSQ لكرة السلة تحت رعاية برنامج الرياضة المدرسية بمدرسة الحكمة في سيريبون، بدءاً بملعب خارجي بسيط.', icon: '🏫' },
      { id: '2', year: '2018', title: 'الكأس الإقليمية الأولى', desc: 'الفوز بأول كأس بطولة مدرسية إقليمية في سيريبون، مما رسخ اسمنا بين الفرق المدرسية.', icon: '🏆' },
      { id: '3', year: '2020', title: 'إعادة تسمية الخيول الذهبية', desc: 'اعتماد هوية خيول الحكمة الذهبية (Golden Stallions) وافتتاح صالة كرة السلة المغلقة بالمدرسة بمرافق ممتازة.', icon: '🎨' },
      { id: '4', year: '2023', title: 'مجد كأس DBL المدرسية', desc: 'حصد بطولة DBL المدرسية المرموقة على مستوى الإقليم للمرة الأولى في مباراة نهائية ملحمية.', icon: '📈' },
      { id: '5', year: '2026', title: 'التاج الوطني الخامس', desc: 'إكمال موسم خالي من الهزائم، وتأمين كأس البطولة الخامس على التوالي وترسيخ الإرث الرياضي للمدرسة.', icon: '👑' }
    ]
  };
  return data[lang as keyof typeof data] || data['en'];
};

// Animated Counter Hook
const AnimatedCounter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let active = true;
    if (ref.current) {
      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top 85%',
        onEnter: () => {
          if (!active) return;
          const end = value;
          const totalTicks = 60 * duration;
          let tick = 0;

          const timer = setInterval(() => {
            tick++;
            const progress = tick / totalTicks;
            // Ease out quad
            const current = Math.floor(end * (progress * (2 - progress)));
            setCount(current);

            if (tick >= totalTicks) {
              setCount(end);
              clearInterval(timer);
            }
          }, 16);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [value, duration]);

  return <span ref={ref}>{count}</span>;
};

export const Storytelling: React.FC = () => {
  const [activeMilestone, setActiveMilestone] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dreamsRef = useRef<HTMLDivElement | null>(null);

  const { language } = useAppStore();
  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';
  
  const [milestones, setMilestones] = useState<Milestone[]>(getMilestones(language));

  useEffect(() => {
    const fetchMilestones = () => {
      db.from('milestones')
        .select('*')
        .order('year', { ascending: true })
        .then(({ data }: any) => {
          if (data) {
            setMilestones(data);
          }
        });
    };

    fetchMilestones();

    window.addEventListener('bsq_milestones_updated', fetchMilestones);
    return () => window.removeEventListener('bsq_milestones_updated', fetchMilestones);
  }, [language]);

  useEffect(() => {
    if (activeMilestone >= milestones.length && milestones.length > 0) {
      setActiveMilestone(0);
    }
  }, [milestones, activeMilestone]);

  const [mvpsCount, setMvpsCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bsq_achievements_mvps");
      return saved !== null ? Number(saved) : 8;
    }
    return 8;
  });

  const [ringsCount, setRingsCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bsq_achievements_rings");
      return saved !== null ? Number(saved) : 5;
    }
    return 5;
  });

  const [winsCount, setWinsCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bsq_achievements_wins");
      return saved !== null ? Number(saved) : 320;
    }
    return 320;
  });

  useEffect(() => {
    const handleUpdate = () => {
      const savedMvps = localStorage.getItem("bsq_achievements_mvps");
      const savedRings = localStorage.getItem("bsq_achievements_rings");
      const savedWins = localStorage.getItem("bsq_achievements_wins");
      if (savedMvps !== null) setMvpsCount(Number(savedMvps));
      if (savedRings !== null) setRingsCount(Number(savedRings));
      if (savedWins !== null) setWinsCount(Number(savedWins));
    };

    window.addEventListener("bsq_achievements_updated", handleUpdate);
    return () => window.removeEventListener("bsq_achievements_updated", handleUpdate);
  }, []);

  // Parallax for Championship Dreams
  const { scrollYProgress } = useScroll({
    target: dreamsRef,
    offset: ["start end", "end start"]
  });
  const yText = useTransform(scrollYProgress, [0, 1], ["50px", "-80px"]);
  const scaleBg = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1.0, 0.95]);

  return (
    <div ref={containerRef} className={`bg-brand-black text-white overflow-hidden ${isRtl ? 'font-arabic text-right' : 'text-left'}`}>
      
      {/* SECTION 1: Our Legacy */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-b border-white/5">
        <div className="text-center mb-16">
          <span className="text-brand-orange font-display text-sm font-semibold tracking-[0.25em] uppercase block mb-2">{t('story', 'legacy')}</span>
          <h2 className="text-4xl md:text-6xl font-title font-extrabold uppercase">
            {(() => {
              const titleText = t('story', 'dynasty');
              const parts = titleText.split(' ');
              const highlight = parts[parts.length - 1];
              const normal = parts.slice(0, -1).join(' ');
              return (
                <>
                  {normal} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-gold">{highlight}</span>
                </>
              );
            })()}
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            {t('story', 'desc')}
          </p>
        </div>

        {/* 3D trophy display grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mt-12">
          
          {/* Trophy 1 */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 text-center flex flex-col items-center group hover:border-brand-orange/30 transition-all duration-500">
            <Trophy3D type="trophy" className="h-[200px]" />
            <h3 className="text-xl font-title font-black uppercase text-brand-gold mt-4">{t('story', 'mvps')}</h3>
            <div className="text-4xl font-title font-black mt-2 text-white">
              <AnimatedCounter value={mvpsCount} />
            </div>
            <p className="text-xs text-gray-500 mt-2 max-w-xs">
              {t('story', 'mvpDesc')}
            </p>
          </div>

          {/* Championship Ring Centerpiece */}
          <div className="glass-panel-heavy rounded-3xl p-8 border border-brand-orange/20 text-center flex flex-col items-center relative scale-100 md:scale-105 glow-orange hover:border-brand-orange/40 transition-all duration-500">
            <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} bg-brand-orange/15 px-3 py-1 rounded-full border border-brand-orange/30 text-[9px] font-bold text-brand-orange tracking-widest uppercase`}>
              DYNASTY
            </div>
            <Trophy3D type="ring" className="h-[220px]" />
            <h3 className="text-2xl font-title font-black uppercase text-brand-orange mt-4">{t('story', 'rings')}</h3>
            <div className="text-5xl font-title font-black mt-2 text-white">
              <AnimatedCounter value={ringsCount} />
            </div>
            <p className="text-xs text-gray-400 mt-2 max-w-xs">
              {t('story', 'ringDesc')}
            </p>
          </div>

          {/* Trophy 3 */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 text-center flex flex-col items-center group hover:border-brand-orange/30 transition-all duration-500">
            <Trophy3D type="trophy" className="h-[200px]" />
            <h3 className="text-xl font-title font-black uppercase text-brand-gold mt-4">{t('story', 'wins')}</h3>
            <div className="text-4xl font-title font-black mt-2 text-white">
              <AnimatedCounter value={winsCount} />
            </div>
            <p className="text-xs text-gray-500 mt-2 max-w-xs">
              {t('story', 'winsDesc')}
            </p>
          </div>

        </div>
      </section>

      {/* SECTION 2: Team Journey Timeline */}
      <section className="py-24 px-6 border-b border-white/5 relative bg-gradient-to-b from-brand-black to-bg-darker">
        {/* Floating dust particles */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,90,0,0.02),transparent)] pointer-events-none" />

        <div className={`max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 ${isRtl ? 'lg:flex-row-reverse text-right' : 'text-left'}`}>
          {/* Milestone Details */}
          <div className={`w-full lg:w-1/3 flex flex-col justify-center text-center lg:text-left ${isRtl ? 'lg:text-right' : ''}`}>
            <span className="text-brand-orange font-display text-sm font-semibold tracking-[0.25em] uppercase block mb-2">{t('story', 'journey')}</span>
            <h3 className="text-3xl md:text-4xl font-title font-extrabold uppercase leading-tight text-white tracking-tight">
              {(() => {
                const titleText = t('story', 'journeyTitle');
                const parts = titleText.split(' ');
                const highlight = parts[parts.length - 1];
                const normal = parts.slice(0, -1).join(' ');
                return (
                  <>
                    {normal} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-burnt">{highlight}</span>
                  </>
                );
              })()}
            </h3>
            
            {/* Display active milestone content */}
            <div className="mt-8 h-40">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMilestone}
                  initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRtl ? -20 : 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-5xl font-title font-black text-brand-orange block mb-2">
                    {milestones[activeMilestone]?.year}
                  </span>
                  <h4 className={`text-xl font-bold font-display text-white mb-2 flex items-center justify-center lg:justify-start gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span>{milestones[activeMilestone]?.icon}</span> {milestones[activeMilestone]?.title}
                  </h4>
                  <p className="text-sm text-gray-400 leading-relaxed font-semibold">
                    {milestones[activeMilestone]?.desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Interactive Horizontal Track */}
          <div className={`w-full lg:w-2/3 flex overflow-x-auto gap-4 bg-white/2 border border-white/5 p-6 rounded-3xl relative ${isRtl ? 'flex-row-reverse' : ''}`}>
            {milestones.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActiveMilestone(idx)}
                className={`min-w-[220px] flex-shrink-0 text-left p-6 rounded-2xl border transition-all duration-300 relative group cursor-pointer ${isRtl ? 'text-right' : ''} ${
                  activeMilestone === idx
                    ? 'bg-brand-orange/15 border-brand-orange glow-orange'
                    : 'bg-white/3 border-white/10 hover:bg-white/5 hover:border-brand-orange/30'
                }`}
              >
                {/* Year Indicator */}
                <span className={`text-2xl font-title font-black block transition-colors ${
                  activeMilestone === idx ? 'text-brand-orange' : 'text-gray-500 group-hover:text-brand-orange'
                }`}>
                  {item.year}
                </span>

                {/* Title */}
                <span className="text-sm font-bold text-white mt-1 block">
                  {item.title}
                </span>

                {/* Subtitle / Chevron */}
                <div className={`mt-4 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-display">{t('story', 'milestone')} {idx+1}</span>
                  <ChevronRight size={14} className={`transform transition-transform ${isRtl ? 'rotate-180' : ''} ${
                    activeMilestone === idx ? 'text-brand-orange translate-x-1' : 'text-gray-500 group-hover:text-white'
                  }`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Championship Dreams (Apple Parallax) */}
      <section ref={dreamsRef} className="relative h-[70vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        
        {/* Parallax Background */}
        <motion.div
          style={{ scale: scaleBg }}
          className="absolute inset-0 z-0 bg-cover bg-center"
        >
          <div className="absolute inset-0 bg-black/75 z-10" />
          <img
            src="https://images.unsplash.com/photo-1544601283-c277a06657e8?auto=format&fit=crop&q=80&w=1920"
            alt="Crowd stadium blur background"
            className="w-full h-full object-cover opacity-30 filter contrast-125 saturate-50"
          />
        </motion.div>

        {/* Cinematic Parallax Text */}
        <motion.div style={{ y: yText }} className="relative z-10 text-center px-4 max-w-4xl">
          <span className="inline-flex items-center gap-1 bg-brand-orange/15 px-3 py-1 rounded-full border border-brand-orange/30 text-xs font-bold text-brand-orange uppercase tracking-[0.25em] mb-6">
            <Sparkles size={12} /> {t('story', 'dreamSlogan')}
          </span>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-title font-black uppercase tracking-tight leading-[0.95] text-white">
            {(() => {
              const dreamText = t('story', 'dreamTitle');
              const parts = dreamText.split(' ');
              const highlight = parts[parts.length - 1];
              const normal = parts.slice(0, -1).join(' ');
              return (
                <>
                  {normal} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-gold">{highlight}</span>
                </>
              );
            })()}
          </h2>
          <p className="text-gray-400 font-display text-sm md:text-base mt-6 max-w-xl mx-auto leading-relaxed font-semibold">
            {t('story', 'dreamDesc')}
          </p>
        </motion.div>

        {/* Ambient Ring Glow bottom edge */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-brand-black to-transparent z-10" />
      </section>
    </div>
  );
};

export default Storytelling;
