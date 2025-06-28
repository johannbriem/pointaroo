import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export default function ProgressBar({ total, goal, onGoalReached }) {
  const percent = Math.min((total / goal) * 100, 100);
  const confettiFired = useRef(false);

  useEffect(() => {
    if (percent >= 100 && !confettiFired.current) {
      confettiFired.current = true;

      // 1. Confetti animation
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });

      // 2. Notify parent logic
      onGoalReached?.();

      // 3. Reset guard after some time
      setTimeout(() => {
        confettiFired.current = false;
      }, 10000);
    }
  }, [percent, onGoalReached]);

  return (
    <div className="my-6">
      <div className="w-full bg-white/30 rounded-full h-8 shadow-inner border border-yellow-300 overflow-hidden relative">
        <div
          className="absolute inset-0 flex items-center justify-center font-semibold text-white text-base drop-shadow"
        >
          {total} / {goal} <span className="italic ml-1">points</span>
        </div>
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-green-500 transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
