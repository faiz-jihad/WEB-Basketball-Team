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
  Lock,
  Unlock,
} from "lucide-react";
import { db } from "../lib/supabase";
import type { Player, Match, Standing, Merchandise, Milestone, ActiveSession } from "../lib/supabase";
import useAppStore from "../lib/store";
import type { BookedTicket } from "../lib/store";
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

  // Removed hardcoded passcodes for security. Now using Supabase Auth.

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passError, setPassError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "matches" | "roster" | "store" | "standings" | "story" | "bookings" | "active_users"
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
  const bookedTickets = useAppStore((state) => state.bookedTickets);
  const verifyTicket = useAppStore((state) => state.verifyTicket);
  const deleteBooking = useAppStore((state) => state.deleteBooking);
  const clearAllBookings = useAppStore((state) => state.clearAllBookings);
  const t = (section: string, key: string) =>
    getTranslation(language, section, key);
  const isRtl = language === "ar";

  const [searchQrCode, setSearchQrCode] = useState("");
  const [verificationResult, setVerificationResult] = useState<{
    status: 'valid' | 'invalid';
    ticket: BookedTicket;
  } | null>(null);

  const handleSearchQr = () => {
    if (!searchQrCode.trim()) return;
    const tix = bookedTickets.find(t => t.qrCode.toLowerCase() === searchQrCode.trim().toLowerCase());
    if (tix) {
      setVerificationResult({ status: 'valid', ticket: tix });
    } else {
      setVerificationResult({ status: 'invalid', ticket: {} as any });
    }
  };

  const handleConfirmVerify = (qr: string) => {
    verifyTicket(qr);
    addToast(
      "success",
      language === "id" ? "Tiket Diverifikasi" : "Ticket Verified",
      language === "id" ? `Kode QR ${qr} berhasil diverifikasi.` : `QR Code ${qr} successfully checked-in.`
    );
    // Refresh verification result view
    const latestTickets = useAppStore.getState().bookedTickets;
    const updatedTix = latestTickets.find(t => t.qrCode === qr);
    if (updatedTix) {
      setVerificationResult({ status: 'valid', ticket: updatedTix });
    }
  };

  const handleDeleteBooking = (qr: string) => {
    if (confirm(language === "id" ? "Apakah Anda yakin ingin menghapus booking ini?" : "Are you sure you want to delete this booking?")) {
      deleteBooking(qr);
      addToast(
        "info",
        language === "id" ? "Booking Dihapus" : "Booking Deleted",
        language === "id" ? `Booking dengan kode QR ${qr} telah dihapus.` : `Booking with QR Code ${qr} has been deleted.`
      );
      if (verificationResult && verificationResult.ticket.qrCode === qr) {
        setVerificationResult(null);
      }
    }
  };

  const handleClearAllBookings = () => {
    if (confirm(language === "id" ? "Apakah Anda yakin ingin menghapus SEMUA booking? Ini akan mengosongkan seluruh kursi!" : "Are you sure you want to delete ALL bookings? This will clear all seats!")) {
      clearAllBookings();
      addToast(
        "success",
        language === "id" ? "Semua Booking Dihapus" : "All Bookings Cleared",
        language === "id" ? "Seluruh data kursi kini telah dikosongkan." : "All seats have been successfully cleared."
      );
      setVerificationResult(null);
    }
  };

  const getTabLabel = (tab: string) => {
    if (tab === "matches") return t("nav", "matches");
    if (tab === "roster") return t("nav", "roster");
    if (tab === "store") return t("nav", "shop");
    if (tab === "standings") return t("matches", "standingsTitle");
    if (tab === "story") return t("story", "legacy");
    if (tab === "bookings") return "Community & Bookings";
    if (tab === "active_users") return language === "id" ? "Pengguna Online" : "Online Users";
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

  // Auth check using Supabase Auth
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !email || !password) return;

    setIsLoading(true);
    setPassError(false);

    try {
      const { data, error } = await db.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data?.user) {
        throw new Error(error?.message || "Invalid credentials");
      }

      // In a real app, verify the user's role from auth claims or a users table.
      // Here we assume successful login matches their selected role for demo purposes.
      setIsAuthenticated(true);
      setAuthenticatedRole(selectedRole);
      setPassword("");
      setShowPassword(false);

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
    } catch (err: any) {
      setPassError(true);
      setTimeout(() => setPassError(false), 500);
      addToast(
        "warning",
        t("admin", "deniedToast"),
        err.message || t("admin", "deniedToastDesc"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // State caches for database
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [merchandise, setMerchandise] = useState<Merchandise[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [newTeamName, setNewTeamName] = useState("");

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    const newEntry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "team_" + Date.now(),
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
    (db as any)
      .from("active_sessions")
      .select("*")
      .then(({ data }: any) => {
        if (data) setActiveSessions(data as ActiveSession[]);
      });
  };

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadDatabase();
    }
  }, [isAuthenticated, isOpen]);

  useEffect(() => {
    const fetchSessions = () => {
      (db as any).from("active_sessions").select("*").then(({ data }: any) => {
        if (data) setActiveSessions(data as ActiveSession[]);
      });
    };

    window.addEventListener("bsq_active_sessions_updated", fetchSessions);
    return () => {
      window.removeEventListener("bsq_active_sessions_updated", fetchSessions);
    };
  }, []);

  const handleSyncLocalData = () => {
    const getLocal = (table: string, version = "v2") => {
      const val = localStorage.getItem(`bsq_db_${version}_${table}`);
      return val ? JSON.parse(val) : [];
    };

    const localPlayers = getLocal("players");
    const localMatches = getLocal("matches");
    const localStandings = getLocal("standings", "v3");
    const localMerchandise = getLocal("merchandise");
    const localMilestones = getLocal("milestones");
    const localManager = getLocal("manager");

    const syncPromises: Promise<any>[] = [];

    addToast("info", "Syncing Database...", "Migrating local data to Supabase...");

    if (localPlayers.length > 0) {
      const cleanPlayers = localPlayers.map((p: any) => ({
        ...p,
        number: parseInt(p.number) || 0
      }));
      syncPromises.push(
        db.from("players").delete().neq("id", "_none_")
          .then((res: any) => {
            if (res.error) return res;
            return db.from("players").insert(cleanPlayers);
          })
      );
    }
    if (localMatches.length > 0) {
      const cleanMatches = localMatches.map((m: any) => {
        let parsedDate = new Date(m.date);
        if (isNaN(parsedDate.getTime())) {
          parsedDate = new Date(); // fallback to current time
        }
        return {
          ...m,
          date: parsedDate.toISOString(),
          score_home: parseInt(m.score_home) || 0,
          score_away: parseInt(m.score_away) || 0,
          quarter: m.quarter ? (parseInt(m.quarter) || null) : null
        };
      });
      syncPromises.push(
        db.from("matches").delete().neq("id", "_none_")
          .then((res: any) => {
            if (res.error) return res;
            return db.from("matches").insert(cleanMatches);
          })
      );
    }
    if (localStandings.length > 0) {
      const cleanStandings = localStandings.map((s: any) => ({
        ...s,
        wins: parseInt(s.wins) || 0,
        losses: parseInt(s.losses) || 0,
        points: parseInt(s.points) || 0
      }));
      syncPromises.push(
        db.from("standings").delete().neq("id", "_none_")
          .then((res: any) => {
            if (res.error) return res;
            return db.from("standings").insert(cleanStandings);
          })
      );
    }
    if (localMerchandise.length > 0) {
      const cleanMerchandise = localMerchandise.map((m: any) => {
        const rawPrice = typeof m.price === "string" 
          ? m.price.replace(/[^0-9.]/g, "") 
          : String(m.price);
        const parsedPrice = parseFloat(rawPrice) || 0;
        return {
          ...m,
          price: parsedPrice,
          stock: parseInt(m.stock) || 0
        };
      });
      syncPromises.push(
        db.from("merchandise").delete().neq("id", "_none_")
          .then((res: any) => {
            if (res.error) return res;
            return db.from("merchandise").insert(cleanMerchandise);
          })
      );
    }
    if (localMilestones.length > 0) {
      const mappedMilestones = localMilestones.map((m: any) => ({
        id: m.id,
        year: String(m.year),
        title: m.title,
        desc: m.desc,
        icon: m.icon
      }));
      syncPromises.push(
        db.from("milestones").delete().neq("id", "_none_")
          .then((res: any) => {
            if (res.error) return res;
            return db.from("milestones").insert(mappedMilestones);
          })
      );
    }
    if (localManager.length > 0) {
      syncPromises.push(
        db.from("manager").delete().neq("id", "_none_")
          .then((res: any) => {
            if (res.error) return res;
            return db.from("manager").insert(localManager);
          })
      );
    }

    Promise.all(syncPromises)
      .then((results) => {
        const errors = results
          .filter((r: any) => r && r.error)
          .map((r: any) => r.error.message || JSON.stringify(r.error));

        if (errors.length > 0) {
          console.error("Sync errors:", errors);
          addToast("warning", "Sync Failed", `Error: ${errors.slice(0, 2).join(", ")}`);
        } else {
          addToast("success", "Sync Completed! 🎉", "All local data successfully uploaded to Supabase!");
        }
        loadDatabase();
      })
      .catch((err) => {
        console.error("Migration error:", err);
        addToast("warning", "Sync Failed", "An error occurred during database migration.");
      });
  };

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
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "milestone_" + Date.now(),
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
      .then(({ error }: any) => {
        if (error) {
          addToast("warning", "Update Failed", error.message || "Failed to update score.");
          return;
        }
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
      .then(({ error }: any) => {
        if (error) {
          addToast("warning", "Status Update Failed", error.message || "Failed to change status.");
          return;
        }
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
              .eq("id", vortexStand.id)
              .then(({ error: standError }: any) => {
                if (standError) console.error("Error updating home standings:", standError);
              });
          }

          // Find Opponent standing
          const oppStand = standings.find((s) =>
            s && s.team_name && match && match.opponent && s.team_name.toLowerCase().includes(match.opponent.toLowerCase()),
          );
          if (oppStand) {
            db.from("standings")
              .update({
                wins: oppStand.wins + (homeWon ? 0 : 1),
                losses: oppStand.losses + (homeWon ? 1 : 0),
                points: oppStand.points + (homeWon ? 1 : 3),
                streak: homeWon ? "L1" : "W1",
              })
              .eq("id", oppStand.id)
              .then(({ error: standError }: any) => {
                if (standError) console.error("Error updating opponent standings:", standError);
              });
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
    const parsedDate = new Date(match.date);
    setEditMatchDate(isNaN(parsedDate.getTime()) ? new Date().toISOString().slice(0, 16) : parsedDate.toISOString().slice(0, 16));
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
      .then(({ error }: any) => {
        if (error) {
          addToast("warning", "Update Failed", error.message || "Failed to update match.");
          return;
        }
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
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "match_" + Date.now(),
        opponent: newMatchOpponent.trim(),
        opponent_logo:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100",
        date: new Date(newMatchDate).toISOString(),
        venue: newMatchVenue,
        status: "UPCOMING",
        score_home: 0,
        score_away: 0,
      })
      .then(({ error }: any) => {
        if (error) {
          addToast("warning", "Failed to Add Match", error.message || "Insert failed.");
          return;
        }
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
  const [newPlayerSPG, setNewPlayerSPG] = useState("1.2");
  const [newPlayerBPG, setNewPlayerBPG] = useState("0.8");
  const [newPlayerHighlightUrl, setNewPlayerHighlightUrl] = useState("https://youtu.be/fGNu9WiTqXg");
  const [newPlayerAwards, setNewPlayerAwards] = useState("");
  const [newPlayerSocialHandle, setNewPlayerSocialHandle] = useState("");
  const [newPlayerFollowers, setNewPlayerFollowers] = useState("");
  const [newPlayerSocialFeed1, setNewPlayerSocialFeed1] = useState("");
  const [newPlayerSocialFeed2, setNewPlayerSocialFeed2] = useState("");
  const [newPlayerSocialFeed3, setNewPlayerSocialFeed3] = useState("");

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const parsedAwards = newPlayerAwards.split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const parsedSocialFeed = [
      newPlayerSocialFeed1.trim(),
      newPlayerSocialFeed2.trim(),
      newPlayerSocialFeed3.trim()
    ].filter(Boolean);

    db.from("players")
      .insert({
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "player_" + Date.now(),
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
          ppg: parseFloat(newPlayerPPG) || 0,
          apg: parseFloat(newPlayerAPG) || 0,
          rpg: parseFloat(newPlayerRPG) || 0,
          spg: parseFloat(newPlayerSPG) || 1.2,
          bpg: parseFloat(newPlayerBPG) || 0.8,
        },
        highlight_url: newPlayerHighlightUrl.trim() || "https://youtu.be/fGNu9WiTqXg",
        awards: parsedAwards.length > 0 ? parsedAwards : null,
        social_handle: newPlayerSocialHandle.trim() || null,
        followers: newPlayerFollowers.trim() || null,
        social_feed: parsedSocialFeed.length > 0 ? parsedSocialFeed : null
      })
      .then(({ error }: any) => {
        if (error) {
          addToast(
            "warning",
            "Failed to Create Player",
            error.message || "Database write failed."
          );
          return;
        }
        loadDatabase();
        setNewPlayerName("");
        setNewPlayerBio("");
        setNewPlayerPhoto("");
        setNewPlayerNum("0");
        setNewPlayerHeight("195 cm");
        setNewPlayerWeight("90 kg");
        setNewPlayerPPG("15");
        setNewPlayerAPG("4");
        setNewPlayerRPG("5");
        setNewPlayerSPG("1.2");
        setNewPlayerBPG("0.8");
        setNewPlayerHighlightUrl("https://youtu.be/fGNu9WiTqXg");
        setNewPlayerAwards("");
        setNewPlayerSocialHandle("");
        setNewPlayerFollowers("");
        setNewPlayerSocialFeed1("");
        setNewPlayerSocialFeed2("");
        setNewPlayerSocialFeed3("");
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
        .then(({ error }: any) => {
          if (error) {
            addToast("warning", "Failed to Remove Player", error.message || "Delete failed.");
            return;
          }
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
  const [editPlayerHeight, setEditPlayerHeight] = useState("");
  const [editPlayerWeight, setEditPlayerWeight] = useState("");
  const [editPlayerBio, setEditPlayerBio] = useState("");
  const [editPlayerPhoto, setEditPlayerPhoto] = useState("");
  const [editPlayerHighlightUrl, setEditPlayerHighlightUrl] = useState("");
  const [editPlayerPPG, setEditPlayerPPG] = useState("0");
  const [editPlayerAPG, setEditPlayerAPG] = useState("0");
  const [editPlayerRPG, setEditPlayerRPG] = useState("0");
  const [editPlayerSPG, setEditPlayerSPG] = useState("0.0");
  const [editPlayerBPG, setEditPlayerBPG] = useState("0.0");
  const [editPlayerAwards, setEditPlayerAwards] = useState("");
  const [editPlayerSocialHandle, setEditPlayerSocialHandle] = useState("");
  const [editPlayerFollowers, setEditPlayerFollowers] = useState("");
  const [editPlayerSocialFeed1, setEditPlayerSocialFeed1] = useState("");
  const [editPlayerSocialFeed2, setEditPlayerSocialFeed2] = useState("");
  const [editPlayerSocialFeed3, setEditPlayerSocialFeed3] = useState("");

  const startEditPlayer = (p: Player) => {
    setEditingPlayerId(p.id);
    setEditPlayerName(p.name);
    setEditPlayerPos(p.position);
    setEditPlayerNum(p.number.toString());
    setEditPlayerHeight(p.height || "195 cm");
    setEditPlayerWeight(p.weight || "90 kg");
    setEditPlayerBio(p.bio || "");
    setEditPlayerPhoto(p.photo || "");
    setEditPlayerHighlightUrl(p.highlight_url || "https://youtu.be/fGNu9WiTqXg");
    setEditPlayerPPG((p.stats?.ppg || 0).toString());
    setEditPlayerAPG((p.stats?.apg || 0).toString());
    setEditPlayerRPG((p.stats?.rpg || 0).toString());
    setEditPlayerSPG((p.stats?.spg || 1.2).toString());
    setEditPlayerBPG((p.stats?.bpg || 0.8).toString());
    setEditPlayerAwards((p.awards || []).join(", "));
    setEditPlayerSocialHandle(p.social_handle || "");
    setEditPlayerFollowers(p.followers || "");
    setEditPlayerSocialFeed1(p.social_feed?.[0] || "");
    setEditPlayerSocialFeed2(p.social_feed?.[1] || "");
    setEditPlayerSocialFeed3(p.social_feed?.[2] || "");
  };

  const handleUpdatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayerId || !editPlayerName.trim()) return;

    const parsedAwards = editPlayerAwards.split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const parsedSocialFeed = [
      editPlayerSocialFeed1.trim(),
      editPlayerSocialFeed2.trim(),
      editPlayerSocialFeed3.trim()
    ].filter(Boolean);

    db.from("players")
      .update({
        name: editPlayerName.trim(),
        position: editPlayerPos,
        number: parseInt(editPlayerNum) || 0,
        height: editPlayerHeight,
        weight: editPlayerWeight,
        bio: editPlayerBio.trim(),
        photo: editPlayerPhoto,
        highlight_url: editPlayerHighlightUrl.trim(),
        stats: {
          ppg: parseFloat(editPlayerPPG) || 0,
          apg: parseFloat(editPlayerAPG) || 0,
          rpg: parseFloat(editPlayerRPG) || 0,
          spg: parseFloat(editPlayerSPG) || 1.2,
          bpg: parseFloat(editPlayerBPG) || 0.8,
        },
        awards: parsedAwards.length > 0 ? parsedAwards : null,
        social_handle: editPlayerSocialHandle.trim() || null,
        followers: editPlayerFollowers.trim() || null,
        social_feed: parsedSocialFeed.length > 0 ? parsedSocialFeed : null
      })
      .eq("id", editingPlayerId)
      .then(({ error }: any) => {
        if (error) {
          addToast("warning", "Failed to Update Player", error.message || "Update failed.");
          return;
        }
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
        is_locked: false,
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

  const handleToggleLockMerch = (item: Merchandise) => {
    db.from("merchandise")
      .update({ is_locked: !item.is_locked })
      .eq("id", item.id)
      .then(() => {
        loadDatabase();
        window.dispatchEvent(new Event("bsq_inventory_updated"));
        addToast(
          "success",
          !item.is_locked ? "Product Locked" : "Product Unlocked",
          `Successfully ${!item.is_locked ? "locked" : "unlocked"} ${item.name}.`
        );
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
                        setPassword("");
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
                        setPassword("");
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
                        setPassword("");
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
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-center bg-black/40 border border-white/10 rounded-xl py-3 text-sm text-white focus:outline-none focus:border-brand-orange mb-4"
                      />
                      <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5 text-center">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`w-full text-center bg-black/40 border rounded-xl py-3 text-sm text-white focus:outline-none tracking-widest ${
                            passError
                              ? "border-red-600 focus:border-red-600"
                              : "border-white/10 focus:border-brand-orange"
                          } ${isRtl ? "pl-10" : "pr-10"}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer ${
                            isRtl ? "left-3" : "right-3"
                          }`}
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      {passError && (
                        <span className="text-[9px] text-red-500 font-bold block mt-1 text-center font-display">
                          {language === "id"
                            ? "Kredensial tidak valid"
                            : "Invalid credentials"}
                        </span>
                      )}
                    </div>
                    <button
                      disabled={isLoading}
                      className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black text-xs tracking-[0.2em] rounded-xl uppercase transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (language === "id" ? "Memverifikasi..." : "Verifying...") : t("admin", "authBtn")}
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
              className="relative w-[95%] md:max-w-5xl md:w-full h-[90vh] md:h-[85vh] bg-bg-dark border border-brand-orange/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10"
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
                    onClick={handleSyncLocalData}
                    className="flex items-center gap-1.5 px-3 py-2 bg-brand-orange/15 hover:bg-brand-orange hover:text-brand-black border border-brand-orange/30 text-brand-orange hover:border-brand-orange/50 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    <RefreshCw size={12} className="animate-spin-slow" />
                    <span className="hidden sm:inline">Sync Local Data</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAuthenticated(false);
                      setAuthenticatedRole(null);
                      setPassError(false);
                      setPassword("");
                      db.auth?.signOut();
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
                    <span className="hidden sm:inline">{t("admin", "logout")}</span>
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
                className={`flex bg-white/2 border-b border-white/5 text-xs font-display font-semibold px-4 gap-6 overflow-x-auto whitespace-nowrap scrollbar-hide ${isRtl ? "flex-row-reverse" : ""}`}
              >
                {(
                  (authenticatedRole === "admin"
                    ? ["matches", "roster", "store", "standings", "story", "bookings", "active_users"]
                    : authenticatedRole === "coach"
                      ? ["matches", "roster"]
                      : ["store"]) as ("matches" | "standings" | "roster" | "story" | "store" | "bookings" | "active_users")[]
                ).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      sessionStorage.setItem("bsq_admin_active_tab", tab);
                    }}
                    className={`shrink-0 py-4 px-2 uppercase tracking-wider relative cursor-pointer ${
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
              <div className="flex-1 overflow-y-auto p-4 md:p-8 font-display">
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
                            <form onSubmit={handleUpdatePlayer} className="w-full space-y-4 bg-white/2 border border-white/10 p-5 rounded-2xl animate-fade-in text-start">
                              <h5 className="text-[10px] font-display font-black text-brand-orange uppercase tracking-wider mb-2">
                                Edit Player Details
                              </h5>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Name</label>
                                  <input 
                                    type="text" 
                                    value={editPlayerName} 
                                    onChange={e => setEditPlayerName(e.target.value)} 
                                    required 
                                    className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2 rounded-xl text-white text-xs" 
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Jersey #</label>
                                  <input 
                                    type="number" 
                                    value={editPlayerNum} 
                                    onChange={e => setEditPlayerNum(e.target.value)} 
                                    required 
                                    className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2 rounded-xl text-white text-xs" 
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Position</label>
                                  <select 
                                    value={editPlayerPos} 
                                    onChange={e => setEditPlayerPos(e.target.value as Player["position"])} 
                                    className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2 rounded-xl text-white text-xs"
                                  >
                                    {["PG", "SG", "SF", "PF", "C"].map(pos => <option key={pos} value={pos}>{pos}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Height</label>
                                  <input 
                                    type="text" 
                                    value={editPlayerHeight} 
                                    onChange={e => setEditPlayerHeight(e.target.value)} 
                                    className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2 rounded-xl text-white text-xs" 
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Weight</label>
                                  <input 
                                    type="text" 
                                    value={editPlayerWeight} 
                                    onChange={e => setEditPlayerWeight(e.target.value)} 
                                    className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-2 rounded-xl text-white text-xs" 
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-5 gap-1.5">
                                <div>
                                  <label className="text-[8px] text-gray-505 font-bold block mb-1 uppercase text-center">PPG</label>
                                  <input 
                                    type="number" step="0.1" 
                                    value={editPlayerPPG} 
                                    onChange={e => setEditPlayerPPG(e.target.value)} 
                                    className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none p-1.5 rounded-lg text-white text-center text-xs" 
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] text-gray-505 font-bold block mb-1 uppercase text-center">APG</label>
                                  <input 
                                    type="number" step="0.1" 
                                    value={editPlayerAPG} 
                                    onChange={e => setEditPlayerAPG(e.target.value)} 
                                    className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none p-1.5 rounded-lg text-white text-center text-xs" 
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] text-gray-505 font-bold block mb-1 uppercase text-center">RPG</label>
                                  <input 
                                    type="number" step="0.1" 
                                    value={editPlayerRPG} 
                                    onChange={e => setEditPlayerRPG(e.target.value)} 
                                    className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none p-1.5 rounded-lg text-white text-center text-xs" 
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] text-gray-505 font-bold block mb-1 uppercase text-center">SPG</label>
                                  <input 
                                    type="number" step="0.1" 
                                    value={editPlayerSPG} 
                                    onChange={e => setEditPlayerSPG(e.target.value)} 
                                    className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none p-1.5 rounded-lg text-white text-center text-xs" 
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] text-gray-505 font-bold block mb-1 uppercase text-center">BPG</label>
                                  <input 
                                    type="number" step="0.1" 
                                    value={editPlayerBPG} 
                                    onChange={e => setEditPlayerBPG(e.target.value)} 
                                    className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none p-1.5 rounded-lg text-white text-center text-xs" 
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Awards / Honors (Comma-separated)</label>
                                <input 
                                  type="text" 
                                  value={editPlayerAwards} 
                                  onChange={e => setEditPlayerAwards(e.target.value)} 
                                  placeholder="e.g. 2x Finals MVP, All-Star First Team, Blocks Leader" 
                                  className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2 rounded-xl text-white text-xs" 
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Social Handle</label>
                                  <input 
                                    type="text" 
                                    value={editPlayerSocialHandle} 
                                    onChange={e => setEditPlayerSocialHandle(e.target.value)} 
                                    placeholder="e.g. marcus_v3" 
                                    className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2 rounded-xl text-white text-xs" 
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Followers Count</label>
                                  <input 
                                    type="text" 
                                    value={editPlayerFollowers} 
                                    onChange={e => setEditPlayerFollowers(e.target.value)} 
                                    placeholder="e.g. 150K or 1.2M" 
                                    className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2 rounded-xl text-white text-xs" 
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Social Feed Posts (Up to 3 recent updates)</label>
                                <input 
                                  type="text" 
                                  value={editPlayerSocialFeed1} 
                                  onChange={e => setEditPlayerSocialFeed1(e.target.value)} 
                                  placeholder="Post 1 (Recent update)" 
                                  className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-1.5 rounded-lg text-white text-xs" 
                                />
                                <input 
                                  type="text" 
                                  value={editPlayerSocialFeed2} 
                                  onChange={e => setEditPlayerSocialFeed2(e.target.value)} 
                                  placeholder="Post 2" 
                                  className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-1.5 rounded-lg text-white text-xs" 
                                />
                                <input 
                                  type="text" 
                                  value={editPlayerSocialFeed3} 
                                  onChange={e => setEditPlayerSocialFeed3(e.target.value)} 
                                  placeholder="Post 3" 
                                  className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-1.5 rounded-lg text-white text-xs" 
                                />
                              </div>

                              <div>
                                <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Photo URL</label>
                                <div className="flex items-center gap-3 bg-black/20 border border-white/10 p-2 rounded-xl">
                                  {editPlayerPhoto && (
                                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                      <img src={editPlayerPhoto} alt="Edit Preview" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                  <input 
                                    type="text" 
                                    value={editPlayerPhoto} 
                                    onChange={e => setEditPlayerPhoto(e.target.value)} 
                                    placeholder="Photo URL" 
                                    className="flex-1 bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-2 py-1.5 rounded-lg text-white text-xs" 
                                  />
                                  <span className="text-[9px] text-gray-500 uppercase font-black">or</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handlePhotoUpload(e, setEditPlayerPhoto)}
                                    className="text-[10px] text-gray-500 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-bold file:bg-white/5 file:text-white file:cursor-pointer"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Highlight Video URL</label>
                                <input 
                                  type="text" 
                                  value={editPlayerHighlightUrl} 
                                  onChange={e => setEditPlayerHighlightUrl(e.target.value)} 
                                  placeholder="e.g. https://www.w3schools.com/html/mov_bbb.mp4" 
                                  className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2 rounded-xl text-white text-xs" 
                                />
                              </div>

                              <div>
                                <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Player Biography</label>
                                <textarea 
                                  value={editPlayerBio} 
                                  onChange={e => setEditPlayerBio(e.target.value)} 
                                  placeholder="Biography details..." 
                                  className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2 rounded-xl text-white text-xs h-16 resize-none" 
                                />
                              </div>

                              <div className="flex gap-2 justify-end">
                                <button type="button" onClick={() => setEditingPlayerId(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl cursor-pointer text-xs transition-colors">
                                  Cancel
                                </button>
                                <button type="submit" className="px-5 py-2 bg-brand-orange hover:bg-brand-burnt text-brand-black font-black uppercase tracking-wider rounded-xl cursor-pointer text-xs transition-all shadow-md shadow-brand-orange/10">
                                  Save Changes
                                </button>
                              </div>
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
                          <div className="grid grid-cols-5 gap-2">
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-center">
                                PPG
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={newPlayerPPG}
                                onChange={(e) => setNewPlayerPPG(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none p-2 rounded-xl text-white text-center"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-center">
                                APG
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={newPlayerAPG}
                                onChange={(e) => setNewPlayerAPG(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none p-2 rounded-xl text-white text-center"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-center">
                                RPG
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={newPlayerRPG}
                                onChange={(e) => setNewPlayerRPG(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none p-2 rounded-xl text-white text-center"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-center">
                                SPG
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={newPlayerSPG}
                                onChange={(e) => setNewPlayerSPG(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none p-2 rounded-xl text-white text-center"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-center">
                                BPG
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={newPlayerBPG}
                                onChange={(e) => setNewPlayerBPG(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none p-2 rounded-xl text-white text-center"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                              Awards / Honors (Comma-separated)
                            </label>
                            <input 
                              type="text" 
                              value={newPlayerAwards} 
                              onChange={e => setNewPlayerAwards(e.target.value)} 
                              placeholder="e.g. DBL MVP, All-Star, Slam Dunk Champion" 
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-xs" 
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                                Social Handle
                              </label>
                              <input 
                                type="text" 
                                value={newPlayerSocialHandle} 
                                onChange={e => setNewPlayerSocialHandle(e.target.value)} 
                                placeholder="e.g. marcus_v" 
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-xs" 
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-1.5 uppercase text-start">
                                Followers Count
                              </label>
                              <input 
                                type="text" 
                                value={newPlayerFollowers} 
                                onChange={e => setNewPlayerFollowers(e.target.value)} 
                                placeholder="e.g. 50K or 1.2M" 
                                className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-xs" 
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase text-start">
                              Social Feed Posts (Up to 3 updates)
                            </label>
                            <input 
                              type="text" 
                              value={newPlayerSocialFeed1} 
                              onChange={e => setNewPlayerSocialFeed1(e.target.value)} 
                              placeholder="Post 1" 
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2 rounded-xl text-white text-xs" 
                            />
                            <input 
                              type="text" 
                              value={newPlayerSocialFeed2} 
                              onChange={e => setNewPlayerSocialFeed2(e.target.value)} 
                              placeholder="Post 2" 
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2 rounded-xl text-white text-xs" 
                            />
                            <input 
                              type="text" 
                              value={newPlayerSocialFeed3} 
                              onChange={e => setNewPlayerSocialFeed3(e.target.value)} 
                              placeholder="Post 3" 
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2 rounded-xl text-white text-xs" 
                            />
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
                              Highlight Video URL
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. https://www.w3schools.com/html/mov_bbb.mp4"
                              value={newPlayerHighlightUrl}
                              onChange={(e) => setNewPlayerHighlightUrl(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-start"
                            />
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
                            className="w-full py-3 bg-brand-orange hover:bg-brand-burnt text-brand-black font-display font-black text-[10px] tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-brand-orange/15 cursor-pointer mt-4"
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
                                  <img src={item.image} alt={item.name} className={`w-full h-full object-cover ${item.is_locked ? "grayscale opacity-40" : ""}`} />
                                </div>
                                <div>
                                  <span className="text-[9px] text-brand-gold uppercase font-bold">
                                    {getCategoryLabel(item.category)} • {t("shop", "stock")}: {item.stock}
                                    {item.is_locked && <span className="ml-2 text-red-500 font-extrabold">[LOCKED]</span>}
                                  </span>
                                  <h5 className={`font-bold text-white text-sm leading-none mt-1 ${item.is_locked ? "line-through opacity-50" : ""}`}>{item.name}</h5>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-bold">
                                <span className="text-white">Rp {item.price.toLocaleString('id-ID')}</span>
                                <button 
                                  onClick={() => handleToggleLockMerch(item)} 
                                  className={`cursor-pointer transition-colors ${item.is_locked ? "text-red-500 hover:text-red-400" : "text-gray-400 hover:text-white"}`}
                                  title={item.is_locked ? "Unlock Product" : "Lock Product"}
                                >
                                  {item.is_locked ? <Lock size={14} /> : <Unlock size={14} />}
                                </button>
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
                  <div className="space-y-6 text-start">
                    <div className={`flex items-center justify-between border-b border-white/5 pb-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <h4 className="font-title font-extrabold uppercase text-white text-sm flex items-center gap-2">
                        <Ticket size={16} className="text-brand-orange" />{" "}
                        {language === "id" ? "Daftar Tiket & Penggemar" : "Tickets & Community List"}
                      </h4>
                    </div>

                    {/* Verification Search and Action Bar */}
                    <div className="bg-white/2 border border-brand-orange/20 rounded-2xl p-5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-radial-gradient from-brand-orange/5 via-transparent to-transparent pointer-events-none" />
                      <h5 className="font-display font-black text-xs uppercase text-brand-orange tracking-widest mb-3">
                        {language === "id" ? "Verifikasi Tiket QR" : "Verify Ticket QR"}
                      </h5>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          placeholder={language === "id" ? "Masukkan Kode QR (misal: VBC-TIX-...)" : "Enter QR Code (e.g., VBC-TIX-...)"}
                          value={searchQrCode}
                          onChange={(e) => {
                            setSearchQrCode(e.target.value);
                            setVerificationResult(null);
                          }}
                          className="flex-1 bg-black/40 border border-white/10 focus:border-brand-orange focus:outline-none px-3 py-2.5 rounded-xl text-white text-xs font-mono"
                        />
                        <button
                          onClick={handleSearchQr}
                          className="px-6 py-2.5 bg-brand-orange hover:bg-brand-burnt text-brand-black font-display font-black text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer whitespace-nowrap"
                        >
                          {language === "id" ? "Cari Tiket" : "Search Ticket"}
                        </button>
                      </div>

                      {verificationResult && (
                        <div className="mt-4 p-4 rounded-xl border bg-black/40 text-start text-xs font-display space-y-3 border-white/5">
                          {verificationResult.status === 'valid' ? (
                            <>
                              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[10px]">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                {language === "id" ? "Tiket Valid" : "Valid Ticket Found"}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-white">
                                <div>
                                  <span className="text-[10px] text-gray-500 block uppercase">{language === "id" ? "Pertandingan" : "Matchup"}</span>
                                  <span className="font-bold uppercase">vs {verificationResult.ticket.opponent}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-500 block uppercase">{language === "id" ? "Tempat Duduk" : "Seat Location"}</span>
                                  <span className="font-bold uppercase text-brand-gold">{verificationResult.ticket.seatNumber}</span>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                <div>
                                  <span className="text-[9px] text-gray-400 block uppercase">{language === "id" ? "Status Kehadiran" : "Check-in Status"}</span>
                                  {verificationResult.ticket.verified ? (
                                    <span className="text-emerald-400 font-bold uppercase text-[10px]">{language === "id" ? "Sudah Hadir (Checked-in)" : "Checked-in"}</span>
                                  ) : (
                                    <span className="text-amber-500 font-bold uppercase text-[10px]">{language === "id" ? "Belum Hadir (Pending)" : "Pending check-in"}</span>
                                  )}
                                </div>
                                {!verificationResult.ticket.verified && (
                                  <button
                                    onClick={() => handleConfirmVerify(verificationResult.ticket.qrCode)}
                                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-brand-black font-black uppercase text-[10px] rounded-lg tracking-wider transition-colors cursor-pointer"
                                  >
                                    {language === "id" ? "Verifikasi & Hadir" : "Verify & Check-in"}
                                  </button>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="text-red-400 font-bold uppercase text-[10px] flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-400" />
                              {language === "id" ? "Tiket Tidak Ditemukan!" : "Ticket Not Found!"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Booked Tickets List */}
                    <div className="bg-white/2 border border-white/5 rounded-2xl overflow-hidden text-start">
                      <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                        <h5 className="font-bold text-brand-orange uppercase text-xs tracking-widest">
                          {language === "id" ? "Tiket Terpesan" : "Booked Tickets"}
                        </h5>
                        {(bookedTickets || []).length > 0 && (
                          <button
                            onClick={handleClearAllBookings}
                            className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-brand-black border border-red-500/20 rounded-lg font-black uppercase text-[9px] tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Trash2 size={10} />
                            {language === "id" ? "Kosongkan Semua" : "Clear All"}
                          </button>
                        )}
                      </div>
                      <div className="p-4 space-y-3">
                        {(bookedTickets || []).length === 0 ? (
                          <div className="text-center py-6 text-gray-500 text-xs font-bold uppercase tracking-widest">
                            {language === "id" ? "Belum ada tiket yang dipesan." : "No tickets booked yet."}
                          </div>
                        ) : (
                          (bookedTickets || []).map((ticket, idx) => (
                            <div key={idx} className={`flex items-center justify-between bg-black/40 border border-white/5 p-3 rounded-xl ${isRtl ? "flex-row-reverse" : ""}`}>
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold block">
                                  {ticket.matchId} | VS {ticket.opponent}
                                </span>
                                <h6 className="text-white font-title font-bold text-sm">Seat {ticket.seatNumber}</h6>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className={`text-[10px] font-bold text-brand-gold bg-brand-gold/10 px-2 py-1 rounded ${isRtl ? "ml-2" : "mr-2"}`}>
                                  {ticket.qrCode}
                                </div>
                                {ticket.verified ? (
                                  <span className="text-[9px] font-bold text-emerald-450 bg-emerald-500/10 px-2 py-1 rounded uppercase tracking-wider">
                                    {language === "id" ? "Sudah Hadir" : "Checked-in"}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleConfirmVerify(ticket.qrCode)}
                                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-brand-black font-black uppercase text-[9px] rounded-lg tracking-wider transition-colors cursor-pointer"
                                  >
                                    {language === "id" ? "Verifikasi" : "Verify"}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteBooking(ticket.qrCode)}
                                  className="p-1.5 text-red-500 hover:bg-red-500/15 rounded-lg border border-transparent hover:border-red-500/30 transition-all cursor-pointer"
                                  title={language === "id" ? "Hapus Booking" : "Delete Booking"}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. ACTIVE USERS PANEL */}
                {activeTab === "active_users" && (
                  <div className="space-y-6 text-start">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <h4 className="font-title font-extrabold uppercase text-white text-sm flex items-center gap-2">
                        <Users size={16} className="text-brand-orange" />
                        {language === "id" ? "Pengguna yang Sedang Online" : "Active Online Users"}
                      </h4>
                      <div className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {activeSessions.length} {language === "id" ? "Online" : "Active"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeSessions.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500 text-xs font-bold uppercase tracking-widest">
                          {language === "id" ? "Tidak ada pengguna online." : "No users online right now."}
                        </div>
                      ) : (
                        activeSessions.map((session) => (
                          <div
                            key={session.id}
                            className="bg-white/2 border border-white/5 p-4 rounded-2xl flex items-center gap-3 hover:border-brand-orange/30 transition-all"
                          >
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                              <img
                                src={session.avatar}
                                alt={session.username}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-white text-xs truncate">
                                {session.username}
                              </h5>
                              <span className="text-[9px] text-gray-500 block uppercase font-mono mt-0.5">
                                ID: {session.id.slice(0, 8)}...
                              </span>
                            </div>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          </div>
                        ))
                      )}
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
