import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { XMarkIcon, Bars3Icon, Bars3BottomRightIcon } from "@heroicons/react/24/solid";
import LanguageSelector from "./LanguageSelector";
import { supabase } from "../supabaseClient";
import { useTheme } from "./ThemeContext";
//import useThemeMeta from "./useThemeMeta";

export default function Navbar({ openGoalModal }) {
  const [user, setUser] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(false);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState("User");
  const { t } = useTranslation();
  const { uiMode, theme, setTheme} = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
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

        if (profile?.role === 'admin') {
          const [goalNotifs, rewardRequests] = await Promise.all([
            supabase
              .from("goal_notifications")
              .select("*, profiles(display_name)")
              .order("created_at", { ascending: false }),
            supabase
              .from("reward_requests")
              .select("id, requested_at, status, rewards(name)")
              .eq("status", "pending")
              .order("requested_at", { ascending: false }),
          ]);

          const combinedNotifications = [];

          if (goalNotifs.data) {
            goalNotifs.data.forEach((n) => {
              combinedNotifications.push({
                id: `goal-${n.id}`,
                type: "goal_completed",
                message: `${
                  n.profiles?.display_name || "Someone"
                } completed their goal.`,
                goal_id: n.goal_id,
                profile_id: n.profile_id,
                goal_name: n.goal_name,
                goal_description: n.goal_description,
                created_at: n.created_at,
              });
            });
          }

          if (rewardRequests.data) {
            rewardRequests.data.forEach((r) => {
              combinedNotifications.push({
                id: `reward-${r.id}`,
                type: "reward_request",
                message: `Reward requested: ${r.rewards?.name || "unknown"}`,
                created_at: r.requested_at,
              });
            });
          }

          setNotifications(combinedNotifications);
        }

        if (error) {
          console.error("Error fetching profile:", error);
          setIsAdmin(false);
        } else {
          setIsAdmin(profile?.role === 'admin');
          setUserDisplayName(profile?.display_name || profile?.display_name || "User");
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
            setUserDisplayName(profile?.display_name || profile?.display_name || "User");
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
          {isAdmin && (
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded hover:bg-[var(--color-navbar-hover-bg)]"
            >
              <span className="text-2xl">🔔</span>
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          )}
          {showNotifications && isAdmin && (
            <div ref={notificationRef} className="absolute right-4 mt-2 w-80 ...">
              <div className="absolute right-4 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-sm">
                <h3 className="font-bold mb-2 text-gray-800">🔔 {t("navbar.notifications")}</h3>
                {notifications.length === 0 ? (
                  <p className="text-gray-500">{t("navbar.noNotifications")}</p>
                ) : (
                  <ul className="space-y-3">
                    {notifications.map((n) => (
                      <li key={n.id} className="border-b pb-2">
                        <p className="text-gray-800">{n.message}</p>
                        <div className="flex justify-end gap-2 mt-1">
                          {n.type === "reward_request" ? (
                            <Link
                              to="/admin?tab=requests"
                              className="text-sm text-blue-600 font-semibold hover:underline"
                              onClick={() => setShowNotifications(false)}
                            >
                              {t("navbar.review")}
                            </Link>
                          ) : n.type === "goal_completed" ? (
                            <Link
                              to="/admin?tab=goals"
                              className="text-sm text-green-600 font-semibold hover:underline"
                              onClick={() => setShowNotifications(false)}
                            >
                              {t("navbar.viewGoal")}
                            </Link>
                          ) : null}
                          <button
                            onClick={async () => {
                              await supabase.from("notifications").update({ read: true }).eq("id", n.id);
                              setNotifications(notifications.filter(notif => notif.id !== n.id));
                            }}
                            className="text-xs text-gray-500 hover:text-gray-800"
                          >
                            {t("navbar.dismiss")}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-[var(--color-navbar-text)] p-2 rounded-md hover:bg-[var(--color-navbar-hover-bg)] transition-colors flex items-center gap-2"
          >
            {uiMode === "kid" ? (
              <span
                className="px-3 py-1 rounded-full border font-semibold text-sm shadow-sm"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-bg-card)",
                  color: "var(--color-text-strong)",
                }}
              >
                {userDisplayName}
              </span>

            ) : (
              <Bars3BottomRightIcon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Toggle - Unified with new menu card */}
        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={() => {
              setMenuOpen(false);
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
        <div className="fixed top-16 right-4 w-64 bg-[var(--color-navbar-bg)] text-[var(--color-navbar-text)] shadow-lg rounded-lg p-4 z-50 transition-all duration-300 ease-in-out transform scale-100 opacity-100 md:block">
          <div className="flex flex-col gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="nav-link-mobile bg-[var(--color-primary)] text-[var(--button-text)] text-center py-2 rounded-md"
                onClick={() => setShowMenu(false)}
              >
                {t("navbar.admin")}
              </Link>
            )}

            <button onClick={() => { openGoalModal(); setShowMenu(false); }} className="nav-link-mobile">
              🎯 {t("navbar.myGoal")}
            </button>

            {showInstallBtn && (
              <button onClick={() => { handleInstallClick(); setShowMenu(false); }} className="btn-install-mobile">
                📲 {t("navbar.installApp")}
              </button>
            )}

            <button onClick={() => { handleLogout(); setShowMenu(false); }} className="btn-logout-mobile">
              {t("navbar.logout")}
            </button>

            <div className="mt-4">
              <LanguageSelector userId={user.id} />

              {/* Theme selector for kids only */}
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
                    <option value="pirate">{t("navbar.pirateTheme")}</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Overlay for both mobile menu and new menu card */}
            {(menuOpen || showMenu) && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-sm bg-opacity-10" // Changed classes
          onClick={() => { setMenuOpen(false); setShowMenu(false); }}
        ></div>
      )}
    </header>
  );
}
