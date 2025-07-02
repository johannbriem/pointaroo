import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import GoalModal from "./components/GoalModal";
import { useTheme} from "./components/ThemeContext";

export default function Layout() {
  const [user, setUser] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { theme, uiMode } = useTheme();

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
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
    const body = document.body;

    body.setAttribute("data-ui-mode", uiMode);
    body.setAttribute("data-theme", theme);

    body.className = body.className
      .split(" ")
      .filter((cls) => !cls.startsWith("theme-"))
      .join(" ");

    body.classList.add(`theme-${theme}`);
  }, [uiMode, theme]);

  return (
    <div className="min-h-screen flex flex-col"> {/* Keep a wrapper div if needed for layout, but remove theme classes */}
      {user && <Navbar openGoalModal={() => setShowGoalModal(true)} />}

      {showGoalModal && user && (
        <GoalModal user={user} onClose={() => setShowGoalModal(false)} />
      )}

      <main className="flex-grow overflow-y-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-6">
          <Outlet context={{ user, loading, openGoalModal: () => setShowGoalModal(true) }} />
        </div>
      </main>
    </div>
  );
}
