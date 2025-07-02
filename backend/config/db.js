const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI; // Add to .env.example: MONGO_URI=your_mongodb_uri

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
