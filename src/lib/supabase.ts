import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const isValidSupabaseKey = (key: string) => {
  if (typeof key !== 'string') return false;
  const k = key.trim();
  return (k.startsWith('eyJ') && k.split('.').length === 3) || k.startsWith('sb_publishable_');
};

// Create actual client if keys are present and key is a valid JWT
export const realSupabase = supabaseUrl && supabaseAnonKey && isValidSupabaseKey(supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;


// Mock Data Store
export interface Player {
  id: string;
  name: string;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  number: number;
  height: string;
  weight: string;
  photo: string;
  bio: string;
  stats: {
    ppg: number;
    apg: number;
    rpg: number;
    spg: number;
    bpg: number;
  };
  highlight_url: string;
  awards?: string[];
  social_handle?: string;
  followers?: string;
  social_feed?: string[];
}

export interface Match {
  id: string;
  opponent: string;
  opponent_logo: string;
  date: string;
  venue: string;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  score_home: number;
  score_away: number;
  quarter?: number;
  time_remaining?: string;
}

export interface Standing {
  id: string;
  team_name: string;
  wins: number;
  losses: number;
  points: number;
  streak: string;
}

export interface Comment {
  id: string;
  match_id: string;
  user_id: string;
  username: string;
  avatar: string;
  content: string;
  created_at: string;
}

export interface Merchandise {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'jersey' | 'shoes' | 'caps' | 'accessories';
  stock: number;
  description: string;
  is_locked?: boolean;
}

export interface Manager {
  id: string;
  name: string;
  title: string;
  photo: string;
  bio: string;
}

export interface Milestone {
  id: string;
  year: string;
  title: string;
  desc: string;
  icon: string;
}

export interface ActiveSession {
  id: string;
  username: string;
  avatar: string;
  last_active: string;
}

const initialManager: Manager[] = [
  {
    id: 'mngr1',
    name: 'Coach Gunawan',
    title: 'Head Coach & Athletic Director',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    bio: 'With over 15 years of coaching experience, Coach Gunawan has led Al Hikmah to multiple championship victories. He focuses on discipline, tactical precision, and team chemistry.'
  }
];

// Initial Mock Data
const initialPlayers: Player[] = [
  {
    id: 'player1',
    name: 'Marcus "The Spark" Vance',
    position: 'PG',
    number: 3,
    height: '188 cm',
    weight: '84 kg',
    photo: 'https://images.unsplash.com/photo-1544605566-031e2850400b?auto=format&fit=crop&q=80&w=400',
    bio: 'Captain and primary playmaker. Known for court vision, lightning-fast crossovers, and clutch three-pointers.',
    stats: { ppg: 18.5, apg: 7.2, rpg: 4.1, spg: 2.1, bpg: 0.3 },
    highlight_url: 'https://youtu.be/fGNu9WiTqXg'
  },
  {
    id: 'player2',
    name: 'Candra "Sniper" Wijaya',
    position: 'SG',
    number: 7,
    height: '192 cm',
    weight: '88 kg',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    bio: 'Elite perimeter shooter. Holds the school record for most three-pointers made in a single season.',
    stats: { ppg: 16.2, apg: 2.4, rpg: 3.8, spg: 1.2, bpg: 0.5 },
    highlight_url: 'https://youtu.be/fGNu9WiTqXg'
  },
  {
    id: 'player3',
    name: 'Fikri "Airborn" Halim',
    position: 'SF',
    number: 11,
    height: '198 cm',
    weight: '92 kg',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    bio: 'Versatile wing defender and high-flyer. Dominates transition play and finishes strong at the rim.',
    stats: { ppg: 14.8, apg: 3.1, rpg: 6.5, spg: 1.8, bpg: 1.1 },
    highlight_url: 'https://youtu.be/fGNu9WiTqXg'
  },
  {
    id: 'player4',
    name: 'Rian "The Wall" Ardianto',
    position: 'PF',
    number: 15,
    height: '203 cm',
    weight: '98 kg',
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400',
    bio: 'Interior force and rebound magnet. Provides elite screen-setting and mid-range pick-and-pop threats.',
    stats: { ppg: 12.4, apg: 1.8, rpg: 8.9, spg: 0.9, bpg: 1.5 },
    highlight_url: 'https://youtu.be/fGNu9WiTqXg'
  },
  {
    id: 'player5',
    name: 'Bagas "Gigant" Maulana',
    position: 'C',
    number: 23,
    height: '208 cm',
    weight: '105 kg',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
    bio: 'Paint protector and lob threat. A double-double machine who anchors the entire defensive system.',
    stats: { ppg: 15.1, apg: 1.2, rpg: 11.3, spg: 0.5, bpg: 2.8 },
    highlight_url: 'https://youtu.be/fGNu9WiTqXg'
  }
];

const initialMatches: Match[] = [
  {
    id: 'match1',
    opponent: 'Solar Flares',
    opponent_logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100',
    date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    venue: 'Al Hikmah Arena',
    status: 'UPCOMING',
    score_home: 0,
    score_away: 0
  },
  {
    id: 'match2',
    opponent: 'Apex Predators',
    opponent_logo: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=100',
    date: new Date(Date.now() - 86400000).toISOString(), // yesterday
    venue: 'Apex Dome',
    status: 'FINISHED',
    score_home: 88,
    score_away: 82
  }
];

const initialStandings: Standing[] = [
  { id: 'std1', team_name: 'BSQ ALL-FIVE', wins: 12, losses: 2, points: 38, streak: 'W5' },
  { id: 'std2', team_name: 'Solar Flares', wins: 10, losses: 4, points: 34, streak: 'W1' },
  { id: 'std3', team_name: 'Apex Predators', wins: 9, losses: 5, points: 32, streak: 'L2' },
  { id: 'std4', team_name: 'Golden Eagles', wins: 7, losses: 7, points: 28, streak: 'L1' }
];

const initialMerchandise: Merchandise[] = [
  {
    id: 'merch1',
    name: 'BSQ Vapor Elite Home Jersey',
    price: 1200000,
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=400',
    category: 'jersey',
    stock: 25,
    description: 'The official authentic BSQ ALL-FIVE home jersey. Engineered with breathable double-knit fabric and quick-drying technology. Features Marcus Vance #3.',
    is_locked: false
  },
  {
    id: 'merch2',
    name: 'BSQ Apex-1 "Fire" Shoes',
    price: 1800000,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400',
    category: 'shoes',
    stock: 12,
    description: 'Designed for high-impact jumping and quick changes of direction. Responsive foam cushioning system wrapped in synthetic leather with neon orange accents.',
    is_locked: false
  },
  {
    id: 'merch3',
    name: 'Championship Legacy Snapback',
    price: 350000,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=400',
    category: 'caps',
    stock: 50,
    description: 'Adjustable snapback cap celebrating the BSQ ALL-FIVE multi-year legacy. High-density embroidered gold crest on deep black fabric.',
    is_locked: false
  },
  {
    id: 'merch4',
    name: 'Championship Edition Blackout Hoodie',
    price: 750000,
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=400',
    category: 'jersey',
    stock: 18,
    description: 'Premium heavyweight cotton fleece hoodie. Minimalist black-on-black logo with custom orange drawcords. Loose, athletic fit.',
    is_locked: false
  },
  {
    id: 'merch5',
    name: 'BSQ Elastic Grip Wristbands (2x)',
    price: 150000,
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&q=80&w=400',
    category: 'accessories',
    stock: 100,
    description: 'Super-absorbent, ultra-elastic wristbands in core team colors. Knitted logo details.',
    is_locked: false
  }
];

const initialComments: Comment[] = [];

const initialMilestones: Milestone[] = [
  { id: 'ms1', year: '2015', title: 'Era Pendirian', desc: 'Tim basket didirikan di bawah program olahraga sekolah Al Hikmah Cirebon, dimulai dari lapangan luar ruangan sederhana.', icon: '🏫' },
  { id: 'ms2', year: '2018', title: 'Piala Regional Pertama', desc: 'Memenangkan piala kejuaraan sekolah regional pertama di Cirebon, menancapkan nama kami di antara tim sekolah lainnya.', icon: '🏆' },
  { id: 'ms3', year: '2020', title: 'Rebranding Tim', desc: 'Mengadopsi identitas baru dan meresmikan aula basket sekolah dalam ruangan dengan fasilitas premium.', icon: '🎨' },
  { id: 'ms4', year: '2023', title: 'Kejayaan Piala DBL', desc: 'Meraih piala bergengsi DBL regional antar-sekolah untuk pertama kalinya dalam pertandingan final yang epik.', icon: '📈' },
  { id: 'ms5', year: '2026', title: 'Gelar Nasional Ke-5', desc: 'Menutup musim tanpa kekalahan, mengamankan trofi kejuaraan ke-5 berturut-turut dan memperkuat warisan olahraga sekolah.', icon: '👑' },
  { id: 'ms6', year: '2028', title: 'Sentra Akademi & Beasiswa Atlet', desc: 'Peresmian BSQ Youth Academy untuk melahirkan atlet berprestasi nasional sekaligus jaminan beasiswa pendidikan penuh.', icon: '🌐' }
];

// Helper Functions to read and write LocalStorage
const getStorageTable = (table: string): any[] => {
  if (typeof window === 'undefined') return [];
  const version = table === 'standings' ? 'v3' : 'v2';
  const val = localStorage.getItem(`bsq_db_${version}_${table}`);
  return val ? JSON.parse(val) : [];
};

const setStorageTable = (table: string, data: any[]) => {
  const version = table === 'standings' ? 'v3' : 'v2';
  localStorage.setItem(`bsq_db_${version}_${table}`, JSON.stringify(data));
};

// Seed Local Database if not present or empty
if (typeof window !== 'undefined') {
  const getParsedLength = (table: string): number => {
    try {
      const data = getStorageTable(table);
      return Array.isArray(data) ? data.length : 0;
    } catch {
      return 0;
    }
  };

  if (!localStorage.getItem('bsq_db_v2_players') || getParsedLength('players') === 0) setStorageTable('players', initialPlayers);
  if (!localStorage.getItem('bsq_db_v2_matches') || getParsedLength('matches') === 0) setStorageTable('matches', initialMatches);
  if (!localStorage.getItem('bsq_db_v3_standings') || getParsedLength('standings') === 0) setStorageTable('standings', initialStandings);
  if (!localStorage.getItem('bsq_db_v2_merchandise') || getParsedLength('merchandise') === 0) setStorageTable('merchandise', initialMerchandise);
  if (!localStorage.getItem('bsq_db_v2_comments')) setStorageTable('comments', initialComments);
  if (!localStorage.getItem('bsq_db_v2_manager') || getParsedLength('manager') === 0) setStorageTable('manager', initialManager);
  if (!localStorage.getItem('bsq_db_v2_milestones') || getParsedLength('milestones') < initialMilestones.length) {
    setStorageTable('milestones', initialMilestones);
  }
  if (!localStorage.getItem('bsq_db_v2_active_sessions')) setStorageTable('active_sessions', []);

  // Self-heal old player highlight links in local storage
  try {
    const currentLocalPlayers = getStorageTable('players');
    if (Array.isArray(currentLocalPlayers) && currentLocalPlayers.length > 0) {
      let updated = false;
      const healedPlayers = currentLocalPlayers.map((p: any) => {
        if (p.highlight_url === 'https://www.w3schools.com/html/mov_bbb.mp4' || !p.highlight_url) {
          p.highlight_url = 'https://youtu.be/fGNu9WiTqXg';
          updated = true;
        }
        return p;
      });
      if (updated) {
        setStorageTable('players', healedPlayers);
      }
    }
  } catch (e) {
    console.error('Failed to self-heal players list in localStorage:', e);
  }
}

// Subscriptions management for Realtime simulation
type ChangeCallback = (payload: any) => void;
const subscribers: { [channel: string]: ChangeCallback[] } = {};

const syncChannel = typeof window !== 'undefined' ? new BroadcastChannel('premium_hoops_realtime') : null;

const triggerCallbacks = (table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => {
  const channelKey = `${table}:${event}`;
  const wildcardKey = `${table}:*`;
  
  const trigger = (key: string) => {
    if (subscribers[key]) {
      subscribers[key].forEach(cb => cb(payload));
    }
  };
  trigger(channelKey);
  trigger(wildcardKey);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`bsq_${table}_updated`));
  }
};

if (syncChannel) {
  syncChannel.onmessage = (e) => {
    const { table, event, payload } = e.data;
    triggerCallbacks(table, event, payload);
  };
}

// Helper to broadcast changes
export const broadcastRealtime = (table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => {
  triggerCallbacks(table, event, payload);
  if (syncChannel) {
    syncChannel.postMessage({ table, event, payload });
  }
};

// (Production) Simulated active game score updater has been removed to allow manual admin control.

// Fluent Mock Supabase Query Builder with LocalStorage CRUD support
export const mockSupabase = {
  from: (table: string) => {
    let filterColumn: string | null = null;
    let filterValue: any = null;
    let updateData: any = null;
    let isDelete = false;
    let insertData: any = null;

    const executeQuery = () => {
      let dataList = getStorageTable(table);

      // Handle Delete operations
      if (isDelete) {
        if (filterColumn) {
          const originalLength = dataList.length;
          const removedItem = dataList.find(item => item[filterColumn!] === filterValue);
          dataList = dataList.filter(item => item[filterColumn!] !== filterValue);
          
          if (dataList.length !== originalLength) {
            setStorageTable(table, dataList);
            broadcastRealtime(table, 'DELETE', { old: removedItem });
          }
        }
        return { data: [], error: null };
      }

      // Handle Update operations
      if (updateData) {
        if (filterColumn) {
          let updatedItem: any = null;
          dataList = dataList.map(item => {
            if (item[filterColumn!] === filterValue) {
              updatedItem = { ...item, ...updateData };
              return updatedItem;
            }
            return item;
          });
          if (updatedItem) {
            setStorageTable(table, dataList);
            broadcastRealtime(table, 'UPDATE', { new: updatedItem });
          }
        }
        return { data: [], error: null };
      }

      // Handle Insert operations
      if (insertData) {
        const records = Array.isArray(insertData) ? insertData : [insertData];
        const newRecords = records.map(record => {
          let formattedRecord = { ...record };
          if (!formattedRecord.id) {
            formattedRecord.id = `${table.slice(0, 3)}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          }
          if (!formattedRecord.created_at) {
            formattedRecord.created_at = new Date().toISOString();
          }
          // Custom avatar seeding for comments
          if (table === 'comments') {
            formattedRecord.avatar = formattedRecord.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${formattedRecord.username}`;
          }
          return formattedRecord;
        });

        const merged = [...dataList, ...newRecords];
        setStorageTable(table, merged);
        
        newRecords.forEach(rec => {
          broadcastRealtime(table, 'INSERT', { new: rec });
        });
        
        return { data: newRecords, error: null };
      }

      // Handle Select operations
      let results = [...dataList];
      if (filterColumn) {
        results = results.filter(item => item[filterColumn!] === filterValue);
      }
      return { data: results, error: null };
    };

    const chain = {
      select: () => chain,
      insert: (record: any) => {
        insertData = record;
        return chain;
      },
      update: (record: any) => {
        updateData = record;
        return chain;
      },
      delete: () => {
        isDelete = true;
        return chain;
      },
      eq: (columnName: string, value: any) => {
        filterColumn = columnName;
        filterValue = value;
        return chain;
      },
      order: (orderCol: string, { ascending = true } = {}) => {
        const orderChain = {
          then: (resolve: any) => {
            const { data } = executeQuery();
            const sorted = [...data].sort((a, b) => {
              const valA = a[orderCol];
              const valB = b[orderCol];
              if (typeof valA === 'string') {
                return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
              }
              return ascending ? valA - valB : valB - valA;
            });
            return Promise.resolve({ data: sorted, error: null }).then(resolve);
          }
        };
        return orderChain;
      },
      then: (resolve: any) => {
        const { data, error } = executeQuery();
        return Promise.resolve({ data, error }).then(resolve);
      }
    };

    return chain;
  },
  channel: (_channelName: string) => {
    return {
      on: (_eventType: string, filter: any, callback: ChangeCallback) => {
        const table = filter.table;
        const event = filter.event || '*';
        const key = `${table}:${event}`;
        if (!subscribers[key]) {
          subscribers[key] = [];
        }
        subscribers[key].push(callback);
        return {
          subscribe: () => {
            return {
              unsubscribe: () => {
                subscribers[key] = subscribers[key].filter(cb => cb !== callback);
              }
            };
          }
        };
      }
    };
  },
  auth: {
    signInWithPassword: async ({ email, password }: any) => {
      // Mock validation
      if (email === 'admin@bsq.com' && password === 'admin2026') return { data: { user: { id: 'admin1', role: 'admin' } }, error: null };
      if (email === 'coach@bsq.com' && password === 'coach2026') return { data: { user: { id: 'coach1', role: 'coach' } }, error: null };
      if (email === 'shop@bsq.com' && password === 'shop2026') return { data: { user: { id: 'shop1', role: 'shop_manager' } }, error: null };
      return { data: null, error: new Error("Invalid credentials") };
    },
    signOut: async () => {
      return { error: null };
    }
  }
};

// Export active supabase database layer (uses real if connected, else mock)
export const db: any = realSupabase || mockSupabase;
export default db;
