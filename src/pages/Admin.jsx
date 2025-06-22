import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import KidPreview from "../components/KidPreview";

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
    const { data } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("role", "kid");

    if (data) setKids(data);
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

  if (!user) return <p className="text-center mt-10">Loading...</p>;
  if (role !== "admin") return <p className="text-red-500 text-center mt-10">❌ Admin access only</p>;

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">🔧 Admin – Task Manager</h1>

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
        <ul className="space-y-2 mb-8">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="bg-gray-100 p-4 rounded flex justify-between items-center"
            >
              <div>
                <p className="font-bold">{task.title}</p>
                <p className="text-sm text-gray-600">
                  {task.points} pts • {task.frequency} • Max/day: {task.max_per_day}
                </p>
              </div>
              <button
                onClick={() => startEdit(task)}
                className="text-blue-600 font-medium hover:underline"
              >
                ✏️ Edit
              </button>
            </li>
          ))}
        </ul>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">🎁 Give Bonus Points</h2>
          <button
            onClick={() => setShowBonusModal(true)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded"
          >
            Give Bonus Points
          </button>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">👀 Preview As Kid</h2>
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 text-black">
            <h2 className="text-xl font-bold">🎁 Give Bonus Points</h2>

            <select
              value={bonus.user_id}
              onChange={(e) => setBonus({ ...bonus, user_id: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Select kid</option>
              {kids.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.email}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Points"
              value={bonus.points}
              onChange={(e) => setBonus({ ...bonus, points: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Reason (e.g. Helped grandma)"
              value={bonus.reason}
              onChange={(e) => setBonus({ ...bonus, reason: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBonusModal(false)}
                className="text-gray-600 hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handleBonusSubmit}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
              >
                Give Points
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
