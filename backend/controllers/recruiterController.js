const User = require("../models/User");
const Recruiter = require("../models/Recruiter");
const Job = require("../models/Job");
const Avatar = require("../models/Avatar");
const Message = require("../models/Message");
const mixpanel = require("../mixpanel");
const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Profile Management
exports.getProfile = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.user.id).select("-password");
    if (!recruiter) return res.status(404).json({ msg: "Recruiter not found" });
    
    res.json(recruiter);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { 
    fullName, phone, location, company, position,
    industry, about, linkedin, github, portfolio 
  } = req.body;

  try {
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;
    if (company) updateData.company = company;
    if (position) updateData.position = position;
    if (industry) updateData.industry = industry;
    if (about) updateData.about = about;
    if (linkedin) updateData.linkedin = linkedin;
    if (github) updateData.github = github;
    if (portfolio) updateData.portfolio = portfolio;
    
    const recruiter = await Recruiter.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select("-password");

    mixpanel.track("Recruiter Profile Updated", {
      distinct_id: req.user.id,
    });

    res.json({ msg: "Profile updated successfully", recruiter });
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
      userModel: 'Recruiter'
    });

    if (avatar) {
      // Update existing avatar
      avatar = await Avatar.findOneAndUpdate(
        { 
          user: req.user.id,
          userModel: 'Recruiter'
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
        userModel: 'Recruiter',
        settings,
        imageUrl
      });

      await avatar.save();
    }

    mixpanel.track("Recruiter Avatar Created", {
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
      userModel: 'Recruiter'
    });
    
    if (!avatar) {
      return res.status(404).json({ msg: "Avatar not found" });
    }
    
    res.json(avatar);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
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

    // Update the recruiter's avatar field in the database
    const recruiter = await Recruiter.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    if (!recruiter) {
      return res.status(404).json({ error: "Recruiter not found" });
    }

    // Track the event in mixpanel
    mixpanel.track("Recruiter Avatar Updated", {
      distinct_id: req.user.id,
    });

    res.json({ 
      message: "Avatar uploaded successfully", 
      avatarUrl: avatarUrl,
      recruiter: recruiter
    });
  } catch (err) {
    console.error("Error uploading avatar:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Get avatar
exports.getAvatar = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.user.id).select("avatar");
    
    if (!recruiter) {
      return res.status(404).json({ error: "Recruiter not found" });
    }
    
    if (!recruiter.avatar) {
      return res.status(404).json({ error: "Avatar not found" });
    }
    
    res.json({ avatarUrl: recruiter.avatar });
  } catch (err) {
    console.error("Error getting avatar:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Job Management
exports.createJob = async (req, res) => {
  const { 
    title, company, location, type, salary, description, skills, status 
  } = req.body;

  try {
    const job = new Job({
      title,
      company,
      location,
      type,
      salary,
      description,
      skills,
      status: status || 'Active',
      recruiter: req.user.id
    });

    await job.save();

    mixpanel.track("Job Created", {
      distinct_id: req.user.id,
      job_title: title,
      company,
      job_type: type
    });

    res.status(201).json({ 
      msg: "Job created successfully", 
      job 
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.updateJob = async (req, res) => {
  const { 
    title, company, location, type, salary, description, skills, status 
  } = req.body;
  const jobId = req.params.id;

  try {
    let job = await Job.findById(jobId);
    
    if (!job) return res.status(404).json({ msg: "Job not found" });
    
    // Check if the recruiter owns this job
    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized to update this job" });
    }
    
    const updateData = {};
    if (title) updateData.title = title;
    if (company) updateData.company = company;
    if (location) updateData.location = location;
    if (type) updateData.type = type;
    if (salary) updateData.salary = salary;
    if (description) updateData.description = description;
    if (skills) updateData.skills = skills;
    if (status) updateData.status = status;
    updateData.updatedAt = Date.now();
    
    job = await Job.findByIdAndUpdate(
      jobId,
      updateData,
      { new: true }
    );

    mixpanel.track("Job Updated", {
      distinct_id: req.user.id,
      job_id: jobId,
      job_title: job.title,
      status: job.status
    });

    res.json({ 
      msg: "Job updated successfully", 
      job 
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.deleteJob = async (req, res) => {
  const jobId = req.params.id;

  try {
    const job = await Job.findById(jobId);
    
    if (!job) return res.status(404).json({ msg: "Job not found" });
    
    // Check if the recruiter owns this job
    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized to delete this job" });
    }
    
    await Job.findByIdAndDelete(jobId);

    mixpanel.track("Job Deleted", {
      distinct_id: req.user.id,
      job_id: jobId,
      job_title: job.title
    });

    res.json({ msg: "Job deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user.id })
      .sort({ postedDate: -1 });
    
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getJobById = async (req, res) => {
  const jobId = req.params.id;

  try {
    const job = await Job.findById(jobId);
    
    if (!job) return res.status(404).json({ msg: "Job not found" });
    
    // Check if the recruiter owns this job
    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized to view this job" });
    }
    
    res.json(job);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Candidate Management
exports.getJobApplicants = async (req, res) => {
  const jobId = req.params.id;

  try {
    const job = await Job.findById(jobId)
      .populate('applicants.user', '-password');
    
    if (!job) return res.status(404).json({ msg: "Job not found" });
    
    // Check if the recruiter owns this job
    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized to view applicants" });
    }
    
    res.json(job.applicants);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.updateApplicantStatus = async (req, res) => {
  const { jobId, applicantId, status } = req.body;

  try {
    const job = await Job.findById(jobId);
    
    if (!job) return res.status(404).json({ msg: "Job not found" });
    
    // Check if the recruiter owns this job
    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized to update applicant status" });
    }
    
    // Find the applicant
    const applicantIndex = job.applicants.findIndex(
      app => app.user.toString() === applicantId
    );
    
    if (applicantIndex === -1) {
      return res.status(404).json({ msg: "Applicant not found" });
    }
    
    // Update status
    job.applicants[applicantIndex].status = status;
    await job.save();
    
    mixpanel.track("Applicant Status Updated", {
      distinct_id: req.user.id,
      job_id: jobId,
      applicant_id: applicantId,
      status
    });
    
    res.json({ 
      msg: "Applicant status updated successfully",
      applicant: job.applicants[applicantIndex]
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.shortlistCandidate = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.user.id);
    const candidateId = req.params.id;

    if (!recruiter) return res.status(403).json({ message: "Access denied" });

    if (!recruiter.shortlistedCandidates.includes(candidateId)) {
      recruiter.shortlistedCandidates.push(candidateId);
      recruiter.rejectedCandidates = recruiter.rejectedCandidates.filter(
        (id) => id.toString() !== candidateId
      );
      await recruiter.save();
    }

    mixpanel.track("Candidate Shortlisted", {
      distinct_id: req.user.id,
      candidate_id: candidateId
    });

    res.json({ message: "Candidate shortlisted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error shortlisting candidate", error: err.message });
  }
};

exports.rejectCandidate = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.user.id);
    const candidateId = req.params.id;

    if (!recruiter) return res.status(403).json({ message: "Access denied" });

    if (!recruiter.rejectedCandidates.includes(candidateId)) {
      recruiter.rejectedCandidates.push(candidateId);
      recruiter.shortlistedCandidates = recruiter.shortlistedCandidates.filter(
        (id) => id.toString() !== candidateId
      );
      await recruiter.save();
    }

    mixpanel.track("Candidate Rejected", {
      distinct_id: req.user.id,
      candidate_id: candidateId
    });

    res.json({ message: "Candidate rejected successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error rejecting candidate", error: err.message });
  }
};

exports.getShortlistedCandidates = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.user.id).populate(
      "shortlistedCandidates",
      "-password"
    );
    res.json(recruiter.shortlistedCandidates || []);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching shortlisted candidates",
      error: err.message,
    });
  }
};

exports.getRejectedCandidates = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.user.id).populate(
      "rejectedCandidates",
      "-password"
    );
    res.json(recruiter.rejectedCandidates || []);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching rejected candidates",
      error: err.message,
    });
  }
};

exports.getCandidates = async (req, res) => {
  try {
    const filters = { role: "user" }; // Changed from "Jobseeker" to "user"

    // Optional: add more filters from query string
    if (req.query.skills) {
      filters.skills = { $in: req.query.skills.split(",") };
    }
    
    if (req.query.location) {
      filters.location = { $regex: req.query.location, $options: 'i' };
    }
    
    if (req.query.availability) {
      filters.availability = req.query.availability;
    }

    const candidates = await User.find(filters).select("-password");
    res.json(candidates);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching candidates", error: err.message });
  }
};

// Messaging
exports.sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;

  try {
    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ msg: "Receiver not found" });
    
    const message = new Message({
      sender: req.user.id,
      senderModel: 'Recruiter',
      receiver: receiverId,
      receiverModel: 'User',
      content
    });
    
    await message.save();
    
    mixpanel.track("Message Sent", {
      distinct_id: req.user.id,
      receiver_id: receiverId
    });
    
    res.status(201).json({ 
      msg: "Message sent successfully", 
      message 
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  const { userId } = req.params;

  try {
    // Get messages between recruiter and user
    const messages = await Message.find({
      $or: [
        { 
          sender: req.user.id, 
          senderModel: 'Recruiter',
          receiver: userId,
          receiverModel: 'User'
        },
        { 
          sender: userId, 
          senderModel: 'User',
          receiver: req.user.id,
          receiverModel: 'Recruiter'
        }
      ]
    }).sort({ createdAt: 1 });
    
    // Mark messages as read
    await Message.updateMany(
      { 
        sender: userId, 
        senderModel: 'User',
        receiver: req.user.id,
        receiverModel: 'Recruiter',
        read: false
      },
      { read: true }
    );
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    // Get unique users the recruiter has messaged with
    const sentMessages = await Message.find({
      sender: req.user.id,
      senderModel: 'Recruiter'
    }).distinct('receiver');
    
    const receivedMessages = await Message.find({
      receiver: req.user.id,
      receiverModel: 'Recruiter'
    }).distinct('sender');
    
    // Combine unique user IDs
    const userIds = [...new Set([...sentMessages, ...receivedMessages])];
    
    // Get user details
    const users = await User.find({
      _id: { $in: userIds }
    }).select('_id fullName');
    
    // Get last message and unread count for each conversation
    const conversations = await Promise.all(users.map(async (user) => {
      const lastMessage = await Message.findOne({
        $or: [
          { 
            sender: req.user.id, 
            senderModel: 'Recruiter',
            receiver: user._id,
            receiverModel: 'User'
          },
          { 
            sender: user._id, 
            senderModel: 'User',
            receiver: req.user.id,
            receiverModel: 'Recruiter'
          }
        ]
      }).sort({ createdAt: -1 });
      
      const unreadCount = await Message.countDocuments({
        sender: user._id,
        senderModel: 'User',
        receiver: req.user.id,
        receiverModel: 'Recruiter',
        read: false
      });
      
      return {
        user: {
          id: user._id,
          fullName: user.fullName
        },
        lastMessage: {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          sender: lastMessage.sender
        },
        unreadCount
      };
    }));
    
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Analytics
exports.getAnalytics = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.user.id);
    if (!recruiter) return res.status(404).json({ msg: "Recruiter not found" });

    // Get job stats
    const totalJobs = await Job.countDocuments({ recruiter: req.user.id });
    const activeJobs = await Job.countDocuments({ 
      recruiter: req.user.id,
      status: 'Active'
    });
    
    // Get applicant stats
    const jobs = await Job.find({ recruiter: req.user.id });
    const totalApplicants = jobs.reduce((sum, job) => sum + job.applicants.length, 0);
    
    // Get shortlisted and rejected counts
    const shortlistedCount = recruiter.shortlistedCandidates.length;
    const rejectedCount = recruiter.rejectedCandidates.length;
    
    res.json({
      profileViews: recruiter.profileViews || 0,
      responseRate: recruiter.responseRate || 0,
      totalJobs,
      activeJobs,
      totalApplicants,
      shortlistedCount,
      rejectedCount
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Add bookmarking functionality
exports.bookmarkCandidate = async (req, res) => {
  try {
    const { candidateId, action } = req.body;
    console.log("Bookmark request by recruiter:", req.user.id, "for candidate:", candidateId, "action:", action);

    if (!candidateId) {
      return res.status(400).json({ msg: "Candidate ID is required" });
    }

    const recruiter = await Recruiter.findById(req.user.id);

    if (!recruiter) {
      console.log("Recruiter not found for id:", req.user.id);
      return res.status(404).json({ msg: "Recruiter not found" });
    }

    // Initialize bookmarkedCandidates if it doesn't exist
    if (!recruiter.bookmarkedCandidates) {
      recruiter.bookmarkedCandidates = [];
    }

    // Handle add/remove based on action parameter
    if (action === "remove") {
      recruiter.bookmarkedCandidates = recruiter.bookmarkedCandidates.filter(
        id => id.toString() !== candidateId
      );
      await recruiter.save();
      console.log("Removed bookmark. New bookmarks:", recruiter.bookmarkedCandidates);
      res.json({ msg: "Candidate removed from bookmarks", success: true });
    } else {
      const alreadyBookmarked = recruiter.bookmarkedCandidates.some(
        id => id.toString() === candidateId
      );
      if (!alreadyBookmarked) {
        recruiter.bookmarkedCandidates.push(candidateId);
        await recruiter.save();
        console.log("Added bookmark. New bookmarks:", recruiter.bookmarkedCandidates);
      }
      res.json({ msg: "Candidate bookmarked successfully", success: true });
    }
  } catch (err) {
    console.error("Bookmark error:", err);
    if (err && err.stack) {
      console.error("Stack trace:", err.stack);
    }
    res.status(500).json({ msg: "Server error", error: err.message, stack: err.stack, success: false });
  }
};

exports.getBookmarkedCandidates = async (req, res) => {
  try {
    console.log("Fetching bookmarks for recruiter:", req.user.id);
    const recruiter = await Recruiter.findById(req.user.id).populate('bookmarkedCandidates', '-password');
    if (!recruiter) {
      return res.status(404).json({ msg: "Recruiter not found" });
    }
    console.log("Bookmarked candidates returned:", recruiter.bookmarkedCandidates);
    res.json(recruiter.bookmarkedCandidates || []);
  } catch (err) {
    console.error("Error fetching bookmarked candidates:", err);
    if (err && err.stack) {
      console.error("Stack trace:", err.stack);
    }
    res.status(500).json({ msg: "Server error", error: err.message, stack: err.stack });
  }
};

exports.getAllRecruiters = async (req, res) => {
  try {
    const filters = { role: "recruiter" }; // Changed from "Recruiter" to "recruiter"

    // Optional: add more filters from query string
    if (req.query.company) {
      filters.company = { $regex: req.query.company, $options: 'i' };
    }
    
    if (req.query.industry) {
      filters.industry = { $in: req.query.industry.split(",") };
    }

    const recruiters = await Recruiter.find(filters).select("-password");
    res.json(recruiters);
  } catch (err) {
    res.status(500).json({ message: "Error fetching recruiters", error: err.message });
  }
};
