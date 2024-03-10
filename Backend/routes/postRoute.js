const express = require('express');
const router = express.Router();
const { createPost, getMyPosts, getMySinglePost, updateMyPost, deleteMyPost } = require('../controllers/postController');
const {isAuthenticatedUser } = require('../middleware/auth');

// Create a new post
router.post('/new',isAuthenticatedUser, createPost);

// Get all posts of the logged-in user
router.get('/all',isAuthenticatedUser, getMyPosts);

// Get a single post of the logged-in user
router.get('/single/:id',isAuthenticatedUser, getMySinglePost);

// Update a post of the logged-in user
router.put('/update/:id',isAuthenticatedUser, updateMyPost);

// Delete a post of the logged-in user
router.delete('/delete/:id',isAuthenticatedUser, deleteMyPost);

module.exports = router;
