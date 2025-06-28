import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import TaskList from "../components/TaskList";
import { useOutletContext } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import { startOfDay, endOfDay } from "date-fns";
import { useTranslation } from "react-i18next";
import LandingPage from "./LandingPage";
import { useTheme } from "../components/ThemeContext";
import useThemeMeta from "../components/useThemeMeta";

const GOAL = 100;

export default function Home() {
  const { user, loading } = useOutletContext();
  const [role, setRole] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [completionsToday, setCompletionsToday] = useState([]);
  const [allCompletions, setAllCompletions] = useState([]);
  const [rewardRequests, setRewardRequests] = useState([]);
  const [goal, setGoal] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [rewards, setRewards] = useState([]);
  const { t } = useTranslation();
  // const navigate = useNavigate();
  const { theme, uiMode, setTheme, setUiMode } = useTheme();
  const { emoji, name, mascot } = useThemeMeta(theme);

  useEffect(() => {
    document.title = t("app.title");
  }, [t]);

  useEffect(() => {
    if (user) {
      const detectedRole = user.user_metadata?.role || null;
      setRole(detectedRole);

      const storedUiMode = localStorage.getItem("uiMode");
      const storedTheme = localStorage.getItem("theme");

      if (!storedUiMode) setUiMode(detectedRole === "admin" ? "parent" : "kid");
      if (!storedTheme) setTheme("space");
    } else {
      setRole(null);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("uiMode", uiMode);
  }, [uiMode]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (loading) return;

    if (user) {
      fetchTasks();
      fetchCompletionsToday();
      fetchAllCompletions();
      fetchRewardRequests();
      fetchGoal();
      fetchPurchases();
      fetchRewards();
    } else {
      setTasks([]);
      setCompletionsToday([]);
      setAllCompletions([]);
      setRewardRequests([]);
      setGoal(null);
      setPurchases([]);
      setRewards([]);
    }
  }, [user?.id, loading]);

  const fetchTasks = async () => {
    const { data } = await supabase.from("tasks").select("*");
    if (data) setTasks(data);
  };

  const fetchCompletionsToday = async () => {
    const { data } = await supabase
      .from("task_completions")
      .select("*")
      .eq("user_id", user.id)
      .gte("completed_at", startOfDay(new Date()).toISOString())
      .lte("completed_at", endOfDay(new Date()).toISOString());
    if (data) setCompletionsToday(data);
  };

  const fetchAllCompletions = async () => {
    const { data } = await supabase
      .from("task_completions")
      .select("*")
      .eq("user_id", user.id);
    if (data) setAllCompletions(data);
  };

  const fetchRewardRequests = async () => {
    const { data } = await supabase
      .from("reward_requests")
      .select("*, rewards(name, cost)")
      .eq("user_id", user.id);
    if (data) setRewardRequests(data);
  };

  const fetchGoal = async () => {
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) setGoal(data);
  };

  const fetchPurchases = async () => {
    const { data } = await supabase
      .from("purchases")
      .select("*")
      .eq("user_id", user.id);
    if (data) setPurchases(data);
  };

  const fetchRewards = async () => {
    const { data } = await supabase.from("rewards").select("*");
    if (data) setRewards(data);
  };

  const handleTaskSuccessfullyCompleted = async (task) => {
    await Promise.all([fetchCompletionsToday(), fetchAllCompletions()]);
    alert(`Task "${task.title}" completed! You earned ${task.points} points.`);
  };

  const childGoal = goal ? Math.ceil(goal.total_cost * (1 - goal.parent_percent / 100)) : GOAL;

  const earnedPoints = allCompletions.reduce((sum, comp) => {
    const task = tasks.find((t) => t.id === comp.task_id);
    return sum + (parseInt(task?.points) || 0);
  }, 0);

  const purchasedPoints = purchases.reduce((sum, p) => {
    return sum + (parseInt(p.cost) || 0);
  }, 0);

  const pendingRequestedPoints = rewardRequests.reduce((sum, req) => {
    if (req.status === 'pending') {
      return sum + (parseInt(req.points_deducted) || 0);
    }
    return sum;
  }, 0);

  const spentPoints = purchasedPoints + pendingRequestedPoints;
  const availablePoints = earnedPoints - spentPoints;

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  if (!user) return <LandingPage />;
  if (role === "admin") return <p className="text-center mt-10 text-gray-500">{t("app.redirectingAdmin")}</p>;

  console.log("Home component rendered"); // Diagnostic log

  return (
    <div className={`max-w-6xl mx-auto p-4 sm:p-6 text-center ${uiMode === "kid" ? `theme-${theme}` : "parent-mode"}`}>
      <div className="flex justify-center mb-4">
        <img src="/logo.png" alt={t("app.title")} className="h-12" />
      </div>

      <h1 className="text-2xl font-bold mb-2">
        {emoji} Welcome to {name} World!
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)]">Say hi to {mascot} 👋</p>


      {/* Removed theme selector buttons from here */}

      <div className="max-w-4xl mx-auto px-4">
        {goal ? (
          <div className="rounded-3xl p-6 mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg flex flex-col md:flex-row items-center gap-6">
            {goal.phone_image && (
              <img src={goal.phone_image} alt={goal.phone_model} className="w-28 h-28 object-contain rounded-xl bg-white p-2" />
            )}
            <div className="text-left space-y-2 w-full">
              <h3 className="text-lg md:text-xl font-bold">🎯 {t("home.goal")}: {goal.phone_model}</h3>
              <div className="flex gap-4 text-sm md:text-base">
                <span className="bg-yellow-300 text-black px-3 py-1 rounded-full font-semibold">{t("home.yourGoal")}: ${childGoal}</span>
                <span className="bg-white/30 px-3 py-1 rounded-full font-semibold">{t("home.parentPays")}: {goal.parent_percent}%</span>
              </div>
              <p className="text-white text-sm italic">{t("home.motivation")}</p>
              <ProgressBar total={availablePoints} goal={childGoal} />
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 text-center">
            <h2 className="text-xl font-bold text-blue-800 mb-2">{t("app.yourCurrentPoints")}</h2>
            <p className="text-4xl font-extrabold text-blue-900">{availablePoints} {t("tasks.points")}</p>
            <p className="text-sm text-blue-700 mt-2">{t("app.setGoalAdmin")}</p>
          </div>
        )}

        

        <div className="max-w-4xl mx-auto px-4">
          <TaskList
            tasks={tasks}
            onComplete={handleTaskSuccessfullyCompleted}
            completionsToday={completionsToday}
            userId={user.id}
            theme={theme}
            uiMode={uiMode}
          />
        </div>
      </div>
    </div>
  );
}
