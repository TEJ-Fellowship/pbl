const { User, Post, Like, Comment } = require("../models/index");

//creating the post by the user
const handlePost = async (req, res) => {
  try {
    const { user_id, content, image_urls } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Content is required" });
    }
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const post = await Post.create({
      user_id,
      content,
      image_urls,
    });
    return res.status(201).json({ message: "Post created successfully", post });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//liking the post by the user
const handleLike = async (req, res) => {
  try {
    const post_id = req.params.id;
    const { user_id } = req.body;
    if (!post_id) {
      return res.status(400).json({ error: "Post ID is required" });
    }
    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const post = await Post.findByPk(post_id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isliked = await Like.findOne({ where: { user_id, post_id } });
    if (isliked) {
      await isliked.destroy();
      return res.status(200).json({ message: "Like removed" });
    }

    const like = await Like.create({ user_id, post_id });
    return res.status(201).json({ message: "Liked successfully", like });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

//commenting on the post by the user
const handleComment = async (req, res) => {
  try {
    const post_id = req.params.id;
    const { user_id, content } = req.body;
    if (!post_id) {
      return res.status(400).json({ error: "Post ID is required" });
    }
    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Content is required" });
    }

    const post = await Post.findByPk(post_id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const comment = await Comment.create({
      user_id,
      post_id,
      content,
    });

    const commentAuthor = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: "commenter",
          attributes: ["id", "username"],
        },
      ],
    });

    return res.status(201).json({
      message: "Commented successfully",
      comment: commentAuthor,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  handlePost,
  handleLike,
  handleComment,
};
