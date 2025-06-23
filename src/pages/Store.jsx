import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useOutletContext } from "react-router-dom";

export default function Store() {
  const {
    user,
    availablePoints,
    purchases = [],
    rewardRequests = [],
    fetchAllData,
  } = useOutletContext();

  const [rewards, setRewards] = useState([]);

  useEffect(() => {
    const fetchRewards = async () => {
      const { data } = await supabase.from("rewards").select("*").order("cost");
      if (data) setRewards(data);
    };
    fetchRewards();
  }, []);

  const balance = availablePoints;

  // Check if a reward has been purchased by the user
  const isPurchased = (rewardId) => {
    return purchases.some(p => p.reward_id === rewardId);
  };

  // Check if a reward has a pending request by the user
  const isPendingRequest = (rewardId) => {
    return rewardRequests.some(req => req.reward_id === rewardId && req.status === 'pending');
  };
  
  const canAfford = (cost) => balance >= cost;

  const handleBuy = async (reward) => {
    if (!canAfford(reward.cost)) return;

    if (reward.requires_approval) {
      // Insert into reward_requests table
      const { error: requestError } = await supabase.from("reward_requests").insert([
        {
          user_id: user.id,
          reward_id: reward.id,
          points_deducted: reward.cost,
          status: 'pending', // Default status
        },
      ]);
      if (!requestError) {
        alert(`🎉 Request for "${reward.name}" submitted! ${reward.cost} points deducted.`);
        fetchAllData(); // Refresh all data from the root
      } else {
        console.error("Error submitting request:", requestError);
        alert("Failed to submit request.");
      }
    } else { // Direct purchase
      const { error } = await supabase.from("purchases").insert([
        {
          user_id: user.id,
          reward_id: reward.id,
          cost: reward.cost,
        },
      ]);
      if (!error) {
        alert(`🎉 You bought: ${reward.name}!`);
        fetchAllData(); // Refresh all data from the root
      } else {
        console.error("Error making purchase:", error);
        alert("Purchase failed.");
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🎁 Reward Store</h1>
      <p className="mb-4 text-sm">Your balance: {balance} pts</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rewards.map((reward) => {
          const afford = canAfford(reward.cost);
          const purchased = isPurchased(reward.id);
          const pendingRequest = isPendingRequest(reward.id);
          return (
            <div key={reward.id} className={`rounded border shadow-sm flex flex-col ${
              purchased ? "bg-green-50" : pendingRequest ? "bg-yellow-50" : afford ? "bg-white" : "bg-gray-100 text-gray-400"
            }`}>
              {reward.photo_url && (
                <img
                  src={reward.photo_url}
                  alt={reward.name}
                  className="w-full h-40 object-cover rounded-t"
                />
              )}
              <div className="p-4 flex flex-col flex-grow">
                <h2 className="text-lg font-semibold">{reward.name}</h2>
                <p className="text-sm flex-grow">{reward.description}</p>
                <p className="mt-2 font-bold">{reward.cost} pts</p>
                <button
                  disabled={!afford || purchased || pendingRequest}
                  onClick={() => handleBuy(reward)}
                  className={`mt-3 px-4 py-2 rounded text-white w-full ${
                    purchased ? "bg-green-500 cursor-not-allowed" : pendingRequest ? "bg-yellow-500 cursor-not-allowed" : afford ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {purchased ? "Purchased!" : pendingRequest ? "Requested (Pending)" : reward.requires_approval ? (afford ? "Request" : "Not enough points") : (afford ? "Redeem" : "Not enough points")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
