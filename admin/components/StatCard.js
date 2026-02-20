export default function StatCard({ title, value, subtitle, icon, color = "primary" }) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-500/10 text-green-400",
    blue: "bg-blue-500/10 text-blue-400",
    yellow: "bg-yellow-500/10 text-yellow-400",
    purple: "bg-purple-500/10 text-purple-400",
  };

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${colors[color]}`}>
          {icon}
        </span>
      </div>
      <p className="text-white text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
    </div>
  );
}
