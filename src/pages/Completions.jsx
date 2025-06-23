import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useOutletContext } from "react-router-dom"; // Import useOutletContext
import { useTranslation } from "react-i18next";

export default function Completions() {
  const { user, loading, role } = useOutletContext(); // Get user, loading, role from context
  const [completions, setCompletions] = useState([]);
  const [localLoading, setLoading] = useState(false); // Local loading state for fetchCompletions
  const { t } = useTranslation();

  useEffect(() => {
    if (user && !loading) { // Only fetch if user is loaded
      fetchCompletions();
    }
  }, [user, role, loading]); // Depend on user, role, and loading from context

  const fetchCompletions = async () => {
    setLoading(true);
    let query = supabase
      .from("task_completions")
      .select("*, tasks(title), profiles:user_id(display_name, email)")
      .order("completed_at", { ascending: false });

    if (role !== "admin") {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (!error) setCompletions(data);
    setLoading(false);
  };
  if (loading || localLoading) return <p className="text-center mt-10">{t("common.loading")}</p>;

  const groupedCompletions = completions.reduce((acc, completion) => {
    const userId = completion.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        user: completion.profiles || { display_name: `User ${userId.substring(0,8)}`, email: userId },
        completions: []
      };
    }
    acc[userId].completions.push(completion);
    return acc;
  }, {});

  const userGroups = Object.values(groupedCompletions);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        📸 {role === "admin" ? t("completions.title") : t("completions.myTitle")}
      </h1>
      {completions.length === 0 ? (
        <p className="text-center text-gray-500 mt-10">{t("completions.noCompletions")}</p>
      ) : (
        role === "admin" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userGroups.map(({ user, completions: userCompletions }) => (
              <div key={user.email} className="bg-gray-50 p-4 rounded-lg shadow-inner">
                <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700 text-center">
                  {user.display_name || user.email}
                </h2>
                <div className="space-y-4">
                  {userCompletions.map((item) => (
                    <div key={item.id} className="border p-4 rounded-lg shadow-sm bg-white">
                      <h3 className="font-semibold text-lg text-black mb-2">{item.tasks?.title || 'Untitled Task'}</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {new Date(item.completed_at).toLocaleString()}
                      </p>
                      <div className="flex space-x-4">
                        {item.before_photo && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600">{t("completions.before")}</p>
                            <img src={item.before_photo} alt="Before" className="w-32 h-32 object-cover border rounded" />
                          </div>
                        )}
                        {item.after_photo && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600">{t("completions.after")}</p>
                            <img src={item.after_photo} alt="After" className="w-32 h-32 object-cover border rounded" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completions.map((item) => (
              <div key={item.id} className="border p-4 rounded-lg shadow-sm bg-white">
                <h3 className="font-semibold text-lg text-black mb-2">{item.tasks?.title || 'Untitled Task'}</h3>
                <p className="text-sm text-gray-500 mb-2">{new Date(item.completed_at).toLocaleString()}</p>
                <div className="flex space-x-4">
                  {item.before_photo && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600">{t("completions.before")}</p>
                      <img src={item.before_photo} alt="Before" className="w-32 h-32 object-cover border rounded" />
                    </div>
                  )}
                  {item.after_photo && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600">{t("completions.after")}</p>
                      <img src={item.after_photo} alt="After" className="w-32 h-32 object-cover border rounded" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
