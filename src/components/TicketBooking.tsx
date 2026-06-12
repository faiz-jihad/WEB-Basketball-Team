import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Info, Ticket } from 'lucide-react';
import useAppStore from '../lib/store';
import confetti from 'canvas-confetti';
import { getTranslation } from '../lib/i18n';

const SECTORS = [
  { id: 'main', name: 'Main Tribune', price: 500000, color: 'text-brand-orange border-brand-orange/30 bg-brand-orange/5' }
];

const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const SEAT_COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Pre-booked random seats to simulate stadium occupation
const OCCUPIED_SEATS = [
  'main-A-3', 'main-A-4', 'main-A-7', 'main-B-2', 'main-B-8',
  'main-C-5', 'main-C-6', 'main-D-1', 'main-D-2', 'main-E-7',
  'main-E-8', 'main-F-4', 'main-F-9'
];

export const TicketBooking: React.FC = () => {
  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);
  const { selectedSeats, selectSeat, clearSelectedSeats, bookedTickets, bookSeats, language } = useAppStore();
  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';

  const getSectorName = (id: string) => {
    return t('tickets', 'tribuneName');
  };

  const renderTitle = () => {
    const titleText = t('tickets', 'title');
    const words = titleText.split(' ');
    if (words.length <= 1) return titleText;
    const lastWord = words.pop();
    return (
      <>
        {words.join(' ')}{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-gold">
          {lastWord}
        </span>
      </>
    );
  };

  const handleSeatClick = (seatId: string) => {
    if (OCCUPIED_SEATS.includes(seatId)) return;
    selectSeat(seatId);
  };

  const handleCheckout = () => {
    if (selectedSeats.length === 0) return;
    
    // Process booking in store
    bookSeats('m3', 'Solar Flares', '2026-06-14T19:30:00Z');

    // Trigger championship confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF5A00', '#FF7A00', '#D4AF37', '#ffffff']
    });
  };

  const totalCost = selectedSeats.length * selectedSector.price;

  return (
    <section id="tickets" className="py-24 px-6 bg-brand-black relative border-b border-white/5">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-brand-orange font-display text-sm font-semibold tracking-[0.25em] uppercase block mb-2">{t('tickets', 'admission')}</span>
          <h2 className="text-4xl md:text-5xl font-title font-extrabold uppercase text-white">
            {renderTitle()}
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-sm leading-relaxed">
            {t('tickets', 'desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Side: Seat Map Selector */}
          <div className="lg:col-span-8 flex flex-col items-center">
            
            {/* Main Tribune Info Card */}
            <div className="w-full mb-8 font-display">
              <div className="border border-brand-orange/20 bg-brand-orange/5 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <span className="text-[10px] text-brand-gold block uppercase font-black tracking-widest">{t('tickets', 'activeStand')}</span>
                  <h3 className="text-xl font-title font-black text-white uppercase mt-1">
                    {t('tickets', 'tribuneName')}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-md">
                    {language === 'id' 
                      ? 'Seluruh penonton berada di tribun barat utama yang menghadap langsung ke lapangan dengan sudut pandang premium.' 
                      : language === 'ar' 
                      ? 'يجلس جميع المتفرجين في المدرج الرئيسي الغربي المواجه للملعب مباشرة بزاوية رؤية ممتازة.' 
                      : 'All spectators are seated in the west main tribune facing the court directly with a premium sightline.'}
                  </p>
                </div>
                <div className={`flex flex-col sm:items-end flex-shrink-0 ${isRtl ? 'sm:items-start text-right' : 'text-left sm:text-right'}`}>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">{t('tickets', 'price')}</span>
                  <span className="text-2xl font-black text-brand-orange mt-1">Rp {selectedSector.price.toLocaleString('id-ID')}</span>
                  <span className="text-[9px] text-gray-500 font-bold mt-1 uppercase tracking-wider">{t('tickets', 'flatRate')}</span>
                </div>
              </div>
            </div>

            {/* Stadium Visualizer */}
            <div className="w-full bg-white/2 border border-white/5 rounded-3xl p-8 flex flex-col items-center relative overflow-hidden">
              
              {/* Hoop Court Line (Representing Court side orientation) */}
              <div className="w-3/4 h-6 bg-gradient-to-b from-brand-orange/20 to-transparent border-t-2 border-brand-orange/40 rounded-b-full flex items-center justify-center mb-16">
                <span className="text-[9px] text-brand-orange font-bold uppercase tracking-[0.4em] font-display">AL HIKMAH ARENA COURT FIELD</span>
              </div>

              {/* Seats Grid */}
              <div className="grid gap-4 w-full max-w-[480px]">
                {SEAT_ROWS.map((row) => (
                  <div key={row} className="flex items-center gap-3 justify-center">
                    <span className="w-6 font-title font-bold text-gray-600 text-xs text-center">{row}</span>
                    <div className="flex-1 flex gap-2 justify-center">
                      {SEAT_COLS.map((col) => {
                        const seatId = `${selectedSector.id}-${row}-${col}`;
                        const isOccupied = OCCUPIED_SEATS.includes(seatId);
                        const isSelected = selectedSeats.includes(seatId);
                        
                        return (
                          <button
                            key={col}
                            onClick={() => handleSeatClick(seatId)}
                            disabled={isOccupied}
                            className={`w-8 h-8 rounded-lg border transition-all flex items-center justify-center font-display text-[9px] font-bold cursor-pointer relative ${
                              isOccupied
                                ? 'bg-white/5 border-transparent text-gray-700 cursor-not-allowed'
                                : isSelected
                                ? 'bg-brand-orange border-brand-orange text-brand-black glow-orange animate-pulse'
                                : 'bg-black/40 border-white/10 hover:border-brand-orange/60 text-gray-400 hover:text-white'
                            }`}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>
                    <span className="w-6 font-title font-bold text-gray-600 text-xs text-center">{row}</span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-6 mt-12 text-[10px] font-display font-semibold border-t border-white/5 pt-6 w-full justify-center">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-black/40 border border-white/10" /> {t('tickets', 'available')}</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-orange border border-brand-orange glow-orange" /> {t('tickets', 'selected')}</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white/5" /> {t('tickets', 'occupied')}</span>
              </div>

            </div>

          </div>

          {/* Right Side: Receipt & Booked Tickets */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Purchase Checkout Summary */}
            <div className="glass-panel-heavy rounded-3xl p-6 border border-white/5 relative">
              <h3 className="font-title font-extrabold uppercase text-white mb-6 flex items-center gap-2 text-start">
                <Ticket size={18} className="text-brand-orange" /> {t('tickets', 'summary')}
              </h3>
 
              <div className="space-y-4 font-display">
                <div className="flex justify-between text-xs border-b border-white/5 pb-3">
                  <span className="text-gray-500">{t('tickets', 'opponent')}</span>
                  <span className="font-bold text-white uppercase">{t('matches', 'vs')} Solar Flares</span>
                </div>
                <div className="flex justify-between text-xs border-b border-white/5 pb-3">
                  <span className="text-gray-500">{t('tickets', 'arena')}</span>
                  <span className="font-bold text-white">Al Hikmah Arena</span>
                </div>
                <div className="flex justify-between text-xs border-b border-white/5 pb-3">
                  <span className="text-gray-500">{t('tickets', 'sector')}</span>
                  <span className="font-bold text-white">{getSectorName(selectedSector.id)}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-white/5 pb-3">
                  <span className="text-gray-500">{t('tickets', 'qty')}</span>
                  <span className="font-bold text-white">{selectedSeats.length} {t('tickets', 'tickets')}</span>
                </div>
                {selectedSeats.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 py-2">
                    {selectedSeats.map(s => {
                      const parts = s.split('-');
                      return (
                        <span key={s} className="px-2 py-0.5 bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-[9px] font-black rounded uppercase">
                          {t('tickets', 'row')} {parts[1]} - {t('tickets', 'seat')} {parts[2]}
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="flex justify-between items-center text-sm pt-4 font-title">
                  <span className="text-gray-400">{t('tickets', 'total')}</span>
                  <span className="text-2xl font-black text-brand-orange">Rp {totalCost.toLocaleString('id-ID')}</span>
                </div>
              </div>
 
              <button
                onClick={handleCheckout}
                disabled={selectedSeats.length === 0}
                className="w-full mt-6 py-4 bg-brand-orange hover:bg-brand-burnt disabled:bg-white/5 disabled:text-gray-600 disabled:border-transparent text-brand-black font-display font-black text-xs tracking-[0.2em] rounded-xl uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-orange/10"
              >
                <CreditCard size={14} /> {t('tickets', 'checkout')}
              </button>
 
              <div className="mt-4 flex items-center gap-2 text-[9px] text-gray-500 leading-normal text-start">
                <Info size={12} className="flex-shrink-0" />
                <span>{t('tickets', 'info')}</span>
              </div>
            </div>

            {/* Booked Tickets Display (QR Cards) */}
            {bookedTickets.length > 0 && (
              <div className="space-y-4">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-display font-bold block text-start">{t('tickets', 'tixTitle')}</span>
                {bookedTickets.map((tix, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`bg-white/2 border border-brand-orange/30 rounded-2xl p-5 flex items-center justify-between relative overflow-hidden ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                  >
                    {/* Left details */}
                    <div className="text-start">
                      <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                        <span className="text-[10px] font-black text-brand-orange tracking-widest uppercase">{t('tickets', 'tixSub')}</span>
                      </div>
                      <h4 className="text-sm font-title font-extrabold uppercase mt-2 text-white">{t('matches', 'vs')} {tix.opponent}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 font-display">
                        {t('tickets', 'sector')}: {getSectorName(tix.seatNumber.split('-')[0])} • {t('tickets', 'row')} {tix.seatNumber.split('-')[1]} {t('tickets', 'seat')} {tix.seatNumber.split('-')[2]}
                      </p>
                      <span className="text-[8px] font-display text-gray-600 block mt-3 font-semibold">{tix.qrCode}</span>
                    </div>

                    {/* Right QR mock */}
                    <div className="w-16 h-16 bg-white rounded-lg p-1.5 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-brand-black" fill="currentColor">
                        {/* Mock QR grid */}
                        <rect x="0" y="0" width="25" height="25" />
                        <rect x="75" y="0" width="25" height="25" />
                        <rect x="0" y="75" width="25" height="25" />
                        <rect x="35" y="35" width="30" height="30" />
                        <rect x="50" y="10" width="10" height="15" />
                        <rect x="15" y="50" width="15" height="10" />
                        <rect x="75" y="75" width="25" height="25" />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};

export default TicketBooking;
