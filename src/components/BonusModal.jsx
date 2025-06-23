export default function BonusModal({ bonus, kids, setBonus, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 text-black">
        <h2 className="text-xl font-bold">🎁 Give Bonus Points</h2>

        <select
          value={bonus.user_id}
          onChange={(e) => setBonus({ ...bonus, user_id: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">Select kid</option>
          {kids.map((k) => (
            <option key={k.id} value={k.id}>
              {k.email}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Points"
          value={bonus.points}
          onChange={(e) => setBonus({ ...bonus, points: parseInt(e.target.value) })}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          placeholder="Reason (e.g. Helped grandma)"
          value={bonus.reason}
          onChange={(e) => setBonus({ ...bonus, reason: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-gray-600 hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Give Points
          </button>
        </div>
      </div>
    </div>
  );
}
