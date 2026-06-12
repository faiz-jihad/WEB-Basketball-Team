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

const initialManager: Manager[] = [
  {
    id: 'mngr1',
    name: 'Dominic Sterling',
    title: 'Head Coach & General Manager',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600',
    bio: 'Dominic Sterling has coached the BSQ ALL-FIVE franchise to 5 championships over a decade. His strategic vision and motivational leadership are legendary in the basketball world.'
  }
];

// Initial Mock Data
const initialPlayers: Player[] = [
  {
    id: 'p1',
    name: 'Marcus "Viper" Vance',
    position: 'PG',
    number: 3,
    height: '191 cm',
    weight: '85 kg',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600',
    bio: 'Marcus Vance is the floor general of BSQ ALL-FIVE, known for his lightning-quick crossovers, elite court vision, and cold-blooded clutch shots in the fourth quarter.',
    stats: { ppg: 22.4, apg: 8.2, rpg: 4.1, spg: 2.1, bpg: 0.3 },
    highlight_url: 'https://www.w3schools.com/html/mov_bbb.mp4'
  },
  {
    id: 'p2',
    name: 'Jalen "Spitfire" Ross',
    position: 'SG',
    number: 11,
    height: '198 cm',
    weight: '92 kg',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600',
    bio: 'Jalen Ross is a lethal scorer from anywhere on the court. His high-release jumpshot and gravity-defying athletic drives make him a constant perimeter threat.',
    stats: { ppg: 25.8, apg: 3.1, rpg: 4.3, spg: 1.5, bpg: 0.6 },
    highlight_url: 'https://www.w3schools.com/html/movie.mp4'
  },
  {
    id: 'p3',
    name: 'Kaelen "The Shield" Carter',
    position: 'SF',
    number: 8,
    height: '203 cm',
    weight: '102 kg',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    bio: 'The defensive anchor and heart of BSQ ALL-FIVE. Carter guards the opposing team\'s best scorer every night and initiates fastbreaks with aggressive rebounds.',
    stats: { ppg: 18.5, apg: 5.2, rpg: 7.4, spg: 2.3, bpg: 1.2 },
    highlight_url: 'https://www.w3schools.com/html/mov_bbb.mp4'
  },
  {
    id: 'p4',
    name: 'Tariq "Apex" Stone',
    position: 'PF',
    number: 23,
    height: '208 cm',
    weight: '110 kg',
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600',
    bio: 'Tariq Stone operates above the rim. Known for thunderous alley-oops, pick-and-roll dominance, and high-intensity energy that ignites the stadium crowd.',
    stats: { ppg: 20.1, apg: 2.5, rpg: 10.5, spg: 0.9, bpg: 1.8 },
    highlight_url: 'https://www.w3schools.com/html/movie.mp4'
  },
  {
    id: 'p5',
    name: 'Nikolai "The Wall" Volkov',
    position: 'C',
    number: 41,
    height: '216 cm',
    weight: '120 kg',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    bio: 'Originally from Eastern Europe, Volkov towers over opponents. A premier rim protector who commands the glass, blocks shots, and facilitates with high-post passing.',
    stats: { ppg: 15.2, apg: 3.4, rpg: 12.8, spg: 0.5, bpg: 3.2 },
    highlight_url: 'https://www.w3schools.com/html/mov_bbb.mp4'
  }
];

const initialMatches: Match[] = [
  {
    id: 'm1',
    opponent: 'Cyber Knights',
    opponent_logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toISOString(), // 2 days ago
    venue: 'Al Hikmah Arena',
    status: 'FINISHED',
    score_home: 112,
    score_away: 105
  },
  {
    id: 'm2',
    opponent: 'Apex Predators',
    opponent_logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100',
    date: new Date().toISOString(), // Today (Live Match)
    venue: 'Apex Center, New York',
    status: 'LIVE',
    score_home: 98,
    score_away: 96,
    quarter: 4,
    time_remaining: '04:22'
  },
  {
    id: 'm3',
    opponent: 'Solar Flares',
    opponent_logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000 * 2).toISOString(), // 2 days later
    venue: 'Al Hikmah Arena',
    status: 'UPCOMING',
    score_home: 0,
    score_away: 0
  },
  {
    id: 'm4',
    opponent: 'Titan Giants',
    opponent_logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000 * 5).toISOString(), // 5 days later
    venue: 'Colosseum Dome, Chicago',
    status: 'UPCOMING',
    score_home: 0,
    score_away: 0
  }
];

const initialStandings: Standing[] = [
  { id: 's1', team_name: 'BSQ ALL-FIVE', wins: 42, losses: 12, points: 96, streak: 'W5' },
  { id: 's2', team_name: 'Cyber Knights', wins: 39, losses: 15, points: 93, streak: 'W2' },
  { id: 's3', team_name: 'Apex Predators', wins: 38, losses: 16, points: 92, streak: 'L1' },
  { id: 's4', team_name: 'Titan Giants', wins: 32, losses: 22, points: 86, streak: 'W1' },
  { id: 's5', team_name: 'Solar Flares', wins: 28, losses: 26, points: 82, streak: 'L3' },
  { id: 's6', team_name: 'Neon Phantoms', wins: 24, losses: 30, points: 78, streak: 'L2' },
  { id: 's7', team_name: 'Giga Titans', wins: 20, losses: 34, points: 74, streak: 'W1' },
  { id: 's8', team_name: 'Crimson Fury', wins: 15, losses: 39, points: 69, streak: 'L5' }
];

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

const initialComments: Comment[] = [
  {
    id: 'c1',
    match_id: 'm2',
    user_id: 'u_user1',
    username: 'SLAM_DUNKER',
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=slam',
    content: 'Marcus Vance is cooking tonight! What a pass!',
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString()
  },
  {
    id: 'c2',
    match_id: 'm2',
    user_id: 'u_user2',
    username: 'BSQ_FAN_99',
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=vortex',
    content: 'Apex Predators defense is tight, but Tariq Stone is dominating the paint.',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString()
  },
  {
    id: 'c3',
    match_id: 'm2',
    user_id: 'u_user3',
    username: 'HoopLover_ID',
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=hoop',
    content: 'CLUTCH TIME! Ross for three! Let\'s go BSQ!',
    created_at: new Date(Date.now() - 30 * 1000).toISOString()
  }
];

// Helper Functions to read and write LocalStorage
const getStorageTable = (table: string): any[] => {
  if (typeof window === 'undefined') return [];
  const val = localStorage.getItem(`bsq_db_${table}`);
  return val ? JSON.parse(val) : [];
};

const setStorageTable = (table: string, data: any[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`bsq_db_${table}`, JSON.stringify(data));
};

// Seed Local Database if not present
if (typeof window !== 'undefined') {
  if (!localStorage.getItem('bsq_db_players')) setStorageTable('players', initialPlayers);
  if (!localStorage.getItem('bsq_db_matches')) setStorageTable('matches', initialMatches);
  if (!localStorage.getItem('bsq_db_standings')) setStorageTable('standings', initialStandings);
  if (!localStorage.getItem('bsq_db_merchandise')) setStorageTable('merchandise', initialMerchandise);
  if (!localStorage.getItem('bsq_db_comments')) setStorageTable('comments', initialComments);
  if (!localStorage.getItem('bsq_db_manager')) setStorageTable('manager', initialManager);
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

// Simulated active game score updater (running in background)
if (typeof window !== 'undefined') {
  // Let's check if score simulation is enabled
  if (localStorage.getItem('vbc_score_simulation') === null) {
    localStorage.setItem('vbc_score_simulation', 'true');
  }

  setInterval(() => {
    if (localStorage.getItem('vbc_score_simulation') !== 'true') return;

    const matchesList = getStorageTable('matches');
    const liveMatchIndex = matchesList.findIndex(m => m.status === 'LIVE');
    if (liveMatchIndex !== -1) {
      const liveMatch = { ...matchesList[liveMatchIndex] };
      const homeTicks = Math.random() > 0.65;
      const awayTicks = Math.random() > 0.65;

      if (homeTicks) liveMatch.score_home += Math.random() > 0.7 ? 3 : 2;
      if (awayTicks) liveMatch.score_away += Math.random() > 0.7 ? 3 : 2;

      // Update timer remaining
      let [min, sec] = (liveMatch.time_remaining || '04:22').split(':').map(Number);
      if (sec > 0) {
        sec -= 1;
      } else if (min > 0) {
        min -= 1;
        sec = 59;
      } else {
        liveMatch.status = 'FINISHED';
      }
      liveMatch.time_remaining = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
      matchesList[liveMatchIndex] = liveMatch;
      
      setStorageTable('matches', matchesList);

      // Broadcast update
      broadcastRealtime('matches', 'UPDATE', { new: liveMatch });
    }

    // Simulate community comments
    const randomComments = [
      'Defense is slipping! We need Nikolai to lock down.',
      'WHAT A PLAY! Vance to Stone!! BOOM!',
      'Refs are checking the monitor. Looks like a clean block.',
      'This game is too close for comfort!',
      'WE WANT THE CHAMPIONSHIP!',
      'Apex Predators looking tired in this fourth quarter.',
      'LET\'S GO VORTEX! #VortexHoops'
    ];
    if (Math.random() > 0.85) {
      const liveMatch = matchesList.find(m => m.status === 'LIVE');
      if (liveMatch) {
        const usernameSeed = `fan_${Math.floor(Math.random() * 1000)}`;
        const commentsList = getStorageTable('comments');
        const newComment: Comment = {
          id: `c_rand_${Date.now()}`,
          match_id: liveMatch.id,
          user_id: `u_rand_${Math.random()}`,
          username: usernameSeed.toUpperCase(),
          avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${usernameSeed}`,
          content: randomComments[Math.floor(Math.random() * randomComments.length)],
          created_at: new Date().toISOString()
        };
        commentsList.push(newComment);

        if (commentsList.length > 30) commentsList.shift();
        setStorageTable('comments', commentsList);

        // Broadcast comment
        broadcastRealtime('comments', 'INSERT', { new: newComment });
      }
    }
  }, 3000);
}

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
