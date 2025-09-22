import userService from "../services/userService.js";

const searchUsers = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Query parameter q is required" });
    }

    const users = await userService.searchUsers(query, req.user.userId);
    res.json(users);
    console.log("Query",query)
    console.log("Users",users)
  } catch (error) {
    console.error("search error", error)
    res.status(500).json({ error: error.message });
  }
};

export default { searchUsers };
