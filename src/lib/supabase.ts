import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create actual client if keys are present
export const realSupabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

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

const initialManager: Manager[] = [];

// Initial Mock Data
const initialPlayers: Player[] = [];

const initialMatches: Match[] = [];

const initialStandings: Standing[] = [];

const initialMerchandise: Merchandise[] = [
  {
    id: 'merch1',
    name: 'BSQ Vapor Elite Home Jersey',
    price: 1200000,
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=400',
    category: 'jersey',
    stock: 25,
    description: 'The official authentic BSQ ALL-FIVE home jersey. Engineered with breathable double-knit fabric and quick-drying technology. Features Marcus Vance #3.'
  },
  {
    id: 'merch2',
    name: 'BSQ Apex-1 "Fire" Shoes',
    price: 1800000,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400',
    category: 'shoes',
    stock: 12,
    description: 'Designed for high-impact jumping and quick changes of direction. Responsive foam cushioning system wrapped in synthetic leather with neon orange accents.'
  },
  {
    id: 'merch3',
    name: 'Championship Legacy Snapback',
    price: 350000,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=400',
    category: 'caps',
    stock: 50,
    description: 'Adjustable snapback cap celebrating the BSQ ALL-FIVE multi-year legacy. High-density embroidered gold crest on deep black fabric.'
  },
  {
    id: 'merch4',
    name: 'Championship Edition Blackout Hoodie',
    price: 750000,
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=400',
    category: 'jersey',
    stock: 18,
    description: 'Premium heavyweight cotton fleece hoodie. Minimalist black-on-black logo with custom orange drawcords. Loose, athletic fit.'
  },
  {
    id: 'merch5',
    name: 'BSQ Elastic Grip Wristbands (2x)',
    price: 150000,
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&q=80&w=400',
    category: 'accessories',
    stock: 100,
    description: 'Super-absorbent, ultra-elastic wristbands in core team colors. Knitted logo details.'
  }
];

const initialComments: Comment[] = [];

const initialMilestones: Milestone[] = [
  { id: 'ms1', year: '2015', title: 'Era Pendirian', desc: 'Tim basket didirikan di bawah program olahraga sekolah Al Hikmah Cirebon, dimulai dari lapangan luar ruangan sederhana.', icon: '🏫' },
  { id: 'ms2', year: '2018', title: 'Piala Regional Pertama', desc: 'Memenangkan piala kejuaraan sekolah regional pertama di Cirebon, menancapkan nama kami di antara tim sekolah lainnya.', icon: '🏆' },
  { id: 'ms3', year: '2020', title: 'Rebranding Tim', desc: 'Mengadopsi identitas baru dan meresmikan aula basket sekolah dalam ruangan dengan fasilitas premium.', icon: '🎨' },
  { id: 'ms4', year: '2023', title: 'Kejayaan Piala DBL', desc: 'Meraih piala bergengsi DBL regional antar-sekolah untuk pertama kalinya dalam pertandingan final yang epik.', icon: '📈' },
  { id: 'ms5', year: '2026', title: 'Gelar Nasional Ke-5', desc: 'Menutup musim tanpa kekalahan, mengamankan trofi kejuaraan ke-5 berturut-turut dan memperkuat warisan olahraga sekolah.', icon: '👑' }
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

// Seed Local Database if not present
if (typeof window !== 'undefined') {
  if (!localStorage.getItem('bsq_db_v2_players')) setStorageTable('players', initialPlayers);
  if (!localStorage.getItem('bsq_db_v2_matches')) setStorageTable('matches', initialMatches);
  if (!localStorage.getItem('bsq_db_v3_standings')) setStorageTable('standings', initialStandings);
  if (!localStorage.getItem('bsq_db_v2_merchandise')) setStorageTable('merchandise', initialMerchandise);
  if (!localStorage.getItem('bsq_db_v2_comments')) setStorageTable('comments', initialComments);
  if (!localStorage.getItem('bsq_db_v2_manager')) setStorageTable('manager', initialManager);
  if (!localStorage.getItem('bsq_db_v2_milestones')) setStorageTable('milestones', initialMilestones);
}

// Subscriptions management for Realtime simulation
type ChangeCallback = (payload: any) => void;
const subscribers: { [channel: string]: ChangeCallback[] } = {};

// Helper to broadcast changes
export const broadcastRealtime = (table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => {
  const channelKey = `${table}:${event}`;
  const wildcardKey = `${table}:*`;
  
  const trigger = (key: string) => {
    if (subscribers[key]) {
      subscribers[key].forEach(cb => cb(payload));
    }
  };
  trigger(channelKey);
  trigger(wildcardKey);
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
            return resolve({ data: sorted, error: null });
          }
        };
        return orderChain;
      },
      then: (resolve: any) => {
        const { data, error } = executeQuery();
        return resolve({ data, error });
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
  }
};

// Export active supabase database layer (uses real if connected, else mock)
export const db: any = realSupabase || mockSupabase;
export default db;
