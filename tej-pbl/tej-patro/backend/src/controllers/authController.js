
function logout(req, res) {
  req.logout((err) => {
    if (err) {
      return res.redirect("/");
    }
    res.redirect("/");
  });
}

module.exports = {
  logout,
};
