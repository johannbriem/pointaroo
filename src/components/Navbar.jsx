// Updated and polished Navbar.jsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { XMarkIcon, Bars3Icon, Bars3BottomRightIcon } from "@heroicons/react/24/solid";
import LanguageSelector from "./LanguageSelector";
import { supabase } from "../supabaseClient";
import { useTheme } from "./ThemeContext";

export default function Navbar({ openGoalModal }) {
  const [user, setUser] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(false);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState("User");
  const { t } = useTranslation();
  const { uiMode, theme, setTheme, setUiMode } = useTheme();

  const [darkModePreference, setDarkModePreference] = useState(() => {
    const savedPreference = localStorage.getItem('theme-mode');
    if (savedPreference) return savedPreference;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const loadUserAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, display_name")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          setIsAdmin(false);
        } else {
          setIsAdmin(profile?.role === 'admin');
          setUserDisplayName(profile?.display_name || user.email || "User");
        }
      }
    };
    loadUserAndRole();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role, display_name")
            .eq("id", session.user.id)
            .single();

          if (error) {
            console.error("Error fetching profile on auth change:", error);
            setIsAdmin(false);
          } else {
            setIsAdmin(profile?.role === 'admin');
            setUserDisplayName(profile?.display_name || session.user.email || "User");
          }
        } else {
          setIsAdmin(false);
          setUserDisplayName("User");
        }
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });
  }, []);

  useEffect(() => {
    if (darkModePreference === 'dark') {
      document.body.classList.add('dark');
    } else if (darkModePreference === 'light') {
      document.body.classList.remove('dark');
    } else if (darkModePreference === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
    localStorage.setItem('theme-mode', darkModePreference);
  }, [darkModePreference]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (!user) return null;

  return (
    <header className="bg-[var(--color-navbar-bg)] sticky top-0 z-50 shadow-lg transition-colors duration-300 ease-in-out border-b border-[var(--color-border)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/">
          <img src="/logo.png" alt="Pointaroo Logo" className="h-10 w-auto object-contain" />
        </Link>

        {/* Desktop Menu - Simplified */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/store" className="nav-link-desktop">
            {t("navbar.store")}
          </Link>
          <Link to="/completions" className="nav-link-desktop">
            {t("navbar.completions")}
          </Link>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-[var(--color-navbar-text)] p-2 rounded-md hover:bg-[var(--color-navbar-hover-bg)] transition-colors flex items-center gap-2"
          >
            {uiMode === "kid" ? (
              <span className="font-semibold text-lg">{userDisplayName}</span>
            ) : (
              <Bars3BottomRightIcon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Toggle - Unified with new menu card */}
        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={() => {
              setMenuOpen(true);
              setShowMenu(true);
            }}
            className="text-[var(--color-navbar-text)] p-2 rounded-md hover:bg-[var(--color-navbar-hover-bg)] transition-colors"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Slide-out Menu (Existing) */}
      <div
        className={`fixed top-0 right-0 h-full w-3/5 max-w-xs bg-[var(--color-navbar-bg)] z-50 shadow-lg transform transition-transform duration-300 ease-in-out md:hidden ${menuOpen ? "translate-x-0" : "translate-x-full"}
          }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-navbar-text)]">{t("navbar.menu")}</h2>
          <button
            onClick={() => {
              setMenuOpen(false);
              setShowMenu(false);
            }}
            className="text-[var(--color-navbar-text)] hover:text-[var(--color-primary)] p-2 rounded-md transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex flex-col gap-2 p-4">
          <Link to="/store" className="nav-link-mobile" onClick={() => { setMenuOpen(false); setShowMenu(false); }}>
            {t("navbar.store")}
          </Link>
          <Link to="/completions" className="nav-link-mobile" onClick={() => { setMenuOpen(false); setShowMenu(false); }}>
            {t("navbar.completions")}
          </Link>
          {isAdmin && (
            <Link to="/admin" className="nav-link-mobile bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-md" onClick={() => { setMenuOpen(false); setShowMenu(false); }}>
              {t("navbar.admin")}
            </Link>
          )}
          <button onClick={() => { openGoalModal(); setMenuOpen(false); setShowMenu(false); }} className="nav-link-mobile">
            🎯 {t("navbar.myGoal")}
          </button>
          {showInstallBtn && (
            <button
              onClick={() => { handleInstallClick(); setMenuOpen(false); setShowMenu(false); }}
              className="btn-install-mobile"
            >
              📲 {t("navbar.installApp")}
            </button>
          )}
          <button onClick={() => { handleLogout(); setMenuOpen(false); setShowMenu(false); }} className="btn-logout-mobile">
            {t("navbar.logout")}
          </button>
          <div className="mt-4">
            <LanguageSelector userId={user.id} />
            {/* Dark Mode Toggle for Mobile Menu */}
            <div className="flex flex-col gap-2 mt-4">
              <span className="text-sm font-semibold text-[var(--color-navbar-text)]">{t("navbar.themeMode")}</span>
              <button
                onClick={() => setDarkModePreference('light')}
                className={`px-3 py-1 rounded-md text-sm font-bold border ${darkModePreference === 'light' ? 'bg-[var(--color-primary)] text-[var(--color-button-text)]' : 'bg-[var(--color-navbar-hover-bg)] text-[var(--color-navbar-text)]'} transition`}
              >
                {t("navbar.lightMode")}
              </button>
              <button
                onClick={() => setDarkModePreference('dark')}
                className={`px-3 py-1 rounded-md text-sm font-bold border ${darkModePreference === 'dark' ? 'bg-[var(--color-primary)] text-[var(--color-button-text)]' : 'bg-[var(--color-navbar-hover-bg)] text-[var(--color-navbar-text)]'} transition`}
              >
                {t("navbar.darkMode")}
              </button>
              <button
                onClick={() => setDarkModePreference('system')}
                className={`px-3 py-1 rounded-md text-sm font-bold border ${darkModePreference === 'system' ? 'bg-[var(--color-primary)] text-[var(--color-button-text)]' : 'bg-[var(--color-navbar-hover-bg)] text-[var(--color-navbar-text)]'} transition`}
              >
                {t("navbar.systemMode")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Menu Card (Desktop and Mobile) */}
      {showMenu && (
        <div
          className={`fixed top-16 right-4 w-64 bg-[var(--color-navbar-bg)] shadow-lg rounded-lg p-4 z-50 transition-all duration-300 ease-in-out transform ${showMenu ? "scale-100 opacity-100" : "scale-95 opacity-0"}
          md:block`}
        >
          <div className="flex flex-col gap-2">
            {isAdmin && (
              <Link to="/admin" className="nav-link-mobile bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-md" onClick={() => setShowMenu(false)}>
                {t("navbar.admin")}
              </Link>
            )}
            <button onClick={() => { openGoalModal(); setShowMenu(false); }} className="nav-link-mobile">
              🎯 {t("navbar.myGoal")}
            </button>
            {showInstallBtn && (
              <button
                onClick={() => { handleInstallClick(); setShowMenu(false); }}
                className="btn-install-mobile"
              >
                📲 {t("navbar.installApp")}
              </button>
            )}
            <button onClick={() => { handleLogout(); setShowMenu(false); }} className="btn-logout-mobile">
              {t("navbar.logout")}
            </button>
            <div className="mt-4">
              <LanguageSelector userId={user.id} />
              {/* Dark Mode Toggle for Desktop Menu Card */}
              <div className="flex flex-col gap-2 mt-4">
                <span className="text-sm font-semibold text-[var(--color-navbar-text)]">{t("navbar.themeMode")}</span>
                <button
                  onClick={() => setDarkModePreference('light')}
                  className={`px-3 py-1 rounded-md text-sm font-bold border ${darkModePreference === 'light' ? 'bg-[var(--color-primary)] text-[var(--color-button-text)]' : 'bg-[var(--color-navbar-hover-bg)] text-[var(--color-navbar-text)]'} transition`}
                >
                  {t("navbar.lightMode")}
                </button>
                <button
                  onClick={() => setDarkModePreference('dark')}
                  className={`px-3 py-1 rounded-md text-sm font-bold border ${darkModePreference === 'dark' ? 'bg-[var(--color-primary)] text-[var(--color-button-text)]' : 'bg-[var(--color-navbar-hover-bg)] text-[var(--color-navbar-text)]'} transition`}
                >
                  {t("navbar.darkMode")}
                </button>
                <button
                  onClick={() => setDarkModePreference('system')}
                  className={`px-3 py-1 rounded-md text-sm font-bold border ${darkModePreference === 'system' ? 'bg-[var(--color-primary)] text-[var(--color-button-text)]' : 'bg-[var(--color-navbar-hover-bg)] text-[var(--color-navbar-text)]'} transition`}
                >
                  {t("navbar.systemMode")}
                </button>
              </div>
            </div>
            {uiMode === "kid" && (
              <div className="flex flex-col gap-2 mt-4">
                <span className="text-sm font-semibold text-[var(--color-navbar-text)]">{t("navbar.kidThemes")}</span>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-black bg-[var(--color-navbar-hover-bg)]"
                >
                  <option value="space">{t("navbar.spaceTheme")}</option>
                  <option value="jungle">{t("navbar.jungleTheme")}</option>
                  <option value="robot">{t("navbar.robotTheme")}</option>
                  <option value="ocean">{t("navbar.oceanTheme")}</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay for both mobile menu and new menu card */}
      {(menuOpen || showMenu) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-5 z-40"
          onClick={() => { setMenuOpen(false); setShowMenu(false); }}
        ></div>
      )}
    </header>
  );
}
