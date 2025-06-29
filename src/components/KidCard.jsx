export default function KidCard({ kid, onClick }) {
  return (
    <div
      className="flex flex-col items-center bg-white rounded-lg shadow p-4 cursor-pointer hover:bg-blue-100"
      onClick={() => onClick(kid)}
    >
      <img
        src={kid.photo_url || "/default-profile.png"}
        alt={kid.display_name}
        className="w-20 h-20 rounded-full object-cover mb-2"
      />
      <p className="text-lg font-semibold text-center">{kid.display_name}</p>
    </div>
  );
}
