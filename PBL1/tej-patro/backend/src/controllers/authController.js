function getMe(req, res) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const displayName =
    req.user?.displayName ||
    (req.user?.name &&
      [req.user.name.givenName, req.user.name.familyName]
        .filter(Boolean)
        .join(" ")) ||
    req.user?.emails?.[0]?.value ||
    "User";
  res.json({ displayName });
}
function logout(req, res) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  req.logout((err) => {
    if (err) {
      return res.redirect(frontendUrl);
    }
    res.redirect(frontendUrl);
  });
}

module.exports = {
  getMe,
  logout,
};
