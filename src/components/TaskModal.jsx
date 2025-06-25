import { useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useTranslation } from "react-i18next";
import { Camera, XCircle } from "lucide-react";

export default function TaskModal({ task, userId, onClose, onCompleted }) {
  const { t } = useTranslation();
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef();

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
      alert(t("errors.taskCompleteFail"));
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative bg-white/95 rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">{task.title}</h2>

        {/* Before Photo */}
        <div className="mt-4">
          <label className="flex items-center gap-2 text-gray-700 font-medium mb-1">
            <Camera className="w-5 h-5" />
            {t("taskModal.beforePhoto")}
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment" // ← forces camera on mobile/tablet
            onChange={(e) => setBeforeFile(e.target.files[0])}
            className="block w-full p-2 border border-gray-300 rounded-md text-gray-800"
          />
          {beforeFile && (
            <div className="relative mt-2">
              <img
                src={URL.createObjectURL(beforeFile)}
                alt="Preview before"
                className="rounded-md w-full max-h-48 object-cover"
              />
              <button
                onClick={() => setBeforeFile(null)}
                className="absolute top-2 right-2 bg-white rounded-full shadow p-1 hover:bg-red-100"
                aria-label="Remove before photo"
              >
                <XCircle className="w-5 h-5 text-red-500" />
              </button>
            </div>
          )}
        </div>

        {/* After Photo */}
        <div className="mt-4">
          <label className="flex items-center gap-2 text-gray-700 font-medium mb-1">
            <Camera className="w-5 h-5" />
            {t("taskModal.afterPhoto")}
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setAfterFile(e.target.files[0])}
            className="block w-full p-2 border border-gray-300 rounded-md text-gray-800"
          />
          {afterFile && (
            <div className="relative mt-2">
              <img
                src={URL.createObjectURL(afterFile)}
                alt="Preview after"
                className="rounded-md w-full max-h-48 object-cover"
              />
              <button
                onClick={() => setAfterFile(null)}
                className="absolute top-2 right-2 bg-white rounded-full shadow p-1 hover:bg-red-100"
                aria-label="Remove after photo"
              >
                <XCircle className="w-5 h-5 text-red-500" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <button
            onClick={onClose}
            className="w-1/2 py-2 mr-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleComplete}
            disabled={submitting}
            className="w-1/2 py-2 ml-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {submitting ? t("taskModal.saving") : t("taskModal.confirmCompletion")}
          </button>
        </div>
      </div>
    </div>
  );
}
