import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import TaskList from "../components/TaskList";
import { useNavigate, useOutletContext } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import { startOfDay, endOfDay } from "date-fns";
import { useTranslation } from "react-i18next";
import LandingPage from "./LandingPage";
import { useTheme } from "../components/ThemeContext";

const GOAL = 100;

export default function Home() {
  const { user, loading } = useOutletContext();
  const [role, setRole] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [completionsToday, setCompletionsToday] = useState([]);
  const [allCompletions, setAllCompletions] = useState([]);
  const [rewardRequests, setRewardRequests] = useState([]); // New state for reward requests
  const [goal, setGoal] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [rewards, setRewards] = useState([]);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, uiMode, setTheme, setUiMode } = useTheme();

  useEffect(() => {
    // Set the document title for the main app view
    document.title = t("app.title");
  }, [t]);

  useEffect(() => {
    localStorage.setItem("uiMode", uiMode);
  }, [uiMode]);


  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      const detectedRole = user.user_metadata?.role || null;
      setRole(detectedRole);

      // Auto set uiMode from role unless already set
      if (!localStorage.getItem("uiMode")) {
        setUiMode(detectedRole === "admin" ? "parent" : "kid");
      }
    } else {
      setRole(null);
    }
  }, [user]);

  // 🔄 Fetch tasks for kids
  useEffect(() => {
    if (loading) return;

    if (user) {
        fetchTasks();
        fetchCompletionsToday();
        fetchAllCompletions();
        fetchRewardRequests(); // Fetch reward requests
        fetchGoal();
        fetchPurchases();
        fetchRewards();
    } else {
      // Clear data when user logs out
      setTasks([]);
      setCompletionsToday([]);
      setAllCompletions([]);
      setRewardRequests([]); // Clear reward requests
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
      .select("*, rewards(name, cost)") // Fetch reward details for display
      .eq("user_id", user.id); // Only fetch current user's requests
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
    // Use the cost from the purchase record, which is more accurate.
    return sum + (parseInt(p.cost) || 0);
  }, 0);

  const pendingRequestedPoints = rewardRequests.reduce((sum, req) => {
    // Only pending requests deduct points immediately
    if (req.status === 'pending') {
      return sum + (parseInt(req.points_deducted) || 0);
    }
    return sum;
  }, 0);

  const spentPoints = purchasedPoints + pendingRequestedPoints;

  const availablePoints = earnedPoints - spentPoints;

  if (loading) {
    return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  }

  if (!user) {
    return <LandingPage />;
  }

  // If user is an admin, show a redirect message while the useEffect navigates them.
  if (role === "admin") {
    return <p className="text-center mt-10 text-gray-500">{t("app.redirectingAdmin")}</p>;
  }

  // If the user has no tasks, show a message
  return (
  <div
    className={`max-w-6xl mx-auto p-4 sm:p-6 text-center ${
      uiMode === "kid" ? `theme-${theme}` : "parent-mode"
    }`}
  >
    <div className="flex justify-center mb-4">
      <img src="/logo.png" alt={t("app.title")} className="h-12" />
    </div>

    {/* 👶 Theme selector only for Kid Mode */}
    {uiMode === "kid" && (
      <div className="flex justify-center gap-2 mb-4">
        {["space", "jungle", "robot", "ocean"].map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`px-3 py-1 rounded-full text-sm font-bold border 
              ${theme === t ? "bg-blue-500 text-white" : "bg-white text-gray-700"} 
              hover:bg-blue-100 transition`}
          >
            {t === "space" && "🪐 Space"}
            {t === "jungle" && "🐸 Jungle"}
            {t === "robot" && "🤖 Robot"}
            {t === "ocean" && "🐠 Ocean"}
          </button>
        ))}
      </div>
    )}

    {goal ? (
      <>
        <div
          className={`mb-6 p-4 rounded-lg ${
            uiMode === "kid" ? "bg-white/70" : "bg-gray-100"
          } text-left md:flex md:items-center md:gap-6 shadow-md`}
        >
          {goal.phone_image && (
            <img
              src={goal.phone_image}
              alt={goal.phone_model}
              className="w-full rounded-md md:w-1/3 lg:w-1/4 h-40 object-contain mb-4 md:mb-0"
            />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">
              🎯 {t("home.goal")}: {goal.phone_model}
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <p>
                <span className="font-semibold">{t("home.totalCost")}:</span> $
                {goal.total_cost}
              </p>
              <p>
                <span className="font-semibold">{t("home.parentPays")}:</span>{" "}
                {goal.parent_percent}%
              </p>
              <p className="col-span-2 text-base font-bold text-green-600">
                {t("home.yourGoal")}: $
                {Math.ceil(
                  goal.total_cost * (1 - goal.parent_percent / 100)
                )}
              </p>
            </div>
          </div>
        </div>
        <ProgressBar total={availablePoints} goal={childGoal} uiMode={uiMode} />
      </>
    ) : (
      <div
        className={`mb-6 p-4 rounded-lg ${
          uiMode === "kid" ? "bg-blue-200" : "bg-blue-50"
        } text-center`}
      >
        <h2
          className={`text-xl font-bold ${
            uiMode === "kid" ? "text-blue-900" : "text-blue-800"
          } mb-2`}
        >
          {t("app.yourCurrentPoints")}
        </h2>
        <p
          className={`text-4xl font-extrabold ${
            uiMode === "kid" ? "text-blue-950" : "text-blue-900"
          }`}
        >
          {availablePoints} {t("tasks.points")}
        </p>
        <p className="text-sm text-blue-700 mt-2">
          {t("app.setGoalAdmin")}
        </p>
      </div>
    )}

    <TaskList
      tasks={tasks}
      onComplete={handleTaskSuccessfullyCompleted}
      completionsToday={completionsToday}
      userId={user.id}
      theme={theme}
      uiMode={uiMode}
    />
  </div>
);
}