import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, Globe, Sparkles } from 'lucide-react';
import useAppStore from '../lib/store';
import { getTranslation } from '../lib/i18n';

export const ContactPage: React.FC = () => {
  const { addToast, addXP, unlockBadge, language, firebaseUser } = useAppStore();
  const isRtl = language === 'ar';
  const t = (key: string) => getTranslation(language, `contact.${key}`);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      addToast('warning', 'Validation Error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      addToast('success', 'Message Sent! 📩', 'Thank you for reaching out to Al Hikmah Cirebon.');
      addXP(25); // Gamified contact submission

      if (firebaseUser) {
        // Unlock badge for first contact message
        unlockBadge(
          'contact_sent',
          'Vocal Supporter',
          '📣',
          'Successfully contacted the team administration.'
        );
      }
    }, 1500);
  };

  return (
    <section className="min-h-screen pt-32 pb-24 px-6 bg-brand-black relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-brand-orange text-xs font-black tracking-[0.25em] uppercase font-display block mb-2"
          >
            {t('getInTouch')}
          </motion.span>
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
            className="text-xs text-gray-500 font-display uppercase tracking-[0.1em] mt-3 max-w-xl mx-auto leading-relaxed"
          >
            {t('desc')}
          </motion.p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Left Column: Info & Map Card */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 flex flex-col gap-6"
          >
            {/* Contact Info Card */}
            <div className="glass-panel-heavy p-8 rounded-3xl border border-white/5 flex-1 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-6">
                <h3 className="text-xl font-title font-black uppercase text-white tracking-wide mb-6">
                  {t('contactDirectory')}
                </h3>

                {/* MapPin */}
                <div className={`flex items-start gap-4 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center text-brand-orange flex-shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('headquarters')}</h4>
                    <p className="text-xs text-gray-300 font-display mt-1 leading-relaxed">
                      Al Hikmah Arena Hall, Jl. Kalijaga No. 11, Cirebon, Jawa Barat, Indonesia
                    </p>
                  </div>
                </div>

                {/* Mail */}
                <div className={`flex items-start gap-4 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center text-brand-orange flex-shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('mediaEmail')}</h4>
                    <p className="text-xs text-gray-300 font-display mt-1">
                      media@bsq-cirebon.sch.id
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className={`flex items-start gap-4 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center text-brand-orange flex-shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('hotline')}</h4>
                    <p className="text-xs text-gray-300 font-display mt-1">
                      +62 231 4455-667
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              <div className={`border-t border-white/5 pt-6 mt-8 ${isRtl ? 'text-right' : 'text-left'}`}>
                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block mb-3">{t('socialChannels')}</span>
                <div className={`flex gap-3 ${isRtl ? 'justify-end' : ''}`}>
                  {['Instagram', 'YouTube', 'TikTok'].map((social) => (
                    <a
                      key={social}
                      href={`#${social.toLowerCase()}`}
                      className="px-3 py-1.5 bg-white/2 hover:bg-brand-orange/10 hover:text-brand-orange border border-white/5 hover:border-brand-orange/20 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors font-display"
                    >
                      {social}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Stylized Visual Map Card */}
            <div className="glass-panel p-4 rounded-3xl border border-white/5 h-48 relative overflow-hidden group">
              <div className="absolute inset-0 bg-neutral-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.15),rgba(255,255,255,0))]" />
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-1 opacity-20 pointer-events-none">
                {Array.from({ length: 72 }).map((_, i) => (
                  <div key={i} className="border-b border-r border-white/10" />
                ))}
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center z-10">
                <div className="w-12 h-12 bg-brand-orange rounded-full flex items-center justify-center text-brand-black shadow-lg shadow-brand-orange/40 group-hover:scale-110 transition-transform duration-500 mb-2 relative">
                  <Globe size={20} className="animate-spin-slow" />
                  <span className="absolute inset-0 bg-brand-orange rounded-full animate-ping opacity-25" />
                </div>
                <h4 className="text-[10px] font-display font-black uppercase text-white tracking-widest">Al Hikmah Arena Hall</h4>
                <span className="text-[8px] font-display text-gray-500 uppercase tracking-widest mt-1">Cirebon, West Java</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Glassmorphic Form Container */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-7"
          >
            <div className="glass-panel-heavy p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden h-full flex flex-col justify-center">
              
              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.form 
                    key="contact-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="name" className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest font-display block mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('fullName')} *</label>
                        <input
                          id="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder={t('fullNamePlaceholder')}
                          className={`w-full bg-black/40 border border-white/5 hover:border-white/10 focus:border-brand-orange rounded-xl p-3.5 text-white font-display text-xs focus:outline-none transition-colors ${isRtl ? 'text-right' : 'text-left'}`}
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest font-display block mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>Email *</label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="name@example.com"
                          className={`w-full bg-black/40 border border-white/5 hover:border-white/10 focus:border-brand-orange rounded-xl p-3.5 text-white font-display text-xs focus:outline-none transition-colors ${isRtl ? 'text-right' : 'text-left'}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest font-display block mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('subject')}</label>
                      <input
                        id="subject"
                        type="text"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder={t('subjectPlaceholder')}
                        className={`w-full bg-black/40 border border-white/5 hover:border-white/10 focus:border-brand-orange rounded-xl p-3.5 text-white font-display text-xs focus:outline-none transition-colors ${isRtl ? 'text-right' : 'text-left'}`}
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest font-display block mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('message')} *</label>
                      <textarea
                        id="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder={t('messagePlaceholder')}
                        className={`w-full bg-black/40 border border-white/5 hover:border-white/10 focus:border-brand-orange rounded-xl p-3.5 text-white font-display text-xs focus:outline-none transition-colors resize-none leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full p-4 bg-brand-orange hover:bg-brand-burnt text-brand-black rounded-xl font-display font-black tracking-[0.2em] uppercase transition-colors flex items-center justify-center gap-3 cursor-pointer shadow-lg disabled:opacity-50 ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
                          <span>{t('sending')}</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} className={isRtl ? 'rotate-180' : ''} />
                          <span>{t('sendMessage')}</span>
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="success-screen"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10"
                  >
                    <CheckCircle2 size={56} className="text-brand-orange mx-auto mb-4 animate-bounce" />
                    <h3 className="text-2xl font-title font-black uppercase text-white mb-2">
                      {t('messageReceived')}
                    </h3>
                    <p className="text-xs text-gray-400 font-display leading-relaxed mb-6 max-w-sm mx-auto">
                      {t('thankYou')}
                    </p>
                    <div className={`flex items-center justify-center gap-2 text-xs font-display text-brand-gold bg-brand-orange/10 border border-brand-orange/20 px-4 py-2 rounded-xl max-w-xs mx-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <Sparkles size={14} />
                      <span>+25 XP {t('xpEarned')}</span>
                    </div>
                    <button
                      onClick={() => {
                        setFormData({ name: '', email: '', subject: '', message: '' });
                        setIsSuccess(false);
                      }}
                      className="mt-8 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      {t('sendAnother')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default ContactPage;
