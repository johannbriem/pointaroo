import { useState } from "react";
import TaskModal from "./TaskModal";
import { useTranslation } from "react-i18next";
import  kidThemeStyles from "../data/themeStyles";

export default function TaskList({
  tasks = [],
  onComplete,
  completionsToday = [],
  userId,
  uiMode = "kid",
  theme = "space",
}) {
  const getTodayCount = (taskId) =>
    completionsToday.filter((c) => c.task_id === taskId).length;
  const [selectedTask, setSelectedTask] = useState(null);
  const { t } = useTranslation();
  const themeConfig =
    uiMode === "kid" ? kidThemeStyles[theme] || {} : {};

  const getCardStyle = () => {
    if (uiMode === "parent") return "bg-white border border-gray-200 p-5 rounded-xl shadow";
    return themeConfig.card || "bg-white shadow-xl rounded-3xl p-5";
  };

  const getButtonStyle = (limitReached) => {
    if (limitReached) return "bg-gray-400 cursor-not-allowed";
    if (uiMode === "parent")
      return "bg-blue-600 hover:bg-blue-700 text-white font-semibold";
    return themeConfig.button || "bg-green-400 hover:bg-green-500 text-white font-bold text-lg py-2 rounded-full";
  };

  const getPointsStyle = () => {
    if (uiMode === "parent") return "text-gray-700 text-sm";
    return themeConfig.pointsText || "text-orange-500 font-extrabold text-lg";
  };

  const getEmojiStyle = () => {
    return uiMode === "kid"
      ? themeConfig.emoji || "text-6xl"
      : "text-4xl";
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <h2
        className={`text-2xl font-semibold mb-6 text-center ${
          uiMode === "kid" ? "text-white font-bold" : "text-gray-800"
        }`}
      >
        {uiMode === "kid" ? "📋 " : ""}
        {t("tasks.title")}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => {
          const doneToday = getTodayCount(task.id);
          const limitReached = doneToday >= task.max_per_day;

          return (
            <div key={task.id} className={getCardStyle()}>
              <div
                className={`w-24 h-24 mx-auto rounded-full overflow-hidden flex items-center justify-center mb-4 border-4 ${
                  uiMode === "parent"
                    ? "bg-gray-100 border-gray-300"
                    : themeConfig.emojiBg || "bg-yellow-100 border-yellow-400"
                }`}
              >
                {task.photo_url ? (
                  <img
                    src={task.photo_url}
                    alt={task.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className={getEmojiStyle()}>{task.emoji || "📌"}</span>
                )}
              </div>

              <h3
                className={`text-xl font-bold mb-1 ${
                  uiMode === "parent" ? "text-gray-800" : "text-black"
                }`}
              >
                {task.title}
              </h3>

              <p className={getPointsStyle()}>
                ⭐ {task.points} {t("tasks.points")}
              </p>

              <p className="text-sm text-gray-500 mb-4">
                {doneToday} / {task.max_per_day} {t("tasks.completedToday")}
              </p>

              <button
                className={`w-full mt-4 py-2 rounded-full ${getButtonStyle(
                  limitReached
                )}`}
                onClick={() => setSelectedTask(task)}
                disabled={limitReached}
              >
                {limitReached
                  ? t("tasks.doneForToday")
                  : t("tasks.completeTask")}
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
