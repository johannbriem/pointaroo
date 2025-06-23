import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useOutletContext } from "react-router-dom";

export default function Store() {
  const { user, loading } = useOutletContext(); // Only get user and loading from App.jsx

  const [tasks, setTasks] = useState([]);
  const [allCompletions, setAllCompletions] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [rewardRequests, setRewardRequests] = useState([]);
  const [rewards, setRewards] = useState([]); // Already there

  useEffect(() => {
    const fetchRewards = async () => {
      const { data } = await supabase.from("rewards").select("*").order("cost");
      if (data) setRewards(data);
    };
    fetchRewards();
  }, []);

  // --- Re-introducing data fetching and point calculation to Store.jsx ---
  useEffect(() => {
    if (user && !loading) {
      fetchTasks();
      fetchAllCompletions();
      fetchPurchases();
      fetchRewardRequests(); 
    }
  }, [user?.id, loading]);

  const fetchTasks = async () => {
    const { data } = await supabase.from("tasks").select("*");
    if (data) setTasks(data);
  };

  const fetchAllCompletions = async () => {
    const { data } = await supabase.from("task_completions").select("*").eq("user_id", user.id);
    if (data) setAllCompletions(data);
  };

  const fetchPurchases = async () => {
    const { data } = await supabase.from("purchases").select("*").eq("user_id", user.id);
    if (data) setPurchases(data);
  };

  const fetchRewardRequests = async () => {
    const { data } = await supabase.from("reward_requests").select("*, rewards(name, cost)").eq("user_id", user.id);
    if (data) setRewardRequests(data);
  };

  const earnedPoints = allCompletions.reduce((sum, comp) => sum + (parseInt(tasks.find(t => t.id === comp.task_id)?.points) || 0), 0);
  const purchasedPoints = purchases.reduce((sum, p) => sum + (parseInt(p.cost) || 0), 0);
  const pendingRequestedPoints = rewardRequests.reduce((sum, req) => sum + (req.status === 'pending' ? (parseInt(req.points_deducted) || 0) : 0), 0);
  const spentPoints = purchasedPoints + pendingRequestedPoints;
  const availablePoints = earnedPoints - spentPoints;
  const balance = availablePoints;
  // The `balance` variable now correctly reflects the user's available points.
  // --- End re-introduction ---

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
        await Promise.all([fetchPurchases(), fetchRewardRequests()]); // Refresh local data
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
        await fetchPurchases(); // Refresh local data
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
            <div key={reward.id} className={`rounded border shadow-sm flex flex-col ${ // Added explicit text colors for readability
              purchased ? "bg-green-50 text-gray-900" : pendingRequest ? "bg-yellow-50 text-gray-900" : afford ? "bg-white text-gray-900" : "bg-gray-100 text-gray-400"
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

      <h2 className="text-2xl font-bold mb-4 mt-8">My Requests</h2>
      {rewardRequests.length === 0 ? (
        <p className="text-gray-500">You have no reward requests yet.</p>
      ) : (
        <div className="space-y-4">
          {rewardRequests.map((request) => (
            <div key={request.id} className="bg-white p-4 rounded-lg shadow-sm border flex items-center">
              {request.rewards?.photo_url && (
                <img
                  src={request.rewards.photo_url}
                  alt={request.rewards.name}
                  className="w-16 h-16 object-cover rounded mr-4"
                />
              )}
              <div className="flex-grow">
                <p className="font-bold text-lg">{request.rewards?.name || 'Unknown Reward'}</p>
                <p className="text-sm text-gray-600">Cost: {request.points_deducted} pts</p>
                <p className="text-sm text-gray-600">
                  Status:{" "}
                  <span
                    className={`font-semibold ${
                      request.status === "pending"
                        ? "text-yellow-600"
                        : request.status === "approved"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  Requested: {new Date(request.requested_at).toLocaleString()}
                </p>
                {request.approved_at && (
                  <p className="text-xs text-gray-500">
                    Processed: {new Date(request.approved_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
