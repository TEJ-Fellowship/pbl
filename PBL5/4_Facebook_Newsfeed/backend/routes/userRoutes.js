const router = require("express").Router()
const {handleFollow,handleGetPosts} = require("../controllers/userController")

router.post("/:id/follow", handleFollow)
router.get("/:id/posts", handleGetPosts)


module.exports = router
