import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Key,
  Plus,
  RefreshCw,
  Trash2,
  Tv,
  Users,
  X,
  Shield,
  Tag,
  ChevronLeft,
  LogOut,
  Eye,
  EyeOff,
  Ticket,
  Trophy,
  Save,
  MessageSquare,
  Sparkles,
  Pencil,
  Check,
} from "lucide-react";
import { db } from "../lib/supabase";
import type { Player, Match, Standing, Merchandise, Milestone } from "../lib/supabase";
import useAppStore from "../lib/store";
import { getTranslation } from "../lib/i18n";

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
}) => {
  type AdminRole = "admin" | "coach" | "shop_manager";

  // Load passcodes from env with safe dev fallbacks
  const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSCODE || "admin2026";
  const DEV_PASS = import.meta.env.VITE_DEVELOPER_PASSCODE || "vortex2026";
  const COACH_PASS = import.meta.env.VITE_COACH_PASSCODE || "coach2026";
  const SHOP_PASS = import.meta.env.VITE_SHOP_PASSCODE || "shop2026";

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("bsq_admin_authenticated") === "true";
    }
    return false;
  });

  const [authenticatedRole, setAuthenticatedRole] = useState<AdminRole | null>(
    () => {
      if (typeof window !== "undefined") {
        return sessionStorage.getItem("bsq_admin_role") as AdminRole | null;
      }
      return null;
    },
  );

  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("bsq_admin_role") as AdminRole | null;
    }
    return null;
  });

  const [passcode, setPasscode] = useState("");
  const [passError, setPassError] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "matches" | "roster" | "store" | "standings" | "story" | "bookings"
  >(() => {
    if (typeof window !== "undefined") {
      const savedTab = sessionStorage.getItem("bsq_admin_active_tab") as any;
      if (savedTab) return savedTab;
    }
    return "matches";
  });

  const [newPlayerPhoto, setNewPlayerPhoto] = useState("");
  const [newMerchImage, setNewMerchImage] = useState("");

  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.7);
            setter(compressed);
          } else {
            setter(reader.result as string);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const addToast = useAppStore((state) => state.addToast);
  const addXP = useAppStore((state) => state.addXP);
  const language = useAppStore((state) => state.language);
  const t = (section: string, key: string) =>
    getTranslation(language, section, key);
  const isRtl = language === "ar";

  const getTabLabel = (tab: string) => {
    if (tab === "matches") return t("nav", "matches");
    if (tab === "roster") return t("nav", "roster");
    if (tab === "store") return t("nav", "shop");
    if (tab === "standings") return t("matches", "standingsTitle");
    if (tab === "story") return t("story", "legacy");
    if (tab === "bookings") return "Community & Bookings";
    return tab;
  };

  const getRoleLabel = (role: AdminRole | null) => {
    if (!role) return "";
    if (role === "admin") return t("admin", "roleAdmin");
    if (role === "coach") return t("admin", "roleCoach");
    return t("admin", "roleShop");
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === "jersey") return t("shop", "jerseys");
    if (cat === "shoes") return t("shop", "shoes");
    if (cat === "caps") return t("shop", "caps");
    return t("shop", "accessories");
  };

  // Auth check
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    let isValid = false;
    if (
      selectedRole === "admin" &&
      (passcode === ADMIN_PASS || passcode === DEV_PASS)
    ) {
      isValid = true;
    } else if (selectedRole === "coach" && passcode === COACH_PASS) {
      isValid = true;
    } else if (selectedRole === "shop_manager" && passcode === SHOP_PASS) {
      isValid = true;
    }

    if (isValid) {
      setIsAuthenticated(true);
      setAuthenticatedRole(selectedRole);
      setPassError(false);
      setPasscode("");
      setShowPasscode(false);

      sessionStorage.setItem("bsq_admin_authenticated", "true");
      sessionStorage.setItem("bsq_admin_role", selectedRole);

      // Auto-set the active tab based on what permissions they have
      if (selectedRole === "shop_manager") {
        setActiveTab("store");
        sessionStorage.setItem("bsq_admin_active_tab", "store");
      } else {
        setActiveTab("matches");
        sessionStorage.setItem("bsq_admin_active_tab", "matches");
      }

      addToast(
        "success",
        t("admin", "unlockedToast"),
        t("admin", "unlockedToastDesc"),
      );
      addXP(50); // XP reward for unlocking dashboard
    } else {
      setPassError(true);
      // Reset shake error state after animation finishes so it can trigger again
      setTimeout(() => setPassError(false), 500);
      addToast(
        "warning",
        t("admin", "deniedToast"),
        t("admin", "deniedToastDesc"),
      );
    }
  };

  // State caches for database
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [merchandise, setMerchandise] = useState<Merchandise[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newTeamName, setNewTeamName] = useState("");

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    const newEntry = {
      team_name: newTeamName.trim(),
      wins: 0,
      losses: 0,
      points: 0,
      streak: "-"
    };
    (db as any).from("standings").insert(newEntry).then(() => {
      addToast("success", "Team Added", `${newTeamName} added to standings.`);
      setNewTeamName("");
      loadDatabase();
      window.dispatchEvent(new Event("bsq_standings_updated"));
    });
  };

  const handleDeleteStanding = (id: string, name: string) => {
    if (confirm(`Remove ${name} from standings?`)) {
      (db as any).from("standings").delete().eq("id", id).then(() => {
        addToast("info", "Team Removed", `${name} removed from standings.`);
        loadDatabase();
        window.dispatchEvent(new Event("bsq_standings_updated"));
      });
    }
  };

  const [tournamentName, setTournamentName] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bsq_active_tournament");
      if (saved) return saved;
    }
    return "Tournament Standings";
  });

  const handleSaveTournamentName = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bsq_active_tournament", tournamentName);
      window.dispatchEvent(new Event("bsq_active_tournament_updated"));
      addToast(
        "success",
        "Tournament Rebranded",
        `Active tournament renamed to: ${tournamentName}`,
      );
    }
  };

  const [coachName, setCoachName] = useState("");
  const [coachRoleTitle, setCoachRoleTitle] = useState("");
  const [coachBio, setCoachBio] = useState("");
  const [coachPhoto, setCoachPhoto] = useState("");

  // Load database tables
  const loadDatabase = () => {
    (db as any)
      .from("matches")
      .select("*")
      .order("date", { ascending: true })
      .then(({ data }: any) => {
        if (data) setMatches(data as Match[]);
      });
    (db as any)
      .from("players")
      .select("*")
      .then(({ data }: any) => {
        if (data) setPlayers(data as Player[]);
      });
    (db as any)
      .from("merchandise")
      .select("*")
      .then(({ data }: any) => {
        if (data) setMerchandise(data as Merchandise[]);
      });
    (db as any)
      .from("standings")
      .select("*")
      .order("points", { ascending: false })
      .then(({ data }: any) => {
        if (data) setStandings(data as Standing[]);
      });
    (db as any)
      .from("manager")
      .select("*")
      .then(({ data }: any) => {
        if (data && data[0]) {
          setCoachName(data[0].name);
          setCoachRoleTitle(data[0].title || "");
          setCoachBio(data[0].bio);
          setCoachPhoto(data[0].photo);
        }
      });
    (db as any)
      .from("milestones")
      .select("*")
      .order("year", { ascending: true })
      .then(({ data }: any) => {
        if (data) setMilestones(data as Milestone[]);
      });
  };

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadDatabase();
    }
  }, [isAuthenticated, isOpen]);

  // Match management state
  const [isSimulating, setIsSimulating] = useState(true);
  const [newMatchOpponent, setNewMatchOpponent] = useState("");
  const [newMatchVenue, setNewMatchVenue] = useState("Al Hikmah Arena");
  const [newMatchDate, setNewMatchDate] = useState("");

  const [ticketPrice, setTicketPrice] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bsq_ticket_price");
      return saved !== null ? Number(saved) : 500000;
    }
    return 500000;
  });

  const [ticketStatus, setTicketStatus] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bsq_ticket_status");
      return saved || "open";
    }
    return "open";
  });

  const [chatStatus, setChatStatus] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bsq_chat_status");
      return saved || "open";
    }
    return "open";
  });

  const [predictionStatus, setPredictionStatus] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bsq_prediction_status");
      return saved || "open";
    }
    return "open";
  });

  const handleSaveFanSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("bsq_chat_status", chatStatus);
    localStorage.setItem("bsq_prediction_status", predictionStatus);
    window.dispatchEvent(new Event("bsq_fan_features_updated"));
    addToast(
      "success",
      language === "id" ? "Pengaturan Interaksi Fans Disimpan" : "Fan Settings Saved",
      language === "id" ? "Fitur chat dan prediksi telah diperbarui." : "Chat and prediction features updated."
    );
  };

  const [mvpsCount, setMvpsCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bsq_achievements_mvps");
      return saved !== null ? Number(saved) : 8;
    }
    return 8;
  });

  const [ringsCount, setRingsCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bsq_achievements_rings");
      return saved !== null ? Number(saved) : 5;
    }
    return 5;
  });

  const [winsCount, setWinsCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bsq_achievements_wins");
      return saved !== null ? Number(saved) : 320;
    }
    return 320;
  });

  const handleSaveAchievements = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("bsq_achievements_mvps", String(mvpsCount));
    localStorage.setItem("bsq_achievements_rings", String(ringsCount));
    localStorage.setItem("bsq_achievements_wins", String(winsCount));
    window.dispatchEvent(new Event("bsq_achievements_updated"));
    addToast(
      "success",
      language === "id" ? "Pencapaian Disimpan" : language === "ar" ? "تم حفظ الإنجازات" : "Achievements Saved",
      `${mvpsCount} MVPs | ${ringsCount} Rings | ${winsCount} Wins`
    );
  };

  const [newMilestoneYear, setNewMilestoneYear] = useState("");
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState("");
  const [newMilestoneIcon, setNewMilestoneIcon] = useState("🏆");

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneYear.trim() || !newMilestoneTitle.trim() || !newMilestoneDesc.trim()) return;

    db.from("milestones")
      .insert({
        year: newMilestoneYear.trim(),
        title: newMilestoneTitle.trim(),
        desc: newMilestoneDesc.trim(),
        icon: newMilestoneIcon
      })
      .then(() => {
        loadDatabase();
        window.dispatchEvent(new Event("bsq_milestones_updated"));
        setNewMilestoneYear("");
        setNewMilestoneTitle("");
        setNewMilestoneDesc("");
        setNewMilestoneIcon("🏆");
        addToast(
          "success",
          "Milestone Added",
          `Historical milestone for ${newMilestoneYear} saved successfully.`
        );
      });
  };

  const handleDeleteMilestone = (id: string, year: string) => {
    if (confirm(`Remove milestone for year ${year}?`)) {
      db.from("milestones")
        .delete()
        .eq("id", id)
        .then(() => {
          loadDatabase();
          window.dispatchEvent(new Event("bsq_milestones_updated"));
          addToast("info", "Milestone Removed", `Milestone for ${year} was deleted.`);
        });
    }
  };

  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editMilestoneYear, setEditMilestoneYear] = useState("");
  const [editMilestoneTitle, setEditMilestoneTitle] = useState("");
  const [editMilestoneDesc, setEditMilestoneDesc] = useState("");
  const [editMilestoneIcon, setEditMilestoneIcon] = useState("🏆");

  const startEditMilestone = (m: Milestone) => {
    setEditingMilestoneId(m.id);
    setEditMilestoneYear(m.year);
    setEditMilestoneTitle(m.title);
    setEditMilestoneDesc(m.desc);
    setEditMilestoneIcon(m.icon);
  };

  const handleUpdateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestoneId || !editMilestoneYear.trim() || !editMilestoneTitle.trim()) return;

    db.from("milestones")
      .update({
        year: editMilestoneYear.trim(),
        title: editMilestoneTitle.trim(),
        desc: editMilestoneDesc.trim(),
        icon: editMilestoneIcon,
      })
      .eq("id", editingMilestoneId)
      .then(() => {
        loadDatabase();
        window.dispatchEvent(new Event("bsq_milestones_updated"));
        setEditingMilestoneId(null);
        addToast("success", "Milestone Updated", `Updated milestone for ${editMilestoneYear}.`);
      });
  };

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const savedPrice = localStorage.getItem("bsq_ticket_price");
      const savedStatus = localStorage.getItem("bsq_ticket_status");
      if (savedPrice !== null) setTicketPrice(Number(savedPrice));
      if (savedStatus !== null) setTicketStatus(savedStatus);

      const savedMvps = localStorage.getItem("bsq_achievements_mvps");
      const savedRings = localStorage.getItem("bsq_achievements_rings");
      const savedWins = localStorage.getItem("bsq_achievements_wins");
      if (savedMvps !== null) setMvpsCount(Number(savedMvps));
      if (savedRings !== null) setRingsCount(Number(savedRings));
      if (savedWins !== null) setWinsCount(Number(savedWins));

      const savedChat = localStorage.getItem("bsq_chat_status");
      const savedPred = localStorage.getItem("bsq_prediction_status");
      if (savedChat !== null) setChatStatus(savedChat);
      if (savedPred !== null) setPredictionStatus(savedPred);
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sim = localStorage.getItem("vbc_score_simulation");
      setIsSimulating(sim !== "false");
    }
  }, []);

  const toggleSimulation = () => {
    const nextSim = !isSimulating;
    setIsSimulating(nextSim);
    localStorage.setItem("vbc_score_simulation", nextSim ? "true" : "false");
    addToast(
      "info",
      "Simulator Toggled",
      `Score ticker automation is now ${nextSim ? "ENABLED" : "PAUSED"}.`,
    );
  };

  const handleSaveTicketSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("bsq_ticket_price", String(ticketPrice));
    localStorage.setItem("bsq_ticket_status", ticketStatus);
    window.dispatchEvent(new Event("bsq_ticket_settings_updated"));
    addToast(
      "success",
      language === "id"
        ? "Pengaturan Tiket Disimpan"
        : language === "ar"
          ? "تم حفظ إعدادات التذاكر"
          : "Ticket Settings Saved",
      language === "id"
        ? `Harga: Rp ${ticketPrice.toLocaleString("id-ID")} | Status: ${ticketStatus === "closed" ? "Pertandingan Tertutup" : "Terbuka untuk Umum"}`
        : language === "ar"
          ? `السعر: Rp ${ticketPrice.toLocaleString("id-ID")} | الحالة: ${ticketStatus === "closed" ? "مباراة مغلقة" : "مفتوح للجمهور"}`
          : `Price: Rp ${ticketPrice.toLocaleString("id-ID")} | Status: ${ticketStatus === "closed" ? "Closed Match" : "Open to Public"}`,
    );
  };

  const handleUpdateScore = (
    matchId: string,
    team: "home" | "away",
    amount: number,
  ) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const updatedHome =
      team === "home" ? match.score_home + amount : match.score_home;
    const updatedAway =
      team === "away" ? match.score_away + amount : match.score_away;

    db.from("matches")
      .update({
        score_home: updatedHome,
        score_away: updatedAway,
      })
      .eq("id", matchId)
      .then(() => {
        loadDatabase();
        addToast(
          "success",
          "Score Updated",
          `Manually adjusted scoreboard to ${updatedHome} - ${updatedAway}.`,
        );
      });
  };

  const handleStatusChange = (matchId: string, nextStatus: Match["status"]) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const updates: Partial<Match> = { status: nextStatus };
    if (nextStatus === "LIVE") {
      updates.quarter = 1;
      updates.time_remaining = "12:00";
    }

    db.from("matches")
      .update(updates)
      .eq("id", matchId)
      .then(() => {
        loadDatabase();
        addToast(
          "success",
          "Match Status Updated",
          `Set game against ${match.opponent} to ${nextStatus}.`,
        );

        // Auto-update standings if match is finalized
        if (nextStatus === "FINISHED") {
          const homeWon = match.score_home > match.score_away;

          // Find Vortex standing
          const vortexStand = standings.find(
            (s) => s.team_name === "BSQ ALL-FIVE",
          );
          if (vortexStand) {
            db.from("standings")
              .update({
                wins: vortexStand.wins + (homeWon ? 1 : 0),
                losses: vortexStand.losses + (homeWon ? 0 : 1),
                points: vortexStand.points + (homeWon ? 3 : 1),
                streak: homeWon ? "W6" : "L1",
              })
              .eq("id", vortexStand.id);
          }

          // Find Opponent standing
          const oppStand = standings.find((s) =>
            s.team_name.toLowerCase().includes(match.opponent.toLowerCase()),
          );
          if (oppStand) {
            db.from("standings")
              .update({
                wins: oppStand.wins + (homeWon ? 0 : 1),
                losses: oppStand.losses + (homeWon ? 1 : 0),
                points: oppStand.points + (homeWon ? 1 : 3),
                streak: homeWon ? "L1" : "W1",
              })
              .eq("id", oppStand.id);
          }
        }
      });
  };

  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editMatchOpponent, setEditMatchOpponent] = useState("");
  const [editMatchDate, setEditMatchDate] = useState("");
  const [editMatchVenue, setEditMatchVenue] = useState("");

  const startEditMatch = (match: Match) => {
    setEditingMatchId(match.id);
    setEditMatchOpponent(match.opponent);
    setEditMatchDate(new Date(match.date).toISOString().slice(0, 16));
    setEditMatchVenue(match.venue);
  };

  const handleUpdateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatchId || !editMatchOpponent.trim() || !editMatchDate) return;
    db.from("matches")
      .update({
        opponent: editMatchOpponent.trim(),
        date: new Date(editMatchDate).toISOString(),
        venue: editMatchVenue,
      })
      .eq("id", editingMatchId)
      .then(() => {
        loadDatabase();
        setEditingMatchId(null);
        addToast("success", "Match Updated", `Updated matchup vs ${editMatchOpponent}.`);
      });
  };

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchOpponent.trim() || !newMatchDate) return;

    db.from("matches")
      .insert({
        opponent: newMatchOpponent.trim(),
        opponent_logo:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100",
        date: new Date(newMatchDate).toISOString(),
        venue: newMatchVenue,
        status: "UPCOMING",
        score_home: 0,
        score_away: 0,
      })
      .then(() => {
        loadDatabase();
        setNewMatchOpponent("");
        setNewMatchDate("");
        addToast(
          "success",
          "Match Scheduled",
          `Added matchup vs ${newMatchOpponent}.`,
        );
      });
  };

  // Player creation state
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerPos, setNewPlayerPos] = useState<Player["position"]>("PG");
  const [newPlayerNum, setNewPlayerNum] = useState("0");
  const [newPlayerHeight, setNewPlayerHeight] = useState("195 cm");
  const [newPlayerWeight, setNewPlayerWeight] = useState("90 kg");
  const [newPlayerBio, setNewPlayerBio] = useState("");
  const [newPlayerPPG, setNewPlayerPPG] = useState("15");
  const [newPlayerAPG, setNewPlayerAPG] = useState("4");
  const [newPlayerRPG, setNewPlayerRPG] = useState("5");

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    db.from("players")
      .insert({
        name: newPlayerName.trim(),
        position: newPlayerPos,
        number: parseInt(newPlayerNum),
        height: newPlayerHeight,
        weight: newPlayerWeight,
        photo:
          newPlayerPhoto ||
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600",
        bio:
          newPlayerBio.trim() ||
          "A professional athlete on the BSQ ALL-FIVE roster.",
        stats: {
          ppg: parseFloat(newPlayerPPG),
          apg: parseFloat(newPlayerAPG),
          rpg: parseFloat(newPlayerRPG),
          spg: 1.2,
          bpg: 0.8,
        },
        highlight_url: "https://www.w3schools.com/html/mov_bbb.mp4",
      })
      .then(() => {
        loadDatabase();
        setNewPlayerName("");
        setNewPlayerBio("");
        setNewPlayerPhoto("");
        addToast(
          "success",
          "Player Created",
          `Added ${newPlayerName} to team roster.`,
        );
      });
  };

  const handleDeletePlayer = (playerId: string, name: string) => {
    if (confirm(`Remove ${name} from roster?`)) {
      (db as any)
        .from("players")
        .delete()
        .eq("id", playerId)
        .then(() => {
          loadDatabase();
          addToast(
            "success",
            "Player Removed",
            `Removed ${name} from roster list.`,
          );
        });
    }
  };

  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPlayerName, setEditPlayerName] = useState("");
  const [editPlayerPos, setEditPlayerPos] = useState<Player["position"]>("PG");
  const [editPlayerNum, setEditPlayerNum] = useState("");

  const startEditPlayer = (p: Player) => {
    setEditingPlayerId(p.id);
    setEditPlayerName(p.name);
    setEditPlayerPos(p.position);
    setEditPlayerNum(p.number.toString());
  };

  const handleUpdatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayerId || !editPlayerName.trim()) return;

    db.from("players")
      .update({
        name: editPlayerName.trim(),
        position: editPlayerPos,
        number: parseInt(editPlayerNum) || 0,
      })
      .eq("id", editingPlayerId)
      .then(() => {
        loadDatabase();
        setEditingPlayerId(null);
        addToast("success", "Player Updated", `Updated ${editPlayerName}.`);
      });
  };

  const handleUpdateCoach = (e: React.FormEvent) => {
    e.preventDefault();
    (db as any)
      .from("manager")
      .delete()
      .eq("id", "mngr1")
      .then(() => {
        (db as any)
          .from("manager")
          .insert({
            id: "mngr1",
            name: coachName.trim(),
            title: coachRoleTitle.trim(),
            bio: coachBio.trim(),
            photo: coachPhoto.trim(),
          })
          .then(() => {
            loadDatabase();
            addToast(
              "success",
              "Manager Updated",
              "Coach and Manager profile updated successfully.",
            );
          });
      });
  };

  // Merchandise state
  const [newMerchName, setNewMerchName] = useState("");
  const [newMerchPrice, setNewMerchPrice] = useState("150000");
  const [newMerchCategory, setNewMerchCategory] =
    useState<Merchandise["category"]>("jersey");
  const [newMerchStock, setNewMerchStock] = useState("20");
  const [newMerchDesc, setNewMerchDesc] = useState("");

  const [editingMerchId, setEditingMerchId] = useState<string | null>(null);
  const [editMerchName, setEditMerchName] = useState("");
  const [editMerchPrice, setEditMerchPrice] = useState("");
  const [editMerchStock, setEditMerchStock] = useState("");
  const [editMerchCategory, setEditMerchCategory] = useState<Merchandise["category"]>("jersey");

  const handleCreateMerch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchName.trim()) return;

    db.from("merchandise")
      .insert({
        name: newMerchName.trim(),
        price: parseFloat(newMerchPrice),
        image:
          newMerchImage ||
          (newMerchCategory === "shoes"
            ? "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400"
            : "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=400"),
        category: newMerchCategory,
        stock: parseInt(newMerchStock),
        description: newMerchDesc.trim() || "Premium merchandise item.",
      })
      .then(() => {
        loadDatabase();
        window.dispatchEvent(new Event("bsq_inventory_updated"));
        setNewMerchName("");
        setNewMerchDesc("");
        setNewMerchImage("");
        addToast(
          "success",
          "Product Added",
          `Added ${newMerchName} to store catalog.`,
        );
      });
  };

  const handleDeleteMerch = (itemId: string, name: string) => {
    if (confirm(`Remove ${name} from store?`)) {
      db.from("merchandise")
        .delete()
        .eq("id", itemId)
        .then(() => {
          loadDatabase();
          window.dispatchEvent(new Event("bsq_inventory_updated"));
          addToast(
            "success",
            "Product Removed",
            `Removed ${name} from store catalog.`,
          );
        });
    }
  };

  const startEditMerch = (item: Merchandise) => {
    setEditingMerchId(item.id);
    setEditMerchName(item.name);
    setEditMerchPrice(item.price.toString());
    setEditMerchStock(item.stock.toString());
    setEditMerchCategory(item.category);
  };

  const handleUpdateMerch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMerchId || !editMerchName.trim()) return;

    db.from("merchandise")
      .update({
        name: editMerchName.trim(),
        price: parseFloat(editMerchPrice),
        stock: parseInt(editMerchStock),
        category: editMerchCategory,
      })
      .eq("id", editingMerchId)
      .then(() => {
        loadDatabase();
        window.dispatchEvent(new Event("bsq_inventory_updated"));
        setEditingMerchId(null);
        addToast("success", "Product Updated", `Updated ${editMerchName}.`);
      });
  };

  // Standings state
  const handleUpdateStanding = (
    teamId: string,
    field: "wins" | "losses" | "points",
    val: number,
  ) => {
    const team = standings.find((s) => s.id === teamId);
    if (!team) return;

    db.from("standings")
      .update({
        [field]: Math.max(0, team[field] + val),
      })
      .eq("id", teamId)
      .then(() => {
        loadDatabase();
        window.dispatchEvent(new Event("bsq_standings_updated"));
      });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
        >
          {/* Backdrop closer */}
          <div className="absolute inset-0 z-0" onClick={onClose} />

          {/* Login Lock */}
          {!isAuthenticated ? (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={
                passError
                  ? {
                      x: [0, -10, 10, -10, 10, -5, 5, 0],
                      transition: { duration: 0.4 },
                    }
                  : { scale: 1, x: 0 }
              }
              exit={{ scale: 0.95 }}
              className="relative max-w-md w-full bg-bg-dark border border-brand-orange/30 rounded-3xl p-8 shadow-2xl glow-orange z-10 mx-4"
            >
              {selectedRole === null ? (
                <>
                  <button
                    onClick={onClose}
                    className={`absolute top-4 text-gray-500 hover:text-white cursor-pointer ${isRtl ? "left-4" : "right-4"}`}
                  >
                    <X size={18} />
                  </button>

                  <div
                    className={`text-center mb-6 ${isRtl ? "text-right" : "text-left"}`}
                  >
                    <div className="w-12 h-12 bg-brand-orange/15 border border-brand-orange/20 rounded-2xl flex items-center justify-center text-brand-orange mx-auto mb-3">
                      <Key size={20} />
                    </div>
                    <h3 className="text-xl font-title font-black uppercase text-white text-center">
                      {t("admin", "roleSelectTitle")}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-display mt-1 text-center">
                      {t("admin", "roleSelectDesc")}
                    </p>
                  </div>

                  <div className="space-y-3 mt-4">
                    {/* Super Admin Option */}
                    <button
                      onClick={() => {
                        setSelectedRole("admin");
                        setPassError(false);
                        setPasscode("");
                      }}
                      className={`w-full p-4 bg-white/2 hover:bg-white/5 border border-white/5 hover:border-brand-orange/30 rounded-2xl flex items-center gap-4 transition-all group cursor-pointer ${
                        isRtl ? "flex-row-reverse text-right" : "text-left"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-orange/15 border border-brand-orange/20 flex items-center justify-center text-brand-orange group-hover:scale-110 transition-transform flex-shrink-0">
                        <Shield size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-title font-black uppercase text-white tracking-wide">
                          {t("admin", "roleAdmin")}
                        </h4>
                        <p className="text-[9px] text-gray-500 font-display mt-0.5 leading-snug">
                          {t("admin", "roleAdminDesc")}
                        </p>
                      </div>
                    </button>

                    {/* Head Coach Option */}
                    <button
                      onClick={() => {
                        setSelectedRole("coach");
                        setPassError(false);
                        setPasscode("");
                      }}
                      className={`w-full p-4 bg-white/2 hover:bg-white/5 border border-white/5 hover:border-brand-orange/30 rounded-2xl flex items-center gap-4 transition-all group cursor-pointer ${
                        isRtl ? "flex-row-reverse text-right" : "text-left"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-orange/15 border border-brand-orange/20 flex items-center justify-center text-brand-orange group-hover:scale-110 transition-transform flex-shrink-0">
                        <Users size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-title font-black uppercase text-white tracking-wide">
                          {t("admin", "roleCoach")}
                        </h4>
                        <p className="text-[9px] text-gray-500 font-display mt-0.5 leading-snug">
                          {t("admin", "roleCoachDesc")}
                        </p>
                      </div>
                    </button>

                    {/* Inventory Manager Option */}
                    <button
                      onClick={() => {
                        setSelectedRole("shop_manager");
                        setPassError(false);
                        setPasscode("");
                      }}
                      className={`w-full p-4 bg-white/2 hover:bg-white/5 border border-white/5 hover:border-brand-orange/30 rounded-2xl flex items-center gap-4 transition-all group cursor-pointer ${
                        isRtl ? "flex-row-reverse text-right" : "text-left"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-orange/15 border border-brand-orange/20 flex items-center justify-center text-brand-orange group-hover:scale-110 transition-transform flex-shrink-0">
                        <Tag size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-title font-black uppercase text-white tracking-wide">
                          {t("admin", "roleShop")}
                        </h4>
                        <p className="text-[9px] text-gray-500 font-display mt-0.5 leading-snug">
                          {t("admin", "roleShopDesc")}
                        </p>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedRole(null)}
                    className={`absolute top-4 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-white cursor-pointer ${
                      isRtl ? "right-4 flex-row-reverse" : "left-4"
                    }`}
                  >
                    <ChevronLeft
                      size={14}
                      className={isRtl ? "rotate-180" : ""}
                    />
                    {t("admin", "backToRoles")}
                  </button>

                  <button
                    onClick={onClose}
                    className={`absolute top-4 text-gray-500 hover:text-white cursor-pointer ${isRtl ? "left-4" : "right-4"}`}
                  >
                    <X size={18} />
                  </button>

                  <div className="text-center mb-6 mt-4">
                    <div className="w-12 h-12 bg-brand-orange/15 border border-brand-orange/20 rounded-2xl flex items-center justify-center text-brand-orange mx-auto mb-3">
                      {selectedRole === "admin" ? (
                        <Shield size={20} />
                      ) : selectedRole === "coach" ? (
                        <Users size={20} />
                      ) : (
                        <Tag size={20} />
                      )}
                    </div>
                    <h3 className="text-lg font-title font-black uppercase text-white">
                      {selectedRole === "admin"
                        ? t("admin", "roleAdmin")
                        : selectedRole === "coach"
                          ? t("admin", "roleCoach")
                          : t("admin", "roleShop")}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-display mt-1">
                      {t("admin", "enterPasscode")}
                    </p>
                  </div>

                  <form
                    onSubmit={handleAuth}
                    className="space-y-4 font-display"
                  >
                    <div>
                      <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5 text-center">
                        {t("admin", "keyPlaceholder")}
                      </label>
                      <div className="relative">
                        <input
                          type={showPasscode ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={passcode}
                          onChange={(e) => setPasscode(e.target.value)}
                          className={`w-full text-center bg-black/40 border rounded-xl py-3 text-sm text-white focus:outline-none tracking-widest ${
                            passError
                              ? "border-red-600 focus:border-red-600"
                              : "border-white/10 focus:border-brand-orange"
                          } ${isRtl ? "pl-10" : "pr-10"}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasscode(!showPasscode)}
                          className={`absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer ${
                            isRtl ? "left-3" : "right-3"
                          }`}
                        >
                          {showPasscode ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      {passError && (
                        <span className="text-[9px] text-red-500 font-bold block mt-1 text-center font-display">
                          {selectedRole === "admin"
                            ? language === "id"
                              ? "Petunjuk: admin2026 atau vortex2026"
                              : language === "ar"
                                ? "تلميح: admin2026 أو vortex2026"
                                : "Hint: admin2026 or vortex2026"
                            : selectedRole === "coach"
                              ? language === "id"
                                ? "Petunjuk: coach2026"
                                : language === "ar"
                                  ? "تلميح: coach2026"
                                  : "Hint: coach2026"
                              : language === "id"
                                ? "Petunjuk: shop2026"
                                : language === "ar"
                                  ? "تلميح: shop2026"
                                  : "Hint: shop2026"}
                        </span>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black text-xs tracking-[0.2em] rounded-xl uppercase transition-colors cursor-pointer"
                    >
                      {t("admin", "authBtn")}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          ) : (
            // Full Admin Dashboard
            <motion.div
              initial={{ scale: 0.95, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 50 }}
              className="relative max-w-5xl w-full h-[85vh] bg-bg-dark border border-brand-orange/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10"
            >
              {/* Header */}
              <div
                className={`p-6 bg-white/2 border-b border-white/5 flex items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse text-right" : "text-left"}`}
                >
                  <div className="w-8 h-8 rounded bg-brand-orange flex items-center justify-center text-brand-black font-title font-black text-sm">
                    V
                  </div>
                  <div>
                    <h3 className="font-title font-black uppercase text-white text-sm">
                      {t("admin", "console")}
                    </h3>
                    <p className="text-[9px] text-brand-gold font-display uppercase tracking-widest font-bold">
                      {t("admin", "authenticatedAs")}:{" "}
                      {getRoleLabel(authenticatedRole)}
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-2.5 ${isRtl ? "flex-row-reverse" : ""}`}
                >
                  <button
                    onClick={() => {
                      setIsAuthenticated(false);
                      setAuthenticatedRole(null);
                      setSelectedRole(null);
                      setPasscode("");
                      sessionStorage.removeItem("bsq_admin_authenticated");
                      sessionStorage.removeItem("bsq_admin_role");
                      sessionStorage.removeItem("bsq_admin_active_tab");
                      addToast(
                        "info",
                        "Logged Out",
                        "Successfully logged out of Administrative Console.",
                      );
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-700/20 hover:border-red-600/40 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      isRtl ? "flex-row-reverse" : ""
                    }`}
                  >
                    <LogOut size={12} />
                    {t("admin", "logout")}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 bg-white/3 hover:bg-brand-orange hover:text-brand-black text-white rounded-xl transition-all cursor-pointer border border-white/5"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Console Tabs */}
              <div
                className={`flex bg-white/2 border-b border-white/5 text-xs font-display font-semibold px-4 gap-6 ${isRtl ? "flex-row-reverse" : ""}`}
              >
                {(
                  (authenticatedRole === "admin"
                    ? ["matches", "roster", "store", "standings", "story", "bookings"]
                    : authenticatedRole === "coach"
                      ? ["matches", "roster"]
                      : ["store"]) as const
                ).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      sessionStorage.setItem("bsq_admin_active_tab", tab);
                    }}
                    className={`py-4 px-2 uppercase tracking-wider relative cursor-pointer ${
                      activeTab === tab
                        ? "text-brand-orange font-bold"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {getTabLabel(tab)}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="adminTab"
                        className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-orange"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Content Panels */}
              <div className="flex-1 overflow-y-auto p-8 font-display">
                {/* 1. MATCHES PANEL */}
                {activeTab === "matches" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Live score controller */}
                    <div className="lg:col-span-7 space-y-6">
                      <div
                        className={`flex items-center justify-between border-b border-white/5 pb-3 ${isRtl ? "flex-row-reverse" : ""}`}
                      >
                        <h4 className="font-title font-extrabold uppercase text-white text-sm flex items-center gap-2 text-start">
                          <Tv size={16} className="text-brand-orange" />{" "}
                          {t("admin", "scoreboard")}
                        </h4>

                        {/* Simulation Toggle */}
                        <button
                          onClick={toggleSimulation}
                          className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-1 ${
                            isSimulating
                              ? "bg-green-500/10 text-green-500 border border-green-500/20"
                              : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                          }`}
                        >
                          <RefreshCw
                            size={10}
                            className={isSimulating ? "animate-spin" : ""}
                          />
                          {isSimulating
                            ? t("admin", "simActive")
                            : t("admin", "simPaused")}
                        </button>
                      </div>

                      {matches.map((match) => (
                        <div
                          key={match.id}
                          className="bg-white/2 border border-white/5 p-5 rounded-2xl space-y-4 relative group"
                        >
                          {editingMatchId === match.id ? (
                            <form onSubmit={handleUpdateMatch} className="space-y-3">
                              <div className="flex gap-2">
                                <input type="text" value={editMatchOpponent} onChange={e => setEditMatchOpponent(e.target.value)} required placeholder="Opponent" className="flex-1 bg-black/40 border border-white/10 px-2 py-1.5 rounded text-white text-xs" />
                                <input type="datetime-local" value={editMatchDate} onChange={e => setEditMatchDate(e.target.value)} required className="flex-1 bg-black/40 border border-white/10 px-2 py-1.5 rounded text-white text-xs" />
                              </div>
                              <div className="flex gap-2">
                                <input type="text" value={editMatchVenue} onChange={e => setEditMatchVenue(e.target.value)} placeholder="Venue" className="flex-1 bg-black/40 border border-white/10 px-2 py-1.5 rounded text-white text-xs" />
                                <button type="submit" className="p-1.5 bg-green-500 hover:bg-green-400 text-black rounded cursor-pointer"><Check size={14} /></button>
                                <button type="button" onClick={() => setEditingMatchId(null)} className="p-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded cursor-pointer"><X size={14} /></button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <button onClick={() => startEditMatch(match)} className="absolute top-4 right-4 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Pencil size={14} />
                              </button>
                              <div className="flex justify-between items-center text-xs pr-8">
                                <span className="font-bold text-white uppercase flex items-center gap-1.5">
                                  vs {match.opponent}
                                  <span
                                    className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                                      match.status === "LIVE"
                                        ? "bg-red-500/20 text-red-500"
                                        : match.status === "FINISHED"
                                          ? "bg-gray-500/20 text-gray-500"
                                          : "bg-brand-gold/20 text-brand-gold"
                                    }`}
                                  >
                                    {match.status}
                                  </span>
                                </span>
                                <span className="text-gray-500">{match.venue}</span>
                              </div>

                          {/* Controls based on status */}
                          {match.status === "UPCOMING" && (
                            <button
                              onClick={() =>
                                handleStatusChange(match.id, "LIVE")
                              }
                              className="px-4 py-2 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black text-[10px] tracking-widest rounded uppercase cursor-pointer"
                            >
                              {language === "ar"
                                ? "بدء المباراة"
                                : language === "id"
                                  ? "Mulai Pertandingan"
                                  : "Kick Off (Go Live)"}
                            </button>
                          )}

                          {match.status === "LIVE" && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between py-2 border-y border-white/5">
                                {/* Vortex score controls */}
                                <div className="text-center">
                                  <span className="text-[9px] text-gray-500 block uppercase font-bold">
                                    VORTEX HOOPS
                                  </span>
                                  <span className="text-xl font-bold text-white">
                                    {match.score_home}
                                  </span>
                                  <div className="flex gap-1 mt-2">
                                    <button
                                      onClick={() =>
                                        handleUpdateScore(match.id, "home", 1)
                                      }
                                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold rounded cursor-pointer"
                                    >
                                      +1
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleUpdateScore(match.id, "home", 2)
                                      }
                                      className="px-2 py-1 bg-brand-orange hover:bg-brand-burnt text-brand-black text-[10px] font-bold rounded cursor-pointer"
                                    >
                                      +2
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleUpdateScore(match.id, "home", 3)
                                      }
                                      className="px-2 py-1 bg-brand-gold hover:bg-amber-500 text-brand-black text-[10px] font-bold rounded cursor-pointer"
                                    >
                                      +3
                                    </button>
                                  </div>
                                </div>

                                <span className="font-bold text-gray-500 text-sm">
                                  vs
                                </span>

                                {/* Opponent score controls */}
                                <div className="text-center">
                                  <span className="text-[9px] text-gray-500 block uppercase font-bold">
                                    {match.opponent.toUpperCase()}
                                  </span>
                                  <span className="text-xl font-bold text-white">
                                    {match.score_away}
                                  </span>
                                  <div className="flex gap-1 mt-2">
                                    <button
                                      onClick={() =>
                                        handleUpdateScore(match.id, "away", 1)
                                      }
                                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold rounded cursor-pointer"
                                    >
                                      +1
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleUpdateScore(match.id, "away", 2)
                                      }
                                      className="px-2 py-1 bg-brand-orange hover:bg-brand-burnt text-brand-black text-[10px] font-bold rounded cursor-pointer"
                                    >
                                      +2
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleUpdateScore(match.id, "away", 3)
                                      }
                                      className="px-2 py-1 bg-brand-gold hover:bg-amber-500 text-brand-black text-[10px] font-bold rounded cursor-pointer"
                                    >
                                      +3
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div
                                className={`flex justify-between items-center ${isRtl ? "flex-row-reverse" : ""}`}
                              >
                                <span className="text-[10px] text-gray-400">
                                  {t("matches", "quarter")}: {match.quarter} •{" "}
                                  {t("matches", "time")}: {match.time_remaining}
                                </span>
                                <button
                                  onClick={() =>
                                    handleStatusChange(match.id, "FINISHED")
                                  }
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] tracking-widest rounded uppercase cursor-pointer"
                                >
                                  {language === "ar"
                                    ? "إنهاء المباراة"
                                    : language === "id"
                                      ? "Akhiri Pertandingan"
                                      : "Finalize & End Game"}
                                </button>
                              </div>
                            </div>
                          )}

                          {match.status === "FINISHED" && (
                            <div
                              className={`text-xs text-gray-400 flex items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}
                            >
                              <span>
                                {t("matches", "final")}: {match.score_home} -{" "}
                                {match.score_away}
                              </span>
                              <button
                                onClick={() =>
                                  handleStatusChange(match.id, "UPCOMING")
                                }
                                className="text-brand-orange text-[10px] uppercase font-bold"
                              >
                                {language === "ar"
                                  ? "إعادة فتح المباراة"
                                  : language === "id"
                                    ? "Buka Kembali Laga"
                                    : "Re-open Game"}
                              </button>
                            </div>
                          )}
                          </>
                        )}
                        </div>
                      ))}
                    </div>

                    {/* Schedule & Ticket Settings Column */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Schedule match form */}
                      <div className="bg-white/2 border border-white/5 p-6 rounded-2xl">
                        <h4 className="font-title font-extrabold uppercase text-white text-sm mb-4 flex items-center gap-1.5 text-start">
                          <Calendar size={16} className="text-brand-orange" />{" "}
                          {t("admin", "schedule")}
                        </h4>
                        <form
                          onSubmit={handleCreateMatch}
                          className="space-y-4 text-xs"
                        >
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              {t("admin", "opponentLabel")}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="E.g., Solar Flares"
                              value={newMatchOpponent}
                              onChange={(e) =>
                                setNewMatchOpponent(e.target.value)
                              }
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              {t("admin", "venueLabel")}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Al Hikmah Arena"
                              value={newMatchVenue}
                              onChange={(e) => setNewMatchVenue(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              {t("admin", "dateTimeLabel")}
                            </label>
                            <input
                              type="datetime-local"
                              required
                              value={newMatchDate}
                              onChange={(e) => setNewMatchDate(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                          >
                            Add Matchup
                          </button>
                        </form>
                      </div>

                      {/* Ticket & Arena Settings form */}
                      <div className="bg-white/2 border border-white/5 p-6 rounded-2xl">
                        <h4 className="font-title font-extrabold uppercase text-white text-sm mb-4 flex items-center gap-1.5 text-start">
                          <Ticket size={16} className="text-brand-orange" />
                          {language === "id"
                            ? "Pengaturan Tiket & Arena"
                            : language === "ar"
                              ? "إعدادات التذاكر والملعب"
                              : "Ticket & Arena Settings"}
                        </h4>
                        <form
                          onSubmit={handleSaveTicketSettings}
                          className="space-y-4 text-xs font-display"
                        >
                          <div>
                            <div className="flex justify-between items-center mb-1.5">
                              <label className="text-[9px] text-gray-400 font-bold uppercase block text-start">
                                {language === "id"
                                  ? "Harga Tiket (Rp)"
                                  : language === "ar"
                                    ? "سعر التذكرة (Rp)"
                                    : "Ticket Price (Rp)"}
                              </label>
                              {ticketPrice === 0 && (
                                <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[8px] font-black rounded uppercase tracking-wider animate-pulse">
                                  {language === "id"
                                    ? "GRATIS / FREE"
                                    : language === "ar"
                                      ? "مجاني"
                                      : "FREE MATCH"}
                                </span>
                              )}
                            </div>
                            <input
                              type="number"
                              required
                              min="0"
                              value={ticketPrice}
                              onChange={(e) =>
                                setTicketPrice(
                                  Math.max(0, parseInt(e.target.value) || 0),
                                )
                              }
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                            />
                            <p className="text-[9px] text-gray-500 mt-1 text-start">
                              {language === "id"
                                ? "Atur ke 0 untuk mengaktifkan reservasi tiket GRATIS bagi penonton."
                                : language === "ar"
                                  ? "اضبط السعر على 0 لجعل حجز التذاكر مجانًا."
                                  : "Set price to 0 to make ticket bookings completely free."}
                            </p>
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              {language === "id"
                                ? "Akses / Status Pertandingan"
                                : language === "ar"
                                  ? "حالة المباراة / الوصول"
                                  : "Match Access / Status"}
                            </label>
                            <select
                              value={ticketStatus}
                              onChange={(e) => setTicketStatus(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                            >
                              <option value="open">
                                {language === "id"
                                  ? "Terbuka untuk Umum (Bisa Dipesan)"
                                  : language === "ar"
                                    ? "مفتوح للجمهور (يمكن الحجز)"
                                    : "Open to Public (Bookings Allowed)"}
                              </option>
                              <option value="closed">
                                {language === "id"
                                  ? "Pertandingan Tertutup (Sembunyikan Seating)"
                                  : language === "ar"
                                    ? "مباراة مغلقة (إخفاء المقاعد)"
                                    : "Closed Match (Hide Seating Visualizer)"}
                              </option>
                            </select>
                            <p className="text-[9px] text-gray-500 mt-1 text-start">
                              {language === "id"
                                ? "Mengubah status ke tertutup akan menampilkan pesan private dan memblokir pembelian."
                                : language === "ar"
                                  ? "تغيير الحالة إلى مغلقة سيعرض لافتة تنبيه خاصة ويمنع حجز المقاعد."
                                  : "Switching to closed displays a private notice banner and disables seat selections."}
                            </p>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                          >
                            {language === "id"
                              ? "Simpan Pengaturan"
                              : language === "ar"
                                ? "حفظ الإعدادات"
                                : "Save Settings"}
                          </button>
                        </form>
                      </div>
                      {/* Fan Interaction Settings form */}
                      <div className="bg-white/2 border border-white/5 p-6 rounded-2xl">
                        <h4 className="font-title font-extrabold uppercase text-white text-sm mb-4 flex items-center gap-1.5 text-start">
                          <MessageSquare size={16} className="text-brand-orange" />
                          {language === "id"
                            ? "Pengaturan Interaksi Fan"
                            : "Fan Interaction Settings"}
                        </h4>
                        <form
                          onSubmit={handleSaveFanSettings}
                          className="space-y-4 text-xs font-display"
                        >
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              {language === "id"
                                ? "Status Live Chat"
                                : "Live Chat Status"}
                            </label>
                            <select
                              value={chatStatus}
                              onChange={(e) => setChatStatus(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                            >
                              <option value="open">
                                {language === "id"
                                  ? "Dibuka (Fan bisa kirim pesan)"
                                  : "Open (Fans can chat)"}
                              </option>
                              <option value="closed">
                                {language === "id"
                                  ? "Ditutup (Kunci Chat)"
                                  : "Closed (Lock Chat)"}
                              </option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              {language === "id"
                                ? "Status Prediksi Skor"
                                : "Score Prediction Status"}
                            </label>
                            <select
                              value={predictionStatus}
                              onChange={(e) => setPredictionStatus(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                            >
                              <option value="open">
                                {language === "id"
                                  ? "Dibuka (Bisa Prediksi)"
                                  : "Open (Predictions allowed)"}
                              </option>
                              <option value="closed">
                                {language === "id"
                                  ? "Ditutup (Kunci Prediksi)"
                                  : "Closed (Lock Predictions)"}
                              </option>
                            </select>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                          >
                            {language === "id"
                              ? "Simpan Pengaturan"
                              : "Save Settings"}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ROSTER PANEL */}
                {activeTab === "roster" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Players list */}
                    <div className="lg:col-span-7 space-y-4">
                      <h4 className="font-title font-extrabold uppercase text-white text-sm border-b border-white/5 pb-3 text-start">
                        {t("admin", "roster")}
                      </h4>
                      {players.map((player) => (
                        <div
                          key={player.id}
                          className={`bg-white/2 border border-white/5 p-4 rounded-xl flex items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}
                        >
                          {editingPlayerId === player.id ? (
                            <form onSubmit={handleUpdatePlayer} className="w-full flex items-center gap-2">
                              <input type="text" value={editPlayerName} onChange={e => setEditPlayerName(e.target.value)} required placeholder="Name" className="flex-1 bg-black/40 border border-white/10 px-2 py-1.5 rounded text-white text-xs" />
                              <select value={editPlayerPos} onChange={e => setEditPlayerPos(e.target.value as Player["position"])} className="bg-black/40 border border-white/10 px-2 py-1.5 rounded text-white text-xs">
                                {["PG", "SG", "SF", "PF", "C"].map(pos => <option key={pos} value={pos}>{pos}</option>)}
                              </select>
                              <input type="number" value={editPlayerNum} onChange={e => setEditPlayerNum(e.target.value)} required placeholder="#" className="w-16 bg-black/40 border border-white/10 px-2 py-1.5 rounded text-white text-xs" />
                              <button type="submit" className="p-1.5 bg-green-500 hover:bg-green-400 text-black rounded cursor-pointer"><Check size={14} /></button>
                              <button type="button" onClick={() => setEditingPlayerId(null)} className="p-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded cursor-pointer"><X size={14} /></button>
                            </form>
                          ) : (
                            <>
                              <div
                                className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse text-right" : "text-left"}`}
                              >
                                <div className="w-10 h-10 rounded bg-white/5 overflow-hidden">
                                  <img
                                    src={player.photo}
                                    alt={player.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <span className="text-[9px] text-brand-orange uppercase font-bold">
                                    {player.position} • #{player.number}
                                  </span>
                                  <h5 className="font-bold text-white text-sm leading-none mt-1">
                                    {player.name}
                                  </h5>
                                </div>
                              </div>
                              <div
                                className={`flex items-center gap-4 text-xs font-bold ${isRtl ? "flex-row-reverse" : ""}`}
                              >
                                <span className="text-gray-400">
                                  {player.stats.ppg} {t("roster", "ppg")}
                                </span>
                                <button
                                  onClick={() => startEditPlayer(player)}
                                  className="text-gray-400 hover:text-white cursor-pointer"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeletePlayer(player.id, player.name)
                                  }
                                  className="text-red-500 hover:text-red-400 cursor-pointer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Forms column */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Add player form */}
                      <div className="bg-white/2 border border-white/5 p-6 rounded-2xl">
                        <h4 className="font-title font-extrabold uppercase text-white text-sm mb-4 flex items-center gap-1.5 text-start">
                          <Users size={16} className="text-brand-orange" />{" "}
                          {t("admin", "signPlayer")}
                        </h4>
                        <form
                          onSubmit={handleCreatePlayer}
                          className="space-y-4 text-xs"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                                {t("admin", "fullName")}
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Marcus Vance"
                                value={newPlayerName}
                                onChange={(e) =>
                                  setNewPlayerName(e.target.value)
                                }
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                                {t("admin", "jerseyNum")}
                              </label>
                              <input
                                type="number"
                                required
                                min="0"
                                max="99"
                                value={newPlayerNum}
                                onChange={(e) =>
                                  setNewPlayerNum(e.target.value)
                                }
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                                {t("admin", "position")}
                              </label>
                              <select
                                value={newPlayerPos}
                                onChange={(e) =>
                                  setNewPlayerPos(
                                    e.target.value as Player["position"],
                                  )
                                }
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                              >
                                {["PG", "SG", "SF", "PF", "C"].map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                                {t("admin", "height")}
                              </label>
                              <input
                                type="text"
                                value={newPlayerHeight}
                                onChange={(e) =>
                                  setNewPlayerHeight(e.target.value)
                                }
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                                {t("admin", "weight")}
                              </label>
                              <input
                                type="text"
                                value={newPlayerWeight}
                                onChange={(e) =>
                                  setNewPlayerWeight(e.target.value)
                                }
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                                {t("admin", "ppg")}
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={newPlayerPPG}
                                onChange={(e) =>
                                  setNewPlayerPPG(e.target.value)
                                }
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                                {t("admin", "apg")}
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={newPlayerAPG}
                                onChange={(e) =>
                                  setNewPlayerAPG(e.target.value)
                                }
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                                {t("admin", "rpg")}
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={newPlayerRPG}
                                onChange={(e) =>
                                  setNewPlayerRPG(e.target.value)
                                }
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              Player Photo
                            </label>
                            <div className="flex items-center gap-3 bg-black/20 border border-white/10 p-2 rounded-xl">
                              {newPlayerPhoto && (
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                  <img
                                    src={newPlayerPhoto}
                                    alt="Player Preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handlePhotoUpload(e, setNewPlayerPhoto)
                                }
                                className="w-full text-[10px] text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-white/5 file:text-white file:hover:bg-white/10 file:cursor-pointer"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              {t("admin", "bio")}
                            </label>
                            <textarea
                              value={newPlayerBio}
                              onChange={(e) => setNewPlayerBio(e.target.value)}
                              placeholder="Signee profile details..."
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white h-20 resize-none text-start"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                          >
                            {t("admin", "confirmContract")}
                          </button>
                        </form>
                      </div>

                      {/* Head Coach & Manager settings form */}
                      <div className="bg-white/2 border border-white/5 p-6 rounded-2xl">
                        <h4 className="font-title font-extrabold uppercase text-white text-sm mb-4 flex items-center gap-1.5 text-start">
                          <Users size={16} className="text-brand-orange" />{" "}
                          {t("admin", "coachTitle")}
                        </h4>
                        <form
                          onSubmit={handleUpdateCoach}
                          className="space-y-4 text-xs"
                        >
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              {t("admin", "coachName")}
                            </label>
                            <input
                              type="text"
                              required
                              value={coachName}
                              onChange={(e) => setCoachName(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              {t("admin", "coachJobTitle")}
                            </label>
                            <input
                              type="text"
                              required
                              value={coachRoleTitle}
                              onChange={(e) =>
                                setCoachRoleTitle(e.target.value)
                              }
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              {t("admin", "coachPhoto")}
                            </label>
                            <div className="flex items-center gap-3 bg-black/20 border border-white/10 p-2 rounded-xl">
                              {coachPhoto && (
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                  <img
                                    src={coachPhoto}
                                    alt="Coach Preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handlePhotoUpload(e, setCoachPhoto)
                                }
                                className="w-full text-[10px] text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-white/5 file:text-white file:hover:bg-white/10 file:cursor-pointer"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              {t("admin", "coachBio")}
                            </label>
                            <textarea
                              required
                              value={coachBio}
                              onChange={(e) => setCoachBio(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white h-20 resize-none text-start"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                          >
                            {t("admin", "updateCoach")}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. STORE PANEL */}
                {activeTab === "store" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Products list */}
                    <div className="lg:col-span-7 space-y-4">
                      <h4 className="font-title font-extrabold uppercase text-white text-sm border-b border-white/5 pb-3 text-start">
                        {t("admin", "inventory")}
                      </h4>
                      {merchandise.map((item) => (
                        <div
                          key={item.id}
                          className={`bg-white/2 border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRtl ? "sm:flex-row-reverse" : ""}`}
                        >
                          {editingMerchId === item.id ? (
                            <form onSubmit={handleUpdateMerch} className="w-full flex items-center gap-2">
                              <input 
                                type="text" required value={editMerchName} onChange={e => setEditMerchName(e.target.value)} 
                                className="flex-1 bg-black/40 border border-white/10 px-2 py-1.5 rounded text-white text-xs" 
                              />
                              <input 
                                type="number" required value={editMerchPrice} onChange={e => setEditMerchPrice(e.target.value)} 
                                className="w-20 bg-black/40 border border-white/10 px-2 py-1.5 rounded text-white text-xs" 
                              />
                              <input 
                                type="number" required value={editMerchStock} onChange={e => setEditMerchStock(e.target.value)} 
                                className="w-16 bg-black/40 border border-white/10 px-2 py-1.5 rounded text-white text-xs" 
                              />
                              <select 
                                value={editMerchCategory} onChange={e => setEditMerchCategory(e.target.value as Merchandise["category"])} 
                                className="bg-black/40 border border-white/10 px-2 py-1.5 rounded text-white text-xs"
                              >
                                {["jersey", "shoes", "caps", "accessories"].map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
                              </select>
                              <button type="submit" className="p-1.5 bg-green-500 hover:bg-green-400 text-black rounded cursor-pointer">
                                <Check size={14} />
                              </button>
                              <button type="button" onClick={() => setEditingMerchId(null)} className="p-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded cursor-pointer">
                                <X size={14} />
                              </button>
                            </form>
                          ) : (
                            <>
                              <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse text-right" : "text-left"}`}>
                                <div className="w-10 h-10 rounded bg-white/5 overflow-hidden flex-shrink-0">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <span className="text-[9px] text-brand-gold uppercase font-bold">
                                    {getCategoryLabel(item.category)} • {t("shop", "stock")}: {item.stock}
                                  </span>
                                  <h5 className="font-bold text-white text-sm leading-none mt-1">{item.name}</h5>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-bold">
                                <span className="text-white">Rp {item.price.toLocaleString('id-ID')}</span>
                                <button onClick={() => startEditMerch(item)} className="text-gray-400 hover:text-white cursor-pointer">
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => handleDeleteMerch(item.id, item.name)} className="text-red-500 hover:text-red-400 cursor-pointer">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add product form */}
                    <div className="lg:col-span-5 bg-white/2 border border-white/5 p-6 rounded-2xl">
                      <h4 className="font-title font-extrabold uppercase text-white text-sm mb-4 flex items-center gap-1.5 text-start">
                        <Plus size={16} className="text-brand-orange" />{" "}
                        {t("admin", "addProduct")}
                      </h4>
                      <form
                        onSubmit={handleCreateMerch}
                        className="space-y-4 text-xs"
                      >
                        <div>
                          <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                            {t("admin", "prodName")}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Championship Edition Cap"
                            value={newMerchName}
                            onChange={(e) => setNewMerchName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              {t("admin", "price")}
                            </label>
                            <input
                              type="number"
                              required
                              value={newMerchPrice}
                              onChange={(e) => setNewMerchPrice(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              {t("admin", "category")}
                            </label>
                            <select
                              value={newMerchCategory}
                              onChange={(e) =>
                                setNewMerchCategory(
                                  e.target.value as Merchandise["category"],
                                )
                              }
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                            >
                              {["jersey", "shoes", "caps", "accessories"].map(
                                (c) => (
                                  <option key={c} value={c}>
                                    {getCategoryLabel(c)}
                                  </option>
                                ),
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              {t("admin", "stock")}
                            </label>
                            <input
                              type="number"
                              required
                              value={newMerchStock}
                              onChange={(e) => setNewMerchStock(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2.5 rounded-xl text-white text-start"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                            Product Image
                          </label>
                          <div className="flex items-center gap-3 bg-black/20 border border-white/10 p-2 rounded-xl">
                            {newMerchImage && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                <img
                                  src={newMerchImage}
                                  alt="Product Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handlePhotoUpload(e, setNewMerchImage)
                              }
                              className="w-full text-[10px] text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-white/5 file:text-white file:hover:bg-white/10 file:cursor-pointer"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                            {t("admin", "desc")}
                          </label>
                          <textarea
                            value={newMerchDesc}
                            onChange={(e) => setNewMerchDesc(e.target.value)}
                            placeholder="Product description and details..."
                            className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white h-20 resize-none text-start"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                        >
                          {t("admin", "addCatalog")}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* 4. STANDINGS PANEL */}
                {activeTab === "standings" && (
                  <div className="space-y-6">
                    <h4 className="font-title font-extrabold uppercase text-white text-sm border-b border-white/5 pb-3 text-start">
                      {t("admin", "standings")}
                    </h4>

                    {/* Active Tournament Customizer */}
                    <div className="bg-white/3 border border-white/5 rounded-2xl p-6 space-y-4">
                      <h5 className="font-display font-bold text-xs uppercase text-brand-orange tracking-wider text-start">
                        Active Tournament Name
                      </h5>
                      <div className="flex gap-4">
                        <input
                          type="text"
                          value={tournamentName}
                          onChange={(e) => setTournamentName(e.target.value)}
                          placeholder="e.g., DBL Cirebon Cup, Piala Walikota, etc."
                          className="flex-1 bg-brand-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-orange transition-all"
                        />
                        <button
                          onClick={handleSaveTournamentName}
                          className="px-6 py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-display font-black text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer whitespace-nowrap"
                        >
                          Save Name
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Standings Table */}
                      <div className="lg:col-span-8 bg-white/2 border border-white/5 rounded-2xl p-6 overflow-x-auto">
                        <table className="w-full text-start text-xs">
                          <thead>
                            <tr
                              className={`text-gray-500 uppercase tracking-wider font-bold border-b border-white/10 pb-3 ${isRtl ? "flex-row-reverse text-right" : "text-left"}`}
                            >
                              <th className="pb-3 text-start">
                                {t("matches", "team")}
                              </th>
                              <th className="pb-3 text-center">
                                {t("matches", "wins")}
                              </th>
                              <th className="pb-3 text-center">
                                {t("matches", "losses")}
                              </th>
                              <th className="pb-3 text-center">
                                {t("matches", "points")}
                              </th>
                              <th className="pb-3 text-center">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {standings.map((team) => (
                              <tr
                                key={team.id}
                                className="border-b border-white/3"
                              >
                                <td className="py-4 font-bold text-white uppercase flex items-center gap-2">
                                  {team.team_name}
                                </td>
                                <td className="py-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() =>
                                        handleUpdateStanding(team.id, "wins", -1)
                                      }
                                      className="px-1.5 py-0.5 bg-white/5 rounded cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="w-6 text-white font-bold">
                                      {team.wins}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleUpdateStanding(team.id, "wins", 1)
                                      }
                                      className="px-1.5 py-0.5 bg-brand-orange text-brand-black rounded font-black cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="py-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() =>
                                        handleUpdateStanding(
                                          team.id,
                                          "losses",
                                          -1,
                                        )
                                      }
                                      className="px-1.5 py-0.5 bg-white/5 rounded cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="w-6 text-white font-bold">
                                      {team.losses}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleUpdateStanding(team.id, "losses", 1)
                                      }
                                      className="px-1.5 py-0.5 bg-brand-orange text-brand-black rounded font-black cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="py-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() =>
                                        handleUpdateStanding(
                                          team.id,
                                          "points",
                                          -1,
                                        )
                                      }
                                      className="px-1.5 py-0.5 bg-white/5 rounded cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-brand-gold font-black">
                                      {team.points}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleUpdateStanding(team.id, "points", 1)
                                      }
                                      className="px-1.5 py-0.5 bg-brand-orange text-brand-black rounded font-black cursor-pointer">
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="py-4 text-center">
                                  <button
                                    onClick={() => handleDeleteStanding(team.id, team.team_name)}
                                    className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Add Team Form */}
                      <div className="lg:col-span-4 bg-white/2 border border-white/5 p-6 rounded-2xl">
                        <h4 className="font-title font-extrabold uppercase text-white text-sm mb-4 flex items-center gap-1.5 text-start">
                          <Plus size={16} className="text-brand-orange" />{" "}
                          Add Team
                        </h4>
                        <form onSubmit={handleAddTeam} className="space-y-4 text-xs">
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              Team Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. BSQ ALL-FIVE"
                              value={newTeamName}
                              onChange={(e) => setNewTeamName(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                          >
                            Add to Rankings
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. STORY & ACHIEVEMENTS PANEL */}
                {activeTab === "story" && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className={`flex items-center justify-between border-b border-white/5 pb-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <h4 className="font-title font-extrabold uppercase text-white text-sm flex items-center gap-2">
                        <Trophy size={16} className="text-brand-gold" />{" "}
                        {t("story", "legacy")} Settings
                      </h4>
                    </div>

                    <form onSubmit={handleSaveAchievements} className="space-y-6 bg-white/2 border border-white/5 p-6 rounded-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* MVPs */}
                        <div>
                          <label className={`block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ${isRtl ? "text-right" : "text-left"}`}>
                            {t("story", "mvps")}
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={mvpsCount}
                            onChange={(e) => setMvpsCount(Number(e.target.value))}
                            className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-gold ${isRtl ? "text-right" : "text-left"}`}
                          />
                        </div>
                        {/* Rings */}
                        <div>
                          <label className={`block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ${isRtl ? "text-right" : "text-left"}`}>
                            {t("story", "rings")}
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={ringsCount}
                            onChange={(e) => setRingsCount(Number(e.target.value))}
                            className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-orange ${isRtl ? "text-right" : "text-left"}`}
                          />
                        </div>
                        {/* Wins */}
                        <div>
                          <label className={`block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ${isRtl ? "text-right" : "text-left"}`}>
                            {t("story", "wins")}
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={winsCount}
                            onChange={(e) => setWinsCount(Number(e.target.value))}
                            className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-orange ${isRtl ? "text-right" : "text-left"}`}
                          />
                        </div>
                      </div>

                      <div className={`flex ${isRtl ? 'justify-start' : 'justify-end'} pt-4 border-t border-white/5`}>
                        <button
                          type="submit"
                          className={`flex items-center gap-2 px-6 py-2.5 bg-brand-orange text-brand-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-brand-burnt transition-colors ${isRtl ? "flex-row-reverse" : ""}`}
                        >
                          <Save size={14} />
                          {t("admin", "saveChanges")}
                        </button>
                      </div>
                    </form>

                    {/* Historical Milestones */}
                    <div className="space-y-4">
                      <div className={`flex items-center justify-between border-b border-white/5 pb-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                        <h4 className="font-title font-extrabold uppercase text-white text-sm flex items-center gap-2">
                          <Sparkles size={16} className="text-brand-orange" />{" "}
                          {t("story", "milestones") || "Historical Milestones"}
                        </h4>
                      </div>

                      {/* List existing milestones */}
                      <div className="space-y-3">
                        {milestones.map((m) => (
                          <div key={m.id} className="bg-white/2 border border-white/5 p-4 rounded-xl flex items-start gap-4">
                            {editingMilestoneId === m.id ? (
                              <form onSubmit={handleUpdateMilestone} className="w-full space-y-2">
                                <div className="flex gap-2">
                                  <input type="text" value={editMilestoneIcon} onChange={e => setEditMilestoneIcon(e.target.value)} className="w-12 bg-black/40 border border-white/10 px-2 py-1.5 rounded text-white text-xs text-center" title="Emoji Icon" />
                                  <input type="text" value={editMilestoneYear} onChange={e => setEditMilestoneYear(e.target.value)} className="w-20 bg-black/40 border border-white/10 px-2 py-1.5 rounded text-white text-xs" placeholder="Year" required />
                                  <input type="text" value={editMilestoneTitle} onChange={e => setEditMilestoneTitle(e.target.value)} className="flex-1 bg-black/40 border border-white/10 px-2 py-1.5 rounded text-white text-xs" placeholder="Title" required />
                                </div>
                                <div className="flex gap-2">
                                  <input type="text" value={editMilestoneDesc} onChange={e => setEditMilestoneDesc(e.target.value)} className="flex-1 bg-black/40 border border-white/10 px-2 py-1.5 rounded text-white text-xs" placeholder="Description" required />
                                  <button type="submit" className="p-1.5 bg-green-500 hover:bg-green-400 text-black rounded cursor-pointer"><Check size={14} /></button>
                                  <button type="button" onClick={() => setEditingMilestoneId(null)} className="p-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded cursor-pointer"><X size={14} /></button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
                                  {m.icon}
                                </div>
                                <div className={`flex-1 ${isRtl ? "text-right" : "text-left"}`}>
                                  <h5 className="font-title font-bold text-white text-sm">
                                    <span className="text-brand-orange mr-2">{m.year}</span>
                                    {m.title}
                                  </h5>
                                  <p className="text-[10px] text-gray-400 mt-1 font-display leading-relaxed">{m.desc}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => startEditMilestone(m)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors cursor-pointer">
                                    <Pencil size={14} />
                                  </button>
                                  <button onClick={() => handleDeleteMilestone(m.id, m.year)} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add new milestone form */}
                      <form onSubmit={handleAddMilestone} className="bg-white/2 border border-brand-orange/20 p-5 rounded-2xl space-y-4">
                        <h5 className="font-display font-bold text-xs uppercase text-brand-orange tracking-wider text-start flex items-center gap-2">
                          <Plus size={14} /> Add Milestone
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">Year</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 2026"
                              value={newMilestoneYear}
                              onChange={(e) => setNewMilestoneYear(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2 rounded-xl text-white text-start text-xs"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">Title</label>
                            <input
                              type="text"
                              required
                              placeholder="Milestone Title"
                              value={newMilestoneTitle}
                              onChange={(e) => setNewMilestoneTitle(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2 rounded-xl text-white text-start text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">Icon</label>
                            <input
                              type="text"
                              required
                              placeholder="Emoji e.g. 🏆"
                              value={newMilestoneIcon}
                              onChange={(e) => setNewMilestoneIcon(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2 rounded-xl text-white text-start text-xs text-center"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">Description</label>
                          <textarea
                            required
                            value={newMilestoneDesc}
                            onChange={(e) => setNewMilestoneDesc(e.target.value)}
                            placeholder="Detailed description of the achievement..."
                            className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white h-16 resize-none text-start text-xs"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-brand-black border border-brand-orange/30 font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-xs"
                        >
                          Add to Legacy Timeline
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* 6. BOOKINGS PANEL */}
                {activeTab === "bookings" && (
                  <div className="space-y-6">
                    <div className={`flex items-center justify-between border-b border-white/5 pb-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <h4 className="font-title font-extrabold uppercase text-white text-sm flex items-center gap-2">
                        <Ticket size={16} className="text-brand-orange" />{" "}
                        {language === "id" ? "Daftar Tiket & Penggemar" : "Tickets & Community List"}
                      </h4>
                    </div>

                    {/* Booked Tickets List */}
                    <div className="bg-white/2 border border-white/5 rounded-2xl overflow-hidden">
                      <div className="p-4 border-b border-white/5 bg-black/20">
                        <h5 className="font-bold text-brand-orange uppercase text-xs tracking-widest">
                          {language === "id" ? "Tiket Terpesan" : "Booked Tickets"}
                        </h5>
                      </div>
                      <div className="p-4 space-y-3">
                        {useAppStore.getState().bookedTickets.length === 0 ? (
                          <div className="text-center py-6 text-gray-500 text-xs font-bold uppercase tracking-widest">
                            {language === "id" ? "Belum ada tiket yang dipesan." : "No tickets booked yet."}
                          </div>
                        ) : (
                          useAppStore.getState().bookedTickets.map((ticket, idx) => (
                            <div key={idx} className={`flex items-center justify-between bg-black/40 border border-white/5 p-3 rounded-xl ${isRtl ? "flex-row-reverse" : ""}`}>
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold block">
                                  {ticket.matchId} | VS {ticket.opponent}
                                </span>
                                <h6 className="text-white font-title font-bold text-sm">Seat {ticket.seatNumber}</h6>
                              </div>
                              <div className={`text-[10px] font-bold text-brand-gold bg-brand-gold/10 px-2 py-1 rounded ${isRtl ? "ml-2" : "mr-2"}`}>
                                {ticket.qrCode}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminPortal;
