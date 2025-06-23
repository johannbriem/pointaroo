import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function Navbar({ openGoalModal }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault(); // Stop auto-prompt
        setDeferredPrompt(e); // Save it for later
        setShowInstallBtn(true); // Show install button
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
  return (
    <header className="bg-gray-800 shadow-md sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-white">
          📱 {t("app.title")}
        </Link>
        <div className="space-x-4">
          <Link to="/store" className="text-sm text-white hover:text-yellow-400"> {/* Translated "Store" */}
            {t("navbar.store")}
          </Link>
          <Link to="/completions" className="text-sm text-white hover:text-yellow-400"> {/* Translated "Completions" */}
            {t("navbar.completions")}
          </Link>
          <Link to="/admin" className="text-sm text-white hover:text-yellow-400"> {/* Translated "Admin" */}
            {t("navbar.admin")}
          </Link>
          <button
            onClick={openGoalModal}
            className="text-sm text-white hover:underline"
        >
            🎯 {t("navbar.myGoal")} {/* Translated "My Goal" */}
          </button>

          {showInstallBtn && (
            <button
              onClick={handleInstallClick}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              📲 {t("navbar.installApp")} {/* Translated "Install App" */}
            </button>
          )}
          
          <button
            onClick={() => {
              localStorage.clear();
              location.href = "/login";
            }}
            className="text-sm text-red-400 hover:text-red-600"
          >
            {t("navbar.logout")} {/* Translated "Logout" */}
          </button>
        </div>
      </nav>
    </header>
  );
}
