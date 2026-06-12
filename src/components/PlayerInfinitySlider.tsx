import React, { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import type { Player } from '../lib/supabase';
import useAppStore from '../lib/store';
import { getTranslation } from '../lib/i18n';
import { useNavigate } from 'react-router-dom';

export const PlayerInfinitySlider: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const { language } = useAppStore();
  const navigate = useNavigate();
  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';

  useEffect(() => {
    db.from('players').select('*').then(({ data }: any) => {
      if (data) setPlayers(data as Player[]);
    });
  }, []);

  if (players.length === 0) return null;

  // Quadruple the player list to ensure there is enough track length for seamless looping
  const scrollList = [...players, ...players, ...players, ...players];

  return (
    <section className="py-16 bg-bg-darker border-b border-white/5 relative overflow-hidden select-none">
      
      {/* Inline styles for seamless infinite marquee loop with RTL check */}
      <style>{`
        @keyframes marquee-ltr {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-rtl {
          0% { transform: translateX(0); }
          100% { transform: translateX(50%); }
        }
        .animate-marquee-track {
          display: flex;
          width: max-content;
          animation: ${isRtl ? 'marquee-rtl' : 'marquee-ltr'} 25s linear infinite;
        }
        .animate-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 mb-8 text-center md:text-start flex justify-between items-end">
        <div>
          <span className="text-brand-orange font-display text-xs font-semibold tracking-[0.25em] uppercase block mb-1">
            {language === 'ar' ? 'تشكيلة النجوم' : language === 'id' ? 'BARISAN BINTANG' : 'STAR LINEUP'}
          </span>
          <h2 className="text-2xl md:text-3xl font-title font-extrabold uppercase text-white tracking-tight">
            {language === 'ar' 
              ? 'اللاعبون الأساسيون' 
              : language === 'id' 
              ? 'PARA PEMAIN UTAMA' 
              : 'THE ACTIVE ROSTER'}
          </h2>
        </div>
        <button
          onClick={() => navigate('/roster')}
          className="text-xs font-display font-black text-brand-gold hover:text-brand-orange transition-colors uppercase tracking-widest hidden sm:block cursor-pointer"
        >
          {t('roster', 'compareMode')} &rarr;
        </button>
      </div>

      {/* Marquee Outer Container */}
      <div className="w-full relative py-4 flex items-center" dir="ltr">
        {/* Soft shadow gradients on edges to blend marquee */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-bg-darker to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-bg-darker to-transparent z-20 pointer-events-none" />

        {/* Scrolling Track */}
        <div className="animate-marquee-track">
          {scrollList.map((player, idx) => (
            <div
              key={`${player.id}-${idx}`}
              onClick={() => navigate('/roster')}
              className="w-52 h-72 relative rounded-2xl overflow-hidden flex-shrink-0 mx-3 border border-white/5 shadow-xl shadow-black/50 group cursor-pointer transition-all duration-500 hover:border-brand-orange/45 hover:scale-105 hover:shadow-brand-orange/5 bg-bg-card"
            >
              {/* Photo */}
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent z-10" />
                <img
                  src={player.photo}
                  alt={player.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
              </div>

              {/* Jersey Number */}
              <div className="absolute top-3 left-3 z-20 w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-xs font-title font-black text-brand-orange shadow">
                #{player.number}
              </div>

              {/* Position badge */}
              <div className="absolute top-3 right-3 z-20 w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-[10px] font-display font-black text-brand-gold shadow">
                {player.position}
              </div>

              {/* Details */}
              <div className="absolute bottom-4 inset-x-4 z-20 flex flex-col items-start text-left">
                <span className="text-brand-gold font-display text-[9px] font-bold tracking-widest uppercase mb-0.5">
                  {player.position === 'PG' ? 'Point Guard' : 
                   player.position === 'SG' ? 'Shooting Guard' : 
                   player.position === 'SF' ? 'Small Forward' : 
                   player.position === 'PF' ? 'Power Forward' : 'Center'}
                </span>
                <h3 className="text-md font-title font-black uppercase text-white tracking-tight leading-none truncate w-full">
                  {player.name.split(' "')[0]}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};

export default PlayerInfinitySlider;
