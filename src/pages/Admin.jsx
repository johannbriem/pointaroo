import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import KidPreview from "../components/KidPreview";
import KidsOverview from "../components/KidsOverview";
import BonusPointsForm from "../components/BonusModal";
import { useTranslation } from "react-i18next";
import KidCard from "../components/KidCard";
import EditKidModal from "../components/EditKidModal";

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
  const [rewardRequests, setRewardRequests] = useState([]); // New state for reward requests
  const [rewards, setRewards] = useState([]);
  const [showAddRewardForm, setShowAddRewardForm] = useState(false);
  const [newRewardForm, setNewRewardForm] = useState({
    name: "",
    description: "",
    cost: 0,
    photo_url: "",
    requires_approval: false,
    request_cooldown_days: 0, // New field for cooldown
  });
  const [isEditingReward, setIsEditingReward] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all');
  const { t } = useTranslation();
  const [ selectedKid, setSelectedKid ] = useState(null);
 

  useEffect(() => {
    const loadUserAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
    loadUserAndRole();
  }, []);

  useEffect(() => {
    if (user && role === 'admin') {
      fetchKids();
      fetchTasks();
      fetchRewards();
      fetchRewardRequests();
    }
  }, [user, role]);

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
      .select(`
        *,
        user:profiles!user_id(display_name, email),
        admin:profiles!admin_id(display_name, email),
        rewards(name, cost, photo_url)
      `);
    if (error) {
      console.error("Error fetching reward requests:", error);
      setRewardRequests([]); // Clear requests on error
      alert("Failed to load reward requests. Check console for details."); // Inform admin
    } else {
      setRewardRequests(data);
    }
  };

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
    let error;

    if (isEditingReward) {
      ({ error } = await supabase
        .from("rewards")
        .update(newRewardForm)
        .eq("id", editingRewardId));
    } else {
      ({ error } = await supabase.from("rewards").insert([newRewardForm]));
    }

    if (!error) {
      alert(isEditingReward ? "Reward updated successfully!" : "Reward added successfully!");
      resetRewardForm();
      fetchRewards();
    } else {
      console.error(isEditingReward ? "Error updating reward:" : "Error adding reward:", error);
      alert(isEditingReward ? "Failed to update reward." : "Failed to add reward.");
    }
  };

  const resetRewardForm = () => {
    setNewRewardForm({
      name: "",
      description: "",
      cost: 0,
      photo_url: "",
      requires_approval: false,
      request_cooldown_days: 0,
    });
    setShowAddRewardForm(false);
    setIsEditingReward(false);
    setEditingRewardId(null);
  };

  const startEditReward = (reward) => {
    setIsEditingReward(true);
    setEditingRewardId(reward.id);
    setNewRewardForm({
      name: reward.name,
      description: reward.description,
      cost: reward.cost,
      photo_url: reward.photo_url || "",
      requires_approval: reward.requires_approval,
      request_cooldown_days: reward.request_cooldown_days || 0,
    });
    setShowAddRewardForm(true); // Make sure form is visible
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
    fetchRewardRequests(); // Refresh the list
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
    fetchRewardRequests(); // Refresh the list
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
        <h1 className="text-2xl font-bold mb-4 text-white">{t("admin.title")}</h1>
        <div className="flex gap-4 mb-4">
          <button onClick={() => setActiveTab("tasks")}>🧱 {t("admin.tasksTab")}</button>
          <button onClick={() => setActiveTab("kids")}>👨‍👧 {t("admin.kidsTab")}</button>
          <button onClick={() => setActiveTab("bonus")}>🎁 {t("admin.bonusTab")}</button>
          <button onClick={() => setActiveTab("rewards")}>🎁 {t("admin.rewardsTab")}</button>
          <button onClick={() => setActiveTab("requests")}>✉️ {t("admin.requestsTab")} ({rewardRequests.filter(r => r.status === 'pending').length})</button>
          <button onClick={() => setActiveTab("family")}>👨‍👩‍👧 {t("admin.familyTab")}</button>
        </div>

        {activeTab === "tasks" && (
          <>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4 mb-8">
              <h2 className="text-lg font-semibold text-gray-800">
                {isEditing ? `✏️ ${t("common.edit")} ${t("tasks.title")}` : `➕ ${t("common.add")} ${t("tasks.title")}`}
              </h2>

              <input
                type="text"
                name="title"
                placeholder={t("tasks.taskTitle")}
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
                placeholder={t("tasks.points")}
                className="w-full p-3 border border-gray-300 rounded-md text-black"
              />
              <input
                type="number"
                name="max_per_day"
                value={form.max_per_day}
                onChange={handleChange}
                placeholder={t("tasks.maxPerDay")}
                className="w-full p-3 border border-gray-300 rounded-md text-black"
              />
              <select
                name="frequency"
                value={form.frequency}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md text-black"
              >
                <option value="once">{t("tasks.once")}</option>
                <option value="daily">{t("tasks.daily")}</option>
                <option value="weekly">{t("tasks.weekly")}</option>
              </select>
              <input
                type="text"
                name="photo_url"
                value={form.photo_url}
                onChange={handleChange}
                placeholder={t("tasks.imageURL")}
                className="w-full p-3 border border-gray-300 rounded-md text-black"
              />

              <button
                type="submit"
                className={`w-full py-3 rounded-md font-bold text-white ${
                  isEditing ? "bg-yellow-500 hover:bg-yellow-600" : "bg-black hover:bg-gray-800"
                }`}
              >
                {isEditing ? `💾 ${t("common.saveChanges")}` : `➕ ${t("common.add")} ${t("tasks.title")}`}
              </button>
            </form>

            <h2 className="text-xl font-semibold mb-2">{t("tasks.currentTasks")}</h2>
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
                            {task.points} {t("tasks.points")} • {t("tasks.maxPerDay")}: {task.max_per_day}
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
        {activeTab === "family" && (
          <div>
            <h2 className="text-xl font-bold mb-4">📊 {t("admin.familyOverview")}</h2>
            <div className="grid grid-cols-2 text-black sm:grid-cols-3 md:grid-cols-4 gap-4">
              {kids.map((kid) => (
                <KidCard key={kid.id} kid={kid} onClick={setSelectedKid} />
              ))}
            </div>

            {selectedKid && (
              <EditKidModal
                kid={selectedKid}
                onClose={() => setSelectedKid(null)}
                onSave={updateGoal}
              />
            )}
          </div>
        )}

        {activeTab === "bonus" && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">🎁 {t("admin.giveBonusPoints")}</h2>
            <button
              onClick={() => setShowBonusModal(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded"
            >
              {t("admin.giveBonusPoints")}
            </button>
          </div>
        )}
        {activeTab === "rewards" && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">🎁 {t("admin.manageRewards")}</h2>
            <div className="mb-6">
              <button
                onClick={() => setShowAddRewardForm(!showAddRewardForm)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded mb-4"
              >
                {showAddRewardForm ? t("common.hideForm") : `➕ ${t("admin.addReward")}`}
              </button>
              {showAddRewardForm && (
                <form onSubmit={handleAddRewardSubmit} className="bg-white p-4 rounded shadow space-y-3">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {isEditingReward ? `✏️ ${t("common.edit")} ${t("admin.rewardsTab")}` : `➕ ${t("admin.addReward")}`}
                  </h2>
                  <input
                    type="text"
                    name="name"
                    placeholder={t("admin.rewardName")}
                    value={newRewardForm.name}
                    onChange={handleAddRewardChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-black"
                  />
                  <textarea
                    name="description"
                    placeholder={t("admin.rewardDescription")}
                    value={newRewardForm.description}
                    onChange={handleAddRewardChange}
                    className="w-full p-2 border border-gray-300 rounded-md text-black"
                  />
                  <input
                    type="number"
                    name="cost"
                    placeholder={t("admin.rewardCost")}
                    value={newRewardForm.cost}
                    onChange={handleAddRewardChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-black"
                  />
                  <input
                    type="text"
                    name="photo_url"
                    placeholder={t("admin.rewardImageURL")}
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
                    <span>{t("admin.requiresApproval")}</span>
                  </label>
                  <label className="flex items-center space-x-2 text-black">
                    <input
                      type="number"
                      name="request_cooldown_days"
                      placeholder={t("admin.requestCooldown")}
                      value={newRewardForm.request_cooldown_days}
                      onChange={handleAddRewardChange}
                      className="w-full p-2 border border-gray-300 rounded-md text-black"
                    />
                    <span>{t("admin.requestCooldown")}</span>
                  </label>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-md font-bold text-white bg-black hover:bg-gray-800"
                    >
                      {isEditingReward ? `💾 ${t("common.saveChanges")}` : t("common.createReward")}
                    </button>
                    {isEditingReward && (
                      <button type="button" onClick={resetRewardForm} className="flex-1 py-2 rounded-md font-bold text-white bg-gray-500 hover:bg-gray-600">Cancel</button>
                    )}
                  </div>
                </form>
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("admin.currentRewards")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.map((reward) => (
                <div key={reward.id} className="p-4 rounded border shadow-sm bg-white flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{reward.name}</h2> {/* Changed text-gray-600 to text-gray-900 for readability */}
                    <p className="text-sm text-gray-700">{reward.description}</p> {/* Changed text-gray-600 to text-gray-700 for readability */}
                    <p className="mt-2 font-bold text-gray-900">{reward.cost} {t("tasks.points")}</p> {/* Changed text-gray-600 to text-gray-900 for readability */}
                    {reward.request_cooldown_days > 0 && <p className="text-xs text-purple-600 font-semibold">{t("store.cooldown", { days: reward.request_cooldown_days })}</p>}
                    {reward.requires_approval && <p className="text-xs text-blue-600 font-semibold">{t("admin.requiresApproval")}</p>}
                  </div>
                  <button onClick={() => startEditReward(reward)} className="text-blue-600 font-medium hover:underline text-xl ml-2">✏️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "requests" && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">✉️ {t("admin.pendingRequests")}</h2>
            {rewardRequests.filter(r => r.status === 'pending').length === 0 ? (
              <p className="text-gray-500">{t("common.noRequestsFound")}</p>
            ) : (
              <div className="space-y-4">
                {rewardRequests.filter(r => r.status === 'pending').map((request) => (
                  <div key={request.id} className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center mb-2">
                      {request.rewards?.photo_url && (
                        <img
                          src={request.rewards.photo_url}
                          alt={request.rewards.name}
                          className="w-16 h-16 object-cover rounded mr-4"
                        />
                      )}
                      <div>
                        <p className="font-bold text-lg">{request.rewards?.name || t("common.unknownReward")}</p>
                        <p className="text-sm text-gray-600">
                          {t("common.requestedBy")}: {request.user?.display_name || request.profiles?.email || t("common.unknownUser")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("common.cost")}: {request.points_deducted} {t("tasks.points")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t("common.on")}: {new Date(request.requested_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => handleApproveRequest(request)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded font-semibold"
                      >
                        {t("common.approve")}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded font-semibold"
                      >
                        {t("common.reject")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <h3 className="text-lg font-semibold mt-8 mb-2">{t("admin.allRewardRequests")}</h3>
            <div className="flex space-x-2 mb-4">
              <button onClick={() => setHistoryFilter('all')} className={`px-3 py-1 rounded ${historyFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{t("common.all")}</button>
              <button onClick={() => setHistoryFilter('pending')} className={`px-3 py-1 rounded ${historyFilter === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{t("common.pending")}</button>
              <button onClick={() => setHistoryFilter('approved')} className={`px-3 py-1 rounded ${historyFilter === 'approved' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{t("common.approved")}</button>
              <button onClick={() => setHistoryFilter('rejected')} className={`px-3 py-1 rounded ${historyFilter === 'rejected' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{t("common.rejected")}</button>
            </div>
            <div className="space-y-4">
              {rewardRequests.filter(r => historyFilter === 'all' || r.status === historyFilter).length === 0 ? (
                <p className="text-gray-500">{t("common.noRequestsFound")}</p>
              ) : (
                rewardRequests.filter(r => historyFilter === 'all' || r.status === historyFilter).map((request) => (
                  <div key={request.id} className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center mb-2">
                      {request.rewards?.photo_url && (
                        <img src={request.rewards.photo_url} alt={request.rewards.name} className="w-12 h-12 object-cover rounded mr-4" />
                      )}
                      <div>
                        <p className="font-bold text-lg text-blue-600">{request.rewards?.name || t("common.unknownReward")}</p>
                        <p className="text-sm text-gray-600">{t("common.requestedBy")}: {request.user?.display_name || request.user?.email || t("common.unknownUser")}</p>
                        <p className="text-sm text-gray-600">{t("common.cost")}: {request.points_deducted} {t("tasks.points")}</p>
                        <p className="text-sm text-gray-600">
                          {t("common.status")}: <span className={`font-semibold ${request.status === 'pending' ? 'text-yellow-600' : request.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                        </p>
                <p className="text-xs text-gray-500">{t("common.requestedBy")}: {new Date(request.requested_at).toLocaleDateString()}</p>
                        {request.approved_at && (
                          <p className="text-xs text-gray-500">
                            {t("common.processed")}: {new Date(request.approved_at).toLocaleString()} {t("common.by")} {request.admin?.display_name || request.admin?.email || t("common.unknownAdmin")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <p className="text-sm text-gray-500"> {/* Translated "Total requests" */}
              {t("common.totalRequests")}: {rewardRequests.length} ({t("common.approved")}: {rewardRequests.filter(r => r.status === 'approved').length}, {t("common.rejected")}: {rewardRequests.filter(r => r.status === 'rejected').length})
            </p>
          </div>
        )}

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
