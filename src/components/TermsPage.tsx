import React from 'react';
import { motion } from 'framer-motion';
import { Scale, FileText, ArrowRight, ShieldAlert } from 'lucide-react';
import useAppStore from '../lib/store';
import { getTranslation } from '../lib/i18n';

export const TermsPage: React.FC = () => {
  const { language } = useAppStore();
  const isRtl = language === 'ar';
  const t = (key: string) => getTranslation(language, 'terms', key);

  const sections = [
    {
      id: 'acceptance',
      title: t('sec1Title'),
      content: t('sec1Content')
    },
    {
      id: 'tickets',
      title: t('sec2Title'),
      content: t('sec2Content')
    },
    {
      id: 'merchandise',
      title: t('sec3Title'),
      content: t('sec3Content')
    },
    {
      id: 'conduct',
      title: t('sec4Title'),
      content: t('sec4Content')
    },
    {
      id: 'liability',
      title: t('sec5Title'),
      content: t('sec5Content')
    }
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="min-h-screen pt-32 pb-24 px-6 bg-brand-black relative overflow-hidden">
      {/* Background Glows */}
      <div className={`absolute top-20 ${isRtl ? 'right-1/4' : 'left-1/4'} w-80 h-80 bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none`} />
      <div className={`absolute bottom-20 ${isRtl ? 'left-1/4' : 'right-1/4'} w-96 h-96 bg-brand-gold/5 rounded-full blur-[120px] pointer-events-none`} />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Page Header */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-brand-orange/10 border border-brand-orange/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <Scale className="text-brand-orange" size={28} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-title font-black uppercase text-white tracking-tight"
          >
            {t('title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xs text-gray-500 font-display uppercase tracking-[0.2em] mt-3"
          >
            {t('updated')}
          </motion.p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          
          {/* Sticky Sidebar Links */}
          <motion.div 
            initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-4 sticky top-28 space-y-2 bg-white/2 border border-white/5 p-6 rounded-2xl backdrop-blur-md"
          >
            <h3 className={`text-[10px] font-display uppercase tracking-widest font-black text-brand-orange mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
              {t('tableOfContents')}
            </h3>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`w-full group flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/3 text-xs text-gray-400 hover:text-white transition-all cursor-pointer ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
              >
                <span>{sec.title}</span>
                <ArrowRight size={12} className={`opacity-0 group-hover:opacity-100 transition-all ${isRtl ? 'group-hover:-translate-x-1 rotate-180' : 'group-hover:translate-x-1'}`} />
              </button>
            ))}
          </motion.div>

          {/* Content Body */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-8 space-y-8"
          >
            {/* Disclaimer Box */}
            <div className={`glass-panel border-brand-orange/20 p-6 rounded-2xl flex items-start gap-4 shadow-xl shadow-brand-orange/2 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <ShieldAlert className="text-brand-orange flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-xs font-title font-black uppercase text-white mb-1">
                  {t('developerNote')}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed font-display">
                  {t('developerNoteDesc')}
                </p>
              </div>
            </div>

            {/* Sections */}
            {sections.map((sec) => (
              <div
                key={sec.id}
                id={sec.id}
                className={`scroll-mt-28 p-8 bg-white/3 border border-white/5 hover:border-white/10 rounded-2xl transition-colors ${isRtl ? 'text-right' : 'text-left'}`}
              >
                <h2 className="text-lg font-title font-black uppercase text-white mb-4 tracking-wide border-b border-white/5 pb-3">
                  {sec.title}
                </h2>
                <p className="text-xs text-gray-400 font-display leading-relaxed">
                  {sec.content}
                </p>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default TermsPage;
