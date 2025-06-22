import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Completions() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [completions, setCompletions] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        setUser(userData.user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userData.user.id)
          .single();

        setRole(profile?.role);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (role === "parent") fetchCompletions();
  }, [role]);

  const fetchCompletions = async () => {
    const { data, error } = await supabase
      .from("task_completions")
      .select("*, tasks(title)")
      .order("completed_at", { ascending: false });

    if (!error) setCompletions(data);
  };

  if (!user) return <p className="text-center mt-10">Loading...</p>;

  if (role !== "parent") {
    return (
      <div className="text-center mt-10 text-red-500 font-bold">
        ❌ Access denied – Admins only
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📸 Task Completions</h1>
      <div className="space-y-6">
        {completions.map((item) => (
          <div key={item.id} className="border p-4 rounded-lg shadow bg-white">
            <h3 className="font-semibold text-lg mb-2">{item.tasks?.title}</h3>
            <p className="text-sm text-gray-500 mb-2">
              Done by: {item.user_id} <br />
              At: {new Date(item.completed_at).toLocaleString()}
            </p>
            <div className="flex space-x-4">
              {item.before_photo && (
                <div>
                  <p className="text-xs">Before:</p>
                  <img
                    src={item.before_photo}
                    alt="Before"
                    className="w-32 h-32 object-cover border rounded"
                  />
                </div>
              )}
              {item.after_photo && (
                <div>
                  <p className="text-xs">After:</p>
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
  );
}
