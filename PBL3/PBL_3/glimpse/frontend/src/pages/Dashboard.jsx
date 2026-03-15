import Sidebar from '../components/Sidebar';
import Timeline from '../pages/Timeline';

const Dashboard = () => {
  return (
    <div className="min-h-screen flex bg-[#0d0b14]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Timeline (grid of clips with dates) */}
        <Timeline />
      </div>
    </div>
  );
};

export default Dashboard;
