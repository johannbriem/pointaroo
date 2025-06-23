import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Completions() {
  const [role, setRole] = useState(null);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        setRole(profile?.role);
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (role === "admin") {
      fetchCompletions();
    }
  }, [role]);

  const fetchCompletions = async () => {
    const { data, error } = await supabase
      .from("task_completions")
      .select("*, tasks(title), profiles:user_id(display_name, email)")
      .order("completed_at", { ascending: false });

    if (!error) setCompletions(data);
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  if (role !== "admin") {
    return (
      <div className="text-center mt-10 text-red-500 font-bold">
        ❌ Access denied – Admins only
      </div>
    );
  }

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
      <h1 className="text-2xl font-bold mb-6 text-center">📸 Task Completions</h1>
      {completions.length === 0 ? (
        <p className="text-center text-gray-500 mt-10">No task completions yet.</p>
      ) : (
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
                          <p className="text-xs font-semibold text-gray-600">Before:</p>
                          <img
                            src={item.before_photo}
                            alt="Before"
                            className="w-32 h-32 object-cover border rounded"
                          />
                        </div>
                      )}
                      {item.after_photo && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600">After:</p>
                          <img
                            src={item.after_photo}
                            alt="After"
                            className="w-32 h-32 object-cover border rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
