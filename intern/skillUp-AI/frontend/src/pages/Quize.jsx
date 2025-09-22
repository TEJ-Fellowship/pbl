
import { Link } from "react-router-dom";
import arrowback from "../../assets/arrow_back.png";

const Quize = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background overlay (z-0) */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-violet-400/10 to-fuchsia-400/10 animate-pulse z-0"></div>
      {/* Main content (z-10) */}
      <div className="relative z-10 flex gap-x-7 p-3 h-screen overflow-hidden">
        <div className="bg-slate-800/80 w-full backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 relative overflow-hidden">
        {/* Arrow button (z-20 so it stays clickable) */}
      <Link to="/dashboard" className="relative z-20">
        <img alt="arrowback" src={arrowback} className="mt-[2px] ml-[2px]"/>
      </Link>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400"></div>
        </div>
      </div>
    </div>
  );
};

export default Quize;
