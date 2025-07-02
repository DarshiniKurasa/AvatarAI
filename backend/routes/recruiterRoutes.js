const express = require("express");
const router = express.Router();
const {
  shortlistCandidate,
  rejectCandidate,
  getShortlistedCandidates,
  getRejectedCandidates,
  getCandidates,
  bookmarkCandidate,
  getBookmarkedCandidates,
  getAllRecruiters,
  getProfile,
  updateProfile,
  uploadAvatar,     // ✅ Add this
  getAvatar         // ✅ And this
} = require("../controllers/recruiterController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Public route - no auth required
router.get("/all", getAllRecruiters);

// All other routes require authentication
router.use(authMiddleware);

// Profile routes - these need to be before the role middleware
// since they only need authentication, not role checking
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// All other routes require recruiter role
router.use(roleMiddleware("recruiter"));

// Candidate management routes
router.post("/shortlist/:id", shortlistCandidate);
router.post("/reject/:id", rejectCandidate);
router.get("/shortlisted", getShortlistedCandidates);
router.get("/rejected", getRejectedCandidates);
router.get("/candidates", getCandidates);

// Bookmark routes
router.post("/bookmark", bookmarkCandidate);
router.get("/bookmarked", getBookmarkedCandidates);

// Configure multer storage for avatar uploads
const storage = multer.memoryStorage();
const avatarUpload = multer({ storage: storage });

// Add this route before the module.exports line
router.post("/avatar", authMiddleware, avatarUpload.single("avatar"), uploadAvatar);
router.get("/avatar", authMiddleware, getAvatar);

module.exports = router;
