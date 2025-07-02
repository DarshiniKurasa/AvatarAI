const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const User = require('../models/User');
const Recruiter = require('../models/Recruiter'); // Add Recruiter model

// Configure multer storage for resume uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/resumes');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'resume-' + uniqueSuffix + ext);
  }
});

const resumeUpload = multer({ storage: storage });

// Python service URL
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000'; // Add to .env.example: PYTHON_SERVICE_URL=http://127.0.0.1:8000

// Updated route to use your Python FastAPI service
router.post('/parse-resume', resumeUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', req.file.filename);
    
    // Store the resume file path
    const resumeFilePath = req.file.path;

    // Create FormData to send file to Python service
    const formData = new FormData();
    const fileStream = fs.createReadStream(req.file.path);
    formData.append('file', fileStream, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Call your Python FastAPI service
    const response = await axios.post(`${PYTHON_SERVICE_URL}/parse-resume`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('Python service response:', response.data);

    // Save the resume file path to the user/recruiter record if authenticated
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        try {
          // Decode the token to get user ID and role
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
          
          // Update the appropriate model based on user role
          if (decoded.role === 'user') {
            await User.findByIdAndUpdate(decoded.id, { 
              resumePath: resumeFilePath,
              updatedAt: Date.now()
            });
          } else if (decoded.role === 'recruiter') {
            await Recruiter.findByIdAndUpdate(decoded.id, { 
              resumePath: resumeFilePath,
              updatedAt: Date.now()
            });
          }
        } catch (tokenErr) {
          console.error('Token verification error:', tokenErr);
          // Continue processing even if token verification fails
        }
      }
    }

    // Return the parsed data from your Python service
    res.json({
      success: true,
      data: response.data,
      message: 'Resume parsed successfully',
      resumePath: resumeFilePath
    });

  } catch (err) {
    // Enhanced error logging
    console.error('Error parsing resume:', err);
    if (err && err.stack) {
      console.error('Stack trace:', err.stack);
    }
    // Clean up uploaded file even if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      error: 'Resume parsing failed', 
      details: err.response?.data || err.message || err.toString(),
      stack: err.stack || null
    });
  }
});

// Fallback route using external API (apilayer)
router.post('/parse-resume-external', resumeUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create the URL for the uploaded file
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/resumes/${req.file.filename}`;
    
    // Call the API Layer resume parser with the provided API key
    const apiUrl = `https://api.apilayer.com/resume_parser/url?url=${encodeURIComponent(fileUrl)}`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        apikey: 'ES4RiFmezFQ30w6fFhaRNxY9GmPx9hLb'
      },
      timeout: 30000
    });

    // Process the parsed data
    const parsedData = response.data;

    // Return the complete parsed data
    res.json({
      profileData: {
        name: parsedData.data?.attributes?.result?.candidate_name || '',
        email: parsedData.data?.attributes?.result?.candidate_email || '',
        phone: parsedData.data?.attributes?.result?.candidate_phone || ''
      },
      education: parsedData.data?.attributes?.result?.education_qualifications || [],
      experience: parsedData.data?.attributes?.result?.positions || [],
      skills: parsedData.data?.attributes?.result?.skills || [],
      rawData: parsedData
    });
  } catch (err) {
    // Enhanced error logging
    console.error('Error parsing resume (external):', err);
    if (err && err.stack) {
      console.error('Stack trace:', err.stack);
    }
    res.status(500).json({ 
      error: 'Resume parsing failed', 
      details: err.response?.data || err.message || err.toString(),
      stack: err.stack || null
    });
  }
});

// Updated upload route to use Python service
router.post('/upload', resumeUpload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received for upload:', req.file.filename);

    // Create FormData to send file to Python service
    const formData = new FormData();
    const fileStream = fs.createReadStream(req.file.path);
    formData.append('file', fileStream, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Call your Python FastAPI service
    const response = await axios.post(`${PYTHON_SERVICE_URL}/parse-resume`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Return the parsed data
    res.json({ 
      success: true,
      parsed: response.data 
    });

  } catch (err) {
    console.error('Error parsing resume:', err.response?.data || err.message);
    
    // Clean up uploaded file even if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Resume parsing failed', 
      details: err.response?.data || err.message 
    });
  }
});

module.exports = router;