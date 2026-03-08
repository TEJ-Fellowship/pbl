function profile(req, res) {
  if (!req.isAuthenticated()) {
    return res.send("Not logged in");
  }

  res.send(`
    <h1>Profile</h1>
    <p>Name: ${req.user.displayName}</p>
    <p>Email: ${req.user.emails[0].value}</p>
    <a href="/auth/logout">Logout</a>
  `);
}

function logout(req, res) {
  req.logout((err) => {
    if (err) {
      return res.redirect("/");
    }
    res.redirect("/");
  });
}

module.exports = {
  profile,
  logout,
};
