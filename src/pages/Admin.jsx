import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import KidPreview from "../components/KidPreview";
import KidsOverview from "../components/KidsOverview";
import BonusPointsForm from "../components/BonusModal";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    title: "",
    points: 10,
    max_per_day: 1,
    frequency: "once",
    photo_url: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("tasks");
  const [bonus, setBonus] = useState({ user_id: "", points: 0, reason: "" });
  const [kids, setKids] = useState([]);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [viewingKidId, setViewingKidId] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        setRole(profile?.role || null);
      }
    };

    loadUser();
    fetchKids();
  }, []);

  const fetchKids = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .eq("role", "kid");

    if (!profiles) return;

    const userIds = profiles.map((p) => p.id);
    const { data: goalsData } = await supabase
      .from("goals")
      .select("*")
      .in("user_id", userIds);

    const merged = profiles.map((p) => ({
      ...p,
      goal: goalsData.find((g) => g.user_id === p.id) || {},
    }));

    setKids(merged);
  };

  const updateGoal = async (kidId, updatedGoal) => {
    const { error } = await supabase
      .from("goals")
      .upsert({ ...updatedGoal, user_id: kidId });

    if (error) {
      alert("Error updating goal.");
    } else {
      alert("Goal updated!");
      fetchKids(); // refresh to reflect changes
    }
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase.from("tasks").select("*");
    if (!error) setTasks(data);
  };

  useEffect(() => {
    if (role === "admin") fetchTasks();
  }, [role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditing) {
      const { error } = await supabase
        .from("tasks")
        .update(form)
        .eq("id", editingId);

      if (!error) {
        setIsEditing(false);
        setEditingId(null);
        resetForm();
        fetchTasks();
      }
    } else {
      const { error } = await supabase.from("tasks").insert([form]);
      if (!error) {
        resetForm();
        fetchTasks();
      }
    }
  };

  const resetForm = () => {
    setForm({ title: "", points: 10, max_per_day: 1, frequency: "once", photo_url: "" });
  };

  const startEdit = (task) => {
    setForm({
      title: task.title,
      points: task.points,
      max_per_day: task.max_per_day,
      frequency: task.frequency,
      photo_url: task.photo_url || "",
    });
    setIsEditing(true);
    setEditingId(task.id);
  };

  const handleBonusSubmit = async () => {
    if (!bonus.user_id || !bonus.points || !bonus.reason) return alert("Please fill all bonus fields.");

    const { error } = await supabase.from("bonus_points").insert([
      {
        user_id: bonus.user_id,
        points: bonus.points,
        reason: bonus.reason,
        given_by: user.id,
      },
    ]);

    if (!error) {
      alert("🎉 Bonus points awarded!");
      setBonus({ user_id: "", points: 0, reason: "" });
      setShowBonusModal(false);
    } else {
      alert("Failed to submit bonus.");
    }
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    const key = task.frequency || 'other';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(task);
    return acc;
  }, {});

  const frequencyOrder = ['daily', 'weekly', 'once', 'other'];
  const sortedFrequencies = Object.keys(groupedTasks).sort((a, b) => {
    const indexA = frequencyOrder.indexOf(a);
    const indexB = frequencyOrder.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  if (!user) return <p className="text-center mt-10">Loading...</p>;
  if (role !== "admin") return <p className="text-red-500 text-center mt-10">❌ Admin access only</p>;

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">🔧 Admin – Task Manager</h1>
        <div className="flex gap-4 mb-4">
          <button onClick={() => setActiveTab("tasks")}>🧱 Tasks</button>
          <button onClick={() => setActiveTab("kids")}>👨‍👧 Kids</button>
          <button onClick={() => setActiveTab("bonus")}>🎁 Bonus</button>
        </div>

        {activeTab === "tasks" && (
          <>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4 mb-8">
              <h2 className="text-lg font-semibold text-gray-800">
                {isEditing ? "✏️ Edit Task" : "➕ Add New Task"}
              </h2>

              <input
                type="text"
                name="title"
                placeholder="Task title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-md text-black"
              />
              <input
                type="number"
                name="points"
                value={form.points}
                onChange={handleChange}
                placeholder="Points"
                className="w-full p-3 border border-gray-300 rounded-md text-black"
              />
              <input
                type="number"
                name="max_per_day"
                value={form.max_per_day}
                onChange={handleChange}
                placeholder="Max per day"
                className="w-full p-3 border border-gray-300 rounded-md text-black"
              />
              <select
                name="frequency"
                value={form.frequency}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md text-black"
              >
                <option value="once">Once</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <input
                type="text"
                name="photo_url"
                value={form.photo_url}
                onChange={handleChange}
                placeholder="Image URL (optional)"
                className="w-full p-3 border border-gray-300 rounded-md text-black"
              />

              <button
                type="submit"
                className={`w-full py-3 rounded-md font-bold text-white ${
                  isEditing ? "bg-yellow-500 hover:bg-yellow-600" : "bg-black hover:bg-gray-800"
                }`}
              >
                {isEditing ? "💾 Save Changes" : "➕ Add Task"}
              </button>
            </form>

            <h2 className="text-xl font-semibold mb-2">Current Tasks</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {sortedFrequencies.map((frequency) => (
                <div key={frequency}>
                  <h3 className="text-lg font-semibold capitalize mb-3 border-b pb-2">{frequency}</h3>
                  <ul className="space-y-2">
                    {groupedTasks[frequency].map((task) => (
                      <li
                        key={task.id}
                        className="bg-gray-100 p-4 rounded-lg shadow-sm flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold">{task.title}</p>
                          <p className="text-sm text-gray-600">
                            {task.points} pts • Max/day: {task.max_per_day}
                          </p>
                        </div>
                        <button
                          onClick={() => startEdit(task)}
                          className="text-blue-600 font-medium hover:underline text-xl"
                        >
                          ✏️
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
        {activeTab === "kids" && <KidsOverview kids={kids} />}
        {activeTab === "bonus" && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">🎁 Give Bonus Points</h2>
            <button
              onClick={() => setShowBonusModal(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded"
            >
              Give Bonus Points
            </button>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">👀 Preview As Kid</h2>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">🎯 Edit Kid Goals</h2>
            {kids.map((kid) => (
              <div key={kid.id} className="bg-white border p-4 rounded shadow mb-4">
                <h3 className="font-bold mb-2">{kid.display_name || kid.email}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Phone Model"
                    className="border p-2 rounded"
                    value={kid.goal?.phone_model || ""}
                    onChange={(e) =>
                      setKids((prev) =>
                        prev.map((k) =>
                          k.id === kid.id
                            ? { ...k, goal: { ...k.goal, phone_model: e.target.value } }
                            : k
                        )
                      )
                    }
                  />
                  <input
                    type="number"
                    placeholder="Total Cost"
                    className="border p-2 rounded"
                    value={kid.goal?.total_cost || ""}
                    onChange={(e) =>
                      setKids((prev) =>
                        prev.map((k) =>
                          k.id === kid.id
                            ? { ...k, goal: { ...k.goal, total_cost: e.target.value } }
                            : k
                        )
                      )
                    }
                  />
                  <input
                    type="number"
                    placeholder="Parent %"
                    className="border p-2 rounded"
                    value={kid.goal?.parent_percent || ""}
                    onChange={(e) =>
                      setKids((prev) =>
                        prev.map((k) =>
                          k.id === kid.id
                            ? { ...k, goal: { ...k.goal, parent_percent: e.target.value } }
                            : k
                        )
                      )
                    }
                  />
                  <input
                    type="text"
                    placeholder="Image URL"
                    className="border p-2 rounded"
                    value={kid.goal?.phone_image || ""}
                    onChange={(e) =>
                      setKids((prev) =>
                        prev.map((k) =>
                          k.id === kid.id
                            ? { ...k, goal: { ...k.goal, phone_image: e.target.value } }
                            : k
                        )
                      )
                    }
                  />
                </div>
                <button
                  onClick={() => updateGoal(kid.id, kid.goal)}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  💾 Save Goal
                </button>
              </div>
            ))}
          </div>
          <select
            value={viewingKidId}
            onChange={(e) => setViewingKidId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md text-black"
          >
            <option value="">Select kid to preview</option>
            {kids.map((kid) => (
              <option key={kid.id} value={kid.id}>
                {kid.email}
              </option>
            ))}
          </select>
        </div>

        {viewingKidId && <KidPreview userId={viewingKidId} />}
      </div>

        {showBonusModal && (
          <BonusModal
            bonus={bonus}
            kids={kids}
            setBonus={setBonus}
            onClose={() => setShowBonusModal(false)}
            onSubmit={handleBonusSubmit}
          />
        )}
    </>
  );
}
