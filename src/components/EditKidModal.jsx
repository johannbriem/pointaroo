import { useState } from "react";
import { useTheme } from "../components/ThemeContext";
import useThemeMeta from "../components/useThemeMeta";

export default function EditKidModal({ kid, onClose, onSave }) {
  const { theme } = useTheme();
  const { uiMode } = useThemeMeta(theme);

  const [goal, setGoal] = useState(kid.goal || {
    phone_model: "",
    total_cost: "",
    parent_percent: "",
    phone_image: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGoal((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(kid.id, goal);
    onClose(); // Optional: close modal after saving
  };

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center backdrop-blur-sm bg-black/10`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-50 bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md theme-${theme} ${uiMode}-mode`}
      >
        <h2 className="text-xl font-bold mb-4 items-center text-center">🎯 Edit Goal for </h2>
          <p className="text-xl font-bold mb-4 items-center text-center text-gray-500">{kid.display_name}</p>

        <input
          name="phone_model"
          value={goal.phone_model}
          onChange={handleChange}
          placeholder="Phone Model"
          className="w-full p-2 border mb-2 rounded"
        />
        <input
          name="total_cost"
          type="number"
          value={goal.total_cost}
          onChange={handleChange}
          placeholder="Total Cost"
          className="w-full p-2 border mb-2 rounded"
        />
        <input
          name="parent_percent"
          type="number"
          value={goal.parent_percent}
          onChange={handleChange}
          placeholder="Parent Pays (%)"
          className="w-full p-2 border mb-2 rounded"
        />
        <input
          name="phone_image"
          value={goal.phone_image}
          onChange={handleChange}
          placeholder="Image URL"
          className="w-full p-2 border mb-4 rounded"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-400 text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
