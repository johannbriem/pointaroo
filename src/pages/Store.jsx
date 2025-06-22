import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Store({ userId, points, purchases = [], fetchPurchases = () => {} }) {
  const [rewards, setRewards] = useState([]);

  useEffect(() => {
    const fetchRewards = async () => {
      const { data } = await supabase.from("rewards").select("*").order("cost");
      if (data) setRewards(data);
    };
    fetchRewards();
  }, []);

  const spent = purchases.reduce((sum, p) => {
    const reward = rewards.find((r) => r.id === p.reward_id);
    return reward ? sum + reward.cost : sum;
  }, 0);

  const balance = points - spent;

  const canAfford = (cost) => balance >= cost;

  const handleBuy = async (reward) => {
    if (!canAfford(reward.cost)) return;

    const { error } = await supabase.from("purchases").insert([
      {
        user_id: userId,
        reward_id: reward.id,
      },
    ]);

    if (!error) {
      alert(`🎉 You bought: ${reward.name}!`);
      fetchPurchases(); // refresh list after buy
    } else {
      alert("Purchase failed.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🎁 Reward Store</h1>
      <p className="mb-4 text-sm">Your balance: {balance} pts</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rewards.map((reward) => {
          const afford = canAfford(reward.cost);
          return (
            <div
              key={reward.id}
              className={`p-4 rounded border shadow-sm ${
                afford ? "bg-white" : "bg-gray-100 text-gray-400"
              }`}
            >
              <h2 className="text-lg font-semibold">{reward.name}</h2>
              <p className="text-sm">{reward.description}</p>
              <p className="mt-2 font-bold">{reward.cost} pts</p>
              <button
                disabled={!afford}
                onClick={() => handleBuy(reward)}
                className={`mt-3 px-4 py-2 rounded text-white ${
                  afford ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {afford ? "Redeem" : "Not enough points"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
