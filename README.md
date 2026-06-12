# BSQ ALL-FIVE | Elite Pro Basketball Franchise Website

Welcome to the official web portal of **BSQ ALL-FIVE**, a professional basketball franchise. This premium website is engineered with cinematic designs, fluid micro-animations, and interactive sports management features built to the aesthetic standards of NBA, Nike, and Apple landing pages.

---

## 🚀 Key Features

### 1. Hero Showcase & Player Slider
- **3D Cinematic Camera**: Cinematic entry animations and smooth camera movements.
- **Player Infinity Slider**: A looping horizontal marquee showing player cards (natural positions, names, jersey numbers) with hover-magnification and auto-scroll direction matching LTR/RTL locales.

### 2. Interactive Tactical Playbook
- **Playbook Board**: Visualize offensive transitions (e.g. pick-and-roll transition into low-post isolation) with animated paths and court indicators.
- **Interactive Player Nodes**: Click individual nodes on the tactical board to inspect active game stats.

### 3. Meet the Titans (Roster & Lineup Builder)
- **GSAP Hover Counters**: Hovering over player cards triggers a count-up animation of career stats (PPG, APG, RPG).
- **Audio Synthesizer**: Programmatic, retro synth sound effects generated via the browser's Web Audio API for interactive clicks, drafting, and unlocks.
- **Dream 5 Lineup Builder**: Draft your starting five directly onto a 2D court mapping that computes real-time OVR, OFF, DEF, and CHEM ratings. Locking the lineup triggers a laser energy-line visual effect.
- **Versus Battle Arena**: Compare career stats side-by-side inside a video-game-style modal showing win probability meters and matchup analytics.

### 4. Match Center & Standings
- **Simulator Node**: Local simulation engine automating live scores and quarter times.
- **Standings Tracker**: Dynamically lists league tables, tracking wins, losses, streak stats, and points.

### 5. Seating Booking Visualizer (Al Hikmah Arena)
- **Single Tribune Map**: Tailored seating mapping for Al Hikmah Arena's Main Stand (Tribun Utama) displaying a **6 rows × 10 columns** interactive grid.
- **Flat Seating Rate**: Flat pricing at **Rp 500.000** with pre-booked occupied coordinates.
- **Digital Access Card**: Checkout yields instant tickets populated with custom QR access codes.

### 6. Official Merchandise Store
- **Store Catalog**: Browse jerseys, sneakers, caps, and accessories with pricing formatted in IDR (`Rp`).
- **Cart Drawer**: Add to cart, choose custom sizes, and check out with instant clubhouse XP rewards.

### 7. Fan Clubhouse & Gamification
- **Clubhouse Chat**: Live fan discussion portal with local message history.
- **Championship Predictor**: Predict scores of upcoming games to accumulate XP.
- **Profile Levels**: Level up your clubhouse rank and earn achievement badges (e.g., Early Fan, Level 5 Champion) as XP builds.

---

## 🔑 Administrative Portal (Role-Based Access Control)

Access the console by clicking the **🔑 Administration Console** link in the website footer. The portal utilizes **RBAC (Role-Based Access Control)** authentication:

| Administrative Role | Passcode | Panel Access | Icon |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin2026` / `vortex2026` | Full access to all panels (Matches, Roster, Shop, Standings) | `Shield` |
| **Head Coach** | `coach2026` | Matches, Roster, Playbook & Coach Settings | `Users` |
| **Inventory Manager** | `shop2026` | Shop Catalog Management only (Direct auto-landing focus) | `Tag` |

---

## 🛠️ Technology Stack

- **Core**: React 19, Vite, TypeScript
- **Styling & Animations**: Tailwind CSS, Framer Motion, GSAP
- **3D Graphics**: Three.js, React Three Fiber (R3F)
- **State Management**: Zustand
- **Database & Auth**: Supabase Database client configuration
- **Icons**: Lucide React
- **Internationalization**: Custom i18n support (English `en`, Indonesian `id`, Arabic `ar` with Native RTL layout mirror)

---

## 💻 Local Setup & Installation

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd premium-hoops
   ```

2. **Configure Environment Variables**:
   Copy the `.env.example` file to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Launch Local Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   ```
