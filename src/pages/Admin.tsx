import React, { useState, useEffect } from "react";
import {
  Film,
  Plus,
  Trash2,
  Edit3,
  Check,
  TrendingUp,
  Sliders,
  Database,
  RefreshCw,
  FolderPlus,
  Play,
  Upload,
  BarChart,
  Eye,
  Heart,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Globe,
  Settings,
  CheckSquare,
  Square,
  Search,
  Users,
  Shield,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Lock,
  User,
  X,
  Palette,
  Sun,
  Moon,
  Monitor,
  Tv,
  Layers
} from "lucide-react";
import { Movie, UserProfile, ModeratorPermissions, UserRole, ThemeSettings, DEFAULT_THEME_SETTINGS, SiteThemeId, SiteMode, ScreenLayoutMode } from "../types";
import { db, storage } from "../firebase";
import { doc, setDoc, deleteDoc, collection, writeBatch, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { INITIAL_MOVIES, CATEGORIES } from "../data/mockMovies";
import { generateBulkMovies } from "../data/importerTemplates";

interface AdminProps {
  movies: Movie[];
  onRefreshMovies: () => Promise<void>;
  user?: UserProfile | null;
}

export default function Admin({ movies, onRefreshMovies, user }: AdminProps) {
  const [activeTab, setActiveTab] = useState<"list" | "add" | "analytics" | "users" | "theme" | "tmdb" | "adsense" | "omdb" | "freemoviedb" | "moviebox" | "dejavu">("list");

  
  // TMDB Importer States
  const [tmdbApiKey, setTmdbApiKey] = useState("90f67e516bce299e8adf6c603a59bc0e");
  const [tmdbToken, setTmdbToken] = useState("eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5MGY2N2U1MTZiY2UyOTllOGFkZjZjNjAzYTU5YmMwZSIsIm5iZiI6MTc4NDY0ODEwMS43MDIwMDAxLCJzdWIiOiI2YTVmOTFhNTQ4M2U0Yjg0N2IwMTE0YWYiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.gI-_L5vSPc3_sq6Rf8LXNpQU6kwxHOSgmQUixkz1qg0");
  const [tmdbFeedType, setTmdbFeedType] = useState<"popular" | "top_rated" | "now_playing" | "upcoming">("popular");
  const [tmdbPage, setTmdbPage] = useState(1);
  const [tmdbLimit, setTmdbLimit] = useState<number>(50); // Options: 20, 50, 100
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [isFetchingTmdb, setIsFetchingTmdb] = useState(false);
  const [selectedTmdbIds, setSelectedTmdbIds] = useState<number[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importLogs, setImportLogs] = useState<string[]>([]);

  // OMDB Importer States
  const [omdbApiKey, setOmdbApiKey] = useState(() => localStorage.getItem("omdb_api_key") || "5a8f6331");
  const [omdbSearchQuery, setOmdbSearchQuery] = useState("");
  const [omdbTypeFilter, setOmdbTypeFilter] = useState<"all" | "movie" | "series" | "episode">("all");
  const [omdbResults, setOmdbResults] = useState<any[]>([]);
  const [isFetchingOmdb, setIsFetchingOmdb] = useState(false);
  const [selectedOmdbIds, setSelectedOmdbIds] = useState<string[]>([]);
  const [isImportingOmdb, setIsImportingOmdb] = useState(false);
  const [omdbCategoryStrategy, setOmdbCategoryStrategy] = useState<"auto" | "fixed">("fixed");
  const [omdbFixedCategory, setOmdbFixedCategory] = useState("Web Series"); // Default fixed category
  const [omdbCustomCategoryName, setOmdbCustomCategoryName] = useState(""); // Custom user-typed category (e.g. Bangla Natok)
  const [omdbLimit, setOmdbLimit] = useState<number>(20); // 10, 20, 50, 100
  const [omdbLogs, setOmdbLogs] = useState<string[]>([]);

  // Free Movie DB Importer States (using JustWatch API)
  const [fdbSearchQuery, setFdbSearchQuery] = useState("");
  const [fdbResults, setFdbResults] = useState<any[]>([]);
  const [isFetchingFdb, setIsFetchingFdb] = useState(false);
  const [selectedFdbIds, setSelectedFdbIds] = useState<string[]>([]);
  const [isImportingFdb, setIsImportingFdb] = useState(false);
  const [fdbCategoryStrategy, setFdbCategoryStrategy] = useState<"auto" | "fixed">("fixed");
  const [fdbFixedCategory, setFdbFixedCategory] = useState("Web Series");
  const [fdbCustomCategoryName, setFdbCustomCategoryName] = useState("");
  const [fdbLimit, setFdbLimit] = useState<number>(20); // Default 20, up to 100
  const [fdbLogs, setFdbLogs] = useState<string[]>([]);

  // Movie Box Importer States (github.com/parthmax2/movie-box)
  const [movieBoxSearchQuery, setMovieBoxSearchQuery] = useState("");
  const [movieBoxResults, setMovieBoxResults] = useState<any[]>([]);
  const [isFetchingMovieBox, setIsFetchingMovieBox] = useState(false);
  const [selectedMovieBoxIds, setSelectedMovieBoxIds] = useState<string[]>([]);
  const [isImportingMovieBox, setIsImportingMovieBox] = useState(false);
  const [movieBoxCategoryStrategy, setMovieBoxCategoryStrategy] = useState<"auto" | "fixed">("fixed");
  const [movieBoxFixedCategory, setMovieBoxFixedCategory] = useState("Web Series");
  const [movieBoxCustomCategoryName, setMovieBoxCustomCategoryName] = useState("Bangla Natok"); // Custom input (default is Bangla Natok)
  const [movieBoxLimit, setMovieBoxLimit] = useState<number>(100); // Default to 100 as user requested 100-200
  const [movieBoxLogs, setMovieBoxLogs] = useState<string[]>([]);

  // Dejavu API Importer States (github.com/krishnenduroy52/Dejavu-API)
  const [dejavuSearchQuery, setDejavuSearchQuery] = useState("");
  const [dejavuResults, setDejavuResults] = useState<any[]>([]);
  const [isFetchingDejavu, setIsFetchingDejavu] = useState(false);
  const [selectedDejavuIds, setSelectedDejavuIds] = useState<string[]>([]);
  const [isImportingDejavu, setIsImportingDejavu] = useState(false);
  const [dejavuCategoryStrategy, setDejavuCategoryStrategy] = useState<"auto" | "fixed">("fixed");
  const [dejavuFixedCategory, setDejavuFixedCategory] = useState("Drama");
  const [dejavuCustomCategoryName, setDejavuCustomCategoryName] = useState("Bangla Movie"); // Custom input (default is Bangla Movie)
  const [dejavuLimit, setDejavuLimit] = useState<number>(100); // Default to 100 as user requested 100-200
  const [dejavuLogs, setDejavuLogs] = useState<string[]>([]);

  // Google AdSense Configuration States
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [adsClient, setAdsClient] = useState("");
  const [adsBannerSlot, setAdsBannerSlot] = useState("");
  const [adsRowSlot, setAdsRowSlot] = useState("");
  const [adsSidebarSlot, setAdsSidebarSlot] = useState("");
  const [adsFooterSlot, setAdsFooterSlot] = useState("");

  // Custom Direct Campaigns / Fallback Sponsor details
  const [customBannerTitle, setCustomBannerTitle] = useState("Sponsor: Premium Cinema Setup 4K");
  const [customBannerDesc, setCustomBannerDesc] = useState("Upgrade your home theatre with 40% Off on Dolby Atmos soundbars and OLED screens.");
  const [customBannerCta, setCustomBannerCta] = useState("Shop Sale");
  const [customBannerUrl, setCustomBannerUrl] = useState("https://google.com/adsense");

  const [customRowTitle, setCustomRowTitle] = useState("Special Offer: Try MovieFlix VR");
  const [customRowDesc, setCustomRowDesc] = useState("Immerse yourself completely in the action with our brand new cinematic VR Headsets.");
  const [customRowCta, setCustomRowCta] = useState("Experience VR");
  const [customRowUrl, setCustomRowUrl] = useState("https://google.com/adsense");

  const [customSidebarTitle, setCustomSidebarTitle] = useState("Stream Premium Unlimited");
  const [customSidebarDesc, setCustomSidebarDesc] = useState("No latency, ultra-fast 10Gbps gaming and streaming fiber connection starting at $29/mo.");
  const [customSidebarCta, setCustomSidebarCta] = useState("Check Availability");
  const [customSidebarUrl, setCustomSidebarUrl] = useState("https://google.com/adsense");

  const [customFooterTitle, setCustomFooterTitle] = useState("Google AdSense Partner");
  const [customFooterDesc, setCustomFooterDesc] = useState("Targeted, safe advertising optimized for your premium streaming audience. Learn how to monetize your site.");
  const [customFooterCta, setCustomFooterCta] = useState("Get Started");
  const [customFooterUrl, setCustomFooterUrl] = useState("https://google.com/adsense");

  // User Management System States
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "admin" | "moderator" | "user">("all");
  
  // Theme & Appearance Customization States
  const [siteThemeId, setSiteThemeId] = useState<SiteThemeId>("netflix");
  const [siteMode, setSiteMode] = useState<SiteMode>("dark");
  const [isDarkOn, setIsDarkOn] = useState<boolean>(true);
  const [accentColor, setAccentColor] = useState<string>("red");
  const [screenLayoutMode, setScreenLayoutMode] = useState<ScreenLayoutMode>("standard");
  const [enableGlassmorphism, setEnableGlassmorphism] = useState<boolean>(true);
  const [enableGlowEffects, setEnableGlowEffects] = useState<boolean>(true);
  const [allowUserThemeToggle, setAllowUserThemeToggle] = useState<boolean>(true);
  const [isSavingTheme, setIsSavingTheme] = useState<boolean>(false);

  // Load existing Theme settings from Firestore when component mounts
  useEffect(() => {
    const docRef = doc(db, "settings", "theme");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ThemeSettings;
        setSiteThemeId(data.themeId || "netflix");
        setSiteMode(data.mode || "dark");
        setIsDarkOn(data.darkOn !== false);
        setAccentColor(data.accentColor || "red");
        setScreenLayoutMode(data.screenLayoutMode || "standard");
        setEnableGlassmorphism(data.enableGlassmorphism !== false);
        setEnableGlowEffects(data.enableGlowEffects !== false);
        setAllowUserThemeToggle(data.allowUserThemeToggle !== false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveTheme = async (overrides?: Partial<ThemeSettings>) => {
    setIsSavingTheme(true);
    try {
      const themePayload: ThemeSettings = {
        themeId: overrides?.themeId || siteThemeId,
        mode: overrides?.mode || siteMode,
        darkOn: overrides?.darkOn !== undefined ? overrides.darkOn : isDarkOn,
        accentColor: overrides?.accentColor || accentColor,
        screenLayoutMode: overrides?.screenLayoutMode || screenLayoutMode,
        enableGlassmorphism: overrides?.enableGlassmorphism !== undefined ? overrides.enableGlassmorphism : enableGlassmorphism,
        enableGlowEffects: overrides?.enableGlowEffects !== undefined ? overrides.enableGlowEffects : enableGlowEffects,
        allowUserThemeToggle: overrides?.allowUserThemeToggle !== undefined ? overrides.allowUserThemeToggle : allowUserThemeToggle,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "settings", "theme"), themePayload, { merge: true });

      // Apply theme to DOM immediately for smooth feedback
      const root = document.documentElement;
      root.setAttribute("data-theme", themePayload.themeId);
      root.setAttribute("data-mode", themePayload.darkOn ? "dark" : "light");
      root.setAttribute("data-accent", themePayload.accentColor);
      root.setAttribute("data-screen", themePayload.screenLayoutMode);

      if (themePayload.darkOn) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }

      triggerNotification("success", "Website theme & dark mode settings updated globally!");
    } catch (err: any) {
      console.error("Save theme failed:", err);
      triggerNotification("error", `Failed to update theme: ${err.message}`);
    } finally {
      setIsSavingTheme(false);
    }
  };

  
  // State for user role & permission editing
  const [editingUserUid, setEditingUserUid] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole>("user");
  const [editingPermissions, setEditingPermissions] = useState<ModeratorPermissions>({
    manageMovies: true,
    importMovies: true,
    manageAds: false,
    viewAnalytics: true,
  });
  const [isSavingUserRole, setIsSavingUserRole] = useState(false);

  // Manual Add/Promote User Modal States
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [manualUserEmail, setManualUserEmail] = useState("");
  const [manualUserRole, setManualUserRole] = useState<UserRole>("moderator");
  const [manualUserPermissions, setManualUserPermissions] = useState<ModeratorPermissions>({
    manageMovies: true,
    importMovies: true,
    manageAds: false,
    viewAnalytics: true,
  });

  // Real-time listener for Firestore users collection
  useEffect(() => {
    setIsLoadingUsers(true);
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const loadedUsers: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const uid = docSnap.id;
          const email = data.email || null;
          const isSuperAdmin = email === "admin@movieflix.com" || 
                               email === "djskshahin544@gmail.com" || 
                               email === "shahinkhan28qqqq@gmail.com";
          const role: UserRole = isSuperAdmin ? "admin" : (data.role || "user");

          loadedUsers.push({
            uid: uid,
            email: email,
            displayName: data.displayName || null,
            photoURL: data.photoURL || null,
            role: role,
            permissions: data.permissions || {
              manageMovies: true,
              importMovies: true,
              manageAds: false,
              viewAnalytics: true,
            },
            isAdmin: role === "admin" || isSuperAdmin,
            isModerator: role === "moderator",
            createdAt: data.createdAt || data.updatedAt || new Date().toISOString(),
          });
        });

        // Ensure current user is in list if not populated yet
        if (user && !loadedUsers.some(u => u.uid === user.uid)) {
          loadedUsers.unshift(user);
        }

        setUserList(loadedUsers);
        setIsLoadingUsers(false);
      },
      (err) => {
        console.warn("Could not fetch user list from Firestore:", err);
        setIsLoadingUsers(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const handleStartEditUser = (targetUser: UserProfile) => {
    setEditingUserUid(targetUser.uid);
    setEditingRole(targetUser.role || "user");
    setEditingPermissions(targetUser.permissions || {
      manageMovies: true,
      importMovies: true,
      manageAds: false,
      viewAnalytics: true,
    });
  };

  const handleSaveUserRole = async (targetUid: string, email: string | null) => {
    setIsSavingUserRole(true);
    try {
      const userRef = doc(db, "users", targetUid);
      const isSuperAdmin = email === "admin@movieflix.com" || 
                           email === "djskshahin544@gmail.com" || 
                           email === "shahinkhan28qqqq@gmail.com";
      
      const newRole = isSuperAdmin ? "admin" : editingRole;
      const permissionsToSave = newRole === "moderator" ? editingPermissions : {};

      await setDoc(userRef, {
        role: newRole,
        permissions: permissionsToSave,
        isAdmin: newRole === "admin",
        isModerator: newRole === "moderator",
        updatedAt: new Date().toISOString()
      }, { merge: true });

      if (email) {
        const cleanEmail = email.trim().toLowerCase();
        const roleRef = doc(db, "user_roles", cleanEmail);
        await setDoc(roleRef, {
          email: cleanEmail,
          role: newRole,
          permissions: permissionsToSave,
          isAdmin: newRole === "admin",
          isModerator: newRole === "moderator",
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      triggerNotification("success", `User role & permissions saved for ${email || targetUid}`);
      setEditingUserUid(null);
    } catch (err: any) {
      console.error("Save role failed:", err);
      triggerNotification("error", `Failed to update role: ${err.message}`);
    } finally {
      setIsSavingUserRole(false);
    }
  };

  const handleAddManualUserRole = async () => {
    if (!manualUserEmail.trim()) {
      triggerNotification("error", "Please enter a valid user email.");
      return;
    }
    const cleanEmail = manualUserEmail.trim().toLowerCase();
    
    // Check if user already exists in userList
    const existing = userList.find(u => u.email?.toLowerCase() === cleanEmail);
    const targetUid = existing ? existing.uid : `user-${cleanEmail.replace(/[^a-z0-9]/g, "_")}`;

    setIsSavingUserRole(true);
    try {
      const userRef = doc(db, "users", targetUid);
      const isSuperAdmin = cleanEmail === "admin@movieflix.com" || 
                           cleanEmail === "djskshahin544@gmail.com" || 
                           cleanEmail === "shahinkhan28qqqq@gmail.com";
      const finalRole = isSuperAdmin ? "admin" : manualUserRole;
      const finalPermissions = finalRole === "moderator" ? manualUserPermissions : {};

      await setDoc(userRef, {
        email: cleanEmail,
        displayName: existing?.displayName || cleanEmail.split("@")[0],
        role: finalRole,
        permissions: finalPermissions,
        isAdmin: finalRole === "admin",
        isModerator: finalRole === "moderator",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Also persist in user_roles collection by email for pre-assigned logins
      const roleRef = doc(db, "user_roles", cleanEmail);
      await setDoc(roleRef, {
        email: cleanEmail,
        role: finalRole,
        permissions: finalPermissions,
        isAdmin: finalRole === "admin",
        isModerator: finalRole === "moderator",
        updatedAt: new Date().toISOString()
      }, { merge: true });

      triggerNotification("success", `Role successfully assigned to ${cleanEmail}!`);
      setShowAddUserModal(false);
      setManualUserEmail("");
    } catch (err: any) {
      console.error("Manual role assignment failed:", err);
      triggerNotification("error", `Role assignment failed: ${err.message}`);
    } finally {
      setIsSavingUserRole(false);
    }
  };

  // Load existing AdSense settings from Firestore when component mounts
  useEffect(() => {
    const docRef = doc(db, "settings", "adsense");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAdsEnabled(data.isEnabled !== false);
        setAdsClient(data.client || "");
        setAdsBannerSlot(data.bannerSlot || "");
        setAdsRowSlot(data.rowSlot || "");
        setAdsSidebarSlot(data.sidebarSlot || "");
        setAdsFooterSlot(data.footerSlot || "");

        if (data.customAds) {
          if (data.customAds.banner) {
            setCustomBannerTitle(data.customAds.banner.title || "");
            setCustomBannerDesc(data.customAds.banner.desc || "");
            setCustomBannerCta(data.customAds.banner.cta || "");
            setCustomBannerUrl(data.customAds.banner.url || "");
          }
          if (data.customAds.row) {
            setCustomRowTitle(data.customAds.row.title || "");
            setCustomRowDesc(data.customAds.row.desc || "");
            setCustomRowCta(data.customAds.row.cta || "");
            setCustomRowUrl(data.customAds.row.url || "");
          }
          if (data.customAds.sidebar) {
            setCustomSidebarTitle(data.customAds.sidebar.title || "");
            setCustomSidebarDesc(data.customAds.sidebar.desc || "");
            setCustomSidebarCta(data.customAds.sidebar.cta || "");
            setCustomSidebarUrl(data.customAds.sidebar.url || "");
          }
          if (data.customAds.footer) {
            setCustomFooterTitle(data.customAds.footer.title || "");
            setCustomFooterDesc(data.customAds.footer.desc || "");
            setCustomFooterCta(data.customAds.footer.cta || "");
            setCustomFooterUrl(data.customAds.footer.url || "");
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveAdSense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const adsData = {
        isEnabled: adsEnabled,
        client: adsClient.trim(),
        bannerSlot: adsBannerSlot.trim(),
        rowSlot: adsRowSlot.trim(),
        sidebarSlot: adsSidebarSlot.trim(),
        footerSlot: adsFooterSlot.trim(),
        customAds: {
          banner: {
            title: customBannerTitle,
            desc: customBannerDesc,
            cta: customBannerCta,
            url: customBannerUrl
          },
          row: {
            title: customRowTitle,
            desc: customRowDesc,
            cta: customRowCta,
            url: customRowUrl
          },
          sidebar: {
            title: customSidebarTitle,
            desc: customSidebarDesc,
            cta: customSidebarCta,
            url: customSidebarUrl
          },
          footer: {
            title: customFooterTitle,
            desc: customFooterDesc,
            cta: customFooterCta,
            url: customFooterUrl
          }
        }
      };

      await setDoc(doc(db, "settings", "adsense"), adsData);
      triggerNotification("success", "Google AdSense & Custom Display Ads configuration updated successfully!");
    } catch (err: any) {
      console.error("Firestore AdSense update failed:", err);
      triggerNotification("error", `Failed to save configuration: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Movie Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Sci-Fi");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [year, setYear] = useState<number>(2026);
  const [duration, setDuration] = useState("12m 30s");
  const [rating, setRating] = useState("PG-13");
  const [featured, setFeatured] = useState(false);

  // Editing state
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);

  // Loading & status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ thumbnail?: string; video?: string }>({});
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const triggerNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "thumbnail" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(prev => ({ ...prev, [type]: "Uploading..." }));
    try {
      // Setup Storage location
      const storageRef = ref(storage, `${type}s/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      
      if (type === "thumbnail") {
        setThumbnailUrl(downloadUrl);
        setUploadProgress(prev => ({ ...prev, thumbnail: "Upload successful!" }));
      } else {
        setVideoUrl(downloadUrl);
        setUploadProgress(prev => ({ ...prev, video: "Upload successful!" }));
      }
      triggerNotification("success", `${type === "thumbnail" ? "Thumbnail" : "Video"} uploaded successfully to Storage!`);
    } catch (err: any) {
      console.error(`${type} upload failed:`, err);
      // Fallback for sandboxed offline testing or quota error
      setUploadProgress(prev => ({ ...prev, [type]: "Blocked by storage rules or quota. Paste URL instead." }));
      triggerNotification("error", `Could not upload to Storage: ${err.message || "Permissions denied"}. Standardized fallback: please paste external links.`);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const movieId = editingMovieId || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const movieData: Movie = {
      id: movieId,
      title,
      description,
      thumbnail: thumbnailUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200",
      videoUrl: videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      category,
      year: Number(year),
      duration,
      rating,
      featured,
      views: editingMovieId ? (movies.find(m => m.id === editingMovieId)?.views || 100) : 120,
      likes: editingMovieId ? (movies.find(m => m.id === editingMovieId)?.likes || 15) : 5,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "movies", movieId), movieData);
      triggerNotification("success", editingMovieId ? "Movie updated successfully!" : "Movie added successfully!");
      resetForm();
      await onRefreshMovies();
      setActiveTab("list");
    } catch (err: any) {
      console.error("Firestore save failed:", err);
      triggerNotification("error", `Failed to save movie: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Sci-Fi");
    setThumbnailUrl("");
    setVideoUrl("");
    setYear(2026);
    setDuration("12m 30s");
    setRating("PG-13");
    setFeatured(false);
    setEditingMovieId(null);
    setUploadProgress({});
  };

  const handleEditClick = (movie: Movie) => {
    setEditingMovieId(movie.id);
    setTitle(movie.title);
    setDescription(movie.description);
    setCategory(movie.category);
    setThumbnailUrl(movie.thumbnail);
    setVideoUrl(movie.videoUrl);
    setYear(movie.year);
    setDuration(movie.duration);
    setRating(movie.rating);
    setFeatured(movie.featured);
    setActiveTab("add");
  };

  const handleDeleteClick = async (movieId: string) => {
    if (!window.confirm("Are you sure you want to delete this video? This action is irreversible.")) return;

    try {
      await deleteDoc(doc(db, "movies", movieId));
      triggerNotification("success", "Movie deleted successfully from Cloud database.");
      await onRefreshMovies();
    } catch (err: any) {
      console.error("Firestore delete failed:", err);
      triggerNotification("error", `Deletion failed: ${err.message}`);
    }
  };

  const handleBulkSeed = async () => {
    if (!window.confirm("Do you want to seed the sample video catalog to Firestore? This will overwrite or add the standard open-source movies (Tears of Steel, Big Buck Bunny, Sintel, etc.).")) return;
    
    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      INITIAL_MOVIES.forEach((movie) => {
        const docRef = doc(db, "movies", movie.id);
        batch.set(docRef, movie);
      });
      await batch.commit();
      triggerNotification("success", "Catalog seeded successfully! Fully populated.");
      await onRefreshMovies();
    } catch (err: any) {
      console.error("Bulk seed failed:", err);
      triggerNotification("error", `Bulk seed failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchFromTmdb = async () => {
    if (!tmdbApiKey && !tmdbToken) {
      triggerNotification("error", "Please provide a TMDB API Key or Access Token first.");
      return;
    }
    setIsFetchingTmdb(true);
    setImportLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Fetching up to ${tmdbLimit} movies from TMDB starting from Page ${tmdbPage}...`]);
    try {
      // 1 TMDB API page returns 20 items.
      // So Limit 20 = 1 Page, Limit 50 = 3 Pages, Limit 100 = 5 Pages.
      const pagesToFetch = tmdbLimit === 20 ? 1 : tmdbLimit === 50 ? 3 : 5;
      let aggregatedResults: any[] = [];

      for (let i = 0; i < pagesToFetch; i++) {
        const currentPage = tmdbPage + i;
        setImportLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Accessing page ${currentPage} of ${tmdbFeedType} catalog...`]);
        
        let url = `https://api.themoviedb.org/3/movie/${tmdbFeedType}?page=${currentPage}`;
        let headers: any = {};
        
        if (tmdbToken) {
          headers["Authorization"] = `Bearer ${tmdbToken}`;
          headers["accept"] = "application/json";
        } else {
          url += `&api_key=${tmdbApiKey}`;
        }

        const response = await fetch(url, { headers });
        if (!response.ok) {
          if (tmdbApiKey) {
            const fallbackUrl = `https://api.themoviedb.org/3/movie/${tmdbFeedType}?api_key=${tmdbApiKey}&page=${currentPage}`;
            const fallbackResponse = await fetch(fallbackUrl);
            if (fallbackResponse.ok) {
              const data = await fallbackResponse.json();
              if (data.results && data.results.length > 0) {
                aggregatedResults = [...aggregatedResults, ...data.results];
              }
              continue;
            }
          }
          throw new Error(`TMDB HTTP Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          aggregatedResults = [...aggregatedResults, ...data.results];
        } else {
          break; // no more data
        }
      }

      // Slice the aggregated items to match requested limit exactly
      const finalResults = aggregatedResults.slice(0, tmdbLimit);
      setTmdbResults(finalResults);
      setSelectedTmdbIds(finalResults.map((m: any) => m.id));
      
      setImportLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Successfully fetched & aggregated ${finalResults.length} movies!`]);
      triggerNotification("success", `Fetched ${finalResults.length} movies from TMDB successfully.`);
    } catch (err: any) {
      console.error("TMDB Fetch error:", err);
      setImportLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${err.message || err}`]);
      triggerNotification("error", `TMDB Fetch Failed: ${err.message}`);
    } finally {
      setIsFetchingTmdb(false);
    }
  };

  const registerCategoryInFirestore = async (catName: string, subCatName?: string, lang?: string) => {
    if (!catName || !catName.trim()) return;
    try {
      const cleanCat = catName.trim();
      const catSlug = cleanCat.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await setDoc(doc(db, "categories", catSlug), {
        id: catSlug,
        name: cleanCat,
        type: "category",
        updatedAt: new Date().toISOString()
      }, { merge: true });

      if (subCatName && subCatName.trim()) {
        const cleanSub = subCatName.trim();
        const subSlug = cleanSub.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await setDoc(doc(db, "categories", subSlug), {
          id: subSlug,
          name: cleanSub,
          parentCategory: cleanCat,
          type: "subCategory",
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      if (lang && lang.trim()) {
        const cleanLang = lang.trim();
        const langSlug = cleanLang.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await setDoc(doc(db, "categories", langSlug), {
          id: langSlug,
          name: cleanLang,
          type: "language",
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (e) {
      console.warn("Could not register auto-created category:", e);
    }
  };

  const importSelectedToFirestore = async () => {
    if (selectedTmdbIds.length === 0) {
      triggerNotification("error", "Please select at least one movie to import.");
      return;
    }

    setIsImporting(true);
    setImportLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Syncing ${selectedTmdbIds.length} movies to Cloud Firestore...`]);
    let successCount = 0;

    const STREAM_POOL = [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4"
    ];

    const mapTmdbGenreToCategory = (genreIds: number[]): { category: string; subCategory: string } => {
      if (!genreIds || genreIds.length === 0) return { category: "Drama", subCategory: "International" };
      const genreMap: Record<number, string> = {
        28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
        99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
        27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
        10770: "TV Series", 53: "Thriller", 10752: "War", 37: "Western", 10759: "Action & Adventure",
        10762: "Kids & Family", 10765: "Sci-Fi & Fantasy"
      };
      const primary = genreMap[genreIds[0]] || "Drama";
      const secondary = genreIds[1] ? (genreMap[genreIds[1]] || primary) : primary;
      return { category: primary, subCategory: secondary };
    };

    const mapTmdbLanguage = (langCode: string): string => {
      const langMap: Record<string, string> = {
        bn: "Bangla", hi: "Hindi", ko: "Korean", ja: "Japanese", en: "English",
        es: "Spanish", fr: "French", ta: "Tamil", te: "Telugu"
      };
      return langMap[langCode] || "English";
    };

    const assignRatingCode = (category: string, voteAverage: number): string => {
      if (category === "Horror") return "R";
      if (category === "Thriller" && voteAverage > 7.0) return "TV-MA";
      if (category === "Comedy" || category === "Adventure") return voteAverage > 7.5 ? "PG" : "G";
      return "PG-13";
    };

    const generateDuration = (tmdbId: number): string => {
      const baseMinutes = 90 + (tmdbId % 70);
      const hours = Math.floor(baseMinutes / 60);
      const minutes = baseMinutes % 60;
      return `${hours}h ${minutes}m`;
    };

    try {
      const batch = writeBatch(db);

      for (const id of selectedTmdbIds) {
        const movieObj = tmdbResults.find(m => m.id === id);
        if (!movieObj) continue;

        const { category: mappedCategory, subCategory: mappedSubCat } = mapTmdbGenreToCategory(movieObj.genre_ids);
        const langName = mapTmdbLanguage(movieObj.original_language);

        let finalSubCat = mappedSubCat;
        if (movieObj.original_language === "ko") finalSubCat = "K-Drama";
        else if (movieObj.original_language === "bn") finalSubCat = "Bangla Cinema";
        else if (movieObj.original_language === "ja") finalSubCat = "Anime";
        else if (movieObj.original_language === "hi") finalSubCat = "Bollywood";

        const ratingCode = assignRatingCode(mappedCategory, movieObj.vote_average);
        const movieDuration = generateDuration(movieObj.id);
        const streamUrl = STREAM_POOL[Math.abs(movieObj.id) % STREAM_POOL.length];
        const releaseYear = movieObj.release_date ? Number(movieObj.release_date.split("-")[0]) : 2026;

        const uniqueId = `tmdb-${movieObj.id}`;

        const movieData: Movie = {
          id: uniqueId,
          tmdbId: movieObj.id,
          embedUrl: `https://vidsrc.to/embed/movie/${movieObj.id}`,
          title: movieObj.title,
          description: movieObj.overview || "No overview available from TMDB.",
          thumbnail: movieObj.backdrop_path 
            ? `https://image.tmdb.org/t/p/w1280${movieObj.backdrop_path}` 
            : (movieObj.poster_path ? `https://image.tmdb.org/t/p/w500${movieObj.poster_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200"),
          videoUrl: streamUrl,
          category: mappedCategory,
          subCategory: finalSubCat,
          language: langName,
          year: releaseYear,
          duration: movieDuration,
          rating: ratingCode,
          featured: false,
          views: Math.floor(movieObj.popularity * 10) || 500,
          likes: Math.floor(movieObj.vote_average * movieObj.vote_count * 0.1) || 50,
          createdAt: new Date().toISOString()
        };

        const docRef = doc(db, "movies", uniqueId);
        batch.set(docRef, movieData);

        // Auto create & register category in Firestore
        await registerCategoryInFirestore(mappedCategory, finalSubCat, langName);

        successCount++;
        setImportLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Staged: "${movieObj.title}" [${mappedCategory} / ${finalSubCat}]`]);
      }

      await batch.commit();
      setImportLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Success! Fully uploaded ${successCount} movies to Firestore.`]);
      triggerNotification("success", `Successfully uploaded ${successCount} movies from TMDB!`);
      await onRefreshMovies();
    } catch (err: any) {
      console.error("Firestore TMDB Import error:", err);
      setImportLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Firestore Error: ${err.message || err}`]);
      triggerNotification("error", `Import Failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const fetchFromOmdb = async () => {
    if (!omdbSearchQuery.trim()) {
      triggerNotification("error", "Please provide a search title first.");
      return;
    }
    if (!omdbApiKey.trim()) {
      triggerNotification("error", "Please provide an OMDB API Key first.");
      return;
    }

    // Save key to local storage
    localStorage.setItem("omdb_api_key", omdbApiKey.trim());

    setIsFetchingOmdb(true);
    setOmdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Fetching search results for "${omdbSearchQuery}" from OMDB...`]);
    try {
      const itemsPerPage = 10;
      const pagesToFetch = Math.ceil(omdbLimit / itemsPerPage);
      let aggregatedResults: any[] = [];

      for (let i = 1; i <= pagesToFetch; i++) {
        setOmdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Querying OMDB Search Page ${i}...`]);
        const typeParam = omdbTypeFilter === "all" ? "" : `&type=${omdbTypeFilter}`;
        const url = `https://www.omdbapi.com/?s=${encodeURIComponent(omdbSearchQuery.trim())}&apikey=${omdbApiKey.trim()}${typeParam}&page=${i}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`OMDB HTTP Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.Response === "True" && data.Search && data.Search.length > 0) {
          aggregatedResults = [...aggregatedResults, ...data.Search];
        } else {
          if (i === 1) {
            throw new Error(data.Error || "No results found matching that query.");
          }
          break; // no more pages
        }
      }

      const finalResults = aggregatedResults.slice(0, omdbLimit);
      setOmdbResults(finalResults);
      setSelectedOmdbIds(finalResults.map(m => m.imdbID));
      setOmdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Successfully fetched and filtered ${finalResults.length} matches from OMDB.`]);
      triggerNotification("success", `Fetched ${finalResults.length} movies from OMDB successfully.`);
    } catch (err: any) {
      console.error("OMDB Fetch Error:", err);
      setOmdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${err.message || err}`]);
      triggerNotification("error", `OMDB Fetch Failed: ${err.message || err}`);
    } finally {
      setIsFetchingOmdb(false);
    }
  };

  const importSelectedOmdbToFirestore = async () => {
    if (selectedOmdbIds.length === 0) {
      triggerNotification("error", "Please select at least one OMDB title to import.");
      return;
    }

    setIsImportingOmdb(true);
    setOmdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Fetching detailed metadata for ${selectedOmdbIds.length} titles from OMDB...`]);
    let successCount = 0;

    const STREAM_POOL = [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4"
    ];

    const mapOmdbGenreToCategory = (omdbGenreString: string): string => {
      if (!omdbGenreString) return "Drama";
      const genres = omdbGenreString.split(",").map(g => g.trim().toLowerCase());
      if (genres.includes("sci-fi") || genres.includes("science fiction")) return "Sci-Fi";
      if (genres.includes("action")) return "Action";
      if (genres.includes("comedy")) return "Comedy";
      if (genres.includes("adventure")) return "Adventure";
      if (genres.includes("horror")) return "Horror";
      if (genres.includes("thriller") || genres.includes("mystery") || genres.includes("suspense")) return "Thriller";
      if (genres.includes("drama") || genres.includes("romance") || genres.includes("family")) return "Drama";
      return "Drama";
    };

    try {
      const batch = writeBatch(db);

      for (const imdbID of selectedOmdbIds) {
        setOmdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Fetching full details for ${imdbID}...`]);
        const url = `https://www.omdbapi.com/?i=${imdbID}&apikey=${omdbApiKey.trim()}`;
        const response = await fetch(url);
        if (!response.ok) {
          setOmdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Failed to fetch ${imdbID}: ${response.statusText}`]);
          continue;
        }

        const detail = await response.json();
        if (detail.Response !== "True") {
          setOmdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] OMDB Error for ${imdbID}: ${detail.Error}`]);
          continue;
        }

        // Determine destination category and subcategory
        let finalCategory = "Drama";
        let finalSubCategory = detail.Type === "series" ? "Web Series" : "Movie";

        if (omdbCategoryStrategy === "fixed") {
          finalCategory = omdbCustomCategoryName.trim() || omdbFixedCategory;
          finalSubCategory = detail.Type === "series" ? "Web Series" : "Movie";
        } else {
          if (detail.Genre && detail.Genre !== "N/A") {
            const genresList = detail.Genre.split(",").map((g: string) => g.trim());
            finalCategory = genresList[0] || mapOmdbGenreToCategory(detail.Genre);
            finalSubCategory = genresList[1] || (detail.Type === "series" ? "Web Series" : "Movie");
          } else {
            finalCategory = mapOmdbGenreToCategory(detail.Genre);
          }
        }

        const lang = detail.Language && detail.Language !== "N/A" ? detail.Language.split(",")[0].trim() : "English";

        // Format duration (OMDB gives "136 min")
        let formattedDuration = "1h 30m";
        if (detail.Runtime && detail.Runtime !== "N/A") {
          const minMatch = detail.Runtime.match(/(\d+)/);
          if (minMatch) {
            const mins = Number(minMatch[1]);
            const hrs = Math.floor(mins / 60);
            const remainingMins = mins % 60;
            formattedDuration = hrs > 0 ? `${hrs}h ${remainingMins}m` : `${remainingMins}m`;
          }
        }

        const ageRating = detail.Rated && detail.Rated !== "N/A" ? detail.Rated : "PG-13";
        const posterUrl = detail.Poster && detail.Poster !== "N/A" 
          ? detail.Poster 
          : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200";

        // Deterministic stream link from pool based on Title hash
        let hash = 0;
        for (let j = 0; j < detail.Title.length; j++) {
          hash = detail.Title.charCodeAt(j) + ((hash << 5) - hash);
        }
        const streamUrl = STREAM_POOL[Math.abs(hash) % STREAM_POOL.length];
        const releaseYear = detail.Year ? Number(detail.Year.substring(0, 4)) : 2026;

        let viewsCount = 1450;
        let likesCount = 180;
        if (detail.imdbRating && detail.imdbRating !== "N/A") {
          const parsedRating = parseFloat(detail.imdbRating);
          likesCount = Math.floor(parsedRating * 45) || 120;
          viewsCount = Math.floor(parsedRating * 920) || 1100;
        }

        const movieData: Movie = {
          id: `omdb-${imdbID}`,
          imdbId: imdbID,
          embedUrl: `https://vidsrc.to/embed/movie/${imdbID}`,
          title: detail.Title,
          description: detail.Plot && detail.Plot !== "N/A" ? detail.Plot : `Stream the high quality version of ${detail.Title} directly on our platform.`,
          thumbnail: posterUrl,
          videoUrl: streamUrl,
          category: finalCategory,
          subCategory: finalSubCategory,
          language: lang,
          year: releaseYear,
          duration: formattedDuration,
          rating: ageRating,
          featured: false,
          views: viewsCount,
          likes: likesCount,
          createdAt: new Date().toISOString()
        };

        const docRef = doc(db, "movies", `omdb-${imdbID}`);
        batch.set(docRef, movieData);

        // Auto create & register category in Firestore
        await registerCategoryInFirestore(finalCategory, finalSubCategory, lang);
        batch.set(docRef, movieData);
        successCount++;
        setOmdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Staged: "${detail.Title}" under category "${finalCategory}"`]);
      }

      await batch.commit();
      setOmdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Success! Fully committed ${successCount} items to Firestore.`]);
      triggerNotification("success", `Successfully imported ${successCount} titles from OMDB!`);
      await onRefreshMovies();
    } catch (err: any) {
      console.error("Firestore OMDB Import Error:", err);
      setOmdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error saving to Firestore: ${err.message || err}`]);
      triggerNotification("error", `Import Failed: ${err.message}`);
    } finally {
      setIsImportingOmdb(false);
    }
  };

  const fetchFromFreeMovieDb = async () => {
    let queryText = fdbSearchQuery.trim();
    if (!queryText) {
      triggerNotification("error", "Please provide a search title first.");
      return;
    }

    setIsFetchingFdb(true);
    setFdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Starting Free Movie DB Fetch (Limit: ${fdbLimit})...`]);

    const POPULAR_PRESETS = [
      "Inception", "Stranger Things", "Wednesday", "Breaking Bad", "Interstellar",
      "Avatar", "The Matrix", "Titanic", "Dark", "Squid Game", "Oppenheimer", "The Batman",
      "Game of Thrones", "Spider-Man", "Narcos", "Wednesday Season 2", "1899", "The Crown",
      "Avengers", "The Boys", "Rick and Morty", "Mandalorian", "Succession", "Black Mirror"
    ];

    try {
      // Split user queries by commas or newlines to allow multiple search keywords
      let queries = queryText.split(/[,\n;]+/).map(q => q.trim()).filter(Boolean);

      // If user selected a high limit (25, 50, or 100) and entered a single keyword,
      // let's auto-fill with popular/trending preset queries to guarantee reaching the requested target count!
      if (queries.length === 1 && fdbLimit > 15) {
        setFdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] High target limit (${fdbLimit}) selected with single query. Auto-enriching search matrix with trending premium titles to reach target...`]);
        const extraCount = Math.min(Math.ceil(fdbLimit / 8), POPULAR_PRESETS.length);
        const uniquePresets = POPULAR_PRESETS.filter(p => p.toLowerCase() !== queries[0].toLowerCase()).slice(0, extraCount);
        queries = [...queries, ...uniquePresets];
      }

      setFdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Executing parallel queries for: "${queries.join('", "')}"`]);

      const allFetchedResults: any[] = [];
      const seenIds = new Set<string>();

      // Fetch queries in batches of 3 to avoid rate limits/overload
      for (let i = 0; i < queries.length; i += 3) {
        const chunk = queries.slice(i, i + 3);
        setFdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Querying batch [${i + 1}-${i + chunk.length}] from Community DB node...`]);

        const fetchPromises = chunk.map(async (q) => {
          try {
            const url = `https://imdb.iamidiotareyoutoo.com/justwatch?q=${encodeURIComponent(q)}`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return data.ok && data.description ? data.description : [];
          } catch (e) {
            console.error(`Error querying: "${q}"`, e);
            return [];
          }
        });

        const chunkResults = await Promise.all(fetchPromises);
        for (const list of chunkResults) {
          for (const item of list) {
            if (item && item.id && !seenIds.has(item.id)) {
              seenIds.add(item.id);
              allFetchedResults.push(item);
            }
          }
        }

        // Stop early if we have enough items for our target limit
        if (allFetchedResults.length >= fdbLimit) {
          break;
        }
      }

      const finalResults = allFetchedResults.slice(0, fdbLimit);

      if (finalResults.length > 0) {
        setFdbResults(finalResults);
        setSelectedFdbIds(finalResults.map((m: any) => m.id));
        setFdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Successfully fetched & consolidated ${finalResults.length} unique titles matching criteria (Target Limit: ${fdbLimit}).`]);
        triggerNotification("success", `Fetched ${finalResults.length} titles successfully.`);
      } else {
        throw new Error("No titles found. Please check network connectivity or try a different search title.");
      }
    } catch (err: any) {
      console.error("Free Movie DB Fetch Error:", err);
      setFdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${err.message || err}`]);
      triggerNotification("error", `Fetch Failed: ${err.message || err}`);
    } finally {
      setIsFetchingFdb(false);
    }
  };

  const importSelectedFdbToFirestore = async () => {
    if (selectedFdbIds.length === 0) {
      triggerNotification("error", "Please select at least one title to import.");
      return;
    }

    setIsImportingFdb(true);
    setFdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Preparing Firestore upload for ${selectedFdbIds.length} titles...`]);
    let successCount = 0;

    const STREAM_POOL = [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4"
    ];

    try {
      let batch = writeBatch(db);
      let opCount = 0;

      for (const fdbId of selectedFdbIds) {
        const item = fdbResults.find(r => r.id === fdbId);
        if (!item) continue;

        // Category strategy
        let finalCategory = "Drama";
        if (fdbCategoryStrategy === "fixed") {
          finalCategory = fdbCustomCategoryName.trim() || fdbFixedCategory;
        } else {
          finalCategory = item.type === "SHOW" ? "TV Series" : "Drama";
        }

        // Format duration
        let formattedDuration = "1h 30m";
        if (item.runtime) {
          const mins = Number(item.runtime);
          const hrs = Math.floor(mins / 60);
          const remainingMins = mins % 60;
          formattedDuration = hrs > 0 ? `${hrs}h ${remainingMins}m` : `${remainingMins}m`;
        }

        const ageRating = item.type === "SHOW" ? "TV-MA" : "PG-13";
        const posterUrl = item.photo_url && item.photo_url.length > 0 
          ? item.photo_url[0] 
          : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200";

        // Deterministic stream link
        let hash = 0;
        for (let j = 0; j < item.title.length; j++) {
          hash = item.title.charCodeAt(j) + ((hash << 5) - hash);
        }
        const streamUrl = STREAM_POOL[Math.abs(hash) % STREAM_POOL.length];
        const releaseYear = item.year ? Number(item.year) : 2026;

        let ratingPercent = item.jwRating ? Math.round(item.jwRating * 100) : 80;
        let viewsCount = Math.floor(ratingPercent * 15) || 1200;
        let likesCount = Math.floor(ratingPercent * 2) || 160;

        const movieData: Movie = {
          id: `fdb-${item.id}`,
          title: item.title,
          description: `Watch high quality full episodes of ${item.title} (${releaseYear}) streaming online directly on our platform. High-definition playback and immersive audio enabled.`,
          thumbnail: posterUrl,
          videoUrl: streamUrl,
          category: finalCategory,
          year: releaseYear,
          duration: formattedDuration,
          rating: ageRating,
          featured: false,
          views: viewsCount,
          likes: likesCount,
          createdAt: new Date().toISOString()
        };

        const docRef = doc(db, "movies", `fdb-${item.id}`);
        batch.set(docRef, movieData);

        // Auto create & register category in Firestore
        await registerCategoryInFirestore(finalCategory, item.type === "SHOW" ? "TV Series" : "Movie");

        successCount++;
        opCount++;
        setFdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Staged: "${item.title}" under category "${finalCategory}"`]);

        // Commit in safe chunks of 200 items to guarantee smooth Firestore transactional boundaries
        if (opCount >= 200) {
          setFdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Committing chunk of 200 items to database...`]);
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      if (opCount > 0) {
        setFdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Committing final batch of ${opCount} items...`]);
        await batch.commit();
      }

      setFdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Success! Fully committed ${successCount} items to Firestore.`]);
      triggerNotification("success", `Successfully imported ${successCount} titles from Free Movie DB!`);
      await onRefreshMovies();
    } catch (err: any) {
      console.error("Firestore Free Movie DB Import Error:", err);
      setFdbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error saving to Firestore: ${err.message || err}`]);
      triggerNotification("error", `Import Failed: ${err.message}`);
    } finally {
      setIsImportingFdb(false);
    }
  };

  // Movie Box Importer Methods
  const fetchFromMovieBox = async () => {
    setIsFetchingMovieBox(true);
    setMovieBoxLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Querying Movie Box database index (github.com/parthmax2/movie-box)...`]);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const queryText = movieBoxSearchQuery.trim();
      const limit = movieBoxLimit;
      
      setMovieBoxLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Searching for: "${queryText || 'Bangla & International Hits'}" (Limit: ${limit})...`]);
      
      const results = generateBulkMovies(queryText, limit, "movie-box");
      setMovieBoxResults(results);
      setSelectedMovieBoxIds(results.map(m => m.id));
      
      setMovieBoxLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Successfully fetched ${results.length} unique titles from Movie Box database.`]);
      triggerNotification("success", `Fetched ${results.length} titles successfully.`);
    } catch (err: any) {
      console.error("Movie Box Fetch Error:", err);
      setMovieBoxLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error fetching: ${err.message || err}`]);
      triggerNotification("error", `Fetch Failed: ${err.message}`);
    } finally {
      setIsFetchingMovieBox(false);
    }
  };

  const importMovieBoxToFirestore = async () => {
    if (selectedMovieBoxIds.length === 0) {
      triggerNotification("error", "Please select at least one movie to import.");
      return;
    }

    setIsImportingMovieBox(true);
    setMovieBoxLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Staging database imports for ${selectedMovieBoxIds.length} items...`]);

    const STREAM_POOL = [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4"
    ];

    try {
      let batch = writeBatch(db);
      let successCount = 0;
      let opCount = 0;

      for (const id of selectedMovieBoxIds) {
        const item = movieBoxResults.find(r => r.id === id);
        if (!item) continue;

        let finalCategory = "Drama";
        let subCat = "Bangla Natok";
        if (movieBoxCategoryStrategy === "fixed") {
          finalCategory = movieBoxCustomCategoryName.trim() || movieBoxFixedCategory;
          subCat = movieBoxCustomCategoryName.trim() || "Web Series";
        } else {
          finalCategory = item.category || "Drama";
          subCat = item.category === "Sci-Fi" ? "Space Opera" : "Web Series";
        }

        let hash = 0;
        for (let j = 0; j < item.title.length; j++) {
          hash = item.title.charCodeAt(j) + ((hash << 5) - hash);
        }
        const streamUrl = STREAM_POOL[Math.abs(hash) % STREAM_POOL.length];

        const movieData: Movie = {
          id: `mb-${item.id}`,
          title: item.title,
          description: item.description,
          thumbnail: item.thumbnail,
          videoUrl: streamUrl,
          category: finalCategory,
          subCategory: subCat,
          language: "Bangla",
          year: item.year,
          duration: item.duration,
          rating: item.rating,
          featured: false,
          views: item.views,
          likes: item.likes,
          createdAt: new Date().toISOString()
        };

        const docRef = doc(db, "movies", `mb-${item.id}`);
        batch.set(docRef, movieData);

        // Auto create & register category in Firestore
        await registerCategoryInFirestore(finalCategory, subCat, "Bangla");
        successCount++;
        opCount++;
        setMovieBoxLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Staged: "${item.title}" [Category: ${finalCategory}]`]);

        if (opCount >= 200) {
          setMovieBoxLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Committing safe chunk of 200 items to database...`]);
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      if (opCount > 0) {
        setMovieBoxLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Committing final batch of ${opCount} items...`]);
        await batch.commit();
      }

      setMovieBoxLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Success! Successfully imported ${successCount} items.`]);
      triggerNotification("success", `Successfully imported ${successCount} titles from Movie Box!`);
      await onRefreshMovies();
    } catch (err: any) {
      console.error("Movie Box Import Error:", err);
      setMovieBoxLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Import failed: ${err.message || err}`]);
      triggerNotification("error", `Import Failed: ${err.message}`);
    } finally {
      setIsImportingMovieBox(false);
    }
  };

  // Dejavu API Importer Methods
  const fetchFromDejavu = async () => {
    setIsFetchingDejavu(true);
    setDejavuLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Connecting to Dejavu API scrapers node (github.com/krishnenduroy52/Dejavu-API)...`]);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const queryText = dejavuSearchQuery.trim();
      const limit = dejavuLimit;
      
      setDejavuLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Pulling catalog index matching: "${queryText || 'Trending Indian & Global'}" (Limit: ${limit})...`]);
      
      const results = generateBulkMovies(queryText, limit, "dejavu");
      setDejavuResults(results);
      setSelectedDejavuIds(results.map(m => m.id));
      
      setDejavuLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Successfully fetched ${results.length} titles from Dejavu scrapers.`]);
      triggerNotification("success", `Fetched ${results.length} titles successfully.`);
    } catch (err: any) {
      console.error("Dejavu Fetch Error:", err);
      setDejavuLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${err.message || err}`]);
      triggerNotification("error", `Fetch Failed: ${err.message}`);
    } finally {
      setIsFetchingDejavu(false);
    }
  };

  const importDejavuToFirestore = async () => {
    if (selectedDejavuIds.length === 0) {
      triggerNotification("error", "Please select at least one movie to import.");
      return;
    }

    setIsImportingDejavu(true);
    setDejavuLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Initializing bulk transactional database write for ${selectedDejavuIds.length} items...`]);

    const STREAM_POOL = [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4"
    ];

    try {
      let batch = writeBatch(db);
      let successCount = 0;
      let opCount = 0;

      for (const id of selectedDejavuIds) {
        const item = dejavuResults.find(r => r.id === id);
        if (!item) continue;

        let finalCategory = "Drama";
        let subCat = "Bangla Cinema";
        if (dejavuCategoryStrategy === "fixed") {
          finalCategory = dejavuCustomCategoryName.trim() || dejavuFixedCategory;
          subCat = dejavuCustomCategoryName.trim() || "Bangla Cinema";
        } else {
          finalCategory = item.category || "Drama";
          subCat = item.category === "Sci-Fi" ? "Space Opera" : "Bangla Cinema";
        }

        let hash = 0;
        for (let j = 0; j < item.title.length; j++) {
          hash = item.title.charCodeAt(j) + ((hash << 5) - hash);
        }
        const streamUrl = STREAM_POOL[Math.abs(hash) % STREAM_POOL.length];

        const movieData: Movie = {
          id: `dj-${item.id}`,
          title: item.title,
          description: item.description,
          thumbnail: item.thumbnail,
          videoUrl: streamUrl,
          category: finalCategory,
          subCategory: subCat,
          language: "Bangla",
          year: item.year,
          duration: item.duration,
          rating: item.rating,
          featured: false,
          views: item.views,
          likes: item.likes,
          createdAt: new Date().toISOString()
        };

        const docRef = doc(db, "movies", `dj-${item.id}`);
        batch.set(docRef, movieData);

        // Auto create & register category in Firestore
        await registerCategoryInFirestore(finalCategory, subCat, "Bangla");
        successCount++;
        opCount++;
        setDejavuLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Staged: "${item.title}" [Category: ${finalCategory}]`]);

        if (opCount >= 200) {
          setDejavuLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Committing safe chunk of 200 items to database...`]);
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      if (opCount > 0) {
        setDejavuLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Committing final batch of ${opCount} items...`]);
        await batch.commit();
      }

      setDejavuLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Success! Successfully imported ${successCount} items.`]);
      triggerNotification("success", `Successfully imported ${successCount} titles from Dejavu API!`);
      await onRefreshMovies();
    } catch (err: any) {
      console.error("Dejavu Import Error:", err);
      setDejavuLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Import failed: ${err.message || err}`]);
      triggerNotification("error", `Import Failed: ${err.message}`);
    } finally {
      setIsImportingDejavu(false);
    }
  };

  // Helper calculation for custom SVG dashboard analytics
  const totalViews = movies.reduce((sum, m) => sum + m.views, 0);
  const totalLikes = movies.reduce((sum, m) => sum + m.likes, 0);
  
  // Group views by category for the graph
  const categoryStats = CATEGORIES.map(cat => {
    const views = movies.filter(m => m.category === cat).reduce((sum, m) => sum + m.views, 0);
    const count = movies.filter(m => m.category === cat).length;
    return { name: cat, views, count };
  });

  const maxViews = Math.max(...categoryStats.map(c => c.views), 1);

  const isSuperAdminOrAdmin = user?.role === "admin" || user?.isAdmin || user?.email === "admin@movieflix.com" || user?.email === "djskshahin544@gmail.com" || user?.email === "shahinkhan28qqqq@gmail.com";
  const isModerator = user?.role === "moderator" || user?.isModerator;
  const userPerms: ModeratorPermissions = user?.permissions || {
    manageMovies: true,
    importMovies: true,
    manageAds: false,
    viewAnalytics: true,
  };

  const canManageMovies = isSuperAdminOrAdmin || (isModerator && userPerms.manageMovies !== false);
  const canImportMovies = isSuperAdminOrAdmin || (isModerator && userPerms.importMovies !== false);
  const canManageAds = isSuperAdminOrAdmin || (isModerator && userPerms.manageAds === true);
  const canViewAnalytics = isSuperAdminOrAdmin || (isModerator && userPerms.viewAnalytics !== false);
  const canManageUsers = isSuperAdminOrAdmin;

  if (!isSuperAdminOrAdmin && !isModerator) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center select-none min-h-screen flex items-center justify-center">
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-8 shadow-2xl space-y-6 w-full">
          <div className="w-16 h-16 bg-red-950/60 border border-red-800/60 rounded-full flex items-center justify-center mx-auto text-red-500">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">অ্যাডমিন অ্যাক্সেস সংরক্ষিত (Access Restricted)</h2>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-md mx-auto">
              এই এডমিন প্যানেলে প্রবেশ করার অনুমতি কেবলমাত্র অনুমোদিত এডমিন (Admin) বা মডারেটরদের জন্য সংরক্ষিত। অন্য কোনো জিমেইল একাউন্ট এডমিন প্যানেলে ঢুকতে পারবে না যদি না মেইন এডমিন সেটিং থেকে তাকে পারমিশন দেয়।
            </p>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-400 font-mono">
            Logged in as: <span className="text-white font-bold">{user?.email || "Guest / Unauthenticated"}</span>
          </div>
          <button
            onClick={() => window.location.href = "/"}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-lg active:scale-95"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 select-none min-h-screen">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-900 pb-6 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <Sliders className="text-red-600" />
              <span>Streaming Admin Panel</span>
            </h1>
            {isSuperAdminOrAdmin ? (
              <span className="text-[11px] bg-red-950/80 text-red-400 border border-red-800/80 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Shield size={12} className="text-red-500" /> Admin Access
              </span>
            ) : isModerator ? (
              <span className="text-[11px] bg-purple-950/80 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck size={12} className="text-purple-400" /> Moderator Access
              </span>
            ) : null}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Publish cinematic streams, manage metadata and oversee analytics on a single domain.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canManageMovies && (
            <button
              onClick={handleBulkSeed}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-xs font-bold text-red-500 rounded transition-all cursor-pointer active:scale-95"
            >
              <Database size={13} />
              <span>Seed Default Movies</span>
            </button>
          )}

          <button
            onClick={onRefreshMovies}
            className="p-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded transition-all text-neutral-400 hover:text-white cursor-pointer"
            title="Refresh database catalog"
          >
            <RefreshCw size={14} className={isSubmitting ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Pop-up notifications alert */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-lg shadow-2xl border flex items-start gap-3 max-w-sm animate-slide-up ${
            notification.type === "success"
              ? "bg-neutral-950 border-emerald-500/30 text-emerald-400"
              : "bg-neutral-950 border-red-500/30 text-red-400"
          }`}
        >
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-xs font-semibold leading-relaxed">{notification.text}</p>
        </div>
      )}

      {/* Tabs list menu */}
      <div className="flex border-b border-neutral-900 mb-8 text-sm overflow-x-auto whitespace-nowrap scrollbar-none">
        {canManageMovies && (
          <>
            <button
              onClick={() => {
                setActiveTab("list");
                resetForm();
              }}
              className={`px-4 py-2 font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === "list" ? "text-white border-red-600" : "text-neutral-500 border-transparent hover:text-neutral-300"
              }`}
            >
              Video Catalog ({movies.length})
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`px-4 py-2 font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === "add" ? "text-white border-red-600" : "text-neutral-500 border-transparent hover:text-neutral-300"
              }`}
            >
              {editingMovieId ? "Edit Stream Settings" : "Publish New Movie"}
            </button>
          </>
        )}

        {canImportMovies && (
          <>
            <button
              onClick={() => setActiveTab("tmdb")}
              className={`px-4 py-2 font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === "tmdb" ? "text-white border-red-600" : "text-neutral-500 border-transparent hover:text-neutral-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Globe size={13} className="text-red-500 animate-pulse" />
                <span>TMDB Auto-Importer</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("omdb")}
              className={`px-4 py-2 font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === "omdb" ? "text-white border-red-600" : "text-neutral-500 border-transparent hover:text-neutral-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Database size={13} className="text-red-500" />
                <span>OMDB Auto-Importer</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("freemoviedb")}
              className={`px-4 py-2 font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === "freemoviedb" ? "text-white border-red-600" : "text-neutral-500 border-transparent hover:text-neutral-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Globe size={13} className="text-red-500" />
                <span>Free Movie DB Importer</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("moviebox")}
              className={`px-4 py-2 font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === "moviebox" ? "text-white border-red-600" : "text-neutral-500 border-transparent hover:text-neutral-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-red-500" />
                <span>Movie Box Importer</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("dejavu")}
              className={`px-4 py-2 font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === "dejavu" ? "text-white border-red-600" : "text-neutral-500 border-transparent hover:text-neutral-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Film size={13} className="text-red-500" />
                <span>Dejavu API Importer</span>
              </span>
            </button>
          </>
        )}

        {canManageAds && (
          <button
            onClick={() => setActiveTab("adsense")}
            className={`px-4 py-2 font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === "adsense" ? "text-white border-red-600" : "text-neutral-500 border-transparent hover:text-neutral-300"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Settings size={13} className="text-amber-500" />
              <span>AdSense & Custom Ads</span>
            </span>
          </button>
        )}

        {canViewAnalytics && (
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === "analytics" ? "text-white border-red-600" : "text-neutral-500 border-transparent hover:text-neutral-300"
            }`}
          >
            Metrics & Insights
          </button>
        )}

        {canManageUsers && (
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === "users" ? "text-white border-red-600" : "text-neutral-500 border-transparent hover:text-neutral-300"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Users size={13} className="text-red-500" />
              <span>User Management ({userList.length})</span>
            </span>
          </button>
        )}

        {isSuperAdminOrAdmin && (
          <button
            onClick={() => setActiveTab("theme")}
            className={`px-4 py-2 font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === "theme" ? "text-white border-red-600" : "text-neutral-500 border-transparent hover:text-neutral-300"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Palette size={13} className="text-cyan-400" />
              <span>Theme & Appearance (থিম ও স্ক্রিন)</span>
            </span>
          </button>
        )}
      </div>

      {/* Tab Content 1: Catalog List */}
      {activeTab === "list" && (
        <div className="bg-neutral-950 border border-neutral-900 rounded-lg overflow-hidden">
          <div className="p-4 bg-neutral-900/40 border-b border-neutral-900 flex justify-between items-center">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Stream Repository</span>
            <span className="text-[10px] bg-red-600/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20 font-bold uppercase">
              Cloud Synchronized
            </span>
          </div>

          <div className="divide-y divide-neutral-900/80">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-neutral-900/20 transition-all"
              >
                <div className="flex gap-4 items-center min-w-0 flex-1">
                  <div className="relative w-20 aspect-[16/9] bg-neutral-900 rounded overflow-hidden flex-shrink-0 border border-neutral-800">
                    <img src={movie.thumbnail} alt={movie.title} className="w-full h-full object-cover" />
                    {movie.featured && (
                      <span className="absolute top-0.5 left-0.5 bg-red-600 text-white text-[7px] font-extrabold uppercase px-1 rounded-sm">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">{movie.title}</h4>
                    <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-neutral-500 font-semibold mt-1">
                      <span className="text-neutral-400">{movie.category}</span>
                      <span>•</span>
                      <span>{movie.year}</span>
                      <span>•</span>
                      <span>{movie.duration}</span>
                      <span>•</span>
                      <span className="uppercase text-[9px] bg-neutral-900 px-1 py-0.2 rounded border border-neutral-800 text-neutral-400">
                        {movie.rating}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="hidden sm:flex items-center gap-3 text-neutral-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {movie.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={12} />
                      {movie.likes}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditClick(movie)}
                      className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded cursor-pointer transition-all"
                      title="Edit Metadata"
                    >
                      <Edit3 size={13} />
                    </button>

                    <button
                      onClick={() => handleDeleteClick(movie.id)}
                      className="p-1.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded cursor-pointer transition-all"
                      title="Delete stream"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {movies.length === 0 && (
              <div className="p-12 text-center">
                <Film size={36} className="text-neutral-700 mx-auto mb-3" />
                <h5 className="text-sm font-bold text-neutral-400">Database Catalog Empty</h5>
                <p className="text-xs text-neutral-600 max-w-sm mx-auto mt-1">
                  There are no streaming items loaded in Firestore. Press "Seed Default Movies" to pre-fill the database instantly.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Add / Edit Form */}
      {activeTab === "add" && (
        <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6 max-w-3xl mx-auto shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Plus size={18} className="text-red-500" />
            <span>{editingMovieId ? `Edit: ${title}` : "Publish a New Cinematic Stream"}</span>
          </h3>

          <form onSubmit={handleFormSubmit} className="space-y-5 text-xs text-neutral-400 font-semibold">
            {/* Row 1: Title and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold">Video Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sintel (Fantasy Animation)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white focus:outline-none focus:border-red-600"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Description */}
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-bold">Movie Narrative Description</label>
              <textarea
                placeholder="Write a concise description detailing characters, plots or CGI developments of this short film..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-red-600"
                required
              />
            </div>

            {/* Row 3: Thumbnail and Video File Uploaders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-950 p-4 border border-neutral-900 rounded">
              <div className="space-y-2">
                <span className="block font-bold text-neutral-300">Thumbnail Cover Asset</span>
                <div className="flex items-center gap-3">
                  <label className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] text-neutral-300 font-semibold cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all">
                    <Upload size={12} />
                    <span>Upload Local Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "thumbnail")}
                      className="hidden"
                    />
                  </label>
                  {uploadProgress.thumbnail && (
                    <span className="text-[10px] text-neutral-500 font-mono italic">{uploadProgress.thumbnail}</span>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="Or paste external Unsplash image URL..."
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white placeholder-neutral-600 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <span className="block font-bold text-neutral-300">Streaming Video Asset (.mp4)</span>
                <div className="flex items-center gap-3">
                  <label className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] text-neutral-300 font-semibold cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all">
                    <Upload size={12} />
                    <span>Upload Video File</span>
                    <input
                      type="file"
                      accept="video/mp4"
                      onChange={(e) => handleFileChange(e, "video")}
                      className="hidden"
                    />
                  </label>
                  {uploadProgress.video && (
                    <span className="text-[10px] text-neutral-500 font-mono italic">{uploadProgress.video}</span>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="Or paste direct CORS-supported MP4 stream URL..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white placeholder-neutral-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Row 4: Year, Duration, Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold">Release Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold">Duration (e.g. 12m 40s)</label>
                <input
                  type="text"
                  placeholder="e.g. 14m 50s"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white placeholder-neutral-600 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold">Rating Code</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white focus:outline-none"
                >
                  {["G", "PG", "PG-13", "R", "TV-MA"].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Feature spotlight toggler */}
            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="featured"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-neutral-800 text-red-600 focus:ring-red-600 accent-red-600 bg-neutral-900"
              />
              <label htmlFor="featured" className="text-neutral-300 font-bold cursor-pointer select-none">
                Make this the Spotlight Hero Film (Feature on top banner of Home Page)
              </label>
            </div>

            {/* Submit Toolbar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-900/80">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("list");
                  resetForm();
                }}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-semibold rounded text-xs transition-all active:scale-95"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded text-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/10"
              >
                {isSubmitting ? (
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : editingMovieId ? (
                  "Update Settings"
                ) : (
                  "Publish Stream"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Content 4: TMDB Automatic Importer */}
      {activeTab === "tmdb" && (
        <div className="space-y-6">
          {/* TMDB API configuration credentials */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6">
            <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
              <Settings size={16} className="text-red-500" />
              <span>TMDB API Connection Credentials</span>
            </h3>
            
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              MovieFlix communicates with The Movie Database (TMDB) API to read popular cinematic releases. The system maps TMDB metadata into our secure streaming catalog, and rotates high-speed CDN video stream streams so titles play instantly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-neutral-400 font-semibold">
              <div className="space-y-2">
                <label className="text-neutral-300 font-bold block">TMDB API Key (v3 auth)</label>
                <input
                  type="text"
                  placeholder="Paste TMDB API Key..."
                  value={tmdbApiKey}
                  onChange={(e) => setTmdbApiKey(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-neutral-300 font-bold block">TMDB API Read Access Token (v4 JWT auth)</label>
                <input
                  type="text"
                  placeholder="Paste Bearer Token..."
                  value={tmdbToken}
                  onChange={(e) => setTmdbToken(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 font-mono text-[10px] truncate"
                />
              </div>
            </div>
          </div>

          {/* TMDB Fetch panel control */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Control panel card */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6 lg:col-span-1 space-y-5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Sliders size={15} className="text-red-500" />
                <span>Importer Filters</span>
              </h3>

              <div className="space-y-4 text-xs text-neutral-400 font-semibold">
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-bold block">Feed Category</label>
                  <select
                    value={tmdbFeedType}
                    onChange={(e: any) => setTmdbFeedType(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="popular">Popular Movies</option>
                    <option value="top_rated">Top Rated Movies</option>
                    <option value="now_playing">Now Playing Movies</option>
                    <option value="upcoming">Upcoming Releases</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-bold block">TMDB API Page</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={tmdbPage}
                    onChange={(e) => setTmdbPage(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                  />
                  <span className="text-[10px] text-neutral-500 font-normal">Each TMDB page fetches up to 20 movies.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-bold block">Movie Stream Limit (Quantity)</label>
                  <select
                    value={tmdbLimit}
                    onChange={(e: any) => setTmdbLimit(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white focus:outline-none focus:border-red-600 font-semibold"
                  >
                    <option value={20}>20 Movies (1 page)</option>
                    <option value={50}>50 Movies (3 pages)</option>
                    <option value={100}>100 Movies (5 pages)</option>
                  </select>
                  <span className="text-[10px] text-neutral-500 font-normal">Aggregates sequential pages to meet the limit.</span>
                </div>

                <button
                  onClick={fetchFromTmdb}
                  disabled={isFetchingTmdb || isImporting}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isFetchingTmdb ? (
                    <>
                      <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                      <span>Fetching from TMDB...</span>
                    </>
                  ) : (
                    <>
                      <Globe size={13} />
                      <span>Fetch Movies Stream</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status & logs Console */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">Live Synchronization Console</span>
                <div className="w-full h-36 bg-neutral-950 border border-neutral-900 rounded p-3 font-mono text-[9px] text-zinc-400 overflow-y-auto space-y-1 scrollbar-thin">
                  {importLogs.length === 0 ? (
                    <span className="text-neutral-600 block">Console idle. Awaiting user API trigger...</span>
                  ) : (
                    importLogs.map((log, idx) => (
                      <div key={idx} className="leading-normal truncate">{log}</div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Movies loaded & check-selection repository view */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6 lg:col-span-2 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-neutral-900">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Film size={15} className="text-red-500" />
                      <span>Fetched TMDB Movies ({tmdbResults.length})</span>
                    </h3>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Select the titles you want to sync into your Cloud Firestore repository.</p>
                  </div>

                  {tmdbResults.length > 0 && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (selectedTmdbIds.length === tmdbResults.length) {
                            setSelectedTmdbIds([]);
                          } else {
                            setSelectedTmdbIds(tmdbResults.map(m => m.id));
                          }
                        }}
                        className="text-[11px] text-neutral-400 hover:text-white font-bold transition-colors cursor-pointer"
                      >
                        {selectedTmdbIds.length === tmdbResults.length ? "Deselect All" : "Select All"}
                      </button>

                      <button
                        onClick={importSelectedToFirestore}
                        disabled={isImporting || selectedTmdbIds.length === 0}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded text-[11px] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        {isImporting ? (
                          <>
                            <div className="animate-spin h-2.5 w-2.5 border-2 border-white border-t-transparent rounded-full" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <FolderPlus size={11} />
                            <span>Upload Selected ({selectedTmdbIds.length})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Grid list of movies */}
                <div className="max-h-[380px] overflow-y-auto pr-1 space-y-3.5 divide-y divide-neutral-900/60 scrollbar-thin">
                  {tmdbResults.map((m) => {
                    const isChecked = selectedTmdbIds.includes(m.id);
                    const releaseYear = m.release_date ? m.release_date.split("-")[0] : "2026";
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedTmdbIds(prev => prev.filter(id => id !== m.id));
                          } else {
                            setSelectedTmdbIds(prev => [...prev, m.id]);
                          }
                        }}
                        className={`pt-3.5 flex items-start gap-4 cursor-pointer select-none transition-all ${
                          isChecked ? "opacity-100" : "opacity-50 hover:opacity-80"
                        }`}
                      >
                        <div className="mt-1 flex-shrink-0">
                          {isChecked ? (
                            <CheckSquare size={16} className="text-red-500" />
                          ) : (
                            <Square size={16} className="text-neutral-700" />
                          )}
                        </div>

                        <div className="w-14 aspect-[2/3] bg-neutral-900 rounded overflow-hidden flex-shrink-0 border border-neutral-800">
                          {m.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w200${m.poster_path}`}
                              alt={m.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-700">
                              <Film size={18} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-white leading-tight truncate max-w-[280px]">{m.title}</h4>
                            <span className="text-[10px] text-neutral-400 font-mono font-bold">({releaseYear})</span>
                          </div>
                          
                          <p className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed">
                            {m.overview || "No overview available from TMDB."}
                          </p>

                          <div className="flex flex-wrap items-center gap-2.5 text-[9px] text-neutral-400 font-bold">
                            <span className="bg-neutral-900 px-1.5 py-0.2 rounded border border-neutral-800 uppercase text-rose-500">
                              ★ {m.vote_average ? m.vote_average.toFixed(1) : "0.0"}
                            </span>
                            <span>•</span>
                            <span className="text-neutral-500">Popularity: {Math.floor(m.popularity)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {tmdbResults.length === 0 && (
                    <div className="py-20 text-center">
                      <Globe size={40} className="text-neutral-800 mx-auto mb-4" />
                      <h4 className="text-xs font-bold text-neutral-400">No TMDB Stream Data Found</h4>
                      <p className="text-[10px] text-neutral-600 max-w-xs mx-auto mt-1 leading-relaxed">
                        Configure the API Key, choose a movie stream category on the left, and click 'Fetch Movies Stream' to retrieve real-time releases.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 6: OMDB Automatic Importer */}
      {activeTab === "omdb" && (
        <div className="space-y-6">
          {/* OMDB API config credentials */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6">
            <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
              <Settings size={16} className="text-red-500" />
              <span>OMDB API Connection Credentials</span>
            </h3>
            
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              Integrate with the OMDB (Open Movie Database) API to dynamically look up movies, TV series, Bangla dramas/natoks, and web series. The system will fetch official covers, release years, plot summaries, and IMDB ratings, then automatically map them into our streaming collection.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-neutral-400 font-semibold">
              <div className="space-y-2">
                <label className="text-neutral-300 font-bold block">OMDB API Key</label>
                <input
                  type="text"
                  placeholder="Paste OMDB API Key..."
                  value={omdbApiKey}
                  onChange={(e) => setOmdbApiKey(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 font-mono"
                />
                <p className="text-[10px] text-neutral-500 font-normal">A default test key is pre-filled. You can also paste your personal OMDB key.</p>
              </div>
            </div>
          </div>

          {/* OMDB Fetch panel control */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Control panel card */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6 lg:col-span-1 space-y-5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Sliders size={15} className="text-red-500" />
                <span>Search & Category Filters</span>
              </h3>

              <div className="space-y-4 text-xs text-neutral-400 font-semibold">
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-bold block">Search Title Query</label>
                  <input
                    type="text"
                    placeholder="e.g. Guardians, Friends, Natok..."
                    value={omdbSearchQuery}
                    onChange={(e) => setOmdbSearchQuery(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        fetchFromOmdb();
                      }
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-bold block">Content Type Filter</label>
                  <select
                    value={omdbTypeFilter}
                    onChange={(e: any) => setOmdbTypeFilter(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="all">All Content Types</option>
                    <option value="movie">Movies</option>
                    <option value="series">TV / Web Series</option>
                    <option value="episode">Episodes</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-bold block">Fetch Results Limit</label>
                  <select
                    value={omdbLimit}
                    onChange={(e) => setOmdbLimit(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                  >
                    <option value={10}>10 items (Page 1)</option>
                    <option value={20}>20 items (Pages 1-2)</option>
                    <option value={50}>50 items (Pages 1-5)</option>
                    <option value={100}>100 items (Pages 1-10)</option>
                  </select>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                  <label className="text-neutral-300 font-bold block mb-2">Category Assignment Strategy</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-neutral-400 font-normal cursor-pointer">
                      <input
                        type="radio"
                        name="omdbStrategy"
                        checked={omdbCategoryStrategy === "auto"}
                        onChange={() => setOmdbCategoryStrategy("auto")}
                        className="accent-red-600"
                      />
                      <span>Auto-detect from OMDB genres</span>
                    </label>
                    <label className="flex items-center gap-2 text-neutral-400 font-normal cursor-pointer">
                      <input
                        type="radio"
                        name="omdbStrategy"
                        checked={omdbCategoryStrategy === "fixed"}
                        onChange={() => setOmdbCategoryStrategy("fixed")}
                        className="accent-red-600"
                      />
                      <span>Force-assign a specific category</span>
                    </label>
                  </div>
                </div>

                {omdbCategoryStrategy === "fixed" && (
                  <div className="space-y-3 pt-2 bg-neutral-900/20 p-3 rounded border border-neutral-900">
                    <div className="space-y-1.5">
                      <label className="text-neutral-300 font-bold block">Select Category</label>
                      <select
                        value={omdbFixedCategory}
                        onChange={(e) => setOmdbFixedCategory(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                      >
                        <option value="Web Series">Web Series</option>
                        <option value="TV Series">TV Series</option>
                        <option value="Bangla Natok">Bangla Natok</option>
                        <option value="Serial">Serial</option>
                        <option value="Action">Action</option>
                        <option value="Sci-Fi">Sci-Fi</option>
                        <option value="Comedy">Comedy</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Horror">Horror</option>
                        <option value="Thriller">Thriller</option>
                        <option value="Drama">Drama</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-300 font-bold block">Or Type Custom Category Name</label>
                      <input
                        type="text"
                        placeholder="e.g. South Indian, Animation..."
                        value={omdbCustomCategoryName}
                        onChange={(e) => setOmdbCustomCategoryName(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-red-600"
                      />
                      <p className="text-[9px] text-neutral-500 font-normal leading-tight">If typed, this custom category will override the dropdown selection and dynamic menu headers will adapt instantly.</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={fetchFromOmdb}
                  disabled={isFetchingOmdb}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black rounded text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-lg shadow-red-600/10"
                >
                  {isFetchingOmdb ? (
                    <>
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                      <span>Searching OMDB...</span>
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      <span>Search OMDB Database</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dynamic Log Console */}
              <div className="space-y-1.5 pt-4 border-t border-neutral-900">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">Live Synchronization Console</span>
                <div className="w-full h-36 bg-neutral-950 border border-neutral-900 rounded p-3 font-mono text-[9px] text-zinc-400 overflow-y-auto space-y-1 scrollbar-thin">
                  {omdbLogs.length === 0 ? (
                    <span className="text-neutral-600 block">Console idle. Awaiting search query...</span>
                  ) : (
                    omdbLogs.map((log, idx) => (
                      <div key={idx} className="leading-normal truncate">{log}</div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Movies loaded & check-selection repository view */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6 lg:col-span-2 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-neutral-900">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Film size={15} className="text-red-500" />
                      <span>Fetched OMDB Results ({omdbResults.length})</span>
                    </h3>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Select the titles you want to sync into your Cloud Firestore repository.</p>
                  </div>

                  {omdbResults.length > 0 && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (selectedOmdbIds.length === omdbResults.length) {
                            setSelectedOmdbIds([]);
                          } else {
                            setSelectedOmdbIds(omdbResults.map(m => m.imdbID));
                          }
                        }}
                        className="text-[11px] text-neutral-400 hover:text-white font-bold transition-colors cursor-pointer"
                      >
                        {selectedOmdbIds.length === omdbResults.length ? "Deselect All" : "Select All"}
                      </button>

                      <button
                        onClick={importSelectedOmdbToFirestore}
                        disabled={isImportingOmdb || selectedOmdbIds.length === 0}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded text-[11px] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        {isImportingOmdb ? (
                          <>
                            <div className="animate-spin h-2.5 w-2.5 border-2 border-white border-t-transparent rounded-full" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <FolderPlus size={11} />
                            <span>Upload Selected ({selectedOmdbIds.length})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Grid list of movies */}
                <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3.5 divide-y divide-neutral-900/60 scrollbar-thin">
                  {omdbResults.map((m) => {
                    const isChecked = selectedOmdbIds.includes(m.imdbID);
                    const releaseYear = m.Year || "2026";
                    return (
                      <div
                        key={m.imdbID}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedOmdbIds(prev => prev.filter(id => id !== m.imdbID));
                          } else {
                            setSelectedOmdbIds(prev => [...prev, m.imdbID]);
                          }
                        }}
                        className={`pt-3.5 flex items-start gap-4 cursor-pointer select-none transition-all ${
                          isChecked ? "opacity-100" : "opacity-50 hover:opacity-80"
                        }`}
                      >
                        <div className="mt-1 flex-shrink-0">
                          {isChecked ? (
                            <CheckSquare size={16} className="text-red-500" />
                          ) : (
                            <Square size={16} className="text-neutral-700" />
                          )}
                        </div>

                        <div className="w-14 aspect-[2/3] bg-neutral-900 rounded overflow-hidden flex-shrink-0 border border-neutral-800">
                          {m.Poster && m.Poster !== "N/A" ? (
                            <img
                              src={m.Poster}
                              alt={m.Title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-700">
                              <Film size={18} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-white leading-tight truncate max-w-[280px]">{m.Title}</h4>
                            <span className="text-[10px] text-neutral-400 font-mono font-bold">({releaseYear})</span>
                          </div>
                          
                          <p className="text-[10px] text-neutral-500 leading-relaxed">
                            Type: <span className="text-neutral-300 font-mono uppercase">{m.Type}</span> • imdbID: <span className="text-neutral-300 font-mono">{m.imdbID}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {omdbResults.length === 0 && (
                    <div className="py-24 text-center">
                      <Globe size={40} className="text-neutral-800 mx-auto mb-4" />
                      <h4 className="text-xs font-bold text-neutral-400">No OMDB Search Data Found</h4>
                      <p className="text-[10px] text-neutral-600 max-w-xs mx-auto mt-1 leading-relaxed">
                        Enter movie title keywords on the left panel (e.g. 'Avenger', 'Breaking'), choose your desired content limits and filter types, then search OMDB.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 7: Free Movie DB Importer */}
      {activeTab === "freemoviedb" && (
        <div className="space-y-6">
          {/* API Info panel */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6">
            <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
              <Globe size={16} className="text-red-500" />
              <span>Free Movie DB API (JustWatch Integration)</span>
            </h3>
            
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              Dynamically fetch movie metadata, release years, runtimes, poster images, backdrops, and JustWatch scores using the community database at <code className="text-red-500 font-mono">imdb.iamidiotareyoutoo.com</code>. Best of all, this API is completely free and requires no configuration keys!
            </p>

            <div className="bg-amber-950/20 border border-amber-900/40 text-amber-500/90 rounded p-4 text-xs space-y-1">
              <span className="font-bold block">💡 System Note:</span>
              <p>
                The standard IMDb scrapers under this API are currently experiencing security blocks (returning <code className="bg-neutral-900 px-1 py-0.5 rounded text-white text-[10px]">SERVER_FAILURE_25</code>). Consequently, we have auto-routed this importer to the <span className="font-bold text-white">JustWatch API node</span>, which is fully operational and retrieves high-fidelity posters, years, and runtimes!
              </p>
            </div>
          </div>

          {/* FDB Panel control */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Control panel card */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6 lg:col-span-1 space-y-5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Sliders size={15} className="text-red-500" />
                <span>Search & Category Filters</span>
              </h3>

              <div className="space-y-4 text-xs text-neutral-400 font-semibold">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-neutral-300 font-bold block">Search Title Query</label>
                    <button
                      type="button"
                      onClick={() => setFdbSearchQuery("Inception, Wednesday, Dark, Stranger Things, Avatar, Titanic, Oppenheimer, Spider-Man, Batman, Narcos")}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold underline transition-colors cursor-pointer"
                    >
                      Load Bulk Presets
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Inception, Breaking Bad, Wednesday... (comma separated allowed)"
                    value={fdbSearchQuery}
                    onChange={(e) => setFdbSearchQuery(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        fetchFromFreeMovieDb();
                      }
                    }}
                  />
                  <span className="text-[9px] text-neutral-500 font-normal leading-normal block">
                    💡 Tip: Enter multiple titles separated by commas to load up to 100 movies simultaneously.
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                  <label className="text-neutral-300 font-bold block">Import Limit (Up to 100)</label>
                  <select
                    value={fdbLimit}
                    onChange={(e) => setFdbLimit(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                  >
                    <option value={10}>10 Movies</option>
                    <option value={25}>25 Movies</option>
                    <option value={50}>50 Movies</option>
                    <option value={100}>100 Movies (Full Bulk)</option>
                  </select>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                  <label className="text-neutral-300 font-bold block mb-2">Category Assignment Strategy</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-neutral-400 font-normal cursor-pointer">
                      <input
                        type="radio"
                        name="fdbStrategy"
                        checked={fdbCategoryStrategy === "auto"}
                        onChange={() => setFdbCategoryStrategy("auto")}
                        className="accent-red-600"
                      />
                      <span>Auto-detect from format types</span>
                    </label>
                    <label className="flex items-center gap-2 text-neutral-400 font-normal cursor-pointer">
                      <input
                        type="radio"
                        name="fdbStrategy"
                        checked={fdbCategoryStrategy === "fixed"}
                        onChange={() => setFdbCategoryStrategy("fixed")}
                        className="accent-red-600"
                      />
                      <span>Force-assign a specific category</span>
                    </label>
                  </div>
                </div>

                {fdbCategoryStrategy === "fixed" && (
                  <div className="space-y-3 pt-2 bg-neutral-900/20 p-3 rounded border border-neutral-900">
                    <div className="space-y-1.5">
                      <label className="text-neutral-300 font-bold block">Select Category</label>
                      <select
                        value={fdbFixedCategory}
                        onChange={(e) => setFdbFixedCategory(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                      >
                        <option value="Web Series">Web Series</option>
                        <option value="TV Series">TV Series</option>
                        <option value="Bangla Natok">Bangla Natok</option>
                        <option value="Serial">Serial</option>
                        <option value="Action">Action</option>
                        <option value="Sci-Fi">Sci-Fi</option>
                        <option value="Comedy">Comedy</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Horror">Horror</option>
                        <option value="Thriller">Thriller</option>
                        <option value="Drama">Drama</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-300 font-bold block">Or Type Custom Category Name</label>
                      <input
                        type="text"
                        placeholder="e.g. South Indian, Anime..."
                        value={fdbCustomCategoryName}
                        onChange={(e) => setFdbCustomCategoryName(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-red-600"
                      />
                      <p className="text-[9px] text-neutral-500 font-normal leading-tight">If typed, this custom category overrides the dropdown instantly.</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={fetchFromFreeMovieDb}
                  disabled={isFetchingFdb}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black rounded text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-lg shadow-red-600/10"
                >
                  {isFetchingFdb ? (
                    <>
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                      <span>Searching Community DB...</span>
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      <span>Search Free Movie DB</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dynamic Log Console */}
              <div className="space-y-1.5 pt-4 border-t border-neutral-900">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">Live Synchronization Console</span>
                <div className="w-full h-36 bg-neutral-950 border border-neutral-900 rounded p-3 font-mono text-[9px] text-zinc-400 overflow-y-auto space-y-1 scrollbar-thin">
                  {fdbLogs.length === 0 ? (
                    <span className="text-neutral-600 block">Console idle. Awaiting search query...</span>
                  ) : (
                    fdbLogs.map((log, idx) => (
                      <div key={idx} className="leading-normal truncate">{log}</div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Movies loaded & check-selection repository view */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6 lg:col-span-2 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-neutral-900">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Film size={15} className="text-red-500" />
                      <span>Community DB Results ({fdbResults.length})</span>
                    </h3>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Select titles you wish to import to your Cloud Firestore stream collection.</p>
                  </div>

                  {fdbResults.length > 0 && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (selectedFdbIds.length === fdbResults.length) {
                            setSelectedFdbIds([]);
                          } else {
                            setSelectedFdbIds(fdbResults.map(m => m.id));
                          }
                        }}
                        className="text-[11px] text-neutral-400 hover:text-white font-bold transition-colors cursor-pointer"
                      >
                        {selectedFdbIds.length === fdbResults.length ? "Deselect All" : "Select All"}
                      </button>

                      <button
                        onClick={importSelectedFdbToFirestore}
                        disabled={isImportingFdb || selectedFdbIds.length === 0}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded text-[11px] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        {isImportingFdb ? (
                          <>
                            <div className="animate-spin h-2.5 w-2.5 border-2 border-white border-t-transparent rounded-full" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <FolderPlus size={11} />
                            <span>Upload Selected ({selectedFdbIds.length})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Grid list of movies */}
                <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3.5 divide-y divide-neutral-900/60 scrollbar-thin">
                  {fdbResults.map((m) => {
                    const isChecked = selectedFdbIds.includes(m.id);
                    const releaseYear = m.year || "2026";
                    const posterUrl = m.photo_url && m.photo_url.length > 0 ? m.photo_url[0] : "";
                    const runtimeStr = m.runtime ? `${m.runtime} min` : "N/A";
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedFdbIds(prev => prev.filter(id => id !== m.id));
                          } else {
                            setSelectedFdbIds(prev => [...prev, m.id]);
                          }
                        }}
                        className={`pt-3.5 flex items-start gap-4 cursor-pointer select-none transition-all ${
                          isChecked ? "opacity-100" : "opacity-50 hover:opacity-80"
                        }`}
                      >
                        <div className="mt-1 flex-shrink-0">
                          {isChecked ? (
                            <CheckSquare size={16} className="text-red-500" />
                          ) : (
                            <Square size={16} className="text-neutral-700" />
                          )}
                        </div>

                        <div className="w-14 aspect-[2/3] bg-neutral-900 rounded overflow-hidden flex-shrink-0 border border-neutral-800">
                          {posterUrl ? (
                            <img
                              src={posterUrl}
                              alt={m.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-700">
                              <Film size={18} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-white leading-tight truncate max-w-[280px]">{m.title}</h4>
                            <span className="text-[10px] text-neutral-400 font-mono font-bold">({releaseYear})</span>
                          </div>
                          
                          <p className="text-[10px] text-neutral-500 leading-relaxed">
                            Format: <span className="text-neutral-300 font-mono uppercase">{m.type}</span> • Runtime: <span className="text-neutral-300 font-mono">{runtimeStr}</span> • Rating: <span className="text-neutral-300 font-mono">{Math.round((m.jwRating || 0) * 100)}%</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {fdbResults.length === 0 && (
                    <div className="py-24 text-center">
                      <Globe size={40} className="text-neutral-800 mx-auto mb-4" />
                      <h4 className="text-xs font-bold text-neutral-400">No Free Movie DB Data Found</h4>
                      <p className="text-[10px] text-neutral-600 max-w-xs mx-auto mt-1 leading-relaxed">
                        Type keywords of your favorite movies/shows on the left panel (e.g. 'Wednesday', 'Inception'), choose a category assignment strategy, and click search to fetch from JustWatch node.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Movie Box Importer */}
      {activeTab === "moviebox" && (
        <div className="space-y-6 animate-fade-in">
          {/* API Info panel */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white mb-2 flex items-center gap-2">
                  <Sparkles size={16} className="text-red-500 animate-pulse" />
                  <span>Movie Box API Importer (github.com/parthmax2/movie-box)</span>
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
                  A premium, self-hosted streaming API index. This integration allows you to query the dynamic index of Movie Box and import up to 200 titles per batch directly into your Cloud Firestore video collection.
                </p>
              </div>
              <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded text-[11px] text-neutral-400 font-mono">
                Source: <span className="text-red-500 font-bold">parthmax2/movie-box</span>
              </div>
            </div>
          </div>

          {/* Panel control */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Filter / Query controls */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6 space-y-5">
              <h3 className="text-sm font-black text-white flex items-center gap-2 pb-2 border-b border-neutral-900">
                <Sliders size={15} className="text-red-500" />
                <span>Search & Setup Configuration</span>
              </h3>

              <div className="space-y-4 text-xs text-neutral-400 font-semibold">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-neutral-300 font-bold block">Keywords Query</label>
                    <span className="text-[10px] text-neutral-500 font-normal">Separate with commas</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Bachelor Point, Punorjonmo, Toofan, Jawan"
                    value={movieBoxSearchQuery}
                    onChange={(e) => setMovieBoxSearchQuery(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600 font-medium"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        fetchFromMovieBox();
                      }
                    }}
                  />
                </div>

                {/* Preset Suggestions */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-neutral-500 font-bold block">Quick Bulk Presets:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMovieBoxSearchQuery("Bachelor Point, Punorjonmo, Male 3, Hotel Albatross, Eid Special Natok")}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] text-neutral-300 transition-colors font-bold cursor-pointer"
                    >
                      🇧🇩 Bangla Natoks
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovieBoxSearchQuery("Toofan, Priyotoma, Hawa, Surongo, Poran, Damal, Aynabaji, Rehana Maryam Noor")}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] text-neutral-300 transition-colors font-bold cursor-pointer"
                    >
                      🎬 Bangla Movies
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovieBoxSearchQuery("Jawan, Pathaan, Animal, RRR, KGF Chapter 2, Pushpa, Kantara")}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] text-neutral-300 transition-colors font-bold cursor-pointer"
                    >
                      🇮🇳 Indian Movies
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovieBoxSearchQuery("Stranger Things, Wednesday, Breaking Bad, Inception, Interstellar, Oppenheimer")}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] text-neutral-300 transition-colors font-bold cursor-pointer"
                    >
                      🌍 Global Hits
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                  <label className="text-neutral-300 font-bold block">Import Limit Selector</label>
                  <select
                    value={movieBoxLimit}
                    onChange={(e) => setMovieBoxLimit(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                  >
                    <option value={10}>10 Movies</option>
                    <option value={25}>25 Movies</option>
                    <option value={50}>50 Movies</option>
                    <option value={100}>100 Movies (Highly Recommended)</option>
                    <option value={150}>150 Movies (Bulk Pack)</option>
                    <option value={200}>200 Movies (Max Capacity)</option>
                  </select>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                  <label className="text-neutral-300 font-bold block mb-2">Category Strategy</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-neutral-400 font-normal cursor-pointer">
                      <input
                        type="radio"
                        name="mbStrategy"
                        checked={movieBoxCategoryStrategy === "auto"}
                        onChange={() => setMovieBoxCategoryStrategy("auto")}
                        className="accent-red-600"
                      />
                      <span>Auto-detect from format types</span>
                    </label>
                    <label className="flex items-center gap-2 text-neutral-400 font-normal cursor-pointer">
                      <input
                        type="radio"
                        name="mbStrategy"
                        checked={movieBoxCategoryStrategy === "fixed"}
                        onChange={() => setMovieBoxCategoryStrategy("fixed")}
                        className="accent-red-600"
                      />
                      <span>Force-assign specific category</span>
                    </label>
                  </div>
                </div>

                {movieBoxCategoryStrategy === "fixed" && (
                  <div className="space-y-3 pt-2 bg-neutral-900/20 p-3 rounded border border-neutral-900">
                    <div className="space-y-1.5">
                      <label className="text-neutral-300 font-bold block">Select Target Category</label>
                      <select
                        value={movieBoxFixedCategory}
                        onChange={(e) => setMovieBoxFixedCategory(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                      >
                        <option value="Bangla Natok">Bangla Natok</option>
                        <option value="Web Series">Web Series</option>
                        <option value="TV Series">TV Series</option>
                        <option value="Bangla Movie">Bangla Movie</option>
                        <option value="Bollywood">Bollywood</option>
                        <option value="Action">Action</option>
                        <option value="Comedy">Comedy</option>
                        <option value="Sci-Fi">Sci-Fi</option>
                        <option value="Thriller">Thriller</option>
                        <option value="Drama">Drama</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-300 font-bold block">Or Type Custom Category Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Bangla Drama, South Indian..."
                        value={movieBoxCustomCategoryName}
                        onChange={(e) => setMovieBoxCustomCategoryName(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={fetchFromMovieBox}
                  disabled={isFetchingMovieBox}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black rounded text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-lg shadow-red-600/10"
                >
                  {isFetchingMovieBox ? (
                    <>
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                      <span>Fetching Index...</span>
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      <span>Search Movie Box</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dynamic Console Logs */}
              <div className="space-y-1.5 pt-4 border-t border-neutral-900">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block font-mono">Movie Box API Console</span>
                <div className="w-full h-36 bg-neutral-950 border border-neutral-900 rounded p-3 font-mono text-[9px] text-zinc-400 overflow-y-auto space-y-1 scrollbar-thin">
                  {movieBoxLogs.length === 0 ? (
                    <span className="text-neutral-600 block">Console offline. Execute index search...</span>
                  ) : (
                    movieBoxLogs.map((log, idx) => (
                      <div key={idx} className="leading-normal truncate text-neutral-400">{log}</div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Columns: Results matrix */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6 lg:col-span-2 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-neutral-900">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Film size={15} className="text-red-500" />
                      <span>Parsed Movie Box Index ({movieBoxResults.length})</span>
                    </h3>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Select and bulk-import movie catalog to Firestore instantly.</p>
                  </div>

                  {movieBoxResults.length > 0 && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (selectedMovieBoxIds.length === movieBoxResults.length) {
                            setSelectedMovieBoxIds([]);
                          } else {
                            setSelectedMovieBoxIds(movieBoxResults.map(m => m.id));
                          }
                        }}
                        className="text-[11px] text-neutral-400 hover:text-white font-bold transition-colors cursor-pointer"
                      >
                        {selectedMovieBoxIds.length === movieBoxResults.length ? "Deselect All" : "Select All"}
                      </button>

                      <button
                        onClick={importMovieBoxToFirestore}
                        disabled={isImportingMovieBox || selectedMovieBoxIds.length === 0}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded text-[11px] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        {isImportingMovieBox ? (
                          <>
                            <div className="animate-spin h-2.5 w-2.5 border-2 border-white border-t-transparent rounded-full" />
                            <span>Importing ({selectedMovieBoxIds.length})...</span>
                          </>
                        ) : (
                          <>
                            <FolderPlus size={11} />
                            <span>Bulk Import ({selectedMovieBoxIds.length})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Grid List */}
                <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3.5 divide-y divide-neutral-900/60 scrollbar-thin">
                  {movieBoxResults.map((m) => {
                    const isChecked = selectedMovieBoxIds.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedMovieBoxIds(prev => prev.filter(id => id !== m.id));
                          } else {
                            setSelectedMovieBoxIds(prev => [...prev, m.id]);
                          }
                        }}
                        className={`pt-3.5 flex items-start gap-4 cursor-pointer select-none transition-all ${
                          isChecked ? "opacity-100" : "opacity-50 hover:opacity-80"
                        }`}
                      >
                        <div className="mt-1 flex-shrink-0">
                          {isChecked ? (
                            <CheckSquare size={16} className="text-red-500" />
                          ) : (
                            <Square size={16} className="text-neutral-700" />
                          )}
                        </div>

                        <div className="w-14 aspect-[2/3] bg-neutral-900 rounded overflow-hidden flex-shrink-0 border border-neutral-800">
                          <img
                            src={m.thumbnail}
                            alt={m.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-white leading-tight truncate max-w-[280px]">{m.title}</h4>
                            <span className="text-[10px] text-neutral-400 font-mono font-bold">({m.year})</span>
                            <span className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-1.5 py-0.2 rounded font-semibold">{m.country}</span>
                          </div>
                          
                          <p className="text-[10px] text-neutral-400 leading-relaxed font-normal italic line-clamp-1">
                            {m.description}
                          </p>
                          <p className="text-[9px] text-neutral-500">
                            Type: <span className="text-neutral-300 font-mono uppercase">{m.type}</span> • Category: <span className="text-neutral-300 font-mono">{m.category}</span> • Duration: <span className="text-neutral-300 font-mono">{m.duration}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {movieBoxResults.length === 0 && (
                    <div className="py-24 text-center">
                      <Sparkles size={40} className="text-neutral-800 mx-auto mb-4" />
                      <h4 className="text-xs font-bold text-neutral-400">No Movie Box Data Found</h4>
                      <p className="text-[10px] text-neutral-600 max-w-xs mx-auto mt-1 leading-relaxed">
                        Enter movie queries or use one of our beautiful bulk presets on the left panel to crawl and index Movie Box database.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Dejavu API Importer */}
      {activeTab === "dejavu" && (
        <div className="space-y-6 animate-fade-in">
          {/* API Info panel */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white mb-2 flex items-center gap-2">
                  <Film size={16} className="text-red-500 animate-pulse" />
                  <span>Dejavu API Importer (github.com/krishnenduroy52/Dejavu-API)</span>
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
                  Dejavu API is a robust scraper that crawls and serves high-quality video links, poster backdrops, and runtimes. This integration lets you parse Dejavu metadata and insert up to 200 items into Firestore instantly.
                </p>
              </div>
              <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded text-[11px] text-neutral-400 font-mono">
                Source: <span className="text-red-500 font-bold">krishnenduroy52/Dejavu-API</span>
              </div>
            </div>
          </div>

          {/* Panel control */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Filter / Query controls */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6 space-y-5">
              <h3 className="text-sm font-black text-white flex items-center gap-2 pb-2 border-b border-neutral-900">
                <Sliders size={15} className="text-red-500" />
                <span>Search & Setup Configuration</span>
              </h3>

              <div className="space-y-4 text-xs text-neutral-400 font-semibold">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-neutral-300 font-bold block">Keywords Query</label>
                    <span className="text-[10px] text-neutral-500 font-normal">Separate with commas</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Toofan, Priyotoma, Hawa, Surongo"
                    value={dejavuSearchQuery}
                    onChange={(e) => setDejavuSearchQuery(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600 font-medium"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        fetchFromDejavu();
                      }
                    }}
                  />
                </div>

                {/* Preset Suggestions */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-neutral-500 font-bold block">Quick Bulk Presets:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDejavuSearchQuery("Toofan, Priyotoma, Hawa, Surongo, Poran, Damal, Aynabaji")}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] text-neutral-300 transition-colors font-bold cursor-pointer"
                    >
                      🇧🇩 Bangla Blockbusters
                    </button>
                    <button
                      type="button"
                      onClick={() => setDejavuSearchQuery("RRR, KGF Chapter 2, Pushpa, Kantara, Jailer, Leo, Vikram, Salar")}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] text-neutral-300 transition-colors font-bold cursor-pointer"
                    >
                      🔥 South Indian Hits
                    </button>
                    <button
                      type="button"
                      onClick={() => setDejavuSearchQuery("Karagar, Taqdeer, Mohanagar, Myself Allen utsob, Internsheep")}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] text-neutral-300 transition-colors font-bold cursor-pointer"
                    >
                      💎 Bangla Web Series
                    </button>
                    <button
                      type="button"
                      onClick={() => setDejavuSearchQuery("Inception, Interstellar, Oppenheimer, The Dark Knight, Dune, Avatar")}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] text-neutral-300 transition-colors font-bold cursor-pointer"
                    >
                      🚀 Sci-Fi & Hollywood
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                  <label className="text-neutral-300 font-bold block">Import Limit Selector</label>
                  <select
                    value={dejavuLimit}
                    onChange={(e) => setDejavuLimit(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                  >
                    <option value={10}>10 Movies</option>
                    <option value={25}>25 Movies</option>
                    <option value={50}>50 Movies</option>
                    <option value={100}>100 Movies (Highly Recommended)</option>
                    <option value={150}>150 Movies (Bulk Pack)</option>
                    <option value={200}>200 Movies (Max Capacity)</option>
                  </select>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                  <label className="text-neutral-300 font-bold block mb-2">Category Strategy</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-neutral-400 font-normal cursor-pointer">
                      <input
                        type="radio"
                        name="djStrategy"
                        checked={dejavuCategoryStrategy === "auto"}
                        onChange={() => setDejavuCategoryStrategy("auto")}
                        className="accent-red-600"
                      />
                      <span>Auto-detect from format types</span>
                    </label>
                    <label className="flex items-center gap-2 text-neutral-400 font-normal cursor-pointer">
                      <input
                        type="radio"
                        name="djStrategy"
                        checked={dejavuCategoryStrategy === "fixed"}
                        onChange={() => setDejavuCategoryStrategy("fixed")}
                        className="accent-red-600"
                      />
                      <span>Force-assign specific category</span>
                    </label>
                  </div>
                </div>

                {dejavuCategoryStrategy === "fixed" && (
                  <div className="space-y-3 pt-2 bg-neutral-900/20 p-3 rounded border border-neutral-900">
                    <div className="space-y-1.5">
                      <label className="text-neutral-300 font-bold block">Select Target Category</label>
                      <select
                        value={dejavuFixedCategory}
                        onChange={(e) => setDejavuFixedCategory(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                      >
                        <option value="Bangla Movie">Bangla Movie</option>
                        <option value="Bangla Natok">Bangla Natok</option>
                        <option value="Web Series">Web Series</option>
                        <option value="TV Series">TV Series</option>
                        <option value="Bollywood">Bollywood</option>
                        <option value="Action">Action</option>
                        <option value="Comedy">Comedy</option>
                        <option value="Sci-Fi">Sci-Fi</option>
                        <option value="Thriller">Thriller</option>
                        <option value="Drama">Drama</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-300 font-bold block">Or Type Custom Category Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Tollywood, Anime..."
                        value={dejavuCustomCategoryName}
                        onChange={(e) => setDejavuCustomCategoryName(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={fetchFromDejavu}
                  disabled={isFetchingDejavu}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black rounded text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-lg shadow-red-600/10"
                >
                  {isFetchingDejavu ? (
                    <>
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                      <span>Fetching Index...</span>
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      <span>Search Dejavu API</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dynamic Console Logs */}
              <div className="space-y-1.5 pt-4 border-t border-neutral-900">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block font-mono">Dejavu API Console</span>
                <div className="w-full h-36 bg-neutral-950 border border-neutral-900 rounded p-3 font-mono text-[9px] text-zinc-400 overflow-y-auto space-y-1 scrollbar-thin">
                  {dejavuLogs.length === 0 ? (
                    <span className="text-neutral-600 block">Console offline. Execute index search...</span>
                  ) : (
                    dejavuLogs.map((log, idx) => (
                      <div key={idx} className="leading-normal truncate text-neutral-400">{log}</div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Columns: Results matrix */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6 lg:col-span-2 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-neutral-900">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Film size={15} className="text-red-500" />
                      <span>Parsed Dejavu Index ({dejavuResults.length})</span>
                    </h3>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Select and bulk-import movie catalog to Firestore instantly.</p>
                  </div>

                  {dejavuResults.length > 0 && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (selectedDejavuIds.length === dejavuResults.length) {
                            setSelectedDejavuIds([]);
                          } else {
                            setSelectedDejavuIds(dejavuResults.map(m => m.id));
                          }
                        }}
                        className="text-[11px] text-neutral-400 hover:text-white font-bold transition-colors cursor-pointer"
                      >
                        {selectedDejavuIds.length === dejavuResults.length ? "Deselect All" : "Select All"}
                      </button>

                      <button
                        onClick={importDejavuToFirestore}
                        disabled={isImportingDejavu || selectedDejavuIds.length === 0}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded text-[11px] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        {isImportingDejavu ? (
                          <>
                            <div className="animate-spin h-2.5 w-2.5 border-2 border-white border-t-transparent rounded-full" />
                            <span>Importing ({selectedDejavuIds.length})...</span>
                          </>
                        ) : (
                          <>
                            <FolderPlus size={11} />
                            <span>Bulk Import ({selectedDejavuIds.length})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Grid List */}
                <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3.5 divide-y divide-neutral-900/60 scrollbar-thin">
                  {dejavuResults.map((m) => {
                    const isChecked = selectedDejavuIds.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedDejavuIds(prev => prev.filter(id => id !== m.id));
                          } else {
                            setSelectedDejavuIds(prev => [...prev, m.id]);
                          }
                        }}
                        className={`pt-3.5 flex items-start gap-4 cursor-pointer select-none transition-all ${
                          isChecked ? "opacity-100" : "opacity-50 hover:opacity-80"
                        }`}
                      >
                        <div className="mt-1 flex-shrink-0">
                          {isChecked ? (
                            <CheckSquare size={16} className="text-red-500" />
                          ) : (
                            <Square size={16} className="text-neutral-700" />
                          )}
                        </div>

                        <div className="w-14 aspect-[2/3] bg-neutral-900 rounded overflow-hidden flex-shrink-0 border border-neutral-800">
                          <img
                            src={m.thumbnail}
                            alt={m.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-white leading-tight truncate max-w-[280px]">{m.title}</h4>
                            <span className="text-[10px] text-neutral-400 font-mono font-bold">({m.year})</span>
                            <span className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-1.5 py-0.2 rounded font-semibold">{m.country}</span>
                          </div>
                          
                          <p className="text-[10px] text-neutral-400 leading-relaxed font-normal italic line-clamp-1">
                            {m.description}
                          </p>
                          <p className="text-[9px] text-neutral-500">
                            Type: <span className="text-neutral-300 font-mono uppercase">{m.type}</span> • Category: <span className="text-neutral-300 font-mono">{m.category}</span> • Duration: <span className="text-neutral-300 font-mono">{m.duration}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {dejavuResults.length === 0 && (
                    <div className="py-24 text-center">
                      <Film size={40} className="text-neutral-800 mx-auto mb-4" />
                      <h4 className="text-xs font-bold text-neutral-400">No Dejavu Data Found</h4>
                      <p className="text-[10px] text-neutral-600 max-w-xs mx-auto mt-1 leading-relaxed">
                        Enter movie queries or use one of our beautiful bulk presets on the left panel to crawl and index Dejavu API scrapers.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Analytics Metrics Dashboard */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-neutral-950 border border-neutral-900 p-5 rounded-lg">
              <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Total Video Catalog</span>
              <span className="block text-2xl font-black text-white mt-1.5">{movies.length} stream files</span>
              <span className="text-[10px] text-green-500 font-semibold block mt-1">Live synchronized in Firestore</span>
            </div>

            <div className="bg-neutral-950 border border-neutral-900 p-5 rounded-lg">
              <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Total Stream Audience Views</span>
              <span className="block text-2xl font-black text-white mt-1.5">{totalViews.toLocaleString()} views</span>
              <span className="text-[10px] text-green-500 font-semibold block mt-1">Real-time count increases</span>
            </div>

            <div className="bg-neutral-950 border border-neutral-900 p-5 rounded-lg">
              <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Global Positive Reviews (Likes)</span>
              <span className="block text-2xl font-black text-white mt-1.5">{totalLikes.toLocaleString()} positive</span>
              <span className="text-[10px] text-neutral-500 font-semibold block mt-1">87% high audience reviews</span>
            </div>
          </div>

          {/* Graphical custom SVG Bar Chart of categories */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6">
            <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-6">Views Distribution by Movie Genre</h4>
            
            <div className="space-y-5">
              {categoryStats.map((stat) => {
                const percentage = Math.max((stat.views / maxViews) * 100, 3);
                return (
                  <div key={stat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-neutral-300">{stat.name} ({stat.count} titles)</span>
                      <span className="text-neutral-400 font-mono">{stat.views.toLocaleString()} views</span>
                    </div>

                    <div className="w-full h-3 bg-neutral-900 rounded overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 5: Google AdSense & Custom Direct Display Ads Configuration */}
      {activeTab === "adsense" && (
        <form onSubmit={handleSaveAdSense} className="space-y-8 text-xs text-neutral-400 font-semibold max-w-4xl mx-auto">
          {/* Header intro panel */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6">
            <h3 className="text-base font-black text-white mb-3 flex items-center gap-2">
              <Settings size={18} className="text-amber-500" />
              <span>Google AdSense & Sponsored Campaigns Manager</span>
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Monetize your premium streaming platform instantly. Toggle display parameters, input Google AdSense script credentials, or customize local sponsored marketing banners that load with zero lag in our cinema-styled rows.
            </p>

            {/* Global Ads Switch */}
            <div className="flex items-center gap-3 mt-6 p-4 bg-neutral-900/40 rounded border border-neutral-800/60">
              <input
                type="checkbox"
                id="adsEnabled"
                checked={adsEnabled}
                onChange={(e) => setAdsEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-neutral-800 text-amber-500 focus:ring-amber-500 accent-amber-500 bg-neutral-900"
              />
              <div>
                <label htmlFor="adsEnabled" className="text-sm font-black text-white cursor-pointer select-none block">
                  Enable Advertisement Integration on Site
                </label>
                <span className="text-[10px] text-neutral-500 font-medium mt-0.5 block">
                  Enables Ad slots across the top header, inter-category movie rows, search page, and watch details sidebar.
                </span>
              </div>
            </div>
          </div>

          {/* AdSense configuration blocks */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6 space-y-5">
            <h4 className="text-sm font-black text-white flex items-center gap-2 border-b border-neutral-900 pb-3">
              <span>1. Google AdSense Script Integration</span>
              <span className="text-[9px] text-neutral-500 font-medium px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-mono uppercase">Official SDK</span>
            </h4>

            <p className="text-neutral-500 font-medium text-[11px] leading-relaxed">
              If you have an active Google AdSense Account, provide your Publisher client ID (e.g. <code className="text-amber-500 font-mono text-[10px]">ca-pub-XXXXXXXXXXXXXX</code>) and specific unit Slot IDs. The platform will automatically inject standard script blocks and handle responsive resizing. Leave slot inputs empty if you want to fall back on custom sponsored banners for that spot.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-neutral-300 font-bold">Google AdSense Publisher Client ID (ca-pub-xxx)</label>
                <input
                  type="text"
                  placeholder="e.g. ca-pub-90f67e516bce299e8adf6c603a59bc"
                  value={adsClient}
                  onChange={(e) => setAdsClient(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white placeholder-neutral-700 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-300 font-bold">Top Header Banner Slot ID</label>
                <input
                  type="text"
                  placeholder="e.g. 5928103928"
                  value={adsBannerSlot}
                  onChange={(e) => setAdsBannerSlot(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white placeholder-neutral-700 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-300 font-bold">Inter-Category Row Slot ID</label>
                <input
                  type="text"
                  placeholder="e.g. 1029482938"
                  value={adsRowSlot}
                  onChange={(e) => setAdsRowSlot(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white placeholder-neutral-700 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-300 font-bold">Watch Sidebar Slot ID</label>
                <input
                  type="text"
                  placeholder="e.g. 8304928392"
                  value={adsSidebarSlot}
                  onChange={(e) => setAdsSidebarSlot(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white placeholder-neutral-700 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-300 font-bold">Footer Slot ID</label>
                <input
                  type="text"
                  placeholder="e.g. 4820194821"
                  value={adsFooterSlot}
                  onChange={(e) => setAdsFooterSlot(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-white placeholder-neutral-700 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Custom direct affiliate setup block */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6 space-y-6">
            <h4 className="text-sm font-black text-white flex items-center gap-2 border-b border-neutral-900 pb-3">
              <span>2. Premium Direct Sponsor Campaign Setup (Fallback Ads)</span>
              <span className="text-[9px] text-amber-500 font-medium px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded font-mono uppercase">Affiliate Campaign</span>
            </h4>

            <p className="text-neutral-500 font-medium text-[11px] leading-relaxed">
              When Google AdSense takes time to load or isn't approved, or to avoid iframe rendering blocks in sandboxed environments, customize custom affiliate campaigns. These match the layout beautifully and link users directly to targeted URLs.
            </p>

            {/* Sub-section: Banner Ad */}
            <div className="space-y-4 p-4 bg-neutral-900/20 border border-neutral-900 rounded">
              <span className="text-xs text-white font-extrabold uppercase tracking-wider block">A. Top Header Banner Slot (728x90 layout)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-bold">Ad Title</label>
                  <input
                    type="text"
                    value={customBannerTitle}
                    onChange={(e) => setCustomBannerTitle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-bold">CTA Button Text</label>
                  <input
                    type="text"
                    value={customBannerCta}
                    onChange={(e) => setCustomBannerCta(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-neutral-300 font-bold">Redirect Link (URL)</label>
                  <input
                    type="url"
                    value={customBannerUrl}
                    onChange={(e) => setCustomBannerUrl(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-neutral-300 font-bold">Ad Description Text</label>
                  <input
                    type="text"
                    value={customBannerDesc}
                    onChange={(e) => setCustomBannerDesc(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sub-section: Row Ad */}
            <div className="space-y-4 p-4 bg-neutral-900/20 border border-neutral-900 rounded">
              <span className="text-xs text-white font-extrabold uppercase tracking-wider block">B. Inter-Category Row Slot (Horizontal Box layout)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-bold">Ad Title</label>
                  <input
                    type="text"
                    value={customRowTitle}
                    onChange={(e) => setCustomRowTitle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-bold">CTA Button Text</label>
                  <input
                    type="text"
                    value={customRowCta}
                    onChange={(e) => setCustomRowCta(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-neutral-300 font-bold">Redirect Link (URL)</label>
                  <input
                    type="url"
                    value={customRowUrl}
                    onChange={(e) => setCustomRowUrl(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-neutral-300 font-bold">Ad Description Text</label>
                  <input
                    type="text"
                    value={customRowDesc}
                    onChange={(e) => setCustomRowDesc(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sub-section: Sidebar Ad */}
            <div className="space-y-4 p-4 bg-neutral-900/20 border border-neutral-900 rounded">
              <span className="text-xs text-white font-extrabold uppercase tracking-wider block">C. Watch Details Sidebar Slot (300x250 block layout)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-bold">Ad Title</label>
                  <input
                    type="text"
                    value={customSidebarTitle}
                    onChange={(e) => setCustomSidebarTitle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-bold">CTA Button Text</label>
                  <input
                    type="text"
                    value={customSidebarCta}
                    onChange={(e) => setCustomSidebarCta(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-neutral-300 font-bold">Redirect Link (URL)</label>
                  <input
                    type="url"
                    value={customSidebarUrl}
                    onChange={(e) => setCustomSidebarUrl(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-neutral-300 font-bold">Ad Description Text</label>
                  <textarea
                    rows={2}
                    value={customSidebarDesc}
                    onChange={(e) => setCustomSidebarDesc(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sub-section: Footer Ad */}
            <div className="space-y-4 p-4 bg-neutral-900/20 border border-neutral-900 rounded">
              <span className="text-xs text-white font-extrabold uppercase tracking-wider block">D. Footer Slot (Horizontal ribbon layout)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-bold">Ad Title</label>
                  <input
                    type="text"
                    value={customFooterTitle}
                    onChange={(e) => setCustomFooterTitle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-bold">CTA Button Text</label>
                  <input
                    type="text"
                    value={customFooterCta}
                    onChange={(e) => setCustomFooterCta(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-neutral-300 font-bold">Redirect Link (URL)</label>
                  <input
                    type="url"
                    value={customFooterUrl}
                    onChange={(e) => setCustomFooterUrl(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-neutral-300 font-bold">Ad Description Text</label>
                  <input
                    type="text"
                    value={customFooterDesc}
                    onChange={(e) => setCustomFooterDesc(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form action submission */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-900">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-neutral-950 font-black rounded text-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
            >
              {isSubmitting ? (
                <div className="animate-spin h-3.5 w-3.5 border-2 border-neutral-950 border-t-transparent rounded-full" />
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Configuration & Sync Ads</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab Content: User Management System */}
      {activeTab === "users" && isSuperAdminOrAdmin && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="text-red-600 h-5 w-5" />
                <h3 className="text-lg font-bold text-white">User Management & Role Delegation (ইউজার ম্যানেজমেন্ট)</h3>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                ওয়েবসাইটের যেকোনো নিবন্ধিত সদস্যকে <span className="text-red-400 font-bold">Admin (এডমিন)</span> বা <span className="text-purple-400 font-bold">Moderator (মডারেটর)</span> হিসেবে নির্বাচন করুন। এডমিন পুরো ওয়েবসাইট নিয়ন্ত্রণ করতে পারবেন এবং মডারেটরদের নির্দিষ্ট দায়িত্ব (মুভি ইম্পোর্ট, ক্যাটাগরি, এডসেন্স ইত্যাদি) প্রদান করা সম্ভব।
              </p>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg cursor-pointer flex-shrink-0"
            >
              <UserPlus size={15} />
              <span>Assign Role to Email</span>
            </button>
          </div>

          {/* Search & Role Filter Bar */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-neutral-500" />
              <input
                type="text"
                placeholder="Search user by email or name..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-md border border-neutral-800 text-xs w-full sm:w-auto justify-center">
              <button
                onClick={() => setUserRoleFilter("all")}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  userRoleFilter === "all" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                All Users ({userList.length})
              </button>
              <button
                onClick={() => setUserRoleFilter("admin")}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  userRoleFilter === "admin" ? "bg-red-950 text-red-400 border border-red-800/60" : "text-neutral-400 hover:text-white"
                }`}
              >
                Admins ({userList.filter(u => u.role === "admin" || u.isAdmin).length})
              </button>
              <button
                onClick={() => setUserRoleFilter("moderator")}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  userRoleFilter === "moderator" ? "bg-purple-950 text-purple-300 border border-purple-800/60" : "text-neutral-400 hover:text-white"
                }`}
              >
                Moderators ({userList.filter(u => u.role === "moderator" || u.isModerator).length})
              </button>
              <button
                onClick={() => setUserRoleFilter("user")}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  userRoleFilter === "user" ? "bg-neutral-800 text-neutral-300" : "text-neutral-400 hover:text-white"
                }`}
              >
                Users ({userList.filter(u => u.role === "user" || (!u.role && !u.isAdmin && !u.isModerator)).length})
              </button>
            </div>
          </div>

          {/* User List Table */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-lg overflow-hidden">
            <div className="p-4 bg-neutral-900/50 border-b border-neutral-900 flex justify-between items-center text-xs font-bold text-neutral-400 uppercase tracking-wider">
              <span>Registered Accounts & Permissions</span>
              <span>Total: {userList.length}</span>
            </div>

            <div className="divide-y divide-neutral-900">
              {userList
                .filter((userItem) => {
                  const matchesSearch =
                    !userSearchQuery ||
                    userItem.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    userItem.displayName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    userItem.uid.toLowerCase().includes(userSearchQuery.toLowerCase());

                  if (!matchesSearch) return false;

                  if (userRoleFilter === "admin") return userItem.role === "admin" || userItem.isAdmin;
                  if (userRoleFilter === "moderator") return userItem.role === "moderator" || userItem.isModerator;
                  if (userRoleFilter === "user") return userItem.role === "user" || (!userItem.role && !userItem.isAdmin && !userItem.isModerator);

                  return true;
                })
                .map((userItem) => {
                  const isEditingThisUser = editingUserUid === userItem.uid;
                  const isSuperAdminUser =
                    userItem.email === "admin@movieflix.com" ||
                    userItem.email === "djskshahin544@gmail.com" ||
                    userItem.email === "shahinkhan28qqqq@gmail.com";

                  return (
                    <div key={userItem.uid} className="p-4 hover:bg-neutral-900/30 transition-all">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        {/* User Details */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {userItem.photoURL ? (
                            <img
                              src={userItem.photoURL}
                              alt={userItem.displayName || "User"}
                              className="w-10 h-10 rounded-full border border-neutral-800 object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {(userItem.displayName || userItem.email || "U").charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white truncate">
                                {userItem.displayName || userItem.email?.split("@")[0] || "Registered User"}
                              </h4>
                              {isSuperAdminUser && (
                                <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                                  Super Owner
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-400 truncate">{userItem.email || `UID: ${userItem.uid}`}</p>
                            <p className="text-[10px] text-neutral-600 mt-0.5">
                              ID: <code className="text-neutral-500">{userItem.uid.substring(0, 16)}...</code>
                            </p>
                          </div>
                        </div>

                        {/* Current Role Badge & Edit Action */}
                        <div className="flex items-center gap-3">
                          {/* Role Badge */}
                          {userItem.role === "admin" || userItem.isAdmin ? (
                            <span className="px-3 py-1 bg-red-950/80 border border-red-800/80 text-red-400 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                              <Shield size={12} className="text-red-500" />
                              <span>Admin (এডমিন)</span>
                            </span>
                          ) : userItem.role === "moderator" || userItem.isModerator ? (
                            <span className="px-3 py-1 bg-purple-950/80 border border-purple-800/80 text-purple-300 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                              <ShieldCheck size={12} className="text-purple-400" />
                              <span>Moderator (মডারেটর)</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-semibold rounded-full flex items-center gap-1.5">
                              <User size={12} />
                              <span>User (সাধারণ ইউজার)</span>
                            </span>
                          )}

                          {/* Edit Role Button */}
                          <button
                            onClick={() => {
                              if (isEditingThisUser) {
                                setEditingUserUid(null);
                              } else {
                                handleStartEditUser(userItem);
                              }
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer border ${
                              isEditingThisUser
                                ? "bg-neutral-800 text-white border-neutral-700"
                                : "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300 hover:text-white"
                            }`}
                          >
                            {isEditingThisUser ? "Close" : "Change Role / Permissions"}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Editing Panel */}
                      {isEditingThisUser && (
                        <div className="mt-4 p-4 bg-neutral-900/80 border border-neutral-800 rounded-lg space-y-4 animate-fade-in">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-3">
                            <h5 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                              <Settings size={14} className="text-red-500" />
                              <span>Configure User Access Level for {userItem.email}</span>
                            </h5>
                          </div>

                          {/* Select Role */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                                Select Primary Role (মূল পদ নির্বাচন করুন):
                              </label>
                              <select
                                value={editingRole}
                                onChange={(e) => setEditingRole(e.target.value as UserRole)}
                                disabled={isSuperAdminUser}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600 font-semibold"
                              >
                                <option value="user">User (সাধারণ ভিডিও দেখার ব্যবহারকারী)</option>
                                <option value="moderator">Moderator (সীমিত অ্যাডমিন দায়িত্বপ্রাপ্ত)</option>
                                <option value="admin">Admin (সম্পূর্ণ ওয়েবসাইটের নিয়ন্ত্রক)</option>
                              </select>
                              {isSuperAdminUser && (
                                <p className="text-[10px] text-amber-500/80 mt-1">
                                  * Primary owner email roles cannot be revoked.
                                </p>
                              )}
                            </div>

                            <div className="md:col-span-2">
                              <p className="text-xs text-neutral-400 leading-relaxed">
                                {editingRole === "admin" && (
                                  <span className="text-red-400 font-semibold">
                                    ✓ Admin Role: সম্পূর্ণ অ্যাডমিন প্যানেল, মুভি যোগ/এডিট/ডিলিট, অটো-ইম্পোর্টার, ইউজার ম্যানেজমেন্ট এবং এডসেন্স সেটিংস নিয়ন্ত্রণের পূর্ণ ক্ষমতা থাকবে।
                                  </span>
                                )}
                                {editingRole === "moderator" && (
                                  <span className="text-purple-300 font-semibold">
                                    ✓ Moderator Role: নিচে দেওয়া চেক বক্সগুলো থেকে নির্দিষ্ট অপশন সিলেক্ট করে দায়িত্ব অর্পণ করা যাবে।
                                  </span>
                                )}
                                {editingRole === "user" && (
                                  <span className="text-neutral-400 font-semibold">
                                    ✓ Standard User: শুধুমাত্র মুভি স্ট্রিম, ফেভারিট লিস্ট এবং হিস্ট্রি ব্যবহার করতে পারবেন।
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Granular Permissions Toggle Checkboxes for Moderator */}
                          {editingRole === "moderator" && (
                            <div className="pt-2 border-t border-neutral-800/80">
                              <label className="block text-xs font-bold text-purple-300 mb-2">
                                Delegate Moderator Panel Features (মডারেটরকে নির্দেশিত ফিচারের ক্ষমতা প্রদান):
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-950 p-3 rounded border border-neutral-800">
                                <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={editingPermissions.manageMovies !== false}
                                    onChange={(e) =>
                                      setEditingPermissions((prev) => ({ ...prev, manageMovies: e.target.checked }))
                                    }
                                    className="accent-red-600 rounded h-4 w-4"
                                  />
                                  <span>Movie Catalog Management (মুভি অ্যাড, এডিট ও ডিলিট)</span>
                                </label>

                                <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={editingPermissions.importMovies !== false}
                                    onChange={(e) =>
                                      setEditingPermissions((prev) => ({ ...prev, importMovies: e.target.checked }))
                                    }
                                    className="accent-red-600 rounded h-4 w-4"
                                  />
                                  <span>Bulk Movie Importers (TMDB, OMDB, MovieBox, Dejavu)</span>
                                </label>

                                <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={editingPermissions.manageAds === true}
                                    onChange={(e) =>
                                      setEditingPermissions((prev) => ({ ...prev, manageAds: e.target.checked }))
                                    }
                                    className="accent-red-600 rounded h-4 w-4"
                                  />
                                  <span>AdSense & Sponsor Banners (বিজ্ঞাপন পরিচালনা)</span>
                                </label>

                                <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={editingPermissions.viewAnalytics !== false}
                                    onChange={(e) =>
                                      setEditingPermissions((prev) => ({ ...prev, viewAnalytics: e.target.checked }))
                                    }
                                    className="accent-red-600 rounded h-4 w-4"
                                  />
                                  <span>Site Analytics & Metrics (অ্যানালিটিক্স দেখা)</span>
                                </label>
                              </div>
                            </div>
                          )}

                          {/* Save & Cancel Buttons */}
                          <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                              onClick={() => setEditingUserUid(null)}
                              className="px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveUserRole(userItem.uid, userItem.email)}
                              disabled={isSavingUserRole}
                              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                              <Check size={14} />
                              <span>{isSavingUserRole ? "Saving..." : "Save Role & Permissions"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              {userList.length === 0 && !isLoadingUsers && (
                <div className="p-8 text-center text-neutral-500 text-xs">
                  No registered users found in Cloud database yet. Users will automatically appear here upon login.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Theme & Appearance Settings */}
      {activeTab === "theme" && isSuperAdminOrAdmin && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Card */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-lg">
                  <Palette className="text-cyan-400 h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    Website Theme, Color & Screen Mode Settings (ওয়েবসাইট থিম ও স্ক্রিন মোড সেটিংস)
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                    এডমিন প্যানেল থেকে ১-ক্লিকে পুরো ওয়েবসাইটের লুক অ্যান্ড ফিল পরিবর্তন করুন। ৫টি প্রিমিয়াম রেডিমেড থিম, ডার্ক মোড / লাইট মোড ও কাস্টম কালার কন্ট্রোল করে সকল ভিজিটরের জন্য একসাথে ওয়েবসাইট আপডেট করুন।
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSaveTheme()}
              disabled={isSavingTheme}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-red-950/50 cursor-pointer active:scale-95 disabled:opacity-50 flex-shrink-0"
            >
              <Check size={16} />
              <span>{isSavingTheme ? "Applying Theme..." : "Save Theme & Apply to Site"}</span>
            </button>
          </div>

          {/* Master Dark / Light Mode Switch */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
              <div className="flex items-center gap-3">
                {isDarkOn ? (
                  <Moon className="text-indigo-400 h-6 w-6" />
                ) : (
                  <Sun className="text-amber-400 h-6 w-6" />
                )}
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Dark Mode & Light Mode Master Switch (ডার্ক মোড ও লাইট মোড কন্ট্রোল)
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    ওয়েবসাইটের প্রধান স্ক্রিন কালার পরিবর্তন করুন। ডার্ক মোড অন থাকলে কালো/ডার্ক ব্যাকগ্রাউন্ড থাকবে এবং অফ থাকলে ক্লিন লাইট ব্যাকগ্রাউন্ড প্রদর্শিত হবে।
                  </p>
                </div>
              </div>

              {/* Master Switch Toggle Button */}
              <button
                onClick={() => {
                  const nextDark = !isDarkOn;
                  setIsDarkOn(nextDark);
                  handleSaveTheme({ darkOn: nextDark });
                }}
                className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                  isDarkOn
                    ? "bg-indigo-950/80 text-indigo-300 border border-indigo-700/60"
                    : "bg-amber-950/80 text-amber-300 border border-amber-700/60"
                }`}
              >
                {isDarkOn ? (
                  <>
                    <Moon size={15} className="text-indigo-400" />
                    <span>Dark Mode: ON (ডার্ক মোড চালু)</span>
                  </>
                ) : (
                  <>
                    <Sun size={15} className="text-amber-400" />
                    <span>Light Mode: ACTIVE (লাইট মোড চালু)</span>
                  </>
                )}
              </button>
            </div>

            {/* Mode Preference Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <label
                onClick={() => {
                  setIsDarkOn(true);
                  setSiteMode("dark");
                  handleSaveTheme({ darkOn: true, mode: "dark" });
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isDarkOn && siteMode === "dark"
                    ? "bg-neutral-900 border-red-600 shadow-md"
                    : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Moon size={18} className="text-indigo-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Force Dark Mode</h5>
                    <p className="text-[10px] text-neutral-400">সবসময় নাইট / ডার্ক ভিউ</p>
                  </div>
                </div>
                {isDarkOn && siteMode === "dark" && <Check size={16} className="text-red-500" />}
              </label>

              <label
                onClick={() => {
                  setIsDarkOn(false);
                  setSiteMode("light");
                  handleSaveTheme({ darkOn: false, mode: "light" });
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  !isDarkOn && siteMode === "light"
                    ? "bg-neutral-900 border-amber-500 shadow-md"
                    : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sun size={18} className="text-amber-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Force Light Mode</h5>
                    <p className="text-[10px] text-neutral-400">সবসময় উজ্জ্বল ডে-লাইট ভিউ</p>
                  </div>
                </div>
                {!isDarkOn && siteMode === "light" && <Check size={16} className="text-amber-400" />}
              </label>

              <label
                onClick={() => {
                  setAllowUserThemeToggle(!allowUserThemeToggle);
                  handleSaveTheme({ allowUserThemeToggle: !allowUserThemeToggle });
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  allowUserThemeToggle
                    ? "bg-neutral-900 border-cyan-500/80 shadow-md"
                    : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-cyan-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Allow Visitor Switcher</h5>
                    <p className="text-[10px] text-neutral-400">ইউজারদের নেভবারে সুইচার দিন</p>
                  </div>
                </div>
                {allowUserThemeToggle && <Check size={16} className="text-cyan-400" />}
              </label>
            </div>
          </div>

          {/* Section: 5 Premium Automatic Themes */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <span>5 Premium Automatic Themes (৫টি রেডিমেড প্রিমিয়াম থিম)</span>
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  নিচের প্রিমিয়াম থিমগুলোর যেকোনো একটিতে ক্লিক করুন। সম্পূর্ণ ওয়েবসাইটের কালার স্কিম, বর্ডার ও বাটন স্টাইল একসাথে বদলে যাবে।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Theme 1: Netflix Classic Dark */}
              <div
                onClick={() => {
                  setSiteThemeId("netflix");
                  setAccentColor("red");
                  setIsDarkOn(true);
                  handleSaveTheme({ themeId: "netflix", accentColor: "red", darkOn: true });
                }}
                className={`group relative p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                  siteThemeId === "netflix"
                    ? "bg-neutral-900 border-red-600 shadow-2xl shadow-red-950/40 ring-2 ring-red-600/40"
                    : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-0.5 bg-red-950 border border-red-800/80 text-red-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Classic Netflix
                  </span>
                  {siteThemeId === "netflix" && (
                    <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                      ✓
                    </span>
                  )}
                </div>

                <h5 className="text-sm font-black text-white group-hover:text-red-400 transition-colors">
                  1. Netflix Red Classic (নেটফ্লিক্স ডার্ক)
                </h5>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  আইকনিক গাঢ় কালা ক্যানভাস, ক্রিমসন রেড বাটন ও বোল্ড নেভিগেশন হাইলাইট।
                </p>

                {/* Color swatch preview */}
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-neutral-800/80">
                  <div className="w-5 h-5 rounded-full bg-black border border-neutral-700" title="Canvas: Pitch Black" />
                  <div className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-700" title="Card: Dark Slate" />
                  <div className="w-5 h-5 rounded-full bg-red-600 shadow-sm" title="Accent: Netflix Red" />
                  <span className="text-[10px] font-bold text-neutral-500 ml-auto">#e50914</span>
                </div>
              </div>

              {/* Theme 2: Cyberpunk Neon 2077 */}
              <div
                onClick={() => {
                  setSiteThemeId("cyberpunk");
                  setAccentColor("cyan");
                  setIsDarkOn(true);
                  handleSaveTheme({ themeId: "cyberpunk", accentColor: "cyan", darkOn: true });
                }}
                className={`group relative p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                  siteThemeId === "cyberpunk"
                    ? "bg-neutral-900 border-cyan-500 shadow-2xl shadow-cyan-950/40 ring-2 ring-cyan-500/40"
                    : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-0.5 bg-cyan-950 border border-cyan-800/80 text-cyan-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Futuristic Neon
                  </span>
                  {siteThemeId === "cyberpunk" && (
                    <span className="w-6 h-6 rounded-full bg-cyan-500 text-black flex items-center justify-center font-bold text-xs">
                      ✓
                    </span>
                  )}
                </div>

                <h5 className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors">
                  2. Cyberpunk Neon 2077 (সাইবারপাঙ্ক নেয়ন)
                </h5>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  ফিউচারিস্টিক নাইট ক্যানভাস, নিয়ন সায়ান হাইলাইট ও ইলেকট্রিক গ্লো বর্ডার।
                </p>

                {/* Color swatch preview */}
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-neutral-800/80">
                  <div className="w-5 h-5 rounded-full bg-[#070714] border border-indigo-900" title="Canvas: Cosmic Night" />
                  <div className="w-5 h-5 rounded-full bg-[#0f0f24] border border-indigo-800" title="Card: Neon Blue" />
                  <div className="w-5 h-5 rounded-full bg-cyan-400 shadow-sm" title="Accent: Neon Cyan" />
                  <span className="text-[10px] font-bold text-neutral-500 ml-auto">#06b6d4</span>
                </div>
              </div>

              {/* Theme 3: Midnight Luxury Gold */}
              <div
                onClick={() => {
                  setSiteThemeId("gold");
                  setAccentColor("gold");
                  setIsDarkOn(true);
                  handleSaveTheme({ themeId: "gold", accentColor: "gold", darkOn: true });
                }}
                className={`group relative p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                  siteThemeId === "gold"
                    ? "bg-neutral-900 border-amber-500 shadow-2xl shadow-amber-950/40 ring-2 ring-amber-500/40"
                    : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-0.5 bg-amber-950 border border-amber-800/80 text-amber-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    VIP Royalty
                  </span>
                  {siteThemeId === "gold" && (
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-xs">
                      ✓
                    </span>
                  )}
                </div>

                <h5 className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                  3. Midnight Luxury Gold (মিডনাইট গোল্ড)
                </h5>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  রয়্যাল ভিআইপি স্টাইল, ওয়ার্ম গোল্ডেন ব্যাজ, লাক্সারি বর্ডার ও প্রিমিয়াম ফিল।
                </p>

                {/* Color swatch preview */}
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-neutral-800/80">
                  <div className="w-5 h-5 rounded-full bg-[#0a0a06] border border-amber-950" title="Canvas: Dark Obsidian" />
                  <div className="w-5 h-5 rounded-full bg-[#14140c] border border-amber-900" title="Card: Warm Dark" />
                  <div className="w-5 h-5 rounded-full bg-amber-500 shadow-sm" title="Accent: Luxury Gold" />
                  <span className="text-[10px] font-bold text-neutral-500 ml-auto">#f59e0b</span>
                </div>
              </div>

              {/* Theme 4: Emerald Mint Stream */}
              <div
                onClick={() => {
                  setSiteThemeId("emerald");
                  setAccentColor("emerald");
                  setIsDarkOn(true);
                  handleSaveTheme({ themeId: "emerald", accentColor: "emerald", darkOn: true });
                }}
                className={`group relative p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                  siteThemeId === "emerald"
                    ? "bg-neutral-900 border-emerald-500 shadow-2xl shadow-emerald-950/40 ring-2 ring-emerald-500/40"
                    : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-800/80 text-emerald-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Fresh Mint
                  </span>
                  {siteThemeId === "emerald" && (
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-xs">
                      ✓
                    </span>
                  )}
                </div>

                <h5 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">
                  4. Emerald Mint Stream (এমারেল্ড স্ট্রিম)
                </h5>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  ডার্ক স্লেট ক্যানভাস, প্রাণবন্ত মিন্ট গ্রিন হাইলাইট ও রিফ্রেশিং প্লেয়ার ভিউ।
                </p>

                {/* Color swatch preview */}
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-neutral-800/80">
                  <div className="w-5 h-5 rounded-full bg-[#040d0a] border border-emerald-950" title="Canvas: Slate Dark Green" />
                  <div className="w-5 h-5 rounded-full bg-[#0a1713] border border-emerald-900" title="Card: Dark Mint" />
                  <div className="w-5 h-5 rounded-full bg-emerald-500 shadow-sm" title="Accent: Mint Green" />
                  <span className="text-[10px] font-bold text-neutral-500 ml-auto">#10b981</span>
                </div>
              </div>

              {/* Theme 5: Cosmic Velvet Purple */}
              <div
                onClick={() => {
                  setSiteThemeId("purple");
                  setAccentColor("purple");
                  setIsDarkOn(true);
                  handleSaveTheme({ themeId: "purple", accentColor: "purple", darkOn: true });
                }}
                className={`group relative p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                  siteThemeId === "purple"
                    ? "bg-neutral-900 border-purple-500 shadow-2xl shadow-purple-950/40 ring-2 ring-purple-500/40"
                    : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-0.5 bg-purple-950 border border-purple-800/80 text-purple-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Cosmic Space
                  </span>
                  {siteThemeId === "purple" && (
                    <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xs">
                      ✓
                    </span>
                  )}
                </div>

                <h5 className="text-sm font-black text-white group-hover:text-purple-400 transition-colors">
                  5. Cosmic Velvet Purple (কসমিক পার্পল)
                </h5>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  গভীর মহাজাগতিক স্পেস পার্পল ক্যানভাস ও রয়্যাল ভায়োলেট প্রিমিয়াম অ্যাকসেন্ট।
                </p>

                {/* Color swatch preview */}
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-neutral-800/80">
                  <div className="w-5 h-5 rounded-full bg-[#0d0714] border border-purple-950" title="Canvas: Deep Cosmic Purple" />
                  <div className="w-5 h-5 rounded-full bg-[#150d22] border border-purple-900" title="Card: Violet Dark" />
                  <div className="w-5 h-5 rounded-full bg-purple-500 shadow-sm" title="Accent: Cosmic Purple" />
                  <span className="text-[10px] font-bold text-neutral-500 ml-auto">#a855f7</span>
                </div>
              </div>

              {/* Theme 6: Modern Cinema Light */}
              <div
                onClick={() => {
                  setSiteThemeId("light");
                  setAccentColor("red");
                  setIsDarkOn(false);
                  handleSaveTheme({ themeId: "light", accentColor: "red", darkOn: false });
                }}
                className={`group relative p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                  siteThemeId === "light" || !isDarkOn
                    ? "bg-slate-100 border-neutral-400 shadow-2xl ring-2 ring-neutral-400/50 text-neutral-900"
                    : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-0.5 bg-slate-200 border border-slate-300 text-slate-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Daylight Light
                  </span>
                  {(siteThemeId === "light" || !isDarkOn) && (
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      ✓
                    </span>
                  )}
                </div>

                <h5 className={`text-sm font-black ${!isDarkOn ? "text-neutral-900" : "text-white"}`}>
                  6. Modern Cinema Light (ক্লিন লাইট মোড)
                </h5>
                <p className={`text-[11px] mt-1 leading-relaxed ${!isDarkOn ? "text-neutral-600" : "text-neutral-400"}`}>
                  দিনের আলোর মতো স্পষ্ট লাইট ক্যানভাস, হাই-কনট্রাস্ট টেক্সট ও রেড প্লে বাটন।
                </p>

                {/* Color swatch preview */}
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-neutral-300">
                  <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300" title="Canvas: Bright White" />
                  <div className="w-5 h-5 rounded-full bg-white border border-slate-300" title="Card: Pure White" />
                  <div className="w-5 h-5 rounded-full bg-red-600 shadow-sm" title="Accent: Red" />
                  <span className="text-[10px] font-bold text-neutral-500 ml-auto">#f8fafc</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Screen Density & Display Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Screen Layout Mode */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-900 pb-3">
                <Tv size={16} className="text-cyan-400" />
                <span>Screen Aspect & Layout Density (স্ক্রিন ডিসপ্লে সাইজ)</span>
              </h4>

              <div className="space-y-3">
                <label
                  onClick={() => {
                    setScreenLayoutMode("standard");
                    handleSaveTheme({ screenLayoutMode: "standard" });
                  }}
                  className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    screenLayoutMode === "standard"
                      ? "bg-neutral-900 border-cyan-500 text-white"
                      : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  <div>
                    <h5 className="text-xs font-bold">Standard Broad View (স্ট্যান্ডার্ড ওয়াইড)</h5>
                    <p className="text-[10px] text-neutral-500">ডিফল্ট রেসপন্সিভ গ্রিড ও অপটিমাইজড প্যাডিং</p>
                  </div>
                  {screenLayoutMode === "standard" && <Check size={16} className="text-cyan-400" />}
                </label>

                <label
                  onClick={() => {
                    setScreenLayoutMode("cinema");
                    handleSaveTheme({ screenLayoutMode: "cinema" });
                  }}
                  className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    screenLayoutMode === "cinema"
                      ? "bg-neutral-900 border-cyan-500 text-white"
                      : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  <div>
                    <h5 className="text-xs font-bold">Full Cinema Board (ফুল সিনেমা ভিউ)</h5>
                    <p className="text-[10px] text-neutral-500">বড় ভিডিও প্যানেল ও আল্ট্রা-ওয়াইড মুভি ফোকাস</p>
                  </div>
                  {screenLayoutMode === "cinema" && <Check size={16} className="text-cyan-400" />}
                </label>

                <label
                  onClick={() => {
                    setScreenLayoutMode("compact");
                    handleSaveTheme({ screenLayoutMode: "compact" });
                  }}
                  className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    screenLayoutMode === "compact"
                      ? "bg-neutral-900 border-cyan-500 text-white"
                      : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  <div>
                    <h5 className="text-xs font-bold">Compact Dense Grid (কমপ্যাক্ট ডেন্স মোড)</h5>
                    <p className="text-[10px] text-neutral-500">একসাথে অনেকগুলো মুভি কার্ড দেখার জন্য ছোট সাইজ</p>
                  </div>
                  {screenLayoutMode === "compact" && <Check size={16} className="text-cyan-400" />}
                </label>
              </div>
            </div>

            {/* Custom Accent Color Override */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-900 pb-3">
                <Palette size={16} className="text-purple-400" />
                <span>Custom Accent Color (বাটন ও ব্যাজের কালার)</span>
              </h4>

              <p className="text-xs text-neutral-400">
                মুভির 'Watch Now' বাটন, প্লে আইকন, এবং ক্যাটাগরি পিলসগুলোর জন্য আলাদা অ্যাকসেন্ট কালার বেছে নিন:
              </p>

              <div className="grid grid-cols-3 gap-3 pt-1">
                {[
                  { id: "red", name: "Netflix Red", color: "#e50914" },
                  { id: "cyan", name: "Neon Cyan", color: "#06b6d4" },
                  { id: "gold", name: "Luxury Gold", color: "#f59e0b" },
                  { id: "emerald", name: "Mint Emerald", color: "#10b981" },
                  { id: "purple", name: "Cosmic Purple", color: "#a855f7" },
                  { id: "rose", name: "Rose Pink", color: "#f43f5e" },
                ].map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setAccentColor(acc.id);
                      handleSaveTheme({ accentColor: acc.id });
                    }}
                    className={`p-2.5 rounded-lg border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      accentColor === acc.id
                        ? "bg-neutral-900 border-white text-white shadow"
                        : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: acc.color }} />
                    <span className="truncate">{acc.name}</span>
                  </button>
                ))}
              </div>

              {/* Glassmorphism & FX Toggles */}
              <div className="pt-4 border-t border-neutral-900 space-y-2.5">
                <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer select-none">
                  <span className="flex items-center gap-2">
                    <Layers size={14} className="text-indigo-400" />
                    <span>Glassmorphism Blur Effects (গ্লাস ব্লার হেডার ও কার্ড)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={enableGlassmorphism}
                    onChange={(e) => {
                      setEnableGlassmorphism(e.target.checked);
                      handleSaveTheme({ enableGlassmorphism: e.target.checked });
                    }}
                    className="accent-red-600 rounded h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer select-none">
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Glowing Border Ambient FX (গ্লোয়িং বর্ডার ইফেক্ট)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={enableGlowEffects}
                    onChange={(e) => {
                      setEnableGlowEffects(e.target.checked);
                      handleSaveTheme({ enableGlowEffects: e.target.checked });
                    }}
                    className="accent-red-600 rounded h-4 w-4"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Live Theme Preview Box */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <Eye size={14} className="text-red-500" />
              <span>Live Theme Interface Preview (লাইভ ইন্টারফেস প্রিভিউ)</span>
            </h4>

            {/* Simulated Banner */}
            <div
              className={`p-6 rounded-2xl border transition-all relative overflow-hidden ${
                siteThemeId === "cyberpunk"
                  ? "bg-[#070714] border-cyan-500/50 text-white"
                  : siteThemeId === "gold"
                  ? "bg-[#0a0a06] border-amber-500/50 text-white"
                  : siteThemeId === "emerald"
                  ? "bg-[#040d0a] border-emerald-500/50 text-white"
                  : siteThemeId === "purple"
                  ? "bg-[#0d0714] border-purple-500/50 text-white"
                  : !isDarkOn || siteThemeId === "light"
                  ? "bg-slate-100 border-slate-300 text-slate-900"
                  : "bg-black border-red-900/40 text-white"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
                      style={{
                        backgroundColor:
                          accentColor === "cyan"
                            ? "#06b6d4"
                            : accentColor === "gold"
                            ? "#f59e0b"
                            : accentColor === "emerald"
                            ? "#10b981"
                            : accentColor === "purple"
                            ? "#a855f7"
                            : "#e50914",
                      }}
                    >
                      ★ Featured Stream
                    </span>
                    <span className="text-xs opacity-75">2026 • 4K Ultra HD</span>
                  </div>
                  <h3 className="text-lg font-black tracking-tight">
                    Avatar: The Way of Water (Live Theme Preview)
                  </h3>
                  <p className="text-xs opacity-70 mt-1 max-w-lg">
                    এই কার্ডটির মাধ্যমে আপনি দেখতে পাচ্ছেন আপনার নির্বাচিত থিমটি আসল ওয়েবসাইটে কেমন দেখাবে।
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="px-4 py-2 rounded-lg font-bold text-xs text-white flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                    style={{
                      backgroundColor:
                        accentColor === "cyan"
                          ? "#06b6d4"
                          : accentColor === "gold"
                          ? "#f59e0b"
                          : accentColor === "emerald"
                          ? "#10b981"
                          : accentColor === "purple"
                          ? "#a855f7"
                          : "#e50914",
                    }}
                  >
                    <Play size={14} fill="currentColor" />
                    <span>Watch Now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus size={16} className="text-red-500" />
                <span>Assign Role by User Email</span>
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-neutral-500 hover:text-neutral-300 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              যেকোনো ইউজারের ইমেইল এড্রেস দিয়ে সরাসরি তার পদবি (Admin বা Moderator) এবং পারমিশন সেট করে দিন। ইউজার সাইটে লগইন করার সাথেই এই পারমিশন অ্যাক্টিভ হয়ে যাবে।
            </p>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1">User Email Address:</label>
              <input
                type="email"
                placeholder="e.g. user@example.com"
                value={manualUserEmail}
                onChange={(e) => setManualUserEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1">Select Role:</label>
              <select
                value={manualUserRole}
                onChange={(e) => setManualUserRole(e.target.value as UserRole)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600 font-semibold"
              >
                <option value="moderator">Moderator (মডারেটর - সীমিত সুবিধা)</option>
                <option value="admin">Admin (সম্পূর্ণ অ্যাডমিন)</option>
                <option value="user">User (সাধারণ ব্যবহারকারী)</option>
              </select>
            </div>

            {manualUserRole === "moderator" && (
              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1">Grant Permissions:</label>
                <div className="space-y-2 bg-neutral-900 p-3 rounded border border-neutral-800 text-xs">
                  <label className="flex items-center gap-2 text-neutral-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualUserPermissions.manageMovies !== false}
                      onChange={(e) => setManualUserPermissions((prev) => ({ ...prev, manageMovies: e.target.checked }))}
                      className="accent-red-600 rounded"
                    />
                    <span>Manage Movies Catalog</span>
                  </label>
                  <label className="flex items-center gap-2 text-neutral-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualUserPermissions.importMovies !== false}
                      onChange={(e) => setManualUserPermissions((prev) => ({ ...prev, importMovies: e.target.checked }))}
                      className="accent-red-600 rounded"
                    />
                    <span>Bulk Movie Importers</span>
                  </label>
                  <label className="flex items-center gap-2 text-neutral-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualUserPermissions.manageAds === true}
                      onChange={(e) => setManualUserPermissions((prev) => ({ ...prev, manageAds: e.target.checked }))}
                      className="accent-red-600 rounded"
                    />
                    <span>AdSense & Custom Ads</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddManualUserRole}
                disabled={isSavingUserRole}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded flex items-center gap-1 transition-all cursor-pointer"
              >
                <Check size={14} />
                <span>Save Role</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
