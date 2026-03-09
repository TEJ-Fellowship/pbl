function NavbarUser({ user }) {
  if (!user?.displayName) return null;

  return (
    <div className="flex flex-col items-end text-right">
      <span className="text-sm font-medium text-slate-800">
        {user.displayName}
      </span>
      {user.email && (
        <span className="text-xs text-slate-500">{user.email}</span>
      )}
    </div>
  );
}

export default NavbarUser;
