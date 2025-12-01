const router = require("express").Router()
const { handleCreateUser, handleFollow, handleGetPosts } = require("../controllers/userController")

// User routes - all user-related operations
router.post("/", handleCreateUser) // Create a new user
router.post("/:id/follow", handleFollow) // Follow/unfollow a user
router.get("/:id/posts", handleGetPosts) // Get posts by a specific user

module.exports = router
