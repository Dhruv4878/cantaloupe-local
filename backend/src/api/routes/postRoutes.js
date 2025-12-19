// postRoutes.js

const express = require("express");
const router = express.Router();
const Post = require("../../models/postModel");
const authMiddleware = require("../middlewares/authMiddleware");

/* ======================================================
   GET: All posts (latest first)
====================================================== */
router.get("/posts", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "User ID missing" });
    }

    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Fetch posts error:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

/* ======================================================
   GET: TOTAL POST COUNT
====================================================== */
router.get("/posts/count", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const count = await Post.countDocuments({ userId });

    return res.json({ count });
  } catch (err) {
    console.error("Post count error:", err);
    return res.status(500).json({ error: "Failed to fetch post count" });
  }
});

/* ======================================================
   GET: calendar
====================================================== */
router.get('/posts/calendar', authMiddleware, async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to are required' });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // 1. Fetch safely (Ensure 'content' is selected here!)
    const posts = await Post.find({ userId: req.user.id })
      .select('createdAt schedule content') 
      .lean();

    // 2. Filter in JS (SAFE)
    const calendarPosts = posts.filter((post) => {
      let include = false;

      // Created date
      if (
        post.createdAt &&
        post.createdAt >= fromDate &&
        post.createdAt <= toDate
      ) {
        include = true;
      }

      // Scheduled entries
      if (post.schedule?.entries && Array.isArray(post.schedule.entries)) {
        for (const entry of post.schedule.entries) {
          if (
            entry.scheduledAt &&
            new Date(entry.scheduledAt) >= fromDate &&
            new Date(entry.scheduledAt) <= toDate
          ) {
            include = true;
            break;
          }
        }
      }

      return include;
    });

    return res.json({ posts: calendarPosts });
  } catch (err) {
    console.error('Calendar API crash:', err);
    return res.status(500).json({
      error: 'Calendar fetch failed',
    });
  }
});

/* ======================================================
   GET: SINGLE POST
====================================================== */
router.get("/posts/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      userId: req.user?.id,
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error("Fetch post error:", err);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

/* ======================================================
   POST: CREATE POST
====================================================== */
router.post("/posts", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "User ID missing" });
    }

    const content = req.body;

    const post = new Post({
      userId,
      content,
      schedule: content?.schedule || null,
    });

    await post.save();

    res.status(201).json({
      message: "Post created",
      post,
    });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

/* ======================================================
   PUT: UPDATE POST
====================================================== */
router.put("/posts/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await Post.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (updated.content?.schedule) {
      updated.schedule = updated.content.schedule;
      await updated.save();
    }

    res.json({
      message: "Post updated",
      post: updated,
    });
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ error: "Failed to update post" });
  }
});

/* ======================================================
   DELETE: POST
====================================================== */
router.delete("/posts/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await Post.findOneAndDelete({
      _id: req.params.id,
      userId: req.user?.id,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

module.exports = router;