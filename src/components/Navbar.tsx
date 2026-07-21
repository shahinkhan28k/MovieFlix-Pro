import React, { useState, useEffect, useMemo } from "react";
import { Search, Bell, Menu, X, LogIn, LogOut, Film, User, Heart, Clock, LayoutDashboard, ChevronDown, Shield, ShieldCheck, Sun, Moon } from "lucide-react";
import { UserProfile, Movie, ThemeSettings } from "../types";
import { CATEGORIES } from "../data/mockMovies";

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  user: UserProfile | null;
  onSignOut: () => Promise<void>;
  onShowLogin: () => void;
  favoritesCount: number;
  watchHistoryCount: number;
  movies?: Movie[];
  themeSettings?: ThemeSettings;
  onToggleDarkMode?: () => void;
}

export default function Navbar({
  currentView,
  setCurrentView,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  user,
  onSignOut,
  onShowLogin,
  favoritesCount,
  watchHistoryCount,
  movies = [],
  themeSettings,
  onToggleDarkMode,
}: NavbarProps) {

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);

  // Dynamically compute active categories from existing movies to include TV Series, Bangla Natok, Web Series, K-Drama, etc.
  const dynamicCategories = useMemo(() => {
    if (!movies || movies.length === 0) return CATEGORIES;
    const catsSet = new Set<string>(CATEGORIES);
    movies.forEach(m => {
      if (m.category) catsSet.add(m.category);
      if (m.subCategory) catsSet.add(m.subCategory);
    });
    return Array.from(catsSet).filter(Boolean);
  }, [movies]);

  // Monitor scroll to apply solid background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogoClick = () => {
    setCurrentView("home");
    setSelectedCategory(null);
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentView("category");
    setIsCategoriesDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (currentView !== "search") {
      setCurrentView("search");
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 select-none ${
        isScrolled
          ? "bg-black/95 backdrop-blur-md shadow-xl border-b border-neutral-900/40 py-3"
          : "bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo & Main Navigation Links */}
        <div className="flex items-center gap-8">
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-1.5 cursor-pointer text-red-600 font-extrabold text-2xl md:text-3xl tracking-tighter select-none transform transition hover:scale-105 active:scale-95"
            style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
          >
            <span>MOVIE</span>
            <span className="text-white bg-red-600 px-1.5 py-0.5 rounded text-lg md:text-xl font-black">FLIX</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-300">
            <button
              onClick={() => {
                setCurrentView("home");
                setSelectedCategory(null);
              }}
              className={`hover:text-white transition-colors cursor-pointer ${
                currentView === "home" && !selectedCategory ? "text-white font-semibold" : ""
              }`}
            >
              Home
            </button>

            {/* Categories Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
                onBlur={() => setTimeout(() => setIsCategoriesDropdownOpen(false), 200)}
                className={`hover:text-white flex items-center gap-1 transition-colors cursor-pointer ${
                  currentView === "category" ? "text-white font-semibold" : ""
                }`}
              >
                <span>Categories</span>
                <ChevronDown size={14} className={`transform transition-transform ${isCategoriesDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isCategoriesDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-neutral-950 border border-neutral-800 rounded-md shadow-2xl overflow-hidden py-1 z-50">
                  {dynamicCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(category)}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-neutral-900 transition-colors ${
                        selectedCategory === category ? "text-red-500 font-semibold bg-neutral-900" : "text-neutral-300"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setCurrentView("favorites")}
              className={`hover:text-white transition-colors cursor-pointer flex items-center gap-1 ${
                currentView === "favorites" ? "text-white font-semibold" : ""
              }`}
            >
              <span>My List</span>
              {favoritesCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center font-bold">
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentView("history")}
              className={`hover:text-white transition-colors cursor-pointer flex items-center gap-1 ${
                currentView === "history" ? "text-white font-semibold" : ""
              }`}
            >
              <span>History</span>
              {watchHistoryCount > 0 && (
                <span className="bg-neutral-800 text-neutral-300 text-[10px] h-4 w-4 rounded-full flex items-center justify-center font-semibold">
                  {watchHistoryCount}
                </span>
              )}
            </button>

            {/* Admin / Moderator Dashboard */}
            <button
              onClick={() => setCurrentView("admin")}
              className={`hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border rounded text-xs font-medium ${
                currentView === "admin" 
                  ? "text-white border-neutral-700 bg-neutral-800" 
                  : user?.role === "admin" || user?.isAdmin
                  ? "text-red-400 border-red-900/60 bg-red-950/20"
                  : user?.role === "moderator" || user?.isModerator
                  ? "text-purple-400 border-purple-900/60 bg-purple-950/20"
                  : "text-neutral-400 border-neutral-800/80"
              }`}
            >
              {user?.role === "admin" || user?.isAdmin ? (
                <>
                  <Shield size={14} className="text-red-500 flex-shrink-0" />
                  <span>Admin Panel</span>
                </>
              ) : user?.role === "moderator" || user?.isModerator ? (
                <>
                  <ShieldCheck size={14} className="text-purple-400 flex-shrink-0" />
                  <span>Moderator Panel</span>
                </>
              ) : (
                <>
                  <LayoutDashboard size={14} className="flex-shrink-0" />
                  <span>Admin</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Secondary Navigation Actions */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative flex items-center">
            <div
              className={`flex items-center bg-neutral-950 border border-neutral-800 rounded px-2 py-1 transition-all duration-300 ${
                isSearchExpanded || searchQuery ? "w-44 sm:w-64 opacity-100" : "w-0 opacity-0 md:opacity-100 md:w-44 border-transparent bg-transparent"
              }`}
            >
              <Search size={16} className="text-neutral-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Titles, people, genres..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchExpanded(true)}
                onBlur={() => {
                  if (!searchQuery) setIsSearchExpanded(false);
                }}
                className="w-full bg-transparent border-0 outline-none text-xs text-white placeholder-neutral-500 p-0 focus:ring-0 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentView("home");
                  }}
                  className="text-neutral-500 hover:text-neutral-300 flex-shrink-0 ml-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {!(isSearchExpanded || searchQuery) && (
              <button
                onClick={() => setIsSearchExpanded(true)}
                className="p-2 text-neutral-300 hover:text-white transition-colors md:hidden"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
            )}
          </div>

          {/* Theme Mode Switcher Toggle Button */}
          {onToggleDarkMode && (themeSettings?.allowUserThemeToggle !== false) && (
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800/60 rounded-full transition-all cursor-pointer"
              title={(themeSettings?.darkOn ?? themeSettings?.isDarkOn ?? true) ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme Mode"
            >
              {(themeSettings?.darkOn ?? themeSettings?.isDarkOn ?? true) ? (
                <Sun size={18} className="text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon size={18} className="text-indigo-400 hover:-rotate-12 transition-transform" />
              )}
            </button>
          )}

          {/* User Account / Login State */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                onBlur={() => setTimeout(() => setIsProfileDropdownOpen(false), 250)}
                className="flex items-center gap-1.5 focus:outline-none"
                aria-label="User Profile Dropdown"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Profile"}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded border border-neutral-800 shadow-md flex-shrink-0 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-bold border border-red-500/30 text-sm flex-shrink-0">
                    {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <ChevronDown size={12} className="text-neutral-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-neutral-950 border border-neutral-800 rounded shadow-2xl py-2 z-50 animate-fade-in text-xs">
                  <div className="px-4 py-2 border-b border-neutral-900 text-neutral-300">
                    <p className="font-semibold text-neutral-100 truncate">
                      {user.displayName || "Authorized User"}
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate mt-0.5">{user.email}</p>
                    {user.isAdmin && (
                      <span className="inline-block bg-red-600/10 text-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-500/20 mt-1.5">
                        Admin Account
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentView("favorites");
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors flex items-center gap-2"
                  >
                    <Heart size={14} className="text-red-500" />
                    <span>My List ({favoritesCount})</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView("history");
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors flex items-center gap-2"
                  >
                    <Clock size={14} className="text-neutral-400" />
                    <span>Watch History ({watchHistoryCount})</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView("admin");
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors flex items-center gap-2 border-t border-neutral-900/60"
                  >
                    <LayoutDashboard size={14} className="text-neutral-400" />
                    <span>Admin Dashboard</span>
                  </button>

                  <button
                    onClick={() => {
                      onSignOut();
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-neutral-900 transition-colors flex items-center gap-2 border-t border-neutral-900/80"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onShowLogin}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-all active:scale-95 shadow-lg shadow-red-600/20"
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-neutral-300 hover:text-white transition-colors md:hidden focus:outline-none"
            aria-label="Toggle Mobile Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-neutral-950 border-b border-neutral-900 py-4 px-4 space-y-3 shadow-2xl animate-slide-down">
          <div className="grid grid-cols-2 gap-2 text-sm text-neutral-300">
            <button
              onClick={() => {
                setCurrentView("home");
                setSelectedCategory(null);
                setIsMobileMenuOpen(false);
              }}
              className={`text-left p-2 rounded hover:bg-neutral-900 hover:text-white ${
                currentView === "home" && !selectedCategory ? "text-white font-bold bg-neutral-900" : ""
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                setCurrentView("favorites");
                setIsMobileMenuOpen(false);
              }}
              className={`text-left p-2 rounded hover:bg-neutral-900 hover:text-white flex items-center justify-between ${
                currentView === "favorites" ? "text-white font-bold bg-neutral-900" : ""
              }`}
            >
              <span>My List</span>
              {favoritesCount > 0 && <span className="bg-red-600 text-white text-[10px] px-1.5 rounded-full font-bold">{favoritesCount}</span>}
            </button>
            <button
              onClick={() => {
                setCurrentView("history");
                setIsMobileMenuOpen(false);
              }}
              className={`text-left p-2 rounded hover:bg-neutral-900 hover:text-white flex items-center justify-between ${
                currentView === "history" ? "text-white font-bold bg-neutral-900" : ""
              }`}
            >
              <span>History</span>
              {watchHistoryCount > 0 && <span className="bg-neutral-800 text-neutral-300 text-[10px] px-1.5 rounded-full font-semibold">{watchHistoryCount}</span>}
            </button>
            <button
              onClick={() => {
                setCurrentView("admin");
                setIsMobileMenuOpen(false);
              }}
              className={`text-left p-2 rounded hover:bg-neutral-900 hover:text-white flex items-center gap-1.5 ${
                currentView === "admin" ? "text-white font-bold bg-neutral-900" : ""
              }`}
            >
              <LayoutDashboard size={14} />
              <span>Admin</span>
            </button>
          </div>

          {/* Categories Grid inside mobile menu */}
          <div className="border-t border-neutral-900 pt-3">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 px-2">Categories</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-neutral-400">
              {dynamicCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={`text-left p-2 rounded hover:bg-neutral-900 hover:text-white ${
                    selectedCategory === category ? "text-red-500 font-bold bg-neutral-900" : ""
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
