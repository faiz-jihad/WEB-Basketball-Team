import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Lock, Check, Sparkles, AlertCircle, Eye } from 'lucide-react';
import { db } from '../lib/supabase';
import type { Merchandise } from '../lib/supabase';
import useAppStore from '../lib/store';
import { getTranslation } from '../lib/i18n';

// Interactive 3D Tilt Wrapper Component
const ProductCard3D: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    
    // Calculate normalized coordinates (-1 to 1)
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const rotateY = (x - 0.5) * 15; // max 15 degrees
    const rotateX = -(y - 0.5) * 15; // max 15 degrees
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1.0)';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="bg-gradient-to-b from-[#161616] to-[#0d0d0d] border border-white/5 hover:border-brand-orange/20 rounded-2xl sm:rounded-3xl p-4 cursor-pointer relative overflow-hidden transition-all duration-300 select-none shadow-xl hover:shadow-brand-orange/5"
      style={{ transformStyle: 'preserve-3d', transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)' }}
    >
      {children}
    </div>
  );
};

export const MerchandiseStore: React.FC = () => {
  const [products, setProducts] = useState<Merchandise[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'jersey' | 'shoes' | 'caps' | 'accessories'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Merchandise | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  
  const { cart, isCartOpen, addToCart, language, addXP, addToast } = useAppStore();
  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';

  const getCategoryLabel = (cat: string) => {
    if (cat === 'all') return t('shop', 'all');
    if (cat === 'jersey') return t('shop', 'jerseys');
    if (cat === 'shoes') return t('shop', 'shoes');
    if (cat === 'caps') return t('shop', 'caps');
    if (cat === 'accessories') return t('shop', 'accessories');
    return cat;
  };

  const renderTitle = () => {
    const titleText = t('shop', 'title');
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

  const loadProducts = () => {
    (db as any).from('merchandise').select('*').then(({ data }: any) => {
      if (data) setProducts(data as Merchandise[]);
    });
  };

  useEffect(() => {
    loadProducts();

    const handleStorageChange = () => loadProducts();
    window.addEventListener("bsq_inventory_updated", handleStorageChange);
    window.addEventListener("bsq_merchandise_updated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("bsq_inventory_updated", handleStorageChange);
      window.removeEventListener("bsq_merchandise_updated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleAddToCartWithSize = (prod: Merchandise, size: string) => {
    if (prod.is_locked || prod.stock <= 0) return;
    addToCart({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      image: prod.image
    }, size);

    addXP(10); // Grant XP for cart interaction
    addToast('success', t('shop', 'toastAdded') || 'Added to Bag', `${prod.name} (${size}) has been added to your shopping bag.`);
  };

  const filteredProducts = products.filter(p => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  // Flagship spotlight product (Home Jersey)
  const spotlightProduct = products.find(p => p.id === 'merch1');

  // Categories count helper
  const getCategoryCount = (cat: 'all' | 'jersey' | 'shoes' | 'caps' | 'accessories') => {
    if (cat === 'all') return products.length;
    return products.filter(p => p.category === cat).length;
  };

  return (
    <section id="shop" className="py-24 px-6 bg-brand-black relative border-b border-white/5 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-radial-gradient from-brand-orange/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className={`flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
          <div className="text-start">
            <span className="text-brand-orange font-display text-sm font-semibold tracking-[0.25em] uppercase block mb-1">{t('shop', 'shop')}</span>
            <h2 className="text-4xl md:text-5xl font-title font-extrabold uppercase text-white">
              {renderTitle()}
            </h2>
          </div>

          {/* Categories bar with counts */}
          <div className={`flex flex-wrap gap-2 bg-white/2 border border-white/10 p-1.5 rounded-2xl text-[11px] font-display font-bold self-start md:self-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
            {(['all', 'jersey', 'shoes', 'caps', 'accessories'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-2 rounded-xl uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === cat
                    ? 'bg-brand-orange text-brand-black font-black glow-orange'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>{getCategoryLabel(cat)}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                  activeCategory === cat ? 'bg-brand-black/15 text-brand-black' : 'bg-white/5 text-gray-500'
                }`}>
                  {getCategoryCount(cat)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Flagship Spotlight Banner */}
        {spotlightProduct && activeCategory === 'all' && (
          <div className="relative w-full rounded-3xl p-6 sm:p-10 mb-12 border border-brand-gold/20 bg-gradient-to-r from-brand-gold/10 via-brand-orange/5 to-black/30 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-brand-gold/5">
            {/* Absolute visual highlights */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-brand-orange/5 rounded-full blur-2xl pointer-events-none translate-y-1/3 -translate-x-1/3" />

            {/* Left Content Column */}
            <div className="flex-1 text-start space-y-4 md:max-w-xl font-display relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-gold/15 border border-brand-gold/30 text-[10px] font-black tracking-widest text-brand-gold rounded-full uppercase">
                <Sparkles size={12} /> Flagship Edition
              </span>
              <h3 className="text-3xl sm:text-4xl font-title font-black text-white uppercase leading-none">
                {spotlightProduct.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                {spotlightProduct.description}
              </p>
              
              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-2xl sm:text-3xl font-title font-black text-white">
                  Rp {spotlightProduct.price.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-brand-gold font-bold uppercase tracking-wider bg-brand-gold/10 border border-brand-gold/20 px-2.5 py-0.5 rounded-md">
                  +100 XP checkout reward
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={() => {
                    setSelectedProduct(spotlightProduct);
                    setSelectedSize('M');
                  }}
                  className="px-6 py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-orange/20 flex items-center gap-2"
                >
                  <Eye size={14} /> {language === 'id' ? 'Lihat Detail' : 'View Details'}
                </button>
                <button
                  onClick={() => handleAddToCartWithSize(spotlightProduct, 'M')}
                  disabled={spotlightProduct.is_locked || spotlightProduct.stock <= 0}
                  className="px-6 py-3 bg-[#161616] hover:bg-[#222222] border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <ShoppingBag size={14} /> {t('shop', 'addToCart')}
                </button>
              </div>
            </div>

            {/* Right Image Column */}
            <div className="w-full md:w-80 lg:w-96 aspect-square rounded-2xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center relative flex-shrink-0 group">
              <img
                src={spotlightProduct.image}
                alt={spotlightProduct.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((prod) => {
              const isLowStock = prod.stock > 0 && prod.stock <= 15;
              return (
                <motion.div
                  key={prod.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard3D onClick={() => {
                    setSelectedProduct(prod);
                    setSelectedSize('M');
                  }}>
                    
                    {/* Category Tag */}
                    <span className={`absolute top-4 z-10 px-2.5 py-0.5 bg-black/60 border border-white/10 text-[9px] font-bold text-brand-gold tracking-widest uppercase rounded ${isRtl ? 'right-4' : 'left-4'}`}>
                      {getCategoryLabel(prod.category)}
                    </span>

                    {/* Status Tag */}
                    {prod.is_locked ? (
                      <span className={`absolute top-4 z-10 px-2 py-0.5 bg-red-950/80 border border-red-700/30 text-[9px] font-bold text-red-500 tracking-widest uppercase rounded flex items-center gap-1 ${isRtl ? 'left-4' : 'right-4'}`}>
                        <Lock size={10} /> {t('shop', 'lockedProduct') || 'LOCKED'}
                      </span>
                    ) : prod.stock <= 0 ? (
                      <span className={`absolute top-4 z-10 px-2 py-0.5 bg-red-950/80 border border-red-700/30 text-[9px] font-bold text-red-500 tracking-widest uppercase rounded flex items-center gap-1 ${isRtl ? 'left-4' : 'right-4'}`}>
                        <X size={10} /> {t('shop', 'outOfStock')}
                      </span>
                    ) : isLowStock ? (
                      <span className={`absolute top-4 z-10 px-2 py-0.5 bg-amber-950/80 border border-amber-700/30 text-[9px] font-bold text-amber-500 tracking-widest uppercase rounded flex items-center gap-1 ${isRtl ? 'left-4' : 'right-4'}`}>
                        <AlertCircle size={10} /> {language === 'id' ? 'STOK LIMITED' : 'LIMITED'}
                      </span>
                    ) : null}

                    {/* Product Image Frame */}
                    <div className="aspect-square w-full rounded-xl sm:rounded-2xl bg-black/40 overflow-hidden mb-4 flex items-center justify-center relative group">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${(prod.is_locked || prod.stock <= 0) ? "grayscale opacity-40" : ""}`}
                      />
                      <div className="absolute inset-0 bg-brand-orange/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      
                      {/* Premium Quick View Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="px-4 py-2 bg-brand-orange text-brand-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <Eye size={12} /> {language === 'id' ? 'Lihat Detail' : 'Quick View'}
                        </span>
                      </div>
                    </div>

                    {/* Title & Details */}
                    <h3 className="text-sm sm:text-base font-title font-black uppercase text-white truncate mb-0.5 text-start">
                      {prod.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3 text-start">
                      {prod.description}
                    </p>

                    {/* Stock level micro indicator */}
                    {!prod.is_locked && prod.stock > 0 && (
                      <div className="w-full mb-3 text-start space-y-1 font-display">
                        <div className="flex justify-between text-[9px] text-gray-500 font-bold">
                          <span>{language === 'id' ? 'Ketersediaan Stok' : 'Stock Availability'}</span>
                          <span className={isLowStock ? 'text-amber-500' : 'text-emerald-500'}>
                            {prod.stock} {language === 'id' ? 'tersisa' : 'left'}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, (prod.stock / 50) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-t border-white/5 pt-3">
                      <span className="text-base sm:text-lg font-title font-black text-white text-start">
                        Rp {prod.price.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[9px] font-bold text-brand-orange/60 tracking-wider text-start hidden sm:inline">
                        {language === 'id' ? 'Klik untuk ukuran' : 'Click to select size'}
                      </span>
                    </div>

                  </ProductCard3D>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      </div>

      {/* Premium Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
            {/* Dark glass backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[#0b0b0b] border border-white/10 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh]"
            >
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Left Column: Product Image Showcase */}
              <div className="w-full md:w-1/2 bg-black/40 flex items-center justify-center relative border-r border-white/5 overflow-hidden p-6">
                <div className="absolute inset-0 bg-radial-gradient from-brand-orange/5 to-transparent blur-2xl pointer-events-none" />
                <div className="aspect-square w-full rounded-2xl overflow-hidden bg-black/20 border border-white/5 group">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>

              {/* Right Column: Details & Actions */}
              <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto text-start font-display">
                <div className="space-y-4">
                  {/* Category & Lock Status badge */}
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-brand-gold/15 border border-brand-gold/30 text-[9px] font-black tracking-widest text-brand-gold rounded uppercase">
                      {getCategoryLabel(selectedProduct.category)}
                    </span>
                    {selectedProduct.is_locked ? (
                      <span className="px-2 py-0.5 bg-red-950/80 border border-red-700/30 text-[9px] font-bold text-red-500 rounded uppercase flex items-center gap-1">
                        <Lock size={10} /> Locked
                      </span>
                    ) : selectedProduct.stock <= 0 ? (
                      <span className="px-2 py-0.5 bg-red-950/80 border border-red-700/30 text-[9px] font-bold text-red-500 rounded uppercase flex items-center gap-1">
                        Sold Out
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-400">
                        ● {language === 'id' ? 'Stok Tersedia' : 'In Stock'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-title font-black uppercase text-white leading-tight">
                    {selectedProduct.name}
                  </h3>

                  <div className="text-xl sm:text-2xl font-title font-black text-brand-orange">
                    Rp {selectedProduct.price.toLocaleString('id-ID')}
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed pt-2">
                    {selectedProduct.description}
                  </p>

                  {/* Size Selector (only applicable to jerseys/shoes/caps usually) */}
                  {!selectedProduct.is_locked && selectedProduct.stock > 0 && (
                    <div className="space-y-2.5 pt-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                        {language === 'id' ? 'PILIH UKURAN' : 'SELECT SIZE'}
                      </span>
                      <div className="flex gap-2">
                        {['S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                          const isActive = selectedSize === size;
                          return (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`w-10 h-10 border rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-brand-orange border-brand-orange text-brand-black glow-orange font-black scale-105'
                                  : 'border-white/10 hover:border-white/20 text-gray-400 hover:text-white hover:bg-white/5 bg-transparent'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Stock Level Warning banner */}
                  {!selectedProduct.is_locked && selectedProduct.stock > 0 && selectedProduct.stock <= 15 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-xl flex items-center gap-2 mt-4 leading-normal">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>
                        {language === 'id' 
                          ? `Edisi Terbatas! Hanya tersisa ${selectedProduct.stock} item lagi di gudang kami.`
                          : `Limited Edition! Only ${selectedProduct.stock} items remaining in our inventory.`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-8 space-y-4">
                  {/* Add to Cart checkout action button */}
                  <button
                    onClick={() => {
                      handleAddToCartWithSize(selectedProduct, selectedSize);
                      setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.is_locked || selectedProduct.stock <= 0}
                    className="w-full py-4 bg-brand-orange hover:bg-brand-burnt disabled:bg-white/5 disabled:border-transparent text-brand-black disabled:text-gray-500 disabled:cursor-not-allowed font-black text-xs tracking-[0.2em] rounded-xl uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:shadow-brand-orange/20"
                  >
                    {selectedProduct.is_locked ? (
                      <>
                        <Lock size={14} /> {t('shop', 'lockedProduct') || 'LOCKED'}
                      </>
                    ) : selectedProduct.stock <= 0 ? (
                      <>
                        <X size={14} /> {t('shop', 'outOfStock')}
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={14} /> {language === 'id' ? `TAMBAH KE TAS (UKURAN ${selectedSize})` : `ADD TO BAG (SIZE ${selectedSize})`}
                      </>
                    )}
                  </button>

                  <div className="text-[10px] text-gray-500 leading-normal text-center">
                    {language === 'id' 
                      ? 'Pemesanan diverifikasi secara resmi via WhatsApp + klaim lencana eksklusif fan club.' 
                      : 'Orders verified securely via WhatsApp with exclusive fan club badge rewards.'}
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
};

export default MerchandiseStore;
