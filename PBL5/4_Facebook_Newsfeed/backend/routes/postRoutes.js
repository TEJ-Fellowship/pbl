const router = require("express").Router()
const { handleGetPosts, handlePost, handleLike, handleComment } = require("../controllers/postController")

// Post routes - all post-related operations
router.post("/", handlePost) // Create a post
router.post("/:id/like", handleLike) // Like/unlike a post
router.post("/:id/comment", handleComment) // Comment on a post

module.exports = router
