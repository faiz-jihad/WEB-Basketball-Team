import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Users, CalendarDays, Ticket, ShoppingBag } from 'lucide-react';
import useAppStore from '../lib/store';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { language } = useAppStore();
  const isRtl = language === 'ar';

  const tabs = [
    { path: '/', icon: Home },
    { path: '/roster', icon: Users },
    { path: '/matches', icon: CalendarDays },
    { path: '/tickets', icon: Ticket },
    { path: '/shop', icon: ShoppingBag }
  ];

  // Reorder tabs if RTL to maintain visual sequence matching DOM
  const orderedTabs = isRtl ? [...tabs].reverse() : tabs;

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    // Exact match or fallback to 0
    let index = orderedTabs.findIndex(t => t.path === location.pathname);
    // Handle specific cases if needed, but for now strict path matching is fine
    if (index === -1) index = 0; // fallback to home if unmatched page (like privacy)
    setActiveIndex(index);
  }, [location.pathname, orderedTabs]);

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-[1000] pb-safe" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="relative w-full h-16 bg-white/5 backdrop-blur-xl border-t border-white/10 flex shadow-[0_-10px_40px_rgba(255,90,0,0.05)]">
        
        {/* Animated Background Cutout effect (using CSS drop shadow trick) */}
        {/* We place a container that moves along X axis to the active index */}
        <motion.div 
          className={`absolute top-0 h-full w-[20%] pointer-events-none ${isRtl ? 'right-0' : 'left-0'}`}
          animate={{ x: isRtl ? `${-activeIndex * 100}%` : `${activeIndex * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* The visual "hole" */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-5 w-[60px] h-[60px] bg-[#080808] rounded-full border-t border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
            {/* Left curved edge - to blend the hole with the navbar top edge */}
            {/* Using transparent boxes with box-shadows to create the inverse rounded corners */}
            <div className="absolute top-5 -left-3 w-3 h-3 bg-transparent rounded-tr-xl shadow-[2px_-2px_0_1px_#080808]" />
            <div className="absolute top-5 -left-3 w-3 h-3 bg-transparent rounded-tr-xl shadow-[1px_-2px_0_0px_rgba(255,255,255,0.1)] pointer-events-none" />
            
            {/* Right curved edge */}
            <div className="absolute top-5 -right-3 w-3 h-3 bg-transparent rounded-tl-xl shadow-[-2px_-2px_0_1px_#080808]" />
            <div className="absolute top-5 -right-3 w-3 h-3 bg-transparent rounded-tl-xl shadow-[-1px_-2px_0_0px_rgba(255,255,255,0.1)] pointer-events-none" />
          </div>
        </motion.div>

        {/* Floating Bubble */}
        <motion.div 
          className={`absolute top-0 h-full w-[20%] pointer-events-none flex items-start justify-center z-20 ${isRtl ? 'right-0' : 'left-0'}`}
          animate={{ x: isRtl ? `${-activeIndex * 100}%` : `${activeIndex * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <motion.div 
            className="w-[48px] h-[48px] -mt-3.5 bg-gradient-to-tr from-brand-orange to-brand-gold rounded-full shadow-lg shadow-brand-orange/40 flex items-center justify-center border-2 border-[#080808]"
            whileTap={{ scale: 0.9 }}
          >
            {React.createElement(orderedTabs[activeIndex].icon, { size: 20, className: "text-[#080808]", strokeWidth: 2.5 })}
          </motion.div>
        </motion.div>

        {/* Nav Links */}
        {orderedTabs.map((tab, i) => {
          const isActive = i === activeIndex;
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className="flex-1 flex flex-col items-center justify-center relative z-10 w-[20%] h-full outline-none"
            >
              <div 
                className={`transition-all duration-300 ease-out flex flex-col items-center justify-center ${
                  isActive ? 'opacity-0 translate-y-4 scale-50' : 'opacity-100 translate-y-0 scale-100 text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon size={20} strokeWidth={2} />
              </div>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
