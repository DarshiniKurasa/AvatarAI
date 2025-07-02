const Job = require("../models/Job");
const Application = require("../models/Application");
const User = require("../models/User");
const Recruiter = require("../models/Recruiter");
const mixpanel = require("../mixpanel");

// Create a new job
exports.createJob = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.user.id);
    if (!recruiter) return res.status(403).json({ message: "Access denied" });

    const jobData = { ...req.body, postedBy: req.user.id };
    const job = await Job.create(jobData);

    mixpanel.track("Job Created", {
      distinct_id: req.user.id,
      job_id: job._id,
      job_title: job.title,
      company: job.company
    });

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: "Error creating job", error: err.message });
  }
};

// Get all jobs
exports.getAllJobs = async (req, res) => {
  try {
    const filters = {};
    
    // Apply filters if provided
    if (req.query.title) {
      filters.title = { $regex: req.query.title, $options: 'i' };
    }
    if (req.query.location) {
      filters.location = { $regex: req.query.location, $options: 'i' };
    }
    if (req.query.type) {
      filters.type = req.query.type;
    }
    if (req.query.skills) {
      filters.skills = { $in: req.query.skills.split(',') };
    }
    
    // Only show active jobs by default
    if (!req.query.showAll) {
      filters.status = 'Active';
    }

    const jobs = await Job.find(filters)
      .populate('postedBy', 'profile.company')
      .sort({ postedDate: -1 });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching jobs", error: err.message });
  }
};

// Get jobs posted by a recruiter
exports.getRecruiterJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id })
      .sort({ postedDate: -1 });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching recruiter jobs", error: err.message });
  }
};

// Get a single job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'profile.company')
      .populate('applicants.user', 'fullName email location');

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Increment view count
    job.views += 1;
    await job.save();

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Error fetching job", error: err.message });
  }
};

// Update a job
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if the recruiter owns this job
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this job" });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedJob);
  } catch (err) {
    res.status(500).json({ message: "Error updating job", error: err.message });
  }
};

// Delete a job
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if the recruiter owns this job
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this job" });
    }

    await Job.findByIdAndDelete(req.params.id);
    
    // Also delete all applications for this job
    await Application.deleteMany({ job: req.params.id });

    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting job", error: err.message });
  }
};

// Apply for a job
exports.applyForJob = async (req, res) => {
  try {
    const { cv, coverLetter } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if user has already applied
    const existingApplication = await Application.findOne({
      job: req.params.id,
      applicant: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    // Create application
    const application = await Application.create({
      job: req.params.id,
      applicant: req.user.id,
      recruiter: job.postedBy,
      cv,
      coverLetter
    });

    // Update job applications count
    job.applications += 1;
    job.applicants.push({
      user: req.user.id,
      cv,
      coverLetter
    });
    await job.save();

    mixpanel.track("Job Application", {
      distinct_id: req.user.id,
      job_id: job._id,
      job_title: job.title,
      company: job.company
    });

    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: "Error applying for job", error: err.message });
  }
};

// Get applications for a job (recruiter only)
exports.getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if the recruiter owns this job
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view these applications" });
    }

    const applications = await Application.find({ job: req.params.id })
      .populate('applicant', 'fullName email location skills availability')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: "Error fetching applications", error: err.message });
  }
};

// Update application status (recruiter only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const job = await Job.findById(application.job);

    // Check if the recruiter owns this job
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this application" });
    }

    application.status = status;
    application.updatedAt = Date.now();
    await application.save();

    // Update status in job.applicants array
    const applicantIndex = job.applicants.findIndex(
      applicant => applicant.user.toString() === application.applicant.toString()
    );

    if (applicantIndex !== -1) {
      job.applicants[applicantIndex].status = status;
      await job.save();
    }

    mixpanel.track("Application Status Updated", {
      distinct_id: req.user.id,
      job_id: job._id,
      application_id: application._id,
      new_status: status
    });

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: "Error updating application status", error: err.message });
  }
};

// Get user's job applications
exports.getUserApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user.id })
      .populate({
        path: 'job',
        select: 'title company location type status postedDate',
        populate: {
          path: 'postedBy',
          select: 'profile.company'
        }
      })
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user applications", error: err.message });
  }
};

// Update application notes (recruiter only)
exports.updateApplicationNotes = async (req, res) => {
  // TODO: Implement logic to update application notes
  res.status(501).json({ message: "Not implemented: updateApplicationNotes" });
};

console.log('jobController.js exports:', Object.keys(module.exports));