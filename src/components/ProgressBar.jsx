export default function ProgressBar({ total, goal }) {
  const percent = Math.min((total / goal) * 100, 100);

  return (
    <div className="my-6">
      <div className="w-full bg-gray-200 rounded-full h-6">
        <div
          className="bg-green-500 h-6 rounded-full text-center text-white text-sm"
          style={{ width: `${percent}%` }}
        >
          {total} / {goal} pts
        </div>
      </div>
    </div>
  );
}
