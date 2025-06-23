// src/components/TaskManager.jsx
import React from "react";

export default function TaskManager({ form, tasks, handleChange, handleSubmit, startEdit, isEditing }) {
  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4 mb-8 text-black">
        <h2 className="text-lg font-semibold text-gray-800">
          {isEditing ? "✏️ Edit Task" : "➕ Add New Task"}
        </h2>

        <input
          type="text"
          name="title"
          placeholder="Task title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-md"
        />
        <input
          type="number"
          name="points"
          value={form.points}
          onChange={handleChange}
          placeholder="Points"
          className="w-full p-3 border border-gray-300 rounded-md"
        />
        <input
          type="number"
          name="max_per_day"
          value={form.max_per_day}
          onChange={handleChange}
          placeholder="Max per day"
          className="w-full p-3 border border-gray-300 rounded-md"
        />
        <select
          name="frequency"
          value={form.frequency}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-md"
        >
          <option value="once">Once</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <input
          type="text"
          name="photo_url"
          value={form.photo_url}
          onChange={handleChange}
          placeholder="Image URL (optional)"
          className="w-full p-3 border border-gray-300 rounded-md"
        />

        <button
          type="submit"
          className={`w-full py-3 rounded-md font-bold text-white ${
            isEditing ? "bg-yellow-500 hover:bg-yellow-600" : "bg-black hover:bg-gray-800"
          }`}
        >
          {isEditing ? "💾 Save Changes" : "➕ Add Task"}
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2 text-white">Current Tasks</h2>
      <ul className="space-y-2 mb-8">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="bg-gray-100 p-4 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-bold text-black">{task.title}</p>
              <p className="text-sm text-gray-600">
                {task.points} pts • {task.frequency} • Max/day: {task.max_per_day}
              </p>
            </div>
            <button
              onClick={() => startEdit(task)}
              className="text-blue-600 font-medium hover:underline"
            >
              ✏️ Edit
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
