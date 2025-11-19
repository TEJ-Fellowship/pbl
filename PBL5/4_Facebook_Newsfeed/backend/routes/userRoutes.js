const router = require("express").Router()
const {handleFollow,handleGetPosts,handleGetFeed} = require("../controllers/userController")

router.post("/:id/follow", handleFollow)
router.get("/:id/posts", handleGetPosts)
router.get("/feed", handleGetFeed)

module.exports = router
