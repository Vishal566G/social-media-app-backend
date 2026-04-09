const express = require("express");
const postRouter = express.Router();
const Post = require("../models/Post");
const auth = require("../middlewares/auth");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "social-app" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
};

// Get all posts with pagination
postRouter.get("/", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username avatar");

    const total = await Post.countDocuments();

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ message: "Server error fetching posts" });
  }
});

// Create post
postRouter.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { text } = req.body;
    let imageUrl = "";

    if (!text && !req.file) {
      return res.status(400).json({ message: "Post must have text or image" });
    }

    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    const post = await Post.create({
      author: req.user._id,
      text: text || "",
      image: imageUrl,
    });

    await post.populate("author", "username avatar");

    res.status(201).json(post);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ message: "Server error creating post" });
  }
});

// Toggle like
postRouter.put("/:id/like", auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyLiked = post.likes.includes(userId);

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      alreadyLiked
        ? { $pull: { likes: userId } }
        : { $addToSet: { likes: userId } },
      { returnDocument: "after" },
    );
    res.json({
      likes: updatedPost.likes,
      liked: !alreadyLiked,
    });
  } catch (error) {
    console.error("Toggle like error:", error);
    res.status(500).json({ message: "Server error toggling like" });
  }
});

// Add a comment
postRouter.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const comment = {
      user: req.user.id,
      userName: req.user.username,
      text,
      createdAt: new Date(),
    };

    // Use $push to add the comment to the post's comments array
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: comment } },
      { returnDocument: "after", runValidators: true },
    );

    if (!updatedPost)
      return res.status(404).json({ message: "Post not found" });

    const newComment = updatedPost.comments[updatedPost.comments.length - 1];

    res.status(201).json(newComment);
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: "Server error adding comment" });
  }
});

// Get all comments for a post
postRouter.get("/:id/comments", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select("comments");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post.comments);
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Server error fetching comments" });
  }
});

module.exports = postRouter;
