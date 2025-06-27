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
  const [rewardRequests, setRewardRequests] = useState([]);
  const [goal, setGoal] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [rewards, setRewards] = useState([]);

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, uiMode, setTheme, setUiMode } = useTheme();

  useEffect(() => {
    document.title = t("app.title");
  }, [t]);

  useEffect(() => {
    localStorage.setItem("uiMode", uiMode);
    localStorage.setItem("theme", theme);
  }, [uiMode, theme]);

  useEffect(() => {
    if (user) {
      const role = user.user_metadata?.role || null;
      setRole(role);
      if (!localStorage.getItem("uiMode")) {
        setUiMode(role === "admin" ? "parent" : "kid");
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user || loading) return;
    fetchTasks();
    fetchCompletionsToday();
    fetchAllCompletions();
    fetchRewardRequests();
    fetchGoal();
    fetchPurchases();
    fetchRewards();
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

  const purchasedPoints = purchases.reduce((sum, p) => sum + (parseInt(p.cost) || 0), 0);

  const pendingRequestedPoints = rewardRequests.reduce((sum, req) => {
    return req.status === "pending" ? sum + (parseInt(req.points_deducted) || 0) : sum;
  }, 0);

  const availablePoints = earnedPoints - purchasedPoints - pendingRequestedPoints;

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  if (!user) return <LandingPage />;
  if (role === "admin") return <p className="text-center mt-10">{t("app.redirectingAdmin")}</p>;

  return (
    <div
      className={`max-w-6xl mx-auto p-4 sm:p-6 ${
        uiMode === "kid" ? `theme-${theme}` : "parent-mode"
      }`}
    >
      <div className="flex justify-center mb-4">
        <img src="/logo.png" alt={t("app.title")} className="h-12" />
      </div>

      {/* Kid Mode: Theme Picker */}
      {uiMode === "kid" && (
        <div className="flex justify-center gap-2 mb-6">
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

      {/* Goal and Progress */}
      <div className="max-w-4xl mx-auto">
              <div className="mb-6 p-4 bg-white/80 rounded-3xl shadow-xl text-left md:flex md:items-center md:gap-6 border-4 border-blue-200">
                {goal.phone_image && (
                  <img
                    src={goal.phone_image}
                    alt={goal.phone_model}
                    className="w-full rounded-xl md:w-1/3 lg:w-1/4 h-40 object-contain mb-4 md:mb-0"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-extrabold mb-2 text-blue-800">
                    🎯 {t("home.goal")}: {goal.phone_model}
                  </h2>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-blue-700">
                    <p><span className="font-semibold">{t("home.totalCost")}:</span> ${goal.total_cost}</p>
                    <p><span className="font-semibold">{t("home.parentPays")}:</span> {goal.parent_percent}%</p>
                    <p className="col-span-2 text-base font-bold text-green-700">
                      {t("home.yourGoal")}: ${Math.ceil(goal.total_cost * (1 - goal.parent_percent / 100))}
                    </p>
                  </div>
                </div>
              </div>

            <div className="w-full bg-gray-300 h-5 rounded-full overflow-hidden mb-6">
              <div
                className="bg-gradient-to-r from-yellow-400 to-green-400 h-full text-xs text-white text-center font-bold"
                style={{ width: `${Math.min((availablePoints / childGoal) * 100, 100)}%` }}
              >
                {/* Progress Bar + Points Display */}
                <div className="mb-6">
                  <div className="w-full bg-gray-300 h-6 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-gradient-to-r from-yellow-400 to-green-400 h-full text-xs text-white text-center font-bold transition-all duration-300"
                      style={{ width: `${Math.min((availablePoints / childGoal) * 100, 100)}%` }}>
                      <span className="sr-only">{availablePoints} / {childGoal}</span>
                    </div>
                  </div>
                  <p className="text-lg font-extrabold mt-2 text-white drop-shadow text-center">
                    {availablePoints} / {childGoal} points
                  </p>
                </div>
              </div>
            </div>
          

      </div>

      {/* Task List */}
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
  