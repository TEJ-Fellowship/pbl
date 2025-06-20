// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <Icon className={color} size={24} />
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-gray-400 text-sm">{title}</div>
    </div>
  );

  export default StatsCard;