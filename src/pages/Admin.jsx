import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import KidPreview from "../components/KidPreview";
import KidsOverview from "../components/KidsOverview";
import BonusPointsForm from "../components/BonusModal";
import { useOutletContext } from "react-router-dom"; // Import useOutletContext

export default function Admin() {
  const { user, loading, role, fetchAllData } = useOutletContext(); // Get user, loading, role from context
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
  const [rewardRequests, setRewardRequests] = useState([]); // New state for reward requests
  const [rewards, setRewards] = useState([]);
  const [showAddRewardForm, setShowAddRewardForm] = useState(false);
  const [newRewardForm, setNewRewardForm] = useState({
    name: "",
    description: "",
    cost: 0,
    photo_url: "",
    requires_approval: false,
  });

  useEffect(() => { // Initial data fetch for Admin specific data
    if (user && !loading) {
      fetchKids();
      fetchRewards();
      fetchRewardRequests();
    }
  }, [user, loading]); // Depend on user and loading from context

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

  const fetchRewards = async () => {
    const { data } = await supabase.from("rewards").select("*").order("cost");
    if (data) setRewards(data);
  };

  const fetchRewardRequests = async () => {
    const { data, error } = await supabase
      .from("reward_requests")
      .select("*, profiles(display_name, email), rewards(name, cost, photo_url)");
    if (!error) setRewardRequests(data);
    else console.error("Error fetching reward requests:", error);
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

  const handleAddRewardChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewRewardForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddRewardSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("rewards").insert([newRewardForm]);

    if (!error) {
      alert("Reward added successfully!");
      setNewRewardForm({
        name: "",
        description: "",
        cost: 0,
        photo_url: "",
        requires_approval: false,
      });
      setShowAddRewardForm(false);
      // Refresh rewards list
      const { data } = await supabase.from("rewards").select("*").order("cost");
      if (data) setRewards(data);
    } else {
      console.error("Error adding reward:", error);
      alert("Failed to add reward.");
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

  // Fetch reward requests for admin view
  useEffect(() => {
    if (role === "admin") fetchRewardRequests();
  }, [role]);

  const handleApproveRequest = async (request) => {
    // 1. Update request status to 'approved'
    const { error: updateError } = await supabase
      .from("reward_requests")
      .update({ status: "approved", approved_at: new Date().toISOString(), admin_id: user.id })
      .eq("id", request.id);

    if (updateError) {
      alert("Failed to approve request.");
      console.error("Error updating request status:", updateError);
      return;
    }

    // 2. Insert into purchases (this is where points are officially 'spent' for approved requests)
    const { error: purchaseError } = await supabase.from("purchases").insert([
      {
        user_id: request.user_id,
        reward_id: request.reward_id,
        cost: request.points_deducted, // Use the points_deducted from the request
      },
    ]);

    if (purchaseError) {
      alert("Failed to record purchase.");
      console.error("Error recording purchase:", purchaseError);
      return;
    }

    alert("Request approved and purchase recorded!");
    fetchAllData(); // Refresh all data from root context
  };

  const handleRejectRequest = async (request) => {
    const { error: updateError } = await supabase
      .from("reward_requests")
      .update({ status: "rejected", approved_at: new Date().toISOString(), admin_id: user.id })
      .eq("id", request.id);

    if (updateError) {
      alert("Failed to reject request.");
      console.error("Error updating request status:", updateError);
      return;
    }
    
    // 2. Refund points to the user by adding a positive bonus_points entry
    const { error: bonusError } = await supabase.from("bonus_points").insert([
      { user_id: request.user_id, points: request.points_deducted, reason: `Refund for rejected reward: ${request.rewards?.name}` }
    ]);
    if (bonusError) console.error("Error refunding points:", bonusError);

    alert("Request rejected!");
    fetchAllData(); // Refresh all data from root context
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

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (role !== "admin") return <p className="text-red-500 text-center mt-10">❌ Admin access only</p>;

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">🔧 Admin – Task Manager</h1>
        <div className="flex gap-4 mb-4">
          <button onClick={() => setActiveTab("tasks")}>🧱 Tasks</button>
          <button onClick={() => setActiveTab("kids")}>👨‍👧 Kids</button>
          <button onClick={() => setActiveTab("bonus")}>🎁 Bonus</button>
          <button onClick={() => setActiveTab("rewards")}>🎁 Rewards</button>
          <button onClick={() => setActiveTab("requests")}>✉️ Requests ({rewardRequests.filter(r => r.status === 'pending').length})</button>
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
        {activeTab === "rewards" && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">🎁 Manage Rewards</h2>
            <div className="mb-6">
              <button
                onClick={() => setShowAddRewardForm(!showAddRewardForm)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded mb-4"
              >
                {showAddRewardForm ? "Hide Form" : "➕ Add New Reward"}
              </button>
              {showAddRewardForm && (
                <form onSubmit={handleAddRewardSubmit} className="bg-white p-4 rounded shadow space-y-3">
                  <h2 className="text-lg font-semibold text-gray-800">Add New Reward</h2>
                  <input
                    type="text"
                    name="name"
                    placeholder="Reward Name"
                    value={newRewardForm.name}
                    onChange={handleAddRewardChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-black"
                  />
                  <textarea
                    name="description"
                    placeholder="Description"
                    value={newRewardForm.description}
                    onChange={handleAddRewardChange}
                    className="w-full p-2 border border-gray-300 rounded-md text-black"
                  />
                  <input
                    type="number"
                    name="cost"
                    placeholder="Cost (points)"
                    value={newRewardForm.cost}
                    onChange={handleAddRewardChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-black"
                  />
                  <input
                    type="text"
                    name="photo_url"
                    placeholder="Image URL (optional)"
                    value={newRewardForm.photo_url}
                    onChange={handleAddRewardChange}
                    className="w-full p-2 border border-gray-300 rounded-md text-black"
                  />
                  <label className="flex items-center space-x-2 text-black">
                    <input
                      type="checkbox"
                      name="requires_approval"
                      checked={newRewardForm.requires_approval}
                      onChange={handleAddRewardChange}
                      className="form-checkbox h-5 w-5 text-purple-600"
                    />
                    <span>Requires Admin Approval</span>
                  </label>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-md font-bold text-white bg-black hover:bg-gray-800"
                  >
                    Create Reward
                  </button>
                </form>
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">Current Rewards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.map((reward) => (
                <div key={reward.id} className="p-4 rounded border shadow-sm bg-white">
                  <h2 className="text-lg font-semibold">{reward.name}</h2>
                  <p className="text-sm">{reward.description}</p>
                  <p className="mt-2 font-bold">{reward.cost} pts</p>
                  {reward.requires_approval && <p className="text-xs text-blue-600 font-semibold">Requires Approval</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "requests" && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">✉️ Reward Requests</h2>
            <div className="space-y-4">
              {rewardRequests.length === 0 && (
                <p className="text-gray-500">No reward requests found.</p>
              )}
              {rewardRequests.map((request) => (
                <div key={request.id} className="bg-white border p-4 rounded shadow flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <p>
                      <span className="font-bold">{request.profiles?.display_name || request.profiles?.email}</span> requested <span className="font-bold">{request.rewards?.name}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Cost: {request.rewards?.cost} pts | Status: <span className={`font-bold ${request.status === "pending" ? "text-yellow-600" : request.status === "approved" ? "text-green-600" : "text-red-600"}`}>{request.status}</span>
                    </p>
                  </div>
                  {request.status === "pending" && (
                    <div className="flex gap-2 mt-2 md:mt-0">
                      <button
                        onClick={() => handleApproveRequest(request)}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
