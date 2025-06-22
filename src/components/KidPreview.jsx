import { useEffect, useState } from "react";
import TaskList from "./TaskList";
import { supabase } from "../supabaseClient";

export default function KidPreview({ userId }) {
  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const { data } = await supabase.from("tasks").select("*");
      setTasks(data || []);
    };

    const fetchCompletions = async () => {
      const { data } = await supabase
        .from("task_completions")
        .select("*")
        .eq("user_id", userId);
      setCompletions(data || []);
    };

    fetchTasks();
    fetchCompletions();
  }, [userId]);

  const handleComplete = async (task) => {
    const { error } = await supabase.from("task_completions").insert([
      {
        user_id: userId,
        task_id: task.id,
      },
    ]);
    if (!error) {
      const { data } = await supabase
        .from("task_completions")
        .select("*")
        .eq("user_id", userId);
      setCompletions(data || []);
    }
  };

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-4">👦 Previewing Kid's Tasks</h2>
      <TaskList
        tasks={tasks}
        onComplete={handleComplete}
        completionsToday={completions}
        userId={userId}
      />
    </div>
  );
}
