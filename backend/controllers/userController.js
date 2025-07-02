require('dotenv').config();
const User = require("../models/User");
const Pitch = require("../models/Pitch");
const Avatar = require("../models/Avatar");
const Job = require("../models/Job");
const mixpanel = require("../mixpanel");
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const express = require('express');
const ImageKit = require("imagekit");
const axios = require('axios');
const tmp = require('tmp');
const { v4: uuidv4 } = require('uuid');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const jobs = {};

const upload = multer({ storage: multer.memoryStorage() });

// Profile Management
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Update profile function
exports.updateProfile = async (req, res) => {
  try {
    // Only update fields that are provided in the request
    const updateData = {};
    
    // Loop through request body and add fields to updateData
    // This preserves empty fields if they're explicitly set to empty string
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Resume Management
exports.uploadResume = async (req, res) => {
  // Resume upload to ImageKit and DB is currently disabled.
  return res.status(200).json({ msg: "Resume upload to ImageKit/DB is disabled." });
};

// Pitch Management
exports.createPitch = async (req, res) => {
  // Accept either content or pitch in the request body
  const content = req.body.content || req.body.pitch;
  const videoUrl = req.body.videoUrl;

  if (!content) {
    return res.status(400).json({ msg: "Pitch content is required" });
  }

  try {
    // Create new pitch
    const pitch = new Pitch({
      user: req.user.id,
      content,
      videoUrl
    });

    await pitch.save();

    // Update User model with the new pitch and videoUrl
    await User.findByIdAndUpdate(
      req.user.id,
      { pitch: content, ...(videoUrl ? { videoUrl } : {}) },
      { new: true }
    );

    mixpanel.track("Pitch Created", {
      distinct_id: req.user.id,
    });

    res.status(201).json({ 
      msg: "Elevator pitch created successfully", 
      pitch 
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.updatePitch = async (req, res) => {
  // Accept either content or pitch in the request body
  const content = req.body.content || req.body.pitch;
  const videoUrl = req.body.videoUrl;

  if (!content) {
    return res.status(400).json({ msg: "Pitch content is required" });
  }

  try {
    // Update User model
    await User.findByIdAndUpdate(
      req.user.id,
      { pitch: content, ...(videoUrl ? { videoUrl } : {}) },
      { new: true }
    );

    // Update or create Pitch model
    let pitch = await Pitch.findOne({ user: req.user.id });
    if (pitch) {
      // Update existing pitch
      pitch = await Pitch.findOneAndUpdate(
        { user: req.user.id },
        { 
          content, 
          videoUrl,
          updatedAt: Date.now() 
        },
        { new: true }
      );
    } else {
      // Create new pitch
      pitch = new Pitch({
        user: req.user.id,
        content,
        videoUrl
      });
      await pitch.save();
    }

    mixpanel.track("Pitch Updated", {
      distinct_id: req.user.id,
    });

    res.json({ 
      msg: "Elevator pitch updated successfully", 
      pitch 
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getPitch = async (req, res) => {
  try {
    let pitch = await Pitch.findOne({ user: req.user.id });
    
    if (!pitch) {
      // Try to get pitch from User model if not found in Pitch model
      const user = await User.findById(req.user.id).select('pitch videoUrl');
      if (!user || !user.pitch) {
        return res.status(404).json({ msg: "Elevator pitch not found" });
      }
      // Return in the same format as Pitch model
      return res.json({
        user: req.user.id,
        content: user.pitch,
        videoUrl: user.videoUrl || null
      });
    }
    
    res.json(pitch);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Avatar Management
exports.createAvatar = async (req, res) => {
  const { settings, imageUrl } = req.body;

  try {
    let avatar = await Avatar.findOne({ 
      user: req.user.id,
      userModel: 'User'
    });

    if (avatar) {
      // Update existing avatar
      avatar = await Avatar.findOneAndUpdate(
        { 
          user: req.user.id,
          userModel: 'User'
        },
        { 
          settings, 
          imageUrl,
          updatedAt: Date.now() 
        },
        { new: true }
      );
    } else {
      // Create new avatar
      avatar = new Avatar({
        user: req.user.id,
        userModel: 'User',
        settings,
        imageUrl
      });

      await avatar.save();
    }

    mixpanel.track("Avatar Created", {
      distinct_id: req.user.id,
    });

    res.status(201).json({ 
      msg: "Avatar created/updated successfully", 
      avatar 
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getAvatar = async (req, res) => {
  try {
    const avatar = await Avatar.findOne({ 
      user: req.user.id,
      userModel: 'User'
    });
    
    if (!avatar) {
      return res.status(404).json({ msg: "Avatar not found" });
    }
    
    res.json(avatar);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Job Application
exports.applyForJob = async (req, res) => {
  const { jobId, cv } = req.body;

  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });
    
    // Check if already applied
    const alreadyApplied = job.applicants.some(
      applicant => applicant.user.toString() === req.user.id
    );
    
    if (alreadyApplied) {
      return res.status(400).json({ msg: "You have already applied for this job" });
    }
    
    // Add user to applicants
    job.applicants.push({
      user: req.user.id,
      cv,
      status: 'Applied',
      appliedAt: Date.now()
    });
    
    await job.save();
    
    mixpanel.track("Job Application Submitted", {
      distinct_id: req.user.id,
      job_id: jobId,
      job_title: job.title,
      company: job.company
    });
    
    res.json({ msg: "Job application submitted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const jobs = await Job.find({
      'applicants.user': req.user.id
    }).select('title company location type salary status postedDate applicants');
    
    // Filter applicant data to only include the current user's application
    const applications = jobs.map(job => {
      const myApplication = job.applicants.find(
        app => app.user.toString() === req.user.id
      );
      
      return {
        job: {
          id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          salary: job.salary,
          status: job.status,
          postedDate: job.postedDate
        },
        status: myApplication.status,
        appliedAt: myApplication.appliedAt
      };
    });
    
    res.json(applications);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Analytics
exports.getAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Get pitch views
    const pitch = await Pitch.findOne({ user: req.user.id });
    const pitchViews = pitch ? pitch.views : 0;
    const pitchLikes = pitch ? pitch.likes : 0;
    
    res.json({
      profileViews: user.profileViews || 0,
      profileClicks: user.profileClicks || 0,
      profileLikes: user.profileLikes || 0,
      profileBookmarks: user.profileBookmarks || 0,
      pitchViews,
      pitchLikes
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.incrementAnalytics = async (req, res) => {
  const { type } = req.body;
  const userId = req.params.id;
  
  try {
    const validTypes = ['profileView', 'profileClick', 'profileLike', 'profileBookmark', 'pitchView', 'pitchLike'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ msg: "Invalid analytics type" });
    }
    
    if (type.startsWith('pitch')) {
      // Update pitch analytics
      const pitch = await Pitch.findOne({ user: userId });
      if (!pitch) return res.status(404).json({ msg: "Pitch not found" });
      
      if (type === 'pitchView') {
        pitch.views += 1;
      } else if (type === 'pitchLike') {
        pitch.likes += 1;
      }
      
      await pitch.save();
    } else {
      // Update user profile analytics
      const updateField = {};
      if (type === 'profileView') updateField.profileViews = 1;
      if (type === 'profileClick') updateField.profileClicks = 1;
      if (type === 'profileLike') updateField.profileLikes = 1;
      if (type === 'profileBookmark') updateField.profileBookmarks = 1;
      
      await User.findByIdAndUpdate(userId, { $inc: updateField });
    }
    
    mixpanel.track(type, {
      distinct_id: req.user ? req.user.id : 'anonymous',
      target_user_id: userId
    });
    
    res.json({ msg: "Analytics updated successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Public Profile
exports.getPublicProfile = async (req, res) => {
  const userId = req.params.id;
  
  try {
    const user = await User.findById(userId).select(
      "-password -email -phone"
    );
    
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    // Increment profile view
    user.profileViews += 1;
    await user.save();
    
    mixpanel.track("Profile Viewed", {
      distinct_id: req.user ? req.user.id : 'anonymous',
      target_user_id: userId
    });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getPublicPitch = async (req, res) => {
  const userId = req.params.id;
  
  try {
    const pitch = await Pitch.findOne({ user: userId });
    
    if (!pitch) return res.status(404).json({ msg: "Pitch not found" });
    
    // Increment pitch view
    pitch.views += 1;
    await pitch.save();
    
    mixpanel.track("Pitch Viewed", {
      distinct_id: req.user ? req.user.id : 'anonymous',
      target_user_id: userId
    });
    
    res.json(pitch);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    // Increment profile views
    user.profileViews += 1;
    await user.save();
    
    // Track profile view in Mixpanel
    if (req.user.role === 'recruiter') {
      mixpanel.track("Profile Viewed", {
        distinct_id: req.user.id,
        user_id: user._id,
        viewer_role: req.user.role
      });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Add this function to your userController.js file
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password");
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Avatar upload handler
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer, // multer memory storage
      fileName: req.file.originalname,
    });

    const avatarUrl = uploadResponse.url;

    // Update the user's avatar field in the database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Avatar uploaded successfully",
      avatarUrl: avatarUrl,
      user: user
    });
  } catch (err) {
    console.error("Error uploading avatar:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Get avatar
exports.getAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("avatar");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (!user.avatar) {
      return res.status(404).json({ error: "Avatar not found" });
    }
    
    res.json({ avatarUrl: user.avatar });
  } catch (err) {
    console.error("Error getting avatar:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Leaderboard functionality
exports.getLeaderboard = async (req, res) => {
  try {
    const { timeframe, category, role } = req.query;
    
    // Default values if not provided
    const selectedTimeframe = timeframe || 'month';
    const selectedCategory = category || 'views';
    const selectedRole = role || 'all';
    
    // Get all users with role 'user'
    const users = await User.find({ role: 'user' }).select("-password");
    
    if (!users || users.length === 0) {
      return res.status(404).json({ msg: "No users found" });
    }
    
    // Process users for leaderboard
    let processedUsers = users.map(user => {
      // Calculate engagement score
      const views = user.profileViews || 0;
      const interactions = (user.profileLikes || 0) + (user.profileClicks || 0) + (user.profileBookmarks || 0);
      const engagement = views > 0 ? Math.min(Math.round((interactions / views) * 100), 100) : 0;
      
      // Determine user role based on skills
      let userRole = 'developer';
      if (user.skills && user.skills.length > 0) {
        if (user.skills.some(s => ['UI', 'UX', 'Figma', 'Design'].includes(s))) {
          userRole = 'designer';
        } else if (user.skills.some(s => ['Product', 'Manager', 'Agile', 'Scrum'].includes(s))) {
          userRole = 'manager';
        }
      }
    
      // Determine title based on skills
      let title = 'Professional';
      if (user.skills && user.skills.length > 0) {
        if (user.skills.some(s => ['React', 'Angular', 'Vue', 'JavaScript', 'TypeScript'].includes(s))) {
          title = 'Frontend Developer';
        } else if (user.skills.some(s => ['Node.js', 'Java', 'Python', 'C#', '.NET', 'PHP'].includes(s))) {
          title = 'Backend Developer';
        } else if (user.skills.some(s => ['UI', 'UX', 'Figma', 'Design'].includes(s))) {
          title = 'UX Designer';
        } else if (user.skills.some(s => ['Product', 'Manager', 'Agile', 'Scrum'].includes(s))) {
          title = 'Product Manager';
        } else if (user.skills.some(s => ['Data', 'Machine Learning', 'AI', 'Python', 'TensorFlow'].includes(s))) {
          title = 'Data Scientist';
        } else {
          title = 'Full Stack Developer';
        }
      }
      
      // Generate about text if not provided
      const about = user.about || `Professional with experience in ${user.skills ? user.skills.join(', ') : 'various technologies'}. Has worked on ${user.experience ? user.experience.length : 'several'} projects or roles.`;
      
      return {
        id: user._id,
        name: user.fullName,
        title: title,
        role: userRole,
        avatar: user.avatar || '/placeholder.svg',
        views: user.profileViews || 0,
        likes: user.profileLikes || 0,
        engagement: engagement,
        email: user.email,
        phone: user.phone || 'Not provided',
        location: user.location || 'Not specified',
        experience: user.experience ? `${user.experience.length}+ years experience` : 'Experience not specified',
        skills: user.skills || [],
        about: about
      };
    });
    
    // Apply role filter if specified
    if (selectedRole !== 'all') {
      processedUsers = processedUsers.filter(user => user.role === selectedRole);
    }
    
    // Sort based on selected category
    processedUsers.sort((a, b) => {
      if (selectedCategory === 'views') return b.views - a.views;
      if (selectedCategory === 'likes') return b.likes - a.likes;
      return b.engagement - a.engagement;
    });
    
    // Add rank and badges after sorting
    processedUsers = processedUsers.map((user, index) => {
      // Determine badge based on rank
      let badge = null;
      if (index === 0) badge = 'top-performer';
      if (index === 1) badge = 'rising-star';
      if (index === 2) badge = 'consistent';
      if (index === 4) badge = 'fast-climber';
      
      // Add change percentage (placeholder for now)
      // In a real implementation, this would compare current metrics with previous period
      const change = '+' + (Math.floor(Math.random() * 20) + 1) + '%';
      
      return {
        ...user,
        rank: index + 1,
        badge,
        change
      };
    });
    
    res.json(processedUsers);
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Avatar Video Generation (multipart/form-data)
exports.generateAvatarVideoAsync = [
  express.json(),
  async (req, res) => {
    const jobId = uuidv4();
    jobs[jobId] = { status: 'pending', progress: '', pythonProcess: null };
    res.json({ jobId }); // Respond immediately

    // Start video generation in background
    (async () => {
      try {
        let avatarPath = null;
        if (req.body.avatarUrl) {
          let avatarUrl = req.body.avatarUrl;
          if (avatarUrl.startsWith('http')) {
            const tmpFile = tmp.fileSync({ postfix: path.extname(avatarUrl) });
            const writer = fs.createWriteStream(tmpFile.name);
            const response = await axios({
              method: 'get',
              url: avatarUrl,
              responseType: 'stream'
            });
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
              writer.on('finish', resolve);
              writer.on('error', reject);
            });
            avatarPath = tmpFile.name;
            // console.log(`[VideoGen][${jobId}] Downloaded avatar image to temp file: ${avatarPath}`);
          } else if (avatarUrl.startsWith('/')) {
            avatarUrl = avatarUrl.slice(1);
            avatarPath = path.join(__dirname, '..', avatarUrl);
            if (!fs.existsSync(avatarPath)) {
              // console.error(`[VideoGen][${jobId}] Avatar image file not found on server: ${avatarPath}`);
              jobs[jobId] = { status: 'error', error: 'Avatar image file not found on server.' };
              return;
            }
            // console.log(`[VideoGen][${jobId}] Using local avatar image: ${avatarPath}`);
          }
        } else {
          // console.error(`[VideoGen][${jobId}] No avatar image provided in request.`);
          jobs[jobId] = { status: 'error', error: 'No avatar image provided.' };
          return;
        }
        const { pitch, gender, nationality } = req.body;
        const videosDir = path.join(__dirname, '../uploads/videos');
        if (!fs.existsSync(videosDir)) {
          fs.mkdirSync(videosDir, { recursive: true });
          // console.log(`[VideoGen][${jobId}] Created videos directory: ${videosDir}`);
        }
        const outputVideoPath = path.join(videosDir, `video-${Date.now()}.mp4`);
        const pythonScript = path.join(__dirname, '../../Avatar/generate_video.py');
        const pythonExecutable = process.env.PYTHON_PATH || 'python';
        const args = [
          '--image', avatarPath,
          '--text', pitch,
          '--gender', gender,
          '--nationality', nationality,
          '--output', outputVideoPath
        ];
        console.log(`[VideoGen][${jobId}] Job started: ${pythonExecutable} ${pythonScript} ...`);
        const pythonProcess = spawn(pythonExecutable, [pythonScript, ...args], {
          cwd: path.join(__dirname, '../../Avatar'),
          env: { ...process.env, KMP_DUPLICATE_LIB_OK: 'TRUE' }
        });
        jobs[jobId].pythonProcess = pythonProcess;
        let errorOutput = '';
        let stdOutput = '';
        pythonProcess.stdout.on('data', (data) => {
          stdOutput += data.toString();
          const msg = data.toString().trim();
          if (/\b\d{1,3}%\b/.test(msg)) {
            jobs[jobId].progress = msg;
          }
          // Remove: console.log(`[VideoGen][${jobId}] Python stdout: ${data}`);
        });
        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
          const msg = data.toString().trim();
          if (/\b\d{1,3}%\b/.test(msg)) {
            jobs[jobId].progress = msg;
          }
          // Remove: console.error(`[VideoGen][${jobId}] Python stderr: ${data}`);
        });
        pythonProcess.on('close', async (code) => {
          // Only log job finish
          console.log(`[VideoGen][${jobId}] Job finished with code: ${code}`);
          let finalVideoPath = outputVideoPath;
          if (!fs.existsSync(finalVideoPath)) {
            const mp4Paths = [];
            const regex = /([A-Z]:[^\r\n]*?\.mp4)/gi;
            let match;
            while ((match = regex.exec(stdOutput)) !== null) {
              mp4Paths.push(match[1].trim());
            }
            let found = false;
            for (const p of mp4Paths) {
              if (fs.existsSync(p)) {
                finalVideoPath = p;
                found = true;
                // console.log(`[VideoGen][${jobId}] Found video at alternate path: ${finalVideoPath}`);
                break;
              }
            }
            if (!found) {
              // Only log critical error
              console.error(`[VideoGen][${jobId}] Video file not found after Python process.`);
              jobs[jobId] = { status: 'error', error: errorOutput };
              return;
            }
          }
          try {
            const videoBuffer = fs.readFileSync(finalVideoPath);
            // console.log(`[VideoGen][${jobId}] Read video file for upload, size: ${videoBuffer.length} bytes`);
            const uploadResponse = await imagekit.upload({
              file: videoBuffer,
              fileName: path.basename(finalVideoPath),
              folder: "/user-videos",
              useUniqueFileName: true,
            });
            const videoUrl = uploadResponse.url;
            // console.log(`[VideoGen][${jobId}] Uploaded video to ImageKit: ${videoUrl}`);
            jobs[jobId] = { status: 'success', videoUrl };
            try {
              await User.findByIdAndUpdate(req.user.id, { videoUrl });
              // console.log(`[VideoGen][${jobId}] Updated User DB with videoUrl.`);
            } catch (err) {
              // Only log critical error
              console.error(`[VideoGen][${jobId}] Failed to update user videoUrl in DB:`, err);
            }
            try {
              fs.unlinkSync(finalVideoPath);
              // console.log(`[VideoGen][${jobId}] Deleted local video file: ${finalVideoPath}`);
            } catch (err) {
              // Only log critical error
              console.error(`[VideoGen][${jobId}] Failed to delete local video file:`, err);
            }
            if (avatarPath && avatarPath.includes('tmp-')) {
              try {
                fs.unlinkSync(avatarPath);
                // console.log(`[VideoGen][${jobId}] Deleted temp avatar file: ${avatarPath}`);
              } catch (err) {
                // Only log critical error
                console.error(`[VideoGen][${jobId}] Failed to delete temp avatar file:`, err);
              }
            }
            if (code !== 0) {
              // Only log warning if process exited abnormally
              console.warn(`[VideoGen][${jobId}] Python process exited with code ${code}, but video was generated.`);
            }
          } catch (err) {
            // Only log critical error
            console.error(`[VideoGen][${jobId}] Failed to upload video to ImageKit:`, err);
            jobs[jobId] = { status: 'error', error: 'Failed to upload video to ImageKit' };
          }
        });
        pythonProcess.on('error', (err) => {
          // Only log critical error
          console.error(`[VideoGen][${jobId}] Python process error:`, err);
          jobs[jobId] = { status: 'error', error: err.message };
        });
      } catch (err) {
        // Only log critical error
        console.error(`[VideoGen][${jobId}] Server error in generateAvatarVideoAsync:`, err.message, err.stack);
        jobs[jobId] = { status: 'error', error: err.message };
      }
    })();
  }
];

exports.getVideoJobStatus = (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json(job);
};

exports.stopVideoJob = (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job || !job.pythonProcess) {
    return res.status(404).json({ message: 'Job or process not found' });
  }
  try {
    job.pythonProcess.kill('SIGTERM');
    job.status = 'stopped';
    job.progress = 'Stopped by user';
    res.json({ message: 'Job stopped' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to stop job', error: err.message });
  }
};
