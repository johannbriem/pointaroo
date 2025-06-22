import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./components/Auth";
import TaskList from "./components/TaskList";
import ProgressBar from "./components/ProgressBar";
import { startOfDay, endOfDay } from "date-fns"; // for date range filtering
import GoalModal from "./components/GoalModal";

const GOAL = 100;

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [completionsToday, setCompletionsToday] = useState([]);
  const [goal, setGoal] = useState(null);
  const childGoal = goal ? goal.total_cost * (1 - goal.parent_percent / 100) : GOAL;
  const [userRole, setUserRole] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);


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

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchCompletions();
      fetchPurchases();
      fetchRewards();
    }
  }, [user]);

  useEffect(() => {
    console.log("Tasks loaded:", tasks);
  }, [tasks]);

  // Calculate points:
  const earnedPoints = completionsToday.reduce((sum, comp) => {
    const task = tasks.find((t) => t.id === comp.task_id);
    return task ? sum + task.points : sum;
  }, 0);

  const spentPoints = purchases.reduce((sum, p) => {
    const reward = rewards.find((r) => r.id === p.reward_id);
    return reward ? sum + reward.cost : sum;
  }, 0);

  const availablePoints = earnedPoints - spentPoints;


  useEffect(() => {
    const loadUserAndProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!error && data?.role) {
          setUserRole(data.role);
        } else {
          setUserRole("child"); // fallback role
        }
      }
    };

    loadUserAndProfile();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchCompletions();
      fetchGoal();
    }
  }, [user]);

  const fetchGoal = async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

  if (!error && data.length > 0) {
    setGoal(data[0]);
  }    


  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      // Assuming tasks are global and not user-specific.
      // If tasks are meant to be user-specific, the admin panel needs to assign user_ids.
    if (!error) setTasks(data);
  };

  const fetchCompletions = async () => {
    const { data, error } = await supabase
      .from("task_completions")
      .select("*")
      .eq("user_id", user.id)
      .gte("completed_at", startOfDay(new Date()).toISOString())
      .lte("completed_at", endOfDay(new Date()).toISOString());

    if (!error) setCompletionsToday(data);
  };

const handleComplete = async (task) => {
  // 1. Check today's completions
  const { data: completions, error: fetchError } = await supabase
  .from("task_completions")
  .select("*", { count: "exact" })
  .eq("user_id", user.id)
  .eq("task_id", task.id)
  .gte("completed_at", startOfDay(new Date()).toISOString())
  .lte("completed_at", endOfDay(new Date()).toISOString());

const countToday = completions?.length || 0;

  if (countToday >= task.max_per_day) {
    alert("Limit reached for today.");
    return;
  }

  // 2. Mark the task as completed (record it)
  const { error: insertError } = await supabase.from("task_completions").insert([
    {
      user_id: user.id,
      task_id: task.id,
    },
  ]);

  if (!insertError) {
    fetchTasks();
    fetchCompletions();
    alert(`Task "${task.title}" completed! You earned ${task.points} points.`);
  } else {
    console.error("Error saving task completion:", insertError.message);
  }
};

  const remainingPoints = childGoal - availablePoints;

  const totalPoints = earnedPoints + remainingPoints;
  if (totalPoints < 0) {
    alert("You have no points available. Complete tasks to earn points!");
    return;
  }
  if (totalPoints >= childGoal) {
    alert("Congratulations! You've reached your goal!");
    // Here you could trigger a reward or notification
  }

  if (!user) return <Auth onLogin={setUser} />;

  return (
    <>
      <Navbar
        onOpenGoalModal={() => {
          console.log("Opening goal modal");
          console.log(user);
          setShowGoalModal(true);
        }}
      />
      {showGoalModal && user && (
        <GoalModal user={user} onClose={() => setShowGoalModal(false)} />
      )}

      <div className="max-w-xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">📱 Earn the Phone!</h1>
        {goal && (
          <div className="mb-6 border p-4 rounded bg-gray-100 text-left">
            <h2 className="text-lg font-bold mb-2">🎯 Goal: {goal.phone_model}</h2>
            {goal.phone_image && (
              <img
                src={goal.phone_image}
                alt={goal.phone_model}
                className="w-full h-40 object-contain mb-2"
              />
            )}
            <p>Total cost: ${goal.total_cost}</p>
            <p>Parent pays: {goal.parent_percent}%</p>
            <p>Your goal: ${Math.ceil(goal.total_cost * (1 - goal.parent_percent / 100))}</p>
          </div>
        )}
        <ProgressBar total={totalPoints} goal={childGoal} />
        <TaskList
          tasks={tasks}
          onComplete={handleComplete}
          completionsToday={completionsToday}
          userId={user.id}
        />
      </div>
    </>
  );
}

export default App;