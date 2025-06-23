// src/components/TaskManager.jsx
import React from "react";
import { useTranslation } from "react-i18next";

export default function TaskManager({ form, tasks, handleChange, handleSubmit, startEdit, isEditing }) {
  const { t } = useTranslation();
  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4 mb-8 text-black">
        <h2 className="text-lg font-semibold text-gray-800">
          {isEditing ? `✏️ ${t("common.edit")} ${t("tasks.title")}` : `➕ ${t("common.add")} ${t("tasks.title")}`}
        </h2>

        <input
          type="text"
          name="title"
          placeholder={t("tasks.taskTitle")}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-md"
        />
        <input
          type="number"
          name="points"
          value={form.points}
          placeholder={t("tasks.points")}
          className="w-full p-3 border border-gray-300 rounded-md"
        />
        <input
          type="number"
          name="max_per_day"
          value={form.max_per_day}
          placeholder={t("tasks.maxPerDay")}
          className="w-full p-3 border border-gray-300 rounded-md"
        />
        <select
          name="frequency"
          value={form.frequency}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-md"
        >
          <option value="once">{t("tasks.once")}</option>
          <option value="daily">{t("tasks.daily")}</option>
          <option value="weekly">{t("tasks.weekly")}</option>
        </select>
        <input
          type="text"
          name="photo_url"
          value={form.photo_url}
          onChange={handleChange}
          placeholder={t("tasks.imageURL")}
          className="w-full p-3 border border-gray-300 rounded-md"
        />

        <button
          type="submit"
          className={`w-full py-3 rounded-md font-bold text-white ${
            isEditing ? "bg-yellow-500 hover:bg-yellow-600" : "bg-black hover:bg-gray-800"
          }`}
        >
          {isEditing ? `💾 ${t("common.saveChanges")}` : `➕ ${t("common.add")} ${t("tasks.title")}`}
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2 text-white">{t("tasks.currentTasks")}</h2>
      <ul className="space-y-2 mb-8">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="bg-gray-100 p-4 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-bold text-black">{task.title}</p>
              <p className="text-sm text-gray-600">
                {task.points} {t("tasks.points")} • {task.frequency} • {t("tasks.maxPerDay")}: {task.max_per_day}
              </p>
            </div>
            <button
              onClick={() => startEdit(task)}
              className="text-blue-600 font-medium hover:underline"
            >
              ✏️ {t("common.edit")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
