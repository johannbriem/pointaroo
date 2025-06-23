import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function KidOverview({ kids }) {
  const [selectedKidId, setSelectedKidId] = useState("");
  const [goal, setGoal] = useState({ title: "", link: "", total_cost: "", parent_percent: "" });
  const [goalData, setGoalData] = useState(null);

  useEffect(() => {
    const loadGoal = async () => {
      if (!selectedKidId) return;

      const { data, error } = await supabase
        .from("goals")
        .select("phone_model, phone_image, total_cost, parent_percent, item_link")
        .eq("user_id", selectedKidId)
        .maybeSingle();

      if (data) {
        setGoalData(data);
        setGoal({
          title: data.phone_model || "",
          link: data.item_link || "",
          total_cost: data.total_cost || "",
          parent_percent: data.parent_percent || "",
        });
      } else {
        setGoalData(null);
        setGoal({ title: "", link: "", total_cost: "", parent_percent: "" });
      }
    };

    loadGoal();
  }, [selectedKidId]);

  const handleSave = async () => {
    if (!selectedKidId) return alert("Select a kid first.");

    const { error } = await supabase.from("goals").upsert({
      user_id: selectedKidId,
      phone_model: goal.phone_model,
      item_link: goal.item_link || null,
      phone_image: goal.phone_image || null,
      total_cost: goal.total_cost ? parseInt(goal.total_cost) : null,
      parent_percent: goal.parent_percent ? parseInt(goal.parent_percent) : null,
    });

    if (!error) {
      alert("🎯 Goal updated!");
    } else {
      console.error("Error saving goal:", error);
      alert("⚠️ Error saving goal.");
    }
  };


  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-2">🎯 Edit Kid Goals</h2>
      <select
        value={selectedKidId}
        onChange={(e) => setSelectedKidId(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md text-white mb-3"
      >
        <option value="">Select kid</option>
        {kids.map((kid) => (
          <option key={kid.id} value={kid.id}>
            {kid.email}
          </option>
        ))}
      </select>

      {goalData ? (
        <div className="border rounded p-4 shadow bg-white text-white mt-4">
          <h3 className="text-lg font-bold">🎯 Goal: {goalData.phone_model}</h3>
          {goalData.phone_image && (
            <img src={goalData.phone_image} alt="Goal" className="h-40 mt-2 rounded" />
          )}
          {goalData.item_link && (
            <p className="mt-2">
              🔗 Link: <a href={goalData.item_link} className="text-blue-600 underline" target="_blank">View Item</a>
            </p>
          )}
          <p className="mt-2">💰 Total Cost: ${goalData.total_cost}</p>
          <p className="mt-1">👨‍👩‍👧 Parents Pay: {goalData.parent_percent}%</p>
        </div>
      ) : (
        <p className="text-gray-500">No goal set yet.</p>
      )}

      <input
        className="w-full p-2 border border-gray-300 rounded mb-2"
        placeholder="Goal Title"
        value={goal.title}
        onChange={(e) => setGoal({ ...goal, title: e.target.value })}
      />
      <input
        className="w-full p-2 border border-gray-300 rounded mb-2"
        placeholder="Link (optional)"
        value={goal.link}
        onChange={(e) => setGoal({ ...goal, link: e.target.value })}
      />
      <input
        className="w-full p-2 border border-gray-300 rounded mb-2"
        placeholder="Total Cost"
        type="number"
        value={goal.total_cost}
        onChange={(e) =>
          setGoal((g) => ({ ...g, total_cost: parseInt(e.target.value) || 0 }))
        }
      />
      <input
        className="w-full p-2 border border-gray-300 rounded mb-2"
        type="number"
        placeholder="Parent pays (%)"
        value={goal.parent_percent}
        onChange={(e) => setGoal({ ...goal, parent_percent: e.target.value })}
      />

      <button
        onClick={handleSave}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold"
      >
        💾 Save Goal
      </button>
    </div>
  );
}
