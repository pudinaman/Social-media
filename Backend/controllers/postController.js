const Post = require("../models/postModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");

// Create a new post
exports.createPost = catchAsyncErrors(async (req, res, next) => {
  const { text } = req.body;

  const post = await Post.create({
    text,
    timestamp: Date.now(),
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    post,
  });
});

// Get all posts of the logged-in user
exports.getMyPosts = catchAsyncErrors(async (req, res, next) => {
  const posts = await Post.find({ user: req.user._id });

  res.status(200).json({
    success: true,
    posts,
  });
});

// Get a single post of the logged-in user
exports.getMySinglePost = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findOne({ _id: req.params.id, user: req.user._id });

  if (!post) {
    return next(new ErrorHandler("Post not found with this Id", 404));
  }

  res.status(200).json({
    success: true,
    post,
  });
});

// Update a post of the logged-in user
exports.updateMyPost = catchAsyncErrors(async (req, res, next) => {
  const { text } = req.body;

  let post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorHandler("Post not found with this Id", 404));
  }

  // Check if the post belongs to the logged-in user
  if (post.user.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("You are not authorized to update this post", 403));
  }

  post = await Post.findByIdAndUpdate(req.params.id, { text }, { new: true });

  res.status(200).json({
    success: true,
    post,
  });
});

// Delete a post of the logged-in user
exports.deleteMyPost = catchAsyncErrors(async (req, res, next) => {
  let post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorHandler("Post not found with this Id", 404));
  }

  // Check if the post belongs to the logged-in user
  if (post.user.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("You are not authorized to delete this post", 403));
  }

  await post.remove();

  res.status(200).json({
    success: true,
  });
});
