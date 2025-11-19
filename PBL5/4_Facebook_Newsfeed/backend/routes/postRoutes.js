const router = require("express").Router()
const {handlePost,handleLike,handleComment} = require("../controllers/postController")



router.post("/", handlePost)
router.post("/:id/like", handleLike)
router.post("/:id/comment", handleComment)



module.exports = router
