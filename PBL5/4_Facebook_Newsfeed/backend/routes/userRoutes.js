const router = require("express").Router()
const { handleFollow, handleGetPosts } = require("../controllers/userController")

// User routes - all user-related operations
router.post("/:id/follow", handleFollow) // Follow/unfollow a user
router.get("/:id/posts", handleGetPosts) // Get posts by a specific user

module.exports = router
