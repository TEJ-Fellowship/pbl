const router = require("express").Router()
const {handlePost,handleLike,handleComment} = require("../controllers/postController")



router.post("/", handlePost)
router("/:id/like", handleLike)
router("/:id/comment", handleComment)


module.exports = router
