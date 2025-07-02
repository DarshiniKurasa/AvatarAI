const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  getProfile,
  updateProfile,
  uploadResume,
  createPitch,
  updatePitch,
  getPitch,
  createAvatar,
  getAvatar,
  uploadAvatar,
  applyForJob,
  getMyApplications,
  getAnalytics,
  incrementAnalytics,
  getPublicProfile,
  getPublicPitch,
  getUserById,
  getAllUsers,
  getLeaderboard,
  generateAvatarVideo,
  generateAvatarVideoAsync,
  getVideoJobStatus,
  stopVideoJob
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const User = require("../models/User");

// 📌 Public routes
router.get("/all", getAllUsers);
router.get("/public/:id", getPublicProfile);
router.get("/public/:id/pitch", getPublicPitch);
router.post("/analytics/:id", incrementAnalytics);

// Add leaderboard route
router.get("/leaderboard", authMiddleware, getLeaderboard);

// 📌 Protected routes (require authentication)
router.use(authMiddleware);

// User profile
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Configure multer storage for avatar uploads
const storage = multer.memoryStorage();
const avatarUpload = multer({ storage: storage });
const resumeUpload = multer({ storage: storage });

// User profile
router.post("/resume", resumeUpload.single('file'), uploadResume);

// Pitch
router.post("/pitch", createPitch);
router.put("/pitch", updatePitch);
router.get("/pitch", getPitch);  // Add this line
router.get("/analytics", getAnalytics);

// Get user by ID
router.get("/:id", getUserById);

// Fetch all users with role 'user'
router.get("/", async (req, res) => {
  try {
    const users = await User.find({ role: "user" });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ✅ Avatar routes
// Add this route before the module.exports line
router.post("/avatar", authMiddleware, avatarUpload.single("avatar"), uploadAvatar);
router.get("/avatar", authMiddleware, getAvatar);

// Avatar video generation
router.post("/avatar/generate-video", generateAvatarVideoAsync);
router.get("/avatar/generate-video/status/:jobId", getVideoJobStatus);
router.post("/avatar/generate-video/stop/:jobId", stopVideoJob);

module.exports = router;
