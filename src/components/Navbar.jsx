// Updated and polished Navbar.jsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { XMarkIcon, Bars3Icon, Bars3BottomRightIcon } from "@heroicons/react/24/solid";
import LanguageSelector from "./LanguageSelector";
import ThemeSelector from "./ThemeSelector";
import { supabase } from "../supabaseClient";

export default function Navbar({ openGoalModal }) {
  const [user, setUser] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false); // New state for the menu card
  const { t } = useTranslation();

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
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
          <img src="/logo.png" alt="Pointaroo" className="h-10" />
        </Link>

        {/* Desktop Menu - Simplified */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeSelector />
          <LanguageSelector userId={user.id} />
          <button
            onClick={() => setShowMenu(!showMenu)} // Toggle the new menu card
            className="text-[var(--color-navbar-text)] p-2 rounded-md hover:bg-[var(--color-navbar-hover-bg)] transition-colors"
          >
            <Bars3BottomRightIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Toggle - Unified with new menu card */}
        <div className="md:hidden flex items-center gap-4">
          <ThemeSelector />
          <button
            onClick={() => {
              setMenuOpen(true);
              setShowMenu(true); // Also open the new menu card for mobile
            }}
            className="text-[var(--color-navbar-text)] p-2 rounded-md hover:bg-[var(--color-navbar-hover-bg)] transition-colors"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Slide-out Menu (Existing) */}
      <div
        className={`fixed top-0 right-0 h-full w-4/5 max-w-xs bg-[var(--color-navbar-bg)] z-50 shadow-lg transform transition-transform duration-300 ease-in-out md:hidden ${menuOpen ? "translate-x-0" : "translate-x-full"}
          }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-navbar-text)]">{t("navbar.menu")}</h2>
          <button
            onClick={() => {
              setMenuOpen(false);
              setShowMenu(false); // Close the new menu card as well
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
          <Link to="/admin" className="nav-link-mobile" onClick={() => { setMenuOpen(false); setShowMenu(false); }}>
            {t("navbar.admin")}
          </Link>
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
            <Link to="/store" className="nav-link-mobile" onClick={() => setShowMenu(false)}>
              {t("navbar.store")}
            </Link>
            <Link to="/completions" className="nav-link-mobile" onClick={() => setShowMenu(false)}>
              {t("navbar.completions")}
            </Link>
            <Link to="/admin" className="nav-link-mobile" onClick={() => setShowMenu(false)}>
              {t("navbar.admin")}
            </Link>
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
          </div>
        </div>
      )}

      {/* Overlay for both mobile menu and new menu card */}
      {(menuOpen || showMenu) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => { setMenuOpen(false); setShowMenu(false); }}
        ></div>
      )}
    </header>
  );
}
