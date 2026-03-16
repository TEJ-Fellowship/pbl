import NavbarUser from "./NavbarUser.jsx";

function Navbar({ user, onLogout, onLoginClick, onGoToToday, onAddEvent }) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Tej Patro</h1>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onGoToToday?.()}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Today
          </button>
          <NavbarUser user={user} />
          {user && (
            <button
              type="button"
              onClick={() => onAddEvent?.()}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Add event
            </button>
          )}
          {user ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Log out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onLoginClick?.()}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
