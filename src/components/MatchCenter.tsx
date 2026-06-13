import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Trophy, Tv, Users, Flame } from 'lucide-react';
import { db } from '../lib/supabase';
import type { Match, Standing } from '../lib/supabase';
import useAppStore from '../lib/store';
import { getTranslation } from '../lib/i18n';

export const MatchCenter: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');
  
  const addToast = useAppStore(state => state.addToast);
  const language = useAppStore(state => state.language);
  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';

  const [tournamentName, setTournamentName] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bsq_active_tournament');
      if (saved) return saved;
    }
    return language === 'ar' ? 'ترتيب البطولة' : language === 'id' ? 'Klasemen Turnamen' : 'Tournament Standings';
  });

  useEffect(() => {
    const handleUpdate = () => {
      setTournamentName(localStorage.getItem('bsq_active_tournament') || 'Tournament Standings');
    };
    window.addEventListener('bsq_active_tournament_updated', handleUpdate);
    return () => {
      window.removeEventListener('bsq_active_tournament_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('bsq_active_tournament')) {
      setTournamentName(language === 'ar' ? 'ترتيب البطولة' : language === 'id' ? 'Klasemen Turnamen' : 'Tournament Standings');
    }
  }, [language]);

  useEffect(() => {
    const fetchMatches = () => {
      (db as any).from('matches').select('*').order('date', { ascending: true }).then(({ data }: any) => {
        if (data) setMatches(data as Match[]);
      });
    };

    const fetchStandings = () => {
      (db as any).from('standings').select('*').order('points', { ascending: false }).then(({ data }: any) => {
        if (data) setStandings(data as Standing[]);
      });
    };

    fetchMatches();
    fetchStandings();

    window.addEventListener('bsq_matches_updated', fetchMatches);
    window.addEventListener('bsq_standings_updated', fetchStandings);

    // Subscribe to simulated Live match score updates!
    const channelName = `matches_update_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const channel = (db as any).channel(channelName)
      .on('postgres_changes' as any, { event: 'UPDATE', table: 'matches', schema: 'public' }, (payload: any) => {
        setMatches((prevMatches) => {
          const updated = prevMatches.map(m => m.id === payload.new.id ? payload.new : m);
          
          // Trigger a Toast Alert on score changes
          const oldMatch = prevMatches.find(m => m.id === payload.new.id);
          if (oldMatch && (oldMatch.score_home !== payload.new.score_home || oldMatch.score_away !== payload.new.score_away)) {
            addToast(
              'info',
              'Score Alert! 🏀',
              `BSQ ALL-FIVE ${payload.new.score_home} - ${payload.new.score_away} ${payload.new.opponent}`
            );
          }
          return updated;
        });
      })
      .subscribe();

    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
      window.removeEventListener('bsq_matches_updated', fetchMatches);
      window.removeEventListener('bsq_standings_updated', fetchStandings);
    };
  }, [addToast]);

  const filteredMatches = matches.filter(m => {
    if (filter === 'live') return m.status === 'LIVE';
    if (filter === 'upcoming') return m.status === 'UPCOMING';
    if (filter === 'past') return m.status === 'FINISHED';
    return true;
  });

  return (
    <section id="match-center" className="py-24 px-6 bg-bg-darker relative border-b border-white/5">
      <div className={`max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 ${isRtl ? 'lg:flex-row-reverse text-right' : 'text-left'}`}>
        
        {/* Left Side: Schedule and Live Score Console */}
        <div className={`lg:col-span-8 flex flex-col ${isRtl ? 'lg:order-2' : 'lg:order-1'}`}>
          
          {/* Header & Filters */}
          <div className={`flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
            <div>
              <span className="text-brand-orange font-display text-sm font-semibold tracking-[0.25em] uppercase block mb-1">
                {t('matches', 'title')}
              </span>
              <h2 className="text-3xl md:text-4xl font-title font-extrabold uppercase text-white tracking-tight">
                Game Schedule & <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-gold">Scores</span>
              </h2>
            </div>
            
            {/* Filter buttons */}
            <div className={`flex bg-white/2 border border-white/10 p-1 rounded-xl text-xs font-display font-semibold self-start md:self-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
              {(['all', 'live', 'upcoming', 'past'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-lg uppercase transition-all cursor-pointer ${
                    filter === type
                      ? 'bg-brand-orange text-brand-black font-black glow-orange'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t('matches', type)}
                </button>
              ))}
            </div>
          </div>

          {/* Matches List */}
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredMatches.map((match) => (
                <motion.div
                  key={match.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`glass-panel rounded-3xl p-6 border transition-all relative overflow-hidden ${
                    match.status === 'LIVE'
                      ? 'border-brand-orange bg-brand-orange/5 glow-orange'
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  
                  {/* Status header */}
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      {match.status === 'LIVE' ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                          <span className="text-[10px] font-black tracking-widest text-red-500 uppercase">Q{match.quarter} • {match.time_remaining} LIVE</span>
                        </>
                      ) : match.status === 'FINISHED' ? (
                        <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">FINAL</span>
                      ) : (
                        <span className="text-[10px] font-bold tracking-widest text-brand-gold uppercase flex items-center gap-1.5">
                          <Calendar size={12} /> UPCOMING GAME
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 font-display font-semibold flex items-center gap-1">
                      <MapPin size={10} /> {match.venue}
                    </div>
                  </div>

                  {/* Teams Scoreboard layout */}
                  <div className="flex items-center justify-between gap-6 py-2">
                    
                    {/* Home Team (VBC Vortex) */}
                    <div className="flex-1 flex items-center justify-end gap-4">
                      <span className="font-title font-extrabold uppercase text-sm sm:text-base text-right hidden sm:inline text-white">BSQ ALL-FIVE</span>
                      <span className="font-title font-extrabold uppercase text-sm sm:text-base text-right sm:hidden text-white">BSQ</span>
                      <div className="w-12 h-12 rounded-xl bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center text-brand-orange text-lg font-black font-title">
                        B
                      </div>
                    </div>

                    {/* Scores Centerpiece */}
                    <div className="flex items-center gap-4 px-6 py-2 bg-white/2 border border-white/5 rounded-2xl">
                      {match.status === 'UPCOMING' ? (
                        <span className="text-sm font-display text-gray-400 font-bold whitespace-nowrap">
                          {(() => {
                            const d = new Date(match.date);
                            return isNaN(d.getTime()) 
                              ? 'TBD' 
                              : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                          })()}
                        </span>
                      ) : (
                        <div className="flex items-center gap-3 font-title font-black text-2xl sm:text-3xl text-white">
                          <motion.span
                            key={match.score_home}
                            initial={{ scale: 1.2, color: '#FF5A00' }}
                            animate={{ scale: 1, color: '#ffffff' }}
                            className="w-12 text-right"
                          >
                            {match.score_home}
                          </motion.span>
                          <span className="text-gray-600 text-base font-display font-normal">:</span>
                          <motion.span
                            key={match.score_away}
                            initial={{ scale: 1.2, color: '#FF5A00' }}
                            animate={{ scale: 1, color: '#ffffff' }}
                            className="w-12 text-left"
                          >
                            {match.score_away}
                          </motion.span>
                        </div>
                      )}
                    </div>

                    {/* Away Team (Opponent) */}
                    <div className="flex-1 flex items-center justify-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                        <img src={match.opponent_logo} alt={match.opponent} className="w-full h-full object-cover filter brightness-75" />
                      </div>
                      <span className="font-title font-extrabold uppercase text-sm sm:text-base text-left hidden sm:inline text-white">{match.opponent || 'Unknown'}</span>
                      <span className="font-title font-extrabold uppercase text-sm sm:text-base text-left sm:hidden text-white">{(match.opponent || 'UNK').slice(0,3).toUpperCase()}</span>
                    </div>

                  </div>

                  {/* Broadcast Channel / Links */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[10px] text-gray-500 font-display flex items-center gap-1.5">
                      <Tv size={12} /> Broadcasted live on VBC-Live TV & Prime Sports
                    </span>
                    {match.status === 'UPCOMING' && (
                      <button
                        onClick={() => {
                          const target = document.getElementById('tickets');
                          target?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-3.5 py-1.5 bg-brand-orange hover:bg-brand-burnt text-brand-black font-display font-black text-[10px] tracking-widest rounded-lg uppercase transition-all cursor-pointer"
                      >
                        Buy Seats
                      </button>
                    )}
                    {match.status === 'LIVE' && (
                      <button
                        onClick={() => {
                          const target = document.getElementById('fan-community');
                          target?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-3.5 py-1.5 bg-white/5 border border-white/10 hover:border-brand-orange/30 text-white font-display font-black text-[10px] tracking-widest rounded-lg uppercase transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Users size={12} /> Fan Chat
                      </button>
                    )}
                  </div>

                </motion.div>
              ))}
              {filteredMatches.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 px-6 glass-panel border-white/5 rounded-3xl text-gray-500 text-center"
                >
                  <Calendar size={48} className="mb-4 opacity-50 text-brand-orange" />
                  <h3 className="text-xl font-title font-black uppercase text-white mb-2">
                    {language === 'id' ? 'Jadwal Kosong' : 'No Matches Scheduled'}
                  </h3>
                  <p className="text-xs font-display">
                    {language === 'id' 
                      ? 'Belum ada pertandingan yang dijadwalkan untuk kategori ini.' 
                      : 'There are currently no matchups scheduled for this category.'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Standings and Leaderboards */}
        <div className={`lg:col-span-4 flex flex-col ${isRtl ? 'lg:order-1' : 'lg:order-2'}`}>
          <div className={`mb-8 ${isRtl ? 'text-right' : 'text-left'}`}>
            <span className="text-brand-gold font-display text-sm font-semibold tracking-[0.25em] uppercase block mb-1">Rankings</span>
            <h2 className={`text-3xl font-title font-extrabold uppercase text-white flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Trophy size={22} className="text-brand-gold" /> {tournamentName}
            </h2>
          </div>

          {/* Standings Table Card */}
          <div className="glass-panel-heavy rounded-3xl p-6 border border-white/5 glow-gold">
            <div className="overflow-x-auto">
              <table className={`w-full text-xs ${isRtl ? 'text-right font-arabic' : 'text-left'}`}>
                <thead>
                  <tr className="text-gray-500 uppercase tracking-wider font-display font-bold border-b border-white/10">
                    <th className="pb-3 text-center w-8">#</th>
                    <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('matches', 'team')}</th>
                    <th className="pb-3 text-center">{t('matches', 'wins')}</th>
                    <th className="pb-3 text-center">{t('matches', 'losses')}</th>
                    <th className="pb-3 text-center">{t('matches', 'points')}</th>
                    <th className="pb-3 text-center">{t('matches', 'streak')}</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team, index) => {
                    const isVortex = team.team_name === 'BSQ ALL-FIVE';
                    return (
                      <tr
                        key={team.id}
                        className={`border-b border-white/3 font-display transition-colors ${
                          isVortex ? 'bg-brand-orange/10 text-white font-bold' : 'text-gray-300 hover:bg-white/1'
                        }`}
                      >
                        <td className="py-3.5 text-center font-title font-bold text-sm">
                          {index + 1}
                        </td>
                        <td className="py-3.5 flex items-center gap-2 font-semibold">
                          {isVortex && <Flame size={14} className="text-brand-orange fill-brand-orange/20 flex-shrink-0" />}
                          {team.team_name || 'Unknown Team'}
                        </td>
                        <td className="py-3.5 text-center font-bold">{team.wins ?? 0}</td>
                        <td className="py-3.5 text-center font-bold text-gray-500">{team.losses ?? 0}</td>
                        <td className="py-3.5 text-center font-black text-white">{team.points ?? 0}</td>
                        <td className={`py-3.5 text-center font-bold text-[10px] ${
                          (team.streak && typeof team.streak === 'string' && team.streak.startsWith('W')) ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {team.streak || '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {standings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500 font-display text-xs">
                        {language === 'id' ? 'Klasemen masih kosong.' : 'Standings are currently empty.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default MatchCenter;
