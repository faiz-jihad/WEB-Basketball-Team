import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Info, Ticket } from 'lucide-react';
import useAppStore from '../lib/store';
import confetti from 'canvas-confetti';
import { getTranslation } from '../lib/i18n';
import { db } from '../lib/supabase';
import type { Match } from '../lib/supabase';

const SECTORS = [
  { id: 'vip', name: 'VIP Court Side', priceMultiplier: 3.0, color: 'text-brand-gold border-brand-gold/30 bg-brand-gold/5' },
  { id: 'west', name: 'West Main Tribune', priceMultiplier: 1.0, color: 'text-brand-orange border-brand-orange/30 bg-brand-orange/5' },
  { id: 'east', name: 'East General Tribune', priceMultiplier: 0.6, color: 'text-white border-white/20 bg-white/5' }
];

const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const SEAT_COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];


export const TicketBooking: React.FC = () => {
  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);
  const { selectedSeats, selectSeat, clearSelectedSeats, bookedTickets, bookSeats, language } = useAppStore();
  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';

  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const [ticketPrice, setTicketPrice] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bsq_ticket_price');
      return saved !== null ? Number(saved) : 500000;
    }
    return 500000;
  });

  const [ticketStatus, setTicketStatus] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bsq_ticket_status');
      return saved || 'open';
    }
    return 'open';
  });

  useEffect(() => {
    db.from('matches').select('*').then(({ data }: any) => {
      if (data) {
        const filtered = (data as Match[]).filter(m => m.status === 'UPCOMING' || m.status === 'FINISHED');
        setUpcomingMatches(filtered);
        if (filtered.length > 0) {
          const firstUpcoming = filtered.find(m => m.status === 'UPCOMING');
          setSelectedMatch(firstUpcoming || filtered[0]);
        }
      }
    });
  }, []);

  useEffect(() => {
    const handleSelectMatch = (e: Event) => {
      const customEvent = e as CustomEvent;
      const matchId = customEvent.detail?.matchId;
      if (matchId && upcomingMatches.length > 0) {
        const match = upcomingMatches.find(m => m.id === matchId);
        if (match) {
          setSelectedMatch(match);
          clearSelectedSeats();
        }
      }
    };
    window.addEventListener('bsq_select_match_for_booking', handleSelectMatch);
    return () => window.removeEventListener('bsq_select_match_for_booking', handleSelectMatch);
  }, [upcomingMatches, clearSelectedSeats]);

  useEffect(() => {
    const handleUpdate = () => {
      const savedPrice = localStorage.getItem('bsq_ticket_price');
      const savedStatus = localStorage.getItem('bsq_ticket_status');
      if (savedPrice !== null) setTicketPrice(Number(savedPrice));
      if (savedStatus !== null) setTicketStatus(savedStatus);
    };

    window.addEventListener('bsq_ticket_settings_updated', handleUpdate);
    return () => window.removeEventListener('bsq_ticket_settings_updated', handleUpdate);
  }, []);

  const getSectorName = (id: string) => {
    const sec = SECTORS.find(s => s.id === id);
    return sec ? sec.name : t('tickets', 'tribuneName');
  };

  const getSectorPrice = (sector: typeof SECTORS[0]) => {
    return Math.round(ticketPrice * sector.priceMultiplier);
  };

  const getSectorDescription = (id: string) => {
    if (id === 'vip') {
      return language === 'id'
        ? 'Dapatkan pengalaman lapangan utama terbaik. Kursi baris depan dengan pelayanan makanan premium dan akses VIP langsung.'
        : language === 'ar'
        ? 'احصل على أفضل تجربة في الملعب الرئيسي. مقاعد الصف الأمامي مع خدمة تقديم الطعام الفاخرة والدخول المباشر لكبار الشخصيات.'
        : 'Get the absolute best court side view. Front row cushioned seats with premium hospitality service and direct VIP lounge entry.';
    }
    if (id === 'west') {
      return language === 'id'
        ? 'Seluruh penonton berada di tribun barat utama yang menghadap langsung ke lapangan dengan sudut pandang premium.'
        : language === 'ar'
        ? 'يجلس جميع المتفرجين في المدرج الرئيسي الغربي المواجه للملعب مباشرة بزاوية رؤية ممتازة.'
        : 'All spectators are seated in the west main tribune facing the court directly with a premium sightline.';
    }
    return language === 'id'
      ? 'Nikmati sudut pandang tribun timur dengan atmosfer pendukung yang sangat meriah dan penuh energi.'
      : language === 'ar'
      ? 'استمتع بزاوية المدرج الشرقي مع أجواء تشجيعية حماسية ومليئة بالطاقة.'
      : 'Enjoy the east side tribune view with a highly energetic, supporter-oriented environment.';
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

  const isSeatOccupied = (seatId: string) => {
    if (!selectedMatch) return true;
    if (selectedMatch.status === 'FINISHED') return false;
    const userBooked = bookedTickets.some(tix => tix.matchId === selectedMatch.id && tix.seatNumber === seatId);
    return userBooked;
  };

  const handleSeatClick = (seatId: string) => {
    if (isSeatOccupied(seatId)) return;
    selectSeat(seatId);
  };

  const handleCheckout = () => {
    if (selectedSeats.length === 0 || !selectedMatch) return;
    
    // Process booking in store
    bookSeats(selectedMatch.id, selectedMatch.opponent, selectedMatch.date);

    // Trigger championship confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF5A00', '#FF7A00', '#D4AF37', '#ffffff']
    });

    const cost = selectedSeats.length * getSectorPrice(selectedSector);
    const phoneNumber = "6281234567890";
    const matchDateStr = new Date(selectedMatch.date).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const seatDetails = selectedSeats.map(s => {
      const parts = s.split('-');
      return `${getSectorName(parts[0])} (Baris ${parts[1]} - Kursi ${parts[2]})`;
    }).join(', ');
    const text = encodeURIComponent(`Halo, saya ingin membeli tiket pertandingan dengan detail berikut:\n\nLawan: ${selectedMatch.opponent}\nTanggal: ${matchDateStr}\nTempat Duduk: ${seatDetails}\nTotal Harga: Rp ${cost.toLocaleString('id-ID')}\n\nMohon informasi pembayarannya.`);
    
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, '_blank');
  };

  const totalCost = selectedSeats.length * getSectorPrice(selectedSector);

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

        {ticketStatus === 'closed' ? (
          <div className="glass-panel-heavy rounded-3xl p-12 border border-brand-orange/20 max-w-2xl mx-auto flex flex-col items-center justify-center text-center glow-orange relative overflow-hidden py-16">
            <div className="absolute inset-0 bg-radial-gradient from-brand-orange/5 via-transparent to-transparent pointer-events-none" />
            <div className="w-20 h-20 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-6 text-brand-orange animate-pulse">
              <Info size={36} />
            </div>
            <h3 className="text-2xl md:text-3xl font-title font-extrabold uppercase text-white tracking-wide mb-4">
              {language === 'id' 
                ? 'Pertandingan Tertutup' 
                : language === 'ar' 
                ? 'مباراة مغلقة' 
                : 'Closed / Private Match'}
            </h3>
            <p className="text-gray-300 font-display text-sm md:text-base leading-relaxed max-w-md">
              {language === 'id' 
                ? 'Laga ini diselenggarakan secara tertutup tanpa penonton. Tiket masuk dan pemesanan kursi tidak tersedia untuk umum.' 
                : language === 'ar' 
                ? 'تقام هذه المباراة خلف أبواب مغلقة بدون جمهور. التذاكر وحجز المقاعد غير متاحة للجمهور.' 
                : 'This match is being held behind closed doors. Ticket sales and seat bookings are not available to the public.'}
            </p>
            <div className="mt-8 flex gap-4 text-xs font-display tracking-widest text-brand-gold">
              <span className="uppercase">{t('hero', 'liveMatch')}</span>
            </div>
          </div>
        ) : upcomingMatches.length === 0 ? (
          <div className="glass-panel-heavy rounded-3xl p-12 border border-brand-orange/20 max-w-2xl mx-auto flex flex-col items-center justify-center text-center glow-orange relative overflow-hidden py-16">
            <div className="absolute inset-0 bg-radial-gradient from-brand-orange/5 via-transparent to-transparent pointer-events-none" />
            <div className="w-20 h-20 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-6 text-brand-orange animate-pulse">
              <Info size={36} />
            </div>
            <h3 className="text-2xl md:text-3xl font-title font-extrabold uppercase text-white tracking-wide mb-4">
              {language === 'id' 
                ? 'Tidak Ada Laga Mendatang' 
                : language === 'ar' 
                ? 'لا توجد مباريات قادمة' 
                : 'No Upcoming Matches'}
            </h3>
            <p className="text-gray-300 font-display text-sm md:text-base leading-relaxed max-w-md">
              {language === 'id' 
                ? 'Saat ini belum ada pertandingan mendatang yang tersedia untuk pemesanan tiket. Silakan periksa kembali nanti.' 
                : language === 'ar' 
                ? 'لا توجد مباريات قادمة متاحة لحجز التذاكر حاليًا. يرجى التحقق لاحقًا.' 
                : 'There are currently no upcoming matches available for ticket booking. Please check back later.'}
            </p>
          </div>
        ) : (
          <>
            {/* Match Selection Dropdown */}
            {upcomingMatches.length > 1 && (
              <div className="mb-12 max-w-md mx-auto relative z-10 font-display">
                <label className="block text-[10px] font-black text-brand-orange uppercase tracking-widest mb-2.5 text-center">
                  {language === 'id' ? 'PILIH PERTANDINGAN' : language === 'ar' ? 'اختر المباراة' : 'SELECT MATCHUP'}
                </label>
                <select
                  value={selectedMatch?.id || ''}
                  onChange={(e) => {
                    const match = upcomingMatches.find(m => m.id === e.target.value);
                    if (match) {
                      setSelectedMatch(match);
                      clearSelectedSeats();
                    }
                  }}
                  className="w-full bg-[#121212] border border-white/10 hover:border-brand-orange/40 rounded-xl px-4 py-3.5 text-xs font-bold text-white focus:outline-none focus:border-brand-orange transition-all cursor-pointer text-center"
                >
                  {upcomingMatches.map(m => (
                    <option key={m.id} value={m.id} className="bg-[#080808]">
                      BSQ ALL-FIVE vs {m.opponent} - {new Date(m.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {m.status === 'FINISHED' ? ` (${language === 'id' ? 'Selesai' : language === 'ar' ? 'منتهية' : 'Finished'})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sector Selector Tabs */}
            <div className="flex flex-wrap gap-2.5 justify-center mb-10 font-display relative z-10">
              {SECTORS.map(sec => {
                const isSelected = selectedSector.id === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setSelectedSector(sec);
                      clearSelectedSeats();
                    }}
                    className={`px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      isSelected
                        ? `${sec.color} scale-105 shadow-lg shadow-brand-orange/5`
                        : 'text-gray-400 border-white/5 bg-white/2 hover:text-white hover:border-white/10'
                    }`}
                  >
                    {sec.name} (Rp {getSectorPrice(sec).toLocaleString('id-ID')})
                  </button>
                );
              })}
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
                        {getSectorName(selectedSector.id)}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1 max-w-md">
                        {getSectorDescription(selectedSector.id)}
                      </p>
                    </div>
                    <div className={`flex flex-col sm:items-end flex-shrink-0 ${isRtl ? 'sm:items-start text-right' : 'text-left sm:text-right'}`}>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">{t('tickets', 'price')}</span>
                      {getSectorPrice(selectedSector) === 0 ? (
                        <span className="text-2xl font-black text-green-500 mt-1 uppercase tracking-wider">
                          {language === 'id' ? 'GRATIS' : language === 'ar' ? 'مجاني' : 'FREE'}
                        </span>
                      ) : (
                        <span className="text-2xl font-black text-brand-orange mt-1">
                          Rp {getSectorPrice(selectedSector).toLocaleString('id-ID')}
                        </span>
                      )}
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
                  <div className="grid gap-2 sm:gap-4 w-full max-w-[480px] overflow-x-auto py-2">
                    {SEAT_ROWS.map((row) => (
                      <div key={row} className="flex items-center gap-1.5 sm:gap-3 justify-center">
                        <span className="w-4 sm:w-6 font-title font-bold text-gray-600 text-[10px] sm:text-xs text-center">{row}</span>
                        <div className="flex-1 flex gap-1 sm:gap-2 justify-center">
                          {SEAT_COLS.map((col) => {
                            const seatId = `${selectedSector.id}-${row}-${col}`;
                            const isOccupied = isSeatOccupied(seatId);
                            const isSelected = selectedSeats.includes(seatId);
                            
                            return (
                              <button
                                key={col}
                                onClick={() => handleSeatClick(seatId)}
                                disabled={isOccupied}
                                className={`w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-md sm:rounded-lg border transition-all flex items-center justify-center font-display text-[8px] sm:text-[9px] font-bold cursor-pointer relative ${
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
                        <span className="w-4 sm:w-6 font-title font-bold text-gray-600 text-[10px] sm:text-xs text-center">{row}</span>
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
                      <span className="font-bold text-white uppercase">{t('matches', 'vs')} {selectedMatch?.opponent || 'Opponent'}</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-white/5 pb-3">
                      <span className="text-gray-500">{language === 'id' ? 'Tanggal' : language === 'ar' ? 'التاريخ' : 'Date'}</span>
                      <span className="font-bold text-white">
                        {selectedMatch 
                          ? new Date(selectedMatch.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </span>
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

                    <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-2">
                      <span className="text-sm font-bold text-gray-400">{t('tickets', 'total')}</span>
                      {getSectorPrice(selectedSector) === 0 ? (
                        <span className="text-xl font-black text-green-500 uppercase tracking-wider">
                          {language === 'id' ? 'GRATIS' : language === 'ar' ? 'مجاني' : 'FREE'}
                        </span>
                      ) : (
                        <span className="text-xl font-black text-brand-orange">
                          Rp {totalCost.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>

                    {selectedMatch && (
                      <div className="mt-4 p-3 bg-white/2 border border-brand-orange/20 rounded-xl text-start font-display text-[10px] leading-relaxed text-gray-400 space-y-1">
                        <span className="text-brand-orange font-bold uppercase tracking-wider block mb-1">
                          {language === 'id' ? 'Ketentuan & Detail Laga' : language === 'ar' ? 'شروط وتفاصيل المباراة' : 'Terms & Match Details'}
                        </span>
                        <p>
                          {language === 'id' 
                            ? `• Tiket ini khusus untuk kursi pertandingan: BSQ ALL-FIVE vs ${selectedMatch.opponent}.`
                            : `• This ticket is exclusively for matchup: BSQ ALL-FIVE vs ${selectedMatch.opponent}.`}
                        </p>
                        <p>
                          {language === 'id' 
                            ? `• Tanggal: ${new Date(selectedMatch.date).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB.`
                            : `• Date: ${new Date(selectedMatch.date).toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.`}
                        </p>
                        <p>
                          {language === 'id' 
                            ? '• Tiket non-refundable dan hanya valid untuk gerbang masuk Al Hikmah Arena.'
                            : '• Tickets are non-refundable and only valid for Al Hikmah Arena gates.'}
                        </p>
                      </div>
                    )}

                    {selectedMatch?.status === 'FINISHED' && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-start font-display leading-relaxed">
                        {language === 'id' 
                          ? 'Pertandingan ini telah selesai. Kursi dapat dilihat (seluruhnya diaktifkan) tetapi pemesanan dinonaktifkan.'
                          : language === 'ar'
                          ? 'لقد انتهت هذه المباراة. يمكن عرض المقاعد (تم تفعيلها جميعاً) ولكن الحجز معطل.'
                          : 'This match has ended. Seats can be viewed (all are enabled) but booking is disabled.'}
                      </div>
                    )}

                    <button
                      onClick={handleCheckout}
                      disabled={selectedSeats.length === 0 || selectedMatch?.status === 'FINISHED'}
                      className="w-full mt-6 py-3.5 bg-brand-orange hover:bg-brand-burnt disabled:bg-white/5 disabled:text-gray-500 disabled:border-transparent text-brand-black disabled:cursor-not-allowed font-black text-xs tracking-[0.25em] rounded-xl uppercase transition-colors cursor-pointer border border-brand-orange/30 shadow-lg hover:shadow-brand-orange/20"
                    >
                      {selectedMatch?.status === 'FINISHED' 
                        ? (language === 'id' ? 'PERTANDINGAN SELESAI' : language === 'ar' ? 'انتهت المباراة' : 'MATCH FINISHED')
                        : t('tickets', 'checkout')}
                    </button>

                    <div className="mt-4 flex items-start gap-2 text-[10px] text-gray-500 leading-relaxed text-start">
                      <CreditCard size={14} className="text-brand-gold flex-shrink-0 mt-0.5" />
                      <span>{t('tickets', 'info')}</span>
                    </div>
                  </div>
                </div>

                {/* Active Booked Digital Tickets */}
                {(bookedTickets || []).length > 0 && (
                  <div className="glass-panel-heavy rounded-3xl p-6 border border-white/5 relative">
                    <h4 className="font-title font-extrabold uppercase text-white mb-4 flex items-center gap-2 text-start">
                      <Ticket size={18} className="text-brand-gold" /> {t('tickets', 'tixTitle')}
                    </h4>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {(bookedTickets || []).map((tix, idx) => (
                        <div key={idx} className="border border-white/5 bg-white/2 rounded-2xl p-4 flex gap-4 items-center relative overflow-hidden">
                          <div className="w-16 h-16 bg-white flex items-center justify-center rounded-lg flex-shrink-0">
                            {/* Simulated QR code deterministically colored */}
                            <div className="grid grid-cols-4 gap-1 w-12 h-12 bg-white">
                              {[...Array(16)].map((_, i) => {
                                const charCode = tix.qrCode.charCodeAt(i % tix.qrCode.length) || 0;
                                const isBlack = (charCode + i) % 2 === 0;
                                return (
                                  <div key={i} className={`w-2.5 h-2.5 ${isBlack ? 'bg-black' : 'bg-white'}`} />
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 text-start font-display">
                            <span className="text-[9px] text-brand-gold font-bold tracking-widest block uppercase">{t('tickets', 'tixSub')}</span>
                            <h5 className="font-title font-black text-white text-base leading-none mt-1 uppercase">vs {tix.opponent}</h5>
                            <span className="text-[9px] text-gray-400 block mt-1">
                              {tix.seatNumber.split('-')[0].toUpperCase()} • {t('tickets', 'row')} {tix.seatNumber.split('-')[1]} - {t('tickets', 'seat')} {tix.seatNumber.split('-')[2]}
                            </span>
                            <span className="text-[8px] text-gray-650 block truncate mt-0.5">{tix.qrCode}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </>
        )}

      </div>
    </section>
  );
};

export default TicketBooking;
