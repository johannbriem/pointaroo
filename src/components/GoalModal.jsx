import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function GoalModal({ user, onClose }) {
  const [goal, setGoal] = useState({ title: "", link: "" });
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      const [{ data: profile }, { data: goals }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).single(),
        supabase.from("goals").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (profile) setDisplayName(profile.display_name || "");
      if (goals) setGoal({ title: goals.title, link: goals.link });
      setLoading(false);
    };
    loadData();
  }, [user]);

  const handleSave = async () => {
    try {
        const { error: profileError } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);

        if (profileError) {
        console.error("Profile update error:", profileError.message);
        }

        const { error: goalError } = await supabase.from("goals").upsert({
        user_id: user.id,
        phone_model: goal.title,
        item_link: goal.link,
        });

        if (goalError) {
        console.error("Goal insert error:", goalError.message);
        }

        onClose();
    } catch (err) {
        console.error("Unexpected error:", err);
    }
    };

  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg text-black space-y-4">
        <h2 className="text-xl font-bold">🎯 My Goal & Name</h2>

        <input
          type="text"
          placeholder="Display name (e.g. Alice)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          placeholder="What are you working toward?"
          value={goal.title}
          onChange={(e) => setGoal({ ...goal, title: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          placeholder="Optional link (e.g. Amazon)"
          value={goal.link}
          onChange={(e) => setGoal({ ...goal, link: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="text-gray-600 hover:underline">Cancel</button>
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
