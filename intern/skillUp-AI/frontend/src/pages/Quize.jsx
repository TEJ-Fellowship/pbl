import { Link } from "react-router-dom";
const Quize = () => {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-violet-400/10 to-fuchsia-400/10 animate-pulse"></div>

        <div className="relative z-10 flex gap-x-7 p-6 h-screen overflow-hidden">
          <div className="bg-slate-800/80  w-full backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400"></div>
            <Link
              to="/dashboard"
              className="w-20 px-4 py-2 text-sm text-white font-semibold rounded-xl shadow-lg bg-gradient-to-r hover:scale-105 hover:shadow-xl active:scale-95 transform transition duration-300 ease-in-out"
            >
              Chats
            </Link>

            <div>Hello</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Quize;
