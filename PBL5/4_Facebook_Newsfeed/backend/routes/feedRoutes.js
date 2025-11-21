const router = require("express").Router()
const { handleGetFeed } = require("../controllers/feedController")

// Get feed for a specific user (posts from users they follow)
// Example: GET /api/feed/1?limit=10&offset=0
router.get("/:id", handleGetFeed)

module.exports = router