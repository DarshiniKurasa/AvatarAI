const User = require("../models/User");
const Recruiter = require("../models/Recruiter");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/jwt");

// Register a user or recruiter
exports.register = async (req, res) => {
  const { email, password, role, fullName } = req.body;

  try {
    const Model = role === "recruiter" ? Recruiter : User;
    const existing = await Model.findOne({ email });
    if (existing)
      return res.status(400).json({ msg: "User with this email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await Model.create({
      email,
      password: hashed,
      role,
      fullName,
    });

    res.status(201).json({
      msg: "Registration successful",
      token: generateToken(user),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Login a user or recruiter
exports.login = async (req, res) => {
  const { email, password, role } = req.body;
  
  console.log('Login attempt:', { email, role }); // Debug log

  try {
    const Model = role === "recruiter" ? Recruiter : User;
    const user = await Model.findOne({ email });
    
    console.log('User found:', user ? 'Yes' : 'No'); // Debug log
    
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    console.log('Password match:', match); // Debug log
    
    if (!match) return res.status(400).json({ msg: "Invalid credentials" });

    const token = generateToken(user);
    console.log('Token generated successfully'); // Debug log

    res.json({
      msg: "Login successful",
      token: token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    });
  } catch (err) {
    console.error('Login error:', err); // Debug log
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Get authenticated user info
exports.getMe = async (req, res) => {
  try {
    const Model = req.user.role === "recruiter" ? Recruiter : User;
    const user = await Model.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
