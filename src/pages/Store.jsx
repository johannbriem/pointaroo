import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";

function formatRemainingTime(milliseconds) {
  if (milliseconds <= 0) {
    return "Ready now";
  }

  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
  const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}m`);

  if (parts.length === 0) {
    return "< 1m left";
  }

  return `~${parts.join(" ")} left`;
}

export default function Store() {
  const { user, loading } = useOutletContext();

  const [tasks, setTasks] = useState([]);
  const [allCompletions, setAllCompletions] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [rewardRequests, setRewardRequests] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [_, forceUpdate] = useState(Date.now());
  const { t } = useTranslation();

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchRewards = async () => {
      const { data } = await supabase.from("rewards").select("*").order("cost");
      if (data) setRewards(data);
    };
    fetchRewards();
  }, []);

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
    const { data } = await supabase
      .from("reward_requests")
      .select("*, rewards(name, cost)")
      .eq("user_id", user.id);
    if (data) setRewardRequests(data);
  };

  const earnedPoints = allCompletions.reduce(
    (sum, comp) => sum + (parseInt(tasks.find(t => t.id === comp.task_id)?.points) || 0),
    0
  );
  const purchasedPoints = purchases.reduce((sum, p) => sum + (parseInt(p.cost) || 0), 0);
  const pendingRequestedPoints = rewardRequests.reduce(
    (sum, req) => sum + (req.status === "pending" ? (parseInt(req.points_deducted) || 0) : 0),
    0
  );
  const balance = earnedPoints - (purchasedPoints + pendingRequestedPoints);

  const isPurchased = rewardId => purchases.some(p => p.reward_id === rewardId);
  const isPendingRequest = rewardId =>
    rewardRequests.some(req => req.reward_id === rewardId && req.status === "pending");

  const getCooldownInfo = reward => {
    if (!reward.request_cooldown_days || reward.request_cooldown_days <= 0) {
      return {
        isUnderCooldown: false,
        lastRequestTime: null,
        cooldownEndTime: null,
        remainingTime: null,
      };
    }

    const relevantRequestTimestamps = rewardRequests
      .filter(
        req =>
          req.reward_id === reward.id &&
          (req.status === "pending" || req.status === "approved") &&
          req.requested_at
      )
      .map(req => new Date(req.requested_at).getTime());

    const relevantPurchaseTimestamps = purchases
      .filter(p => p.reward_id === reward.id && p.created_at)
      .map(p => new Date(p.created_at).getTime());

    const allTimestamps = [...relevantRequestTimestamps, ...relevantPurchaseTimestamps].filter(
      ts => !isNaN(ts)
    );

    if (allTimestamps.length === 0) {
      return {
        isUnderCooldown: false,
        lastRequestTime: null,
        cooldownEndTime: null,
        remainingTime: null,
      };
    }

    const lastRequestTimestamp = Math.max(...allTimestamps);
    const lastRequestDate = new Date(lastRequestTimestamp);
    const cooldownEndTime =
      lastRequestTimestamp + reward.request_cooldown_days * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const remainingTime = cooldownEndTime - now;

    return {
      isUnderCooldown: remainingTime > 0,
      lastRequestTime: lastRequestDate,
      cooldownEndTime: new Date(cooldownEndTime),
      remainingTime: Math.max(0, remainingTime),
    };
  };

  const canAfford = cost => balance >= cost;

  const handleBuy = async reward => {
    if (!canAfford(reward.cost)) return;

    if (reward.requires_approval) {
      const { error } = await supabase.from("reward_requests").insert([
        {
          user_id: user.id,
          reward_id: reward.id,
          points_deducted: reward.cost,
          status: "pending",
        },
      ]);
      if (!error) {
        alert(`🎉 Request for "${reward.name}" submitted!`);
        await Promise.all([fetchPurchases(), fetchRewardRequests()]);
      } else {
        console.error("Error submitting request:", error);
        alert("Failed to submit request.");
      }
    } else {
      const { error } = await supabase.from("purchases").insert([
        {
          user_id: user.id,
          reward_id: reward.id,
          cost: reward.cost,
        },
      ]);
      if (!error) {
        alert(`🎉 You bought: ${reward.name}!`);
        await fetchPurchases();
      } else {
        console.error("Error making purchase:", error);
        alert("Purchase failed.");
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-3 flex justify-center items-center gap-2">
          <span>🎁</span> 
          <span>{t("store.title")}</span>
        </h1>
        <div className="inline-block px-4 py-2 bg-yellow-200 text-yellow-900 rounded-full text-sm font-semibold shadow-md">
          ⭐ {t("store.balance")}: <span className="font-bold">{balance} pts</span>
        </div>
      </div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {rewards.map(reward => {
    const afford = canAfford(reward.cost);
    const purchased = isPurchased(reward.id);
    const pendingRequest = isPendingRequest(reward.id);
    const cooldownInfo = getCooldownInfo(reward);
    const underCooldown = cooldownInfo.isUnderCooldown;
    const isDisabled = !afford || purchased || pendingRequest || underCooldown;

    let buttonText = t("store.redeem");
    if (purchased) buttonText = t("store.purchased");
    else if (pendingRequest) buttonText = t("store.requested");
    else if (underCooldown) buttonText = t("store.cooldown", { days: reward.request_cooldown_days });
    else if (!afford) buttonText = t("store.notEnough");
    else if (reward.requires_approval) buttonText = t("store.request");

    return (
      <div
        key={reward.id}
        className="rounded-xl border shadow-sm flex flex-col transition-all hover:scale-[1.01]"
        style={{
          backgroundColor: "var(--color-bg-card)",
          borderColor: "var(--color-border)",
          color: "var(--color-text)",
        }}
      >
        {reward.photo_url && (
          <img
            src={reward.photo_url}
            alt={reward.name}
            className="w-full h-40 object-cover rounded-t"
          />
        )}
        <div className="p-4 flex flex-col flex-grow">
          <h2
            className="text-lg font-bold mb-1"
            style={{ color: "var(--color-text-strong)" }}
          >
            {reward.name}
          </h2>
          {reward.request_cooldown_days > 0 && (
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              {t("store.dayCooldown", { days: reward.request_cooldown_days })}
            </p>
          )}
          <p className="text-sm flex-grow" style={{ color: "var(--color-text)" }}>
            {reward.description}
          </p>
          <p className="mt-2 font-bold" style={{ color: "var(--color-text-strong)" }}>
            {reward.cost} pts
          </p>

          {underCooldown && cooldownInfo.remainingTime > 0 && (
            <div
              className="mt-3 px-4 py-3 rounded-xl shadow-inner border"
              style={{
                backgroundColor: "var(--color-bg-subtle)",
                borderColor: "var(--color-border-muted)",
                color: "var(--color-text-muted)",
              }}
            >
              <div className="flex items-center mb-2">
                <span className="text-xl mr-2 animate-pulse">⏳</span>
                <span className="font-semibold">
                  {t("store.cooldownActive")}
                </span>
              </div>
              <p className="ml-6 text-sm">
                <span className="font-medium">{t("store.timeLeft")}:</span>{" "}
                {formatRemainingTime(cooldownInfo.remainingTime)}
              </p>
              <div className="mt-2 bg-[var(--color-bg-muted)] rounded-full h-3 overflow-hidden">
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${
                      100 -
                      (cooldownInfo.remainingTime /
                        (reward.request_cooldown_days * 24 * 60 * 60 * 1000)) *
                        100
                    }%`,
                    backgroundColor: "var(--color-primary)",
                  }}
                ></div>
              </div>
            </div>
          )}

          <button
            disabled={isDisabled}
            onClick={() => handleBuy(reward)}
            className={`button w-full mt-4 ${
              isDisabled ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.02]"
            }`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    );
  })}
</div>
</div>
);
}
