import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import TaskList from "../components/TaskList";
import { useNavigate, useOutletContext } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import { startOfDay, endOfDay } from "date-fns";

const GOAL = 100;

export default function Home() {
  const { user, loading } = useOutletContext();
  const [role, setRole] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [completionsToday, setCompletionsToday] = useState([]);
  const [goal, setGoal] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [rewards, setRewards] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setRole(user.user_metadata?.role || null);
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
        fetchGoal();
        fetchPurchases();
        fetchRewards();
    } else {
      // Clear data when user logs out
      setTasks([]);
      setCompletionsToday([]);
      setGoal(null);
      setPurchases([]);
      setRewards([]);
    }
  }, [user, loading]);

  // Redirect admin users to the admin panel
  useEffect(() => {
    if (role === "admin") {
      navigate("/admin");
    }
  }, [role, navigate]);

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

  const handleComplete = async (task) => {
    const countToday = completionsToday.filter((c) => c.task_id === task.id).length;

    if (countToday >= task.max_per_day) {
      alert("Limit reached for today.");
      return;
    }

    const { error } = await supabase.from("task_completions").insert([
      {
        user_id: user.id,
        task_id: task.id,
      },
    ]);
    if (!error) {
      fetchCompletionsToday();
      alert(`Task "${task.title}" completed! You earned ${task.points} points.`);
    } else {
      console.error("Error saving task completion:", error.message);
    }
  };

  const childGoal = goal ? goal.total_cost * (1 - goal.parent_percent / 100) : GOAL;

  const earnedPoints = completionsToday.reduce((sum, comp) => {
    const task = tasks.find((t) => t.id === comp.task_id);
    return task ? sum + task.points : sum;
  }, 0);

  const spentPoints = purchases.reduce((sum, p) => {
    const reward = rewards.find((r) => r.id === p.reward_id);
    return reward ? sum + reward.cost : sum;
  }, 0);

  const availablePoints = earnedPoints - spentPoints;

  if (loading) {
    return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto mt-10 text-center">
        <h1 className="text-3xl font-bold mb-4">📱 Earn Your Phone</h1>
        <p className="mb-6 text-gray-600">
          Log in to see your tasks and earn points toward your goal.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/login" className="bg-blue-600 text-white px-4 py-2 rounded">
            Log In
          </a>
          <a href="/signup" className="bg-green-600 text-white px-4 py-2 rounded">
            Sign Up
          </a>
        </div>
      </div>
    );
  }

  // If user is an admin, show a redirect message while the useEffect navigates them.
  if (role === "admin") {
    return <p className="text-center mt-10 text-gray-500">Redirecting to admin panel...</p>;
  }

  // For any other logged-in user (e.g., 'kid' or no role set), show the task view.
  // This is a safer default than a blank page.
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">📱 Earn the Phone!</h1>
      {goal && (
        <div className="mb-6 border p-4 rounded-lg bg-gray-50 text-left md:flex md:items-center md:gap-6">
          {goal.phone_image && (
            <img
              src={goal.phone_image}
              alt={goal.phone_model}
              className="w-full rounded-md md:w-1/3 lg:w-1/4 h-40 object-contain mb-4 md:mb-0"
            />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">🎯 Goal: {goal.phone_model}</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <p><span className="font-semibold">Total cost:</span> ${goal.total_cost}</p>
              <p><span className="font-semibold">Parent pays:</span> {goal.parent_percent}%</p>
              <p className="col-span-2 text-base font-bold text-green-600">
                Your goal: ${Math.ceil(goal.total_cost * (1 - goal.parent_percent / 100))}
              </p>
            </div>
          </div>
        </div>
      )}
      <ProgressBar total={availablePoints} goal={childGoal} />
      <TaskList
        tasks={tasks}
        onComplete={handleComplete}
        completionsToday={completionsToday}
        userId={user.id}
      />
    </div>
  );
}
