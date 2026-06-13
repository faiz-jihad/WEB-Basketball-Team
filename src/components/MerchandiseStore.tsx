import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Trash2, ArrowRight } from 'lucide-react';
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
    
    const rotateY = (x - 0.5) * 20; // max 20 degrees
    const rotateX = -(y - 0.5) * 20; // max 20 degrees
    
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1.0)';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="bg-bg-card border border-white/5 rounded-3xl p-5 cursor-pointer relative overflow-hidden transition-all duration-200 select-none hover:border-brand-orange/20"
      style={{ transformStyle: 'preserve-3d', transition: 'transform 0.15s ease' }}
    >
      {children}
    </div>
  );
};

export const MerchandiseStore: React.FC = () => {
  const [products, setProducts] = useState<Merchandise[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'jersey' | 'shoes' | 'caps' | 'accessories'>('all');
  
  const { cart, isCartOpen, addToCart, removeFromCart, updateQuantity, clearCart, setCartOpen, addXP, addToast, language } = useAppStore();
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

  const handleAddToCart = (prod: Merchandise, size?: string) => {
    if (prod.is_locked || prod.stock <= 0) return;
    addToCart({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      image: prod.image
    }, size || 'M');

    addXP(5); // Grant minor XP for buying/cart updates
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Check if any item in cart is currently locked or has 0 stock in products database
    const invalidItems = cart.filter(item => {
      const match = products.find(p => p.id === item.id);
      return match && (match.is_locked || match.stock <= 0);
    });

    if (invalidItems.length > 0) {
      addToast('warning', 'Item Unavailable', `Some items in your cart are sold out or currently locked. Please remove them.`);
      return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderDetails = cart.map(item => `- ${item.name} (${item.size}) x${item.quantity}`).join('\n');
    
    const phoneNumber = "6281234567890";
    const text = encodeURIComponent(`Halo, saya ingin memesan merchandise berikut:\n\n${orderDetails}\n\nTotal Harga: Rp ${total.toLocaleString('id-ID')}\n\nMohon informasi pembayarannya.`);
    
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, '_blank');

    clearCart();
    setCartOpen(false);
    addXP(100); // Massive XP for checking out
    addToast('success', t('shop', 'orderPlaced'), t('shop', 'orderPlacedDesc'));
  };

  const filteredProducts = products.filter(p => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <section id="shop" className="py-24 px-6 bg-bg-darker relative border-b border-white/5">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Categories */}
        <div className={`flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
          <div className="text-start">
            <span className="text-brand-orange font-display text-sm font-semibold tracking-[0.25em] uppercase block mb-1">{t('shop', 'shop')}</span>
            <h2 className="text-4xl md:text-5xl font-title font-extrabold uppercase text-white">
              {renderTitle()}
            </h2>
          </div>

          {/* Categories bar */}
          <div className={`flex flex-wrap gap-2 bg-white/2 border border-white/10 p-1.5 rounded-2xl text-xs font-display font-semibold self-start md:self-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
            {(['all', 'jersey', 'shoes', 'caps', 'accessories'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2.5 rounded-xl uppercase transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-brand-orange text-brand-black font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((prod) => (
              <motion.div
                key={prod.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <ProductCard3D onClick={() => {
                  if (!(prod.is_locked || prod.stock <= 0)) {
                    handleAddToCart(prod);
                  }
                }}>
                  
                  {/* Category Tag */}
                  <span className={`absolute top-4 z-10 px-2 py-0.5 bg-black/60 border border-white/10 text-[9px] font-bold text-brand-gold tracking-widest uppercase rounded ${isRtl ? 'right-4' : 'left-4'}`}>
                    {getCategoryLabel(prod.category)}
                  </span>

                  {/* Status Tag */}
                  {prod.is_locked ? (
                    <span className={`absolute top-4 z-10 px-2 py-0.5 bg-red-950/80 border border-red-700/30 text-[9px] font-bold text-red-500 tracking-widest uppercase rounded flex items-center gap-1 ${isRtl ? 'left-4' : 'right-4'}`}>
                      🔒 {t('shop', 'lockedProduct') || 'LOCKED'}
                    </span>
                  ) : prod.stock <= 0 ? (
                    <span className={`absolute top-4 z-10 px-2 py-0.5 bg-red-950/80 border border-red-700/30 text-[9px] font-bold text-red-500 tracking-widest uppercase rounded flex items-center gap-1 ${isRtl ? 'left-4' : 'right-4'}`}>
                      ❌ {t('shop', 'outOfStock')}
                    </span>
                  ) : null}

                  {/* Product Image Frame */}
                  <div className="aspect-square w-full rounded-2xl bg-black/40 overflow-hidden mb-6 flex items-center justify-center relative group">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${(prod.is_locked || prod.stock <= 0) ? "grayscale opacity-40" : ""}`}
                    />
                    <div className="absolute inset-0 bg-brand-orange/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>

                  {/* Title & Details */}
                  <h3 className="text-lg font-title font-black uppercase text-white truncate mb-1 text-start">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4 text-start">
                    {prod.description}
                  </p>

                  <div className={`flex justify-between items-center border-t border-white/5 pt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span className="text-2xl font-title font-black text-white">Rp {prod.price.toLocaleString('id-ID')}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(prod);
                      }}
                      disabled={prod.is_locked || prod.stock <= 0}
                      className={`px-4 py-2.5 font-display font-black text-[10px] tracking-widest rounded-xl uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg ${
                        (prod.is_locked || prod.stock <= 0)
                          ? "bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed shadow-none"
                          : "bg-brand-orange hover:bg-brand-burnt text-brand-black shadow-brand-orange/15"
                      }`}
                    >
                      {prod.is_locked ? (
                        <>
                          <X size={12} /> {t('shop', 'lockedProduct') || 'LOCKED'}
                        </>
                      ) : prod.stock <= 0 ? (
                        <>
                          <X size={12} /> {t('shop', 'outOfStock')}
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={12} /> {t('shop', 'addToCart')}
                        </>
                      )}
                    </button>
                  </div>

                </ProductCard3D>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>

      {/* Slide-out Shopping Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[2000] bg-black/70 backdrop-blur-md flex ${isRtl ? 'justify-start' : 'justify-end'}`}
          >
            {/* Click backdrop to close */}
            <div className="absolute inset-0 z-0" onClick={() => setCartOpen(false)} />

            {/* Cart Panel */}
            <motion.div
              initial={{ x: isRtl ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`relative w-full max-w-md h-full bg-bg-dark p-8 flex flex-col justify-between z-10 ${
                isRtl ? 'border-r' : 'border-l'
              } border-white/10`}
            >
              
              {/* Header */}
              <div>
                <div className={`flex items-center justify-between border-b border-white/10 pb-6 mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <h3 className={`text-xl font-title font-black uppercase text-white flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <ShoppingBag size={20} className="text-brand-orange" /> {t('shop', 'cartTitle')}
                  </h3>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="p-2 bg-white/3 hover:bg-brand-orange hover:text-brand-black text-white rounded-xl transition-all cursor-pointer border border-white/5"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Items Scroll container */}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {cart.map((item) => (
                    <motion.div
                      key={`${item.id}-${item.size}`}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white/2 border border-white/5 p-4 rounded-2xl flex gap-4 items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                        <div className="w-16 h-16 rounded-xl bg-black/30 overflow-hidden flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white truncate max-w-[150px]">{item.name}</h4>
                          <span className="text-[10px] text-brand-gold font-display font-semibold block mt-1">
                            {t('shop', 'size')}: {item.size} • Rp {item.price.toLocaleString('id-ID')}
                          </span>
                          
                          {/* Quantity Controls */}
                          <div className={`flex items-center gap-2 mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                              className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs text-white font-bold w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                              className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="p-2 bg-white/2 hover:bg-red-950/40 text-gray-500 hover:text-red-500 border border-transparent hover:border-red-900/30 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                  {cart.length === 0 && (
                    <div className="text-center py-12 text-gray-500 text-sm">
                      {t('shop', 'emptyCart')}
                    </div>
                  )}
                </div>
              </div>

              {/* Checkout details */}
              <div className="border-t border-white/10 pt-6">
                <div className="space-y-3 mb-6 font-display text-xs">
                  <div className={`flex justify-between text-gray-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span>{t('shop', 'subtotal')}</span>
                    <span className="text-white">Rp {cartTotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className={`flex justify-between text-gray-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span>{t('shop', 'shipping')}</span>
                    <span className="text-brand-gold uppercase font-bold">{t('shop', 'freeDelivery')}</span>
                  </div>
                  <div className={`flex justify-between text-sm font-title pt-3 border-t border-white/5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-400 font-bold">{t('shop', 'totalCost')}</span>
                    <span className="text-xl font-black text-brand-orange">Rp {cartTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className={`w-full py-4 bg-brand-orange hover:bg-brand-burnt disabled:bg-white/5 disabled:text-gray-600 disabled:border-transparent text-brand-black font-display font-black text-xs tracking-[0.2em] rounded-xl uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-orange/10 ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  {t('shop', 'confirmPurchase')} <ArrowRight size={14} className={isRtl ? 'transform rotate-180' : ''} />
                </button>
                
                <span className="text-[9px] text-gray-500 font-display text-center block mt-3">
                  {t('shop', 'checkoutReward')}
                </span>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
};

export default MerchandiseStore;
