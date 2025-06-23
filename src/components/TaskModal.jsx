import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function TaskModal({ task, userId, onClose, onCompleted }) {
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleComplete = async () => {
    setSubmitting(true);

    const uploadImage = async (file) => {
      const ext = file.name.split(".").pop();
      const path = `completion-${Date.now()}-${Math.random()}.${ext}`;
      const { error } = await supabase.storage.from("task-images").upload(path, file);
      if (error) return null;
      return supabase.storage.from("task-images").getPublicUrl(path).data.publicUrl;
    };

    const before_url = beforeFile ? await uploadImage(beforeFile) : null;
    const after_url = afterFile ? await uploadImage(afterFile) : null;

    const { error } = await supabase.from("task_completions").insert([
      {
        user_id: userId,
        task_id: task.id,
        before_photo: before_url,
        after_photo: after_url,
      },
    ]);

    setSubmitting(false);
    if (!error) {
      onCompleted();
      onClose();
    } else {
      alert("Failed to complete task");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 shadow-xl text-left">
        <h2 className="text-xl font-bold">{task.title}</h2>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                📸 Before Photo
            </label>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && setBeforeFile(e.target.files[0])}
                className="block w-full"
            />
            </div>

            <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                📸 After Photo
            </label>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && setAfterFile(e.target.files[0])}
                className="block w-full"
            />
            </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={submitting}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {submitting ? "Saving..." : "Confirm Completion"}
          </button>
        </div>
      </div>
    </div>
  );
}
