const router = require("express").Router()
const { handleGetFeed } = require("../controllers/feedController")

// Get feed for a specific user (posts from users they follow)
router.get("/", handleGetFeed)

module.exports = router