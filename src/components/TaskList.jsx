import { useState } from "react";
import TaskModal from "./TaskModal";

export default function TaskList({ tasks = [], onComplete, completionsToday = [], userId }) {
  const getTodayCount = (taskId) =>
    completionsToday.filter((c) => c.task_id === taskId).length;
  const [selectedTask, setSelectedTask] = useState(null);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <h2 className="text-2xl font-semibold mb-6 text-center">📋 Tasks</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => {
          const doneToday = getTodayCount(task.id);
          const limitReached = doneToday >= task.max_per_day;

          return (
            <div
              key={task.id}
              className="bg-white p-5 rounded-xl shadow-lg text-center transform transition hover:scale-105"
            >
              <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full overflow-hidden flex items-center justify-center mb-4 border-4 border-yellow-300">
                {task.photo_url ? (
                  <img
                    src={task.photo_url}
                    alt={task.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-5xl">{task.emoji || "📌"}</span>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-800">{task.title}</h3>
              <p className="text-yellow-500 font-semibold my-1">
                ⭐ {task.points} points
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {doneToday} / {task.max_per_day} completed today
              </p>

              <button
                onClick={() => setSelectedTask(task)}
                disabled={limitReached}
                className={`w-full px-4 py-2 rounded-full font-bold text-white transition ${
                  limitReached
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {limitReached ? "Done for today" : "Complete Task"}
              </button>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          userId={userId}
          onClose={() => setSelectedTask(null)}
          onCompleted={() => {
            onComplete(selectedTask);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
