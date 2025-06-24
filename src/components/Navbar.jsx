import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/solid";
import LanguageSelector from "./LanguageSelector"; 
import { supabase } from "../supabaseClient"; // Adjust the import path as needed

export default function Navbar({ openGoalModal }) {
  const [user, setUser] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  const desktopNavLinks = (
    <>
      <Link to="/store" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
        {t("navbar.store")}
      </Link>
      <Link to="/completions" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
        {t("navbar.completions")}
      </Link>
      <Link to="/admin" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
        {t("navbar.admin")}
      </Link>
      <button
        onClick={openGoalModal}
        className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
      >
        🎯 {t("navbar.myGoal")}
      </button>

      {showInstallBtn && (
        <button
          onClick={handleInstallClick}
          className="text-sm font-medium bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors shadow-sm"
        >
          📲 {t("navbar.installApp")}
        </button>
      )}

      <button onClick={handleLogout} className="text-sm font-medium text-gray-300 px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 hover:text-white transition-colors">
        {t("navbar.logout")}
      </button>

      <div className="relative">
        {user && <LanguageSelector userId={user.id} />}
      </div>
    </>
  );

  const mobileNavLinks = (
    <div className="flex flex-col space-y-2">
      <Link to="/store" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
        {t("navbar.store")}
      </Link>
      <Link to="/completions" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
        {t("navbar.completions")}
      </Link>
      <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
        {t("navbar.admin")}
      </Link>
      <button
        onClick={() => {
          openGoalModal();
          setMenuOpen(false);
        }}
        className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-black hover:bg-gray-700"
      >
        🎯 {t("navbar.myGoal")}
      </button>

      <div className="border-t border-gray-700 pt-4 mt-4 space-y-4">
        {showInstallBtn && (
          <button
            onClick={() => {
              handleInstallClick();
              setMenuOpen(false);
            }}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-500 hover:bg-indigo-600 transition-colors"
          >
            📲 {t("navbar.installApp")}
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-600 rounded-lg shadow-sm text-base font-bold text-red-600 hover:bg-gray-700 hover:text-white transition-colors"
        >
          {t("navbar.logout")}
        </button>
        
        <div className="pt-2 flex justify-center text-white">
          {user && <LanguageSelector userId={user.id} />}
        </div>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <>
      <header className="bg-gray-800 shadow-md sticky top-0 z-30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/"><img src="/logo.png" alt={t("app.title")} className="h-8" /></Link>

          {/* Desktop nav */}
          <div className="hidden md:flex space-x-6 items-center">{desktopNavLinks}</div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <button onClick={() => setMenuOpen(true)} className="text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden ${
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      ></div>

      <div
        className={`fixed top-0 right-0 h-full w-4/5 max-w-sm bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out z-50 md:hidden border-l border-gray-700 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-end p-2">
          <button
            onClick={() => setMenuOpen(false)}
            className="text-gray-400 p-2 rounded-full hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
          >
            <span className="sr-only">Close menu</span>
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="px-4 pb-4">
          {mobileNavLinks}
        </div>
      </div>
    </>
  );
}
