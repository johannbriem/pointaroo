import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import GoalModal from "./components/GoalModal";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./components/LanguageSelector"; // adjust path if needed

export default function Layout() {
  const [user, setUser] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  
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

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Language switcher */}
      <div className="flex justify-end p-2 text-black"> {/* Added text-black for visibility */}
        {user && <LanguageSelector userId={user.id} />}
      </div>

      <Navbar openGoalModal={() => setShowGoalModal(true)} />
      
      {showGoalModal && user && (
        <GoalModal user={user} onClose={() => setShowGoalModal(false)} />
      )}
      
      <main className="flex-grow px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-6">
          <Outlet context={{ user, loading }} />
        </div>
      </main>
    </div>
  );
}
