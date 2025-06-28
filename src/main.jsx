import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Admin from "./pages/Admin.jsx";
import Completions from "./pages/Completions.jsx";
import Store from "./pages/Store.jsx"; // ✅ import it
import "./index.css";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js"; // ✅ import supabase client
import Home from "./pages/Home.jsx";
import Layout from "./Layout.jsx"; // ✅ import Layout component
import Login from "./pages/Login.jsx"; // ✅ import Login page
import Signup from "./pages/Signup.jsx"; // ✅ import Signup page
import JoinPage from "./pages/JoinPage.jsx"; // ✅ import JoinPage for family invites
import './i18n';
import { ThemeProvider } from "./components/ThemeContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx"; // ✅ import ErrorBoundary


function StoreRouteWrapper() {
  const [user, setUser] = useState(null);
  const [completionsToday, setCompletionsToday] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("family_id")
        .eq("id", user.id)
        .single();

      if (!profile?.family_id) {
        setTasks([]);
        setRewards([]);
        return;
      }

      const [comps, tsks, rwrds, purch] = await Promise.all([
        supabase
          .from("task_completions")
          .select("*")
          .eq("user_id", user.id),
        supabase.from("tasks").select("*").eq("family_id", profile.family_id),
        supabase
          .from("rewards")
          .select("*")
          .eq("family_id", profile.family_id),
        supabase.from("purchases").select("*").eq("user_id", user.id),
      ]);

      setCompletionsToday(comps.data || []);
      setTasks(tsks.data || []);
      setRewards(rwrds.data || []);
      setPurchases(purch.data || []);
    };

    load();
  }, [user]);

  const earned = completionsToday.reduce((sum, c) => {
    const task = tasks.find((t) => t.id === c.task_id);
    return task ? sum + task.points : sum;
  }, 0);
  const spent = purchases.reduce((sum, p) => {
    const reward = rewards.find((r) => r.id === p.reward_id);
    return reward ? sum + reward.cost : sum;
  }, 0);

  const balance = earned - spent;

  return user ? (
    <Store
      userId={user.id}
      points={balance}
      purchases={purchases}
      fetchPurchases={async () => {
        const { data } = await supabase
          .from("purchases")
          .select("*")
          .eq("user_id", user.id);
        setPurchases(data || []);
      }}
    />
  ) : (
    <p className="text-center mt-6">Loading...</p>
  );
}


ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/store" element={<Store />} />
        <Route path="/completions" element={<Completions />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  </BrowserRouter>
);

