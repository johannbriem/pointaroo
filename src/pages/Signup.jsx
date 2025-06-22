import { useState } from "react";
import { supabase } from "../supabaseClient";


export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("kid");
  const [goal, setGoal] = useState("");
  const [goalLink, setGoalLink] = useState("");
  const [error, setError] = useState(null);
  
  const handleSignup = async () => {
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    const userId = data?.user?.id ?? data?.session?.user?.id;

    if (userId && goal) {
      await supabase.from("goals").insert([
        {
          user_id: userId,
          title: goal,
          link: goalLink || null,
        },
      ]);
    }

    alert("Signup successful!");
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Sign Up</h2>
      <input
        type="email"
        className="w-full p-2 border mb-2"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="w-full p-2 border mb-2"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input placeholder="What are you saving for?" value={goal} onChange={(e) => setGoal(e.target.value)} />
      <input placeholder="Optional link to the item" value={goalLink} onChange={(e) => setGoalLink(e.target.value)} />

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full p-2 border mb-4"
      >
        <option value="kid">👧 I'm a Kid</option>
        <option value="admin">👨‍👩‍👧 I'm a Parent</option>
      </select>

      <button onClick={handleSignup} className="bg-green-600 text-white w-full py-2 rounded">
        Sign Up
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
