import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ...top imports remain the same

export default function Completions() {
  const { user, loading } = useOutletContext();
  const [completions, setCompletions] = useState([]);
  const [localLoading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (user && !loading) {
      fetchUserRoleAndCompletions();
    }
  }, [user, loading]);

  const fetchUserRoleAndCompletions = async () => {
    setLoading(true);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching role:", profileError);
      setLoading(false);
      return;
    }

    setUserRole(profile.role);

    let query = supabase
      .from("task_completions")
      .select("*, tasks(title), profiles:user_id(display_name, email)")
      .order("completed_at", { ascending: false });

    if (profile.role !== "admin") {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (!error) setCompletions(data);
    else console.error("Error fetching completions:", error);

    setLoading(false);
  };

  if (loading || localLoading) {
    return <p className="text-center mt-10">{t("common.loading")}</p>;
  }

  const groupedCompletions = completions.reduce((acc, completion) => {
    const userId = completion.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        user: completion.profiles || {
          display_name: `User ${userId.substring(0, 8)}`,
          email: userId,
        },
        completions: [],
      };
    }
    acc[userId].completions.push(completion);
    return acc;
  }, {});

  const userGroups = Object.values(groupedCompletions);

  const CompletionCard = ({ item }) => (
    <div
      className="p-4 rounded-lg shadow-sm border transform transition-all duration-200 hover:scale-[1.02]"
      style={{
        backgroundColor: "var(--color-bg-subtle)",
        borderColor: "var(--color-border-muted)",
        color: "var(--color-text)",
      }}
    >
      <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--color-text-strong)" }}>
        {item.tasks?.title || "Untitled Task"}
      </h3>
      <p className="text-sm mb-2" style={{ color: "var(--color-text-muted)" }}>
        {new Date(item.completed_at).toLocaleString()}
      </p>
      <div className="flex flex-wrap gap-4">
        {item.before_photo && (
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
              {t("completions.before")}
            </p>
            <img
              src={item.before_photo}
              alt="Before"
              className="w-32 h-32 object-cover rounded border"
              style={{ borderColor: "var(--color-border-muted)" }}
            />
          </div>
        )}
        {item.after_photo && (
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
              {t("completions.after")}
            </p>
            <img
              src={item.after_photo}
              alt="After"
              className="w-32 h-32 object-cover rounded border"
              style={{ borderColor: "var(--color-border-muted)" }}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-8 text-center" style={{ color: "var(--color-text-heading)" }}>
        📸 {userRole === "admin" ? t("completions.title") : t("completions.myTitle")}
      </h1>

      {completions.length === 0 ? (
        <p className="text-center mt-10" style={{ color: "var(--color-text-muted)" }}>
          {t("completions.noCompletions")}
        </p>
      ) : userRole === "admin" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userGroups.map(({ user, completions: userCompletions }) => (
            <div
              key={user.email}
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
            >
              <h2 className="text-xl font-bold mb-4 pb-2 text-center border-b"
                  style={{
                    color: "var(--color-text)",
                    borderColor: "var(--color-border)",
                  }}
              >
                {user.display_name || user.email}
              </h2>
              <div className="space-y-4">
                {userCompletions.map((item) => (
                  <CompletionCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {completions.map((item) => (
            <CompletionCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
