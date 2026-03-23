//get the current user
function getMe(req, res) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const { googleId, ...userData } = req.user.toObject();
  res.json({ user: userData });
}

//logout the user
function logout(req, res) {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        return res.status(500).json({ error: destroyErr.message });
      }
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
      return res.json({ message: "Logged out successfully" });
    });
  });
}

module.exports = {
  getMe,
  logout,
};
