import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from './i18n';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
}

export interface FanProfile {
  username: string;
  avatar: string;
  level: number;
  xp: number;
  badges: { id: string; name: string; icon: string; description: string; unlockedAt: string }[];
}

export interface BookedTicket {
  matchId: string;
  opponent: string;
  seatNumber: string;
  qrCode: string;
  date: string;
  verified?: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'xp';
  title: string;
  message: string;
}

interface AppState {
  // Cart
  cart: CartItem[];
  isCartOpen: boolean;
  addToCart: (item: Omit<CartItem, 'quantity'>, size?: string) => void;
  removeFromCart: (itemId: string, size?: string) => void;
  updateQuantity: (itemId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;

  // Fan Session
  fan: FanProfile;
  firebaseUser: any | null;
  setFirebaseUser: (user: any | null) => void;
  loginFan: (username: string) => void;
  addXP: (amount: number) => void;
  unlockBadge: (badgeId: string, badgeName: string, icon: string, description: string) => void;

  // Ticket Selection
  selectedSeats: string[];
  selectSeat: (seat: string) => void;
  clearSelectedSeats: () => void;
  bookedTickets: BookedTicket[];
  bookSeats: (matchId: string, opponent: string, date: string) => void;
  verifyTicket: (qrCode: string) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;

  // i18n
  language: Language;
  setLanguage: (lang: Language) => void;
}

// Initial badges list
const MOCK_BADGES = [
  { id: 'early', name: 'Early Fan', icon: '🔥', description: 'Joined the Vortex community.', unlockedAt: new Date().toISOString() }
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  // i18n implementation
  language: 'en',
  setLanguage: (lang) => {
    set({ language: lang });
    if (typeof window !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  },

  // Cart implementation
  cart: [],
  isCartOpen: false,
  addToCart: (item, size) => {
    set(state => {
      const existingIndex = state.cart.findIndex(
        i => i.id === item.id && i.size === size
      );
      
      let newCart = [...state.cart];
      if (existingIndex > -1) {
        newCart[existingIndex].quantity += 1;
      } else {
        newCart.push({ ...item, quantity: 1, size });
      }

      // Add positive feedback
      setTimeout(() => {
        get().addToast('success', 'Cart Updated', `Added ${item.name} to shopping cart.`);
      }, 50);

      return { cart: newCart, isCartOpen: true };
    });
  },
  removeFromCart: (itemId, size) => {
    set(state => ({
      cart: state.cart.filter(item => !(item.id === itemId && item.size === size))
    }));
  },
  updateQuantity: (itemId, quantity, size) => {
    if (quantity <= 0) {
      get().removeFromCart(itemId, size);
      return;
    }
    set(state => ({
      cart: state.cart.map(item =>
        item.id === itemId && item.size === size ? { ...item, quantity } : item
      )
    }));
  },
  clearCart: () => set({ cart: [] }),
  setCartOpen: (open) => set({ isCartOpen: open }),

  // Fan Session implementation
  fan: {
    username: 'COURT_CRUSADER',
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=hoops',
    level: 1,
    xp: 25,
    badges: MOCK_BADGES
  },
  firebaseUser: null,
  setFirebaseUser: (user) => {
    set(state => {
      if (user) {
        const fanState = state.fan || {
          username: 'COURT_CRUSADER',
          avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=hoops',
          level: 1,
          xp: 25,
          badges: MOCK_BADGES
        };
        // Automatically sync Fan Profile to Google User
        return {
          firebaseUser: user,
          fan: {
            ...fanState,
            username: user.displayName || 'Google Fan',
            avatar: user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.displayName}`
          }
        };
      }
      return { firebaseUser: null };
    });
  },
  loginFan: (username) => {
    set(() => ({
      fan: {
        username: username.trim().toUpperCase(),
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
        level: 1,
        xp: 0,
        badges: MOCK_BADGES
      }
    }));
    get().addToast('success', 'Profile Created', `Welcome to the arena, ${username.toUpperCase()}!`);
  },
  addXP: (amount) => {
    set(state => {
      const fanState = state.fan || {
        username: 'COURT_CRUSADER',
        avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=hoops',
        level: 1,
        xp: 25,
        badges: MOCK_BADGES
      };
      const newXP = (fanState.xp ?? 0) + amount;
      const nextLevelThreshold = (fanState.level ?? 1) * 100;
      let newLevel = fanState.level ?? 1;
      let levelUpToast = false;

      if (newXP >= nextLevelThreshold) {
        newLevel += 1;
        levelUpToast = true;
      }

      setTimeout(() => {
        get().addToast('xp', `+${amount} XP Gained`, `Keep interacting to climb the team levels!`);
        if (levelUpToast) {
          get().addToast('success', 'LEVEL UP! 🚀', `You are now Level ${newLevel}! Keep it up.`);
          // Unlock new level badge
          get().unlockBadge(
            `lvl_${newLevel}`,
            `Level ${newLevel} Fan`,
            '🏆',
            `Reached Fan Level ${newLevel}`
          );
        }
      }, 50);

      return {
        fan: {
          ...fanState,
          xp: newXP,
          level: newLevel
        }
      };
    });
  },
  unlockBadge: (badgeId, badgeName, icon, description) => {
    set(state => {
      const fanState = state.fan || {
        username: 'COURT_CRUSADER',
        avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=hoops',
        level: 1,
        xp: 25,
        badges: MOCK_BADGES
      };
      const badges = fanState.badges || [];
      if (badges.some(b => b.id === badgeId)) return {};
      
      const newBadge = {
        id: badgeId,
        name: badgeName,
        icon,
        description,
        unlockedAt: new Date().toISOString()
      };

      setTimeout(() => {
        get().addToast('info', 'Badge Unlocked! 🏅', `Earned: ${badgeName}`);
      }, 100);

      return {
        fan: {
          ...fanState,
          badges: [...badges, newBadge]
        }
      };
    });
  },

  // Ticket Selection implementation
  selectedSeats: [],
  selectSeat: (seat) => {
    set(state => {
      const exists = state.selectedSeats.includes(seat);
      const newSeats = exists
        ? state.selectedSeats.filter(s => s !== seat)
        : [...state.selectedSeats, seat];
      return { selectedSeats: newSeats };
    });
  },
  clearSelectedSeats: () => set({ selectedSeats: [] }),
  bookedTickets: [],
  bookSeats: (matchId, opponent, date) => {
    const seats = get().selectedSeats;
    if (seats.length === 0) return;

    set(state => {
      const newBookings = seats.map(seat => ({
        matchId,
        opponent,
        seatNumber: seat,
        qrCode: `VBC-TIX-${matchId}-${seat}-${Math.floor(1000 + Math.random() * 9000)}`,
        date
      }));

      // Grant XP
      setTimeout(() => {
        get().addXP(50 * seats.length);
        get().addToast('success', 'Tickets Booked!', `Successfully booked ${seats.length} seats.`);
      }, 50);

      return {
        bookedTickets: [...state.bookedTickets, ...newBookings],
        selectedSeats: []
      };
    });
  },
  verifyTicket: (qrCode) => {
    set(state => {
      const tickets = state.bookedTickets.map(t => {
        if (t.qrCode === qrCode) {
          return { ...t, verified: true };
        }
        return t;
      });
      return { bookedTickets: tickets };
    });
  },

  // Toasts implementation
  toasts: [],
  addToast: (type, title, message) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    set(state => ({
      toasts: [...state.toasts, { id, type, title, message }]
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },
  removeToast: (id) => set(state => ({
    toasts: state.toasts.filter(t => t.id !== id)
  }))
    }),
    {
      name: 'premium-hoops-storage',
      partialize: (state) => ({
        cart: state.cart,
        fan: state.fan,
        bookedTickets: state.bookedTickets,
        firebaseUser: state.firebaseUser,
        language: state.language,
      }),
    }
  )
);
export default useAppStore;
