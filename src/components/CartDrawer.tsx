import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Trash2, ArrowRight } from 'lucide-react';
import useAppStore from '../lib/store';
import { getTranslation } from '../lib/i18n';
import db from '../lib/supabase';
import type { Merchandise } from '../lib/supabase';

export const CartDrawer: React.FC = () => {
  const { 
    cart, 
    isCartOpen, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    setCartOpen, 
    addXP, 
    addToast, 
    language 
  } = useAppStore();

  const [products, setProducts] = useState<Merchandise[]>([]);

  const t = (section: string, key: string) => getTranslation(language, section, key);
  const isRtl = language === 'ar';

  const loadProducts = () => {
    (db as any).from('merchandise').select('*').then(({ data }: any) => {
      if (data) setProducts(data as Merchandise[]);
    });
  };

  useEffect(() => {
    if (isCartOpen) {
      loadProducts();
    }
  }, [isCartOpen]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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

  return (
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
            className={`relative w-full max-w-md h-full bg-bg-dark p-8 flex flex-col justify-between z-[2010] ${
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
  );
};

export default CartDrawer;
