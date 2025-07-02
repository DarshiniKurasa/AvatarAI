require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Recruiter = require('./models/Recruiter');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    const users = await User.find({});
    const recruiters = await Recruiter.find({});
    
    console.log('Users in database:', users.length);
    users.forEach(u => console.log('User:', u.email, u.role));
    
    console.log('Recruiters in database:', recruiters.length);
    recruiters.forEach(r => console.log('Recruiter:', r.email, r.role));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers(); 