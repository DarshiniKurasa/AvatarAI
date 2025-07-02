require("dotenv").config();
const cookieParser = require("cookie-parser");
const resumeParserRoute = require("./routes/resumeParser");
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const startPitchService = require('./startPitchService');
const fs = require('fs');
const path = require('path');
const userRoutes = require('./routes/userRoutes');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
connectDB();

// Start the Elevator Pitch service
const pitchService = startPitchService();

// Gracefully shut down the pitch service when the Node.js process exits
process.on('exit', () => {
  if (pitchService) {
    pitchService.kill();
  }
});

// Remove the first generic cors() middleware and place the configured one here
// CORS middleware is defined here
// First apply CORS middleware
app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Then register the resume parser route AFTER CORS is applied
// Remove these lines
// app.use('/api', resumeParserRoute);
// const resumeParserRoutes = require('./routes/resumeParser');
// app.use('/api/resume', resumeParserRoutes);

// Replace with this single registration
app.use('/api', resumeParserRoute);

// Serve static files from the uploads directory
// Add this line after the CORS middleware setup
// Add this with your other route imports
const resumeParserRoutes = require('./routes/resumeParser');

// Add this with your other app.use statements
app.use('/api/resume', resumeParserRoutes);

// Make uploads directory accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve videos statically
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')));

app.use('/api/user', userRoutes);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/recruiter", require("./routes/recruiterRoutes"));
app.use("/api/mixpanel", require("./routes/mixpanelRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/recommendations", require("./routes/recommendationRoutes"));
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
server.setTimeout(24 * 60 * 60 * 1000); // 24 hours