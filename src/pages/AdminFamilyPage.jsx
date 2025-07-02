import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AdminFamilyPage() {
  const { user, loading } = useOutletContext();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("members");

  const [familyMembers, setFamilyMembers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (user && !loading) fetchFamilyData();
  }, [user, loading]);

  const fetchFamilyData = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id")
      .eq("id", user.id)
      .single();

    if (!profile?.family_id) return;

    const [members, goalData, completionData, requestData] = await Promise.all([
      supabase.from("profiles").select("id, display_name, role, email").eq("family_id", profile.family_id),
      supabase.from("goals").select("*").eq("family_id", profile.family_id),
      supabase.from("task_completions").select("*, profiles(display_name)").eq("family_id", profile.family_id),
      supabase.from("reward_requests").select("*, profiles(display_name), rewards(name)").eq("family_id", profile.family_id),
    ]);

    setFamilyMembers(members.data || []);
    setGoals(goalData.data || []);
    setCompletions(completionData.data || []);
    setRequests(requestData.data || []);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t("admin.familyManagement")}</h1>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab("members")} className="tab-btn">👨‍👩‍👧 {t("admin.members")}</button>
        <button onClick={() => setActiveTab("goals")} className="tab-btn">🎯 {t("admin.goals")}</button>
        <button onClick={() => setActiveTab("tasks")} className="tab-btn">📋 {t("admin.tasks")}</button>
        <button onClick={() => setActiveTab("requests")} className="tab-btn">📬 {t("admin.requests")}</button>
      </div>

      <div className="bg-white p-4 rounded shadow-sm">
        {activeTab === "members" && (
          <div>
            <h2 className="font-bold mb-2 text-blue-200">{t("admin.familyMembers")}</h2>
            {familyMembers.map((m) => (
              <div key={m.id} className="p-2 border-b text-black">
                {m.display_name} ({m.role}) - {m.email}
              </div>
            ))}
          </div>
        )}

        {activeTab === "goals" && (
          <div>
            <h2 className="font-bold mb-2">{t("admin.familyGoals")}</h2>
            {goals.map((g) => (
              <div key={g.id} className="p-2 border-b">
                🎯 {g.phone_model} — {g.progress || 0} / {g.target_points} pts
              </div>
            ))}
          </div>
        )}

        {activeTab === "tasks" && (
          <div>
            <h2 className="font-bold mb-2">{t("admin.completedTasks")}</h2>
            {completions.map((c) => (
              <div key={c.id} className="p-2 border-b">
                ✅ {c.task_title} by {c.profiles?.display_name || "Unknown"}
              </div>
            ))}
          </div>
        )}

        {activeTab === "requests" && (
          <div>
            <h2 className="font-bold mb-2">{t("admin.rewardRequests")}</h2>
            {requests.map((r) => (
              <div key={r.id} className="p-2 border-b">
                🎁 {r.rewards?.name} requested by {r.profiles?.display_name || "Unknown"}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
