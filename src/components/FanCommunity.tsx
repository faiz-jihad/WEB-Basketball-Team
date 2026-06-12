import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MessageSquare, Send, Trophy, UserPlus } from 'lucide-react';
import { db } from '../lib/supabase';
import type { Comment } from '../lib/supabase';
import useAppStore from '../lib/store';
import { getTranslation } from '../lib/i18n';

export const FanCommunity: React.FC = () => {
  const { fan, loginFan, addXP, addToast, unlockBadge, language } = useAppStore();
  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';
  
  const [usernameInput, setUsernameInput] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  
  // Prediction state
  const [homeScorePred, setHomeScorePred] = useState('110');
  const [awayScorePred, setAwayScorePred] = useState('105');
  const [hasPredicted, setHasPredicted] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch comments for live match m2
  useEffect(() => {
    (db as any).from('comments').select('*').eq('match_id', 'm2').order('created_at', { ascending: true }).then(({ data }: any) => {
      if (data) setComments(data as Comment[]);
    });

    // Subscribe to realtime comment insertions
    const channel = (db as any).channel('comments:INSERT')
      .on('postgres_changes' as any, { event: 'INSERT', table: 'comments' }, (payload: any) => {
        setComments(prev => [...prev, payload.new as Comment]);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      loginFan(usernameInput.trim());
      setShowLogin(false);
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    (db as any).from('comments').insert({
      match_id: 'm2',
      user_id: `u_${fan.username}`,
      username: fan.username,
      avatar: fan.avatar,
      content: commentText.trim()
    }).then(({ error }: any) => {
      if (!error) {
        setCommentText('');
        // Grant XP for discussion engagement
        addXP(15);
        
        // Unlock badge if they reach a certain number of comments or just randomly
        if (Math.random() > 0.6) {
          unlockBadge(
            'chatter',
            'Super Chatty',
            '💬',
            'Engaged in match center comments'
          );
        }
      }
    });
  };

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    setHasPredicted(true);
    addXP(40); // Reward predicting upcoming matchups
    addToast('success', 'Prediction Saved! 🔮', 'You gained 40 XP. Check back post-match!');
    unlockBadge('predictor', 'Prophet Pro', '🔮', 'Predicted upcoming game score');
  };

  // Calculate XP percentage for level progress
  const nextLevelThreshold = fan.level * 100;
  const xpPercentage = Math.min((fan.xp / nextLevelThreshold) * 100, 100);

  return (
    <section id="fan-community" className="py-24 px-6 bg-brand-black relative border-b border-white/5">
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Col: Gamification Profile & Prediction */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Fan Dashboard Profile */}
          <div className="glass-panel-heavy rounded-3xl p-8 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6">
              <div className="text-start">
                <span className="text-brand-orange font-display text-sm font-semibold tracking-[0.25em] uppercase block mb-1">{t('fan', 'clubhouse')}</span>
                <h3 className="text-2xl font-title font-black uppercase text-white">{t('fan', 'clubhouseTitle')}</h3>
              </div>
              <button
                onClick={() => setShowLogin(!showLogin)}
                className="p-2 bg-white/5 hover:bg-brand-orange/20 text-gray-400 hover:text-brand-orange rounded-xl border border-white/10 transition-all text-xs font-display flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus size={14} /> {t('fan', 'changeId')}
              </button>
            </div>

            {/* Change Profile Drawer */}
            {showLogin && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-white/2 border border-white/5 rounded-2xl p-4 mb-6 overflow-hidden"
                onSubmit={handleRegister}
              >
                <label className="text-[10px] text-gray-400 font-display font-bold uppercase tracking-wider block mb-2 text-start">{t('fan', 'createName')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder={t('fan', 'usernamePlaceholder')}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange font-display"
                  />
                  <button type="submit" className="bg-brand-orange hover:bg-brand-burnt text-brand-black px-4 rounded-xl text-xs font-black uppercase font-display cursor-pointer">
                    {t('fan', 'apply')}
                  </button>
                </div>
              </motion.form>
            )}

            {/* User Details */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-brand-orange/15 border border-brand-orange/30 overflow-hidden flex items-center justify-center p-1.5 shadow-lg shadow-brand-orange/5">
                <img src={fan.avatar} alt={fan.username} className="w-full h-full" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-title font-black text-white leading-none">
                  {fan.username}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-brand-orange/20 text-brand-orange text-[9px] font-black rounded uppercase">
                    {t('fan', 'level')} {fan.level}
                  </span>
                  <span className="text-gray-500 text-[10px] font-display">
                    {fan.xp} / {nextLevelThreshold} {t('fan', 'xp')}
                  </span>
                </div>
              </div>
            </div>

            {/* Level XP Bar */}
            <div className="mb-6">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-brand-orange to-brand-burnt transition-all duration-500"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
            </div>

            {/* Badges Grid */}
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-display font-bold block mb-3 text-start">{t('fan', 'earnedBadges')}</span>
              <div className="grid grid-cols-4 gap-3">
                {fan.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center relative group"
                  >
                    <span className="text-xl mb-1">{badge.icon}</span>
                    <span className="text-[9px] font-bold text-gray-300 font-display truncate w-full">{badge.name}</span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-brand-black border border-white/10 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity text-[9px] text-gray-400 z-10">
                      <strong>{badge.name}</strong>
                      <p className="mt-1">{badge.description}</p>
                    </div>
                  </div>
                ))}
                {fan.badges.length < 4 && Array.from({ length: 4 - fan.badges.length }).map((_, i) => (
                  <div key={i} className="border border-dashed border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-gray-600">
                    <span className="text-lg">🔒</span>
                    <span className="text-[9px] font-display mt-1">{t('fan', 'locked')}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Match Predictor Card */}
          <div className="glass-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-brand-orange" />
              <h4 className="font-title font-extrabold uppercase text-white text-start">{t('fan', 'scorePredictor')}</h4>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed mb-6 text-start">
              {t('fan', 'upcomingGameDesc')}
            </p>

            <AnimatePresence mode="wait">
              {!hasPredicted ? (
                <motion.form
                  key="predForm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handlePredict}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-[9px] text-gray-400 font-display uppercase block mb-1.5 text-center">{t('fan', 'vortexHoops')}</label>
                      <input
                        type="number"
                        min="50"
                        max="150"
                        value={homeScorePred}
                        onChange={(e) => setHomeScorePred(e.target.value)}
                        className="w-full text-center bg-black/40 border border-white/10 rounded-xl py-3 text-xl font-title font-black text-brand-orange focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <span className="text-gray-600 font-bold mt-4 font-display">vs</span>
                    <div className="flex-1">
                      <label className="text-[9px] text-gray-400 font-display uppercase block mb-1.5 text-center">{t('fan', 'solarFlares')}</label>
                      <input
                        type="number"
                        min="50"
                        max="150"
                        value={awayScorePred}
                        onChange={(e) => setAwayScorePred(e.target.value)}
                        className="w-full text-center bg-black/40 border border-white/10 rounded-xl py-3 text-xl font-title font-black text-white focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-display font-black text-xs tracking-[0.2em] rounded-xl uppercase transition-colors cursor-pointer"
                  >
                    {t('fan', 'predictBtn')} (+40 XP)
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="predLocked"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-brand-orange/10 border border-brand-orange/20 rounded-2xl p-6 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-orange/25 border border-brand-orange/30 flex items-center justify-center text-brand-orange mx-auto mb-3">
                    <Check size={18} />
                  </div>
                  <h5 className="font-bold text-white uppercase text-sm">{t('fan', 'predictionLocked')}</h5>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {t('fan', 'vortexHoops')} {homeScorePred} - {awayScorePred} {t('fan', 'solarFlares')}.
                  </p>
                  <p className="text-[9px] text-brand-gold mt-3 font-display uppercase tracking-widest">
                    {t('fan', 'xpRewardCredited')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Right Col: Live Match Chat / comments */}
        <div className="lg:col-span-7 flex flex-col h-[550px] md:h-[620px] glass-panel-heavy rounded-3xl border border-white/5 overflow-hidden">
          
          {/* Chat Header */}
          <div className={`p-6 border-b border-white/10 bg-white/3 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <div>
                <h4 className="font-title font-black uppercase text-white text-sm">{t('fan', 'chatTitle')}</h4>
                <p className="text-[10px] text-gray-500 font-display uppercase">{t('fan', 'vortexVsApex')}</p>
              </div>
            </div>
            <span className="text-[10px] text-gray-500 font-display flex items-center gap-1">
              <MessageSquare size={12} /> {comments.length} {t('fan', 'messages')}
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence initial={false}>
              {comments.map((comment) => {
                const isMe = comment.username === fan.username;
                const bubbleCorner = isMe
                  ? (isRtl ? 'rounded-tl-none' : 'rounded-tr-none')
                  : (isRtl ? 'rounded-tr-none' : 'rounded-tl-none');
                
                return (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-brand-orange/15 border border-brand-orange/30 p-1 flex-shrink-0">
                      <img src={comment.avatar} alt={comment.username} className="w-full h-full" />
                    </div>

                    {/* Bubble Content */}
                    <div className={`max-w-[70%] ${isMe ? (isRtl ? 'text-left' : 'text-right') : (isRtl ? 'text-right' : 'text-left')}`}>
                      <span className="text-[9px] font-bold text-gray-500 uppercase font-display block mb-1">
                        {comment.username}
                      </span>
                      <div className={`rounded-2xl px-4 py-2.5 text-xs text-white ${bubbleCorner} ${
                        isMe
                          ? 'bg-brand-orange/20 border border-brand-orange/30'
                          : 'bg-white/3 border border-white/10'
                      }`}>
                        {comment.content}
                      </div>
                      <span className="text-[8px] text-gray-600 mt-1 block">
                        {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Message Input form */}
          <form onSubmit={handleSendComment} className={`p-4 bg-white/2 border-t border-white/5 flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <input
              type="text"
              required
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={`${t('fan', 'chatPlaceholder')} ${fan.username}...`}
              className="flex-1 bg-black/50 border border-white/10 focus:border-brand-orange focus:outline-none px-4 py-3 rounded-xl text-xs text-white placeholder-gray-600 font-display"
            />
            <button
              type="submit"
              className="p-3 bg-brand-orange hover:bg-brand-burnt text-brand-black rounded-xl transition-all cursor-pointer flex items-center justify-center"
            >
              <Send size={16} className={isRtl ? 'transform rotate-180' : ''} />
            </button>
          </form>

        </div>

      </div>

    </section>
  );
};

export default FanCommunity;
