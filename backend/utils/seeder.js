require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Recruiter = require("../models/Recruiter");
const Job = require("../models/Job");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Application = require("../models/Application");
const Pitch = require("../models/Pitch");
const Avatar = require("../models/Avatar");
const connectDB = require("../config/db");
const IMAGEKIT_URL = process.env.IMAGEKIT_URL_ENDPOINT;

// Sample data for users
const users = [
  {
    email: "amit.verma@example.com",
    password: "amitSecure2024",
    role: "user",
    fullName: "Amit Verma",
    phone: "+91 98765 43210",
    location: "Pune, Maharashtra, India",
    avatar: `${IMAGEKIT_URL}/tpauozgxh/amit.png?updatedAt=1750491534480`,
    linkedin: "linkedin.com/in/amitverma-autosys",
    github: "github.com/amitverma-dev",
    leetcode: "leetcode.com/amitverma",
    portfolio: "amitverma.tech",
    skills: ["Python", "CAPL", "CANalyzer", "Node.js", "Data Science"],
    education: [
      {
        institution: "Savitribai Phule Pune University",
        degree: "BE Electronics and Communication Engineering",
        year: "2009–2013",
        gpa: "3.7"
      },
      {
        institution: "ISTQB India Chapter",
        degree: "ISTQB Foundation Certification",
        year: "2014",
        gpa: "Pass"
      }
    ],
    experience: [
      {
        company: "Autotronix Solutions",
        position: "Senior Systems Engineer",
        duration: "2017–2023",
        description: "Led testing and validation for body control modules in passenger vehicles. Worked extensively on CANalyzer, test automation using Python, and issue tracking in JIRA."
      },
      {
        company: "Infocar Systems",
        position: "Embedded Systems Engineer",
        duration: "2013–2017",
        description: "Integrated hardware and software for real-time automotive systems. Supported in vehicle-level validation and diagnostics using CAN and LIN tools."
      }
    ],
    projects: [
      {
        name: "In-Vehicle CAN Communication Validator",
        tech: ["CANalyzer", "Python", "CAPL", "Excel VBA"],
        description: "Developed validation scripts to test in-vehicle communication scenarios and perform automated report generation for automotive ECUs."
      },
      {
        name: "HIL Testing Framework",
        tech: ["Python", "NI VeriStand", "Simulink", "dSPACE"],
        description: "Built Hardware-in-the-Loop setups for testing embedded control units under real-time simulation environments."
      }
    ],
    profileViews: 7,
    profileClicks: 10,
    profileLikes: 3,
    profileBookmarks: 2,
    pitchViews: 6,
    pitch: "Hi, I'm Amit Verma. I hold a Bachelor's degree in Electronics and Communication Engineering from Pune University, completed in 2013. I've worked as a Systems Engineer in the automotive domain for 9 years, focusing on embedded testing, hardware-software integration, and validation protocols. My key skills include CANalyzer, Python scripting, and real-time systems. I'm ISTQB Foundation certified and now keen to contribute to a technology-driven organization where precision engineering and quality assurance are core values.",
    video: `${IMAGEKIT_URL}/player/embed/tpauozgxh/imagespeech-0-100_enhanced%20(1).mp4?updatedAt=1750483782541&thumbnail=https%3A%2F%2Fik.imagekit.io%2Ftpauozgxh%2Fimagespeech-0-100_enhanced%2520%281%29.mp4%2Fik-thumbnail.jpg%3FupdatedAt%3D1750483782541&updatedAt=1750483782541`
  },
  {
    email: "shanti.priya@example.com",
    password: "qaPriya2024",
    role: "user",
    fullName: "Shanti Priya",
    phone: "+91 98111 22334",
    location: "New Delhi, India",
    avatar: `${IMAGEKIT_URL}/tpauozgxh/Shanti.png?updatedAt=1750491471824`,
    linkedin: "linkedin.com/in/shantipriya-qa",
    github: "github.com/shantipriya",
    leetcode: "leetcode.com/shantipriya",
    portfolio: "shantipriya.dev",
    skills: ["Java", "Python", "Selenium", "JavaScript", "UI/UX"],
    education: [
      {
        institution: "University of Delhi",
        degree: "Bachelor of Computer Applications (BCA)",
        year: "2009–2012",
        gpa: "3.8"
      },
      {
        institution: "ISTQB India",
        degree: "ISTQB Foundation Certification",
        year: "2013",
        gpa: "Pass"
      }
    ],
    experience: [
      {
        company: "FinEdge Technologies",
        position: "Senior QA Analyst",
        duration: "2016–2024",
        description: "Led the QA team in functional and regression testing for high-traffic fintech platforms. Developed and maintained automation suites using Selenium and TestNG, managed test cases and bug lifecycle via JIRA."
      },
      {
        company: "Delta FinServ",
        position: "QA Analyst",
        duration: "2012–2016",
        description: "Performed manual and API testing for core banking applications. Collaborated closely with developers in Agile sprints and ensured timely defect reporting and resolution."
      }
    ],
    projects: [
      {
        name: "Automated Banking Regression Suite",
        tech: ["Selenium", "TestNG", "Java", "JIRA"],
        description: "Built a scalable automation framework to test key banking workflows across releases. Reduced manual testing effort by 60%."
      },
      {
        name: "Payment Gateway API Validator",
        tech: ["Postman", "REST Assured", "Python"],
        description: "Designed and executed automated API tests for payment gateway integration, covering edge cases, security scenarios, and failure recovery."
      }
    ],
    profileViews: 8,
    profileClicks: 9,
    profileLikes: 5,
    profileBookmarks: 4,
    pitchViews: 5,
    pitch: "Hi, I'm Shanti Priya. I hold a Bachelor's degree in Computer Applications from Delhi University, completed in 2012. I've worked as a QA Analyst in the fintech sector for over 10 years, specializing in end-to-end functional testing, regression suites, and automation scripting. My key skills include Selenium, JIRA, API testing, Agile methodology, and defect lifecycle management. I'm ISTQB certified and now eager to contribute to an innovative organization that values precision, speed, and continuous improvement in software delivery.",
    video: `${IMAGEKIT_URL}/player/embed/tpauozgxh/imagespeech-0-100_full.mp4?updatedAt=1750483240176&thumbnail=https%3A%2F%2Fik.imagekit.io%2Ftpauozgxh%2Fimagespeech-0-100_full.mp4%2Fik-thumbnail.jpg%3FupdatedAt%3D1750483240176&updatedAt=1750483240176`
  },
  {
    email: "kevin.lang@example.com",
    password: "secureLang2024",
    role: "user",
    fullName: "Kevin Lang",
    phone: "+1 (617) 555-2290",
    location: "Boston, MA",
    avatar: `${IMAGEKIT_URL}/tpauozgxh/processed_face(1).png?updatedAt=1750491346187`,
    linkedin: "linkedin.com/in/kevin-lang-syseng",
    github: "github.com/kevinlang-dev",
    leetcode: "leetcode.com/kevinlang",
    portfolio: "kevinlang.tech",
    skills: ["Shell", "Python", "C", "React", "JavaScript"],
    education: [
      {
        institution: "Harvard University",
        degree: "BS Electronics and Communication Engineering",
        year: "2011–2015",
        gpa: "3.8"
      },
      {
        institution: "International Software Testing Qualifications Board",
        degree: "ISTQB Foundation Certification",
        year: "2016",
        gpa: "Pass"
      }
    ],
    experience: [
      {
        company: "NextSys Technologies",
        position: "Senior Systems Engineer",
        duration: "2018–2024",
        description: "Led embedded system validation and software integration for industrial control units. Developed validation protocols and automation scripts using shell and Python."
      },
      {
        company: "EdgeCore Embedded",
        position: "Systems Engineer",
        duration: "2015–2018",
        description: "Designed and tested embedded firmware for automotive microcontrollers. Worked on board bring-up and system-level diagnostics."
      }
    ],
    projects: [
      {
        name: "ECU Diagnostic Suite",
        tech: ["C", "CANoe", "Shell", "Python"],
        description: "Developed an in-house suite for automotive ECU testing covering diagnostics, bootloader, and protocol validation."
      },
      {
        name: "Embedded OS Integration",
        tech: ["Linux Kernel", "Bash", "Yocto", "GCC"],
        description: "Integrated and customized embedded Linux OS for custom boards used in smart automation systems."
      }
    ],
    profileViews: 4,
    profileClicks: 4,
    profileLikes: 1,
    profileBookmarks: 0,
    pitchViews: 2,
    pitch: "Hi, I'm Kevin Lang. I hold a Bachelor's degree in Electronics and Communication Engineering from Harvard University, completed in 2015. I've worked as a Systems Engineer in the system domain for 11 years, focusing on embedded testing, software integration, and validation protocols. My key skills include Shell scripting and Operating Systems. I'm ISTQB Foundation certified and now keen to contribute to a technology-driven organization.",
    video: `${IMAGEKIT_URL}/player/embed/tpauozgxh/imagespeech-0-100_enhanced%20(3).mp4?updatedAt=1750489508088&thumbnail=https%3A%2F%2Fik.imagekit.io%2Ftpauozgxh%2Fimagespeech-0-100_enhanced%2520%283%29.mp4%2Fik-thumbnail.jpg%3FupdatedAt%3D1750489508088&updatedAt=1750489508088`
  },
  {
    email: "linda.harris@example.com",
    password: "testqueen2024",
    role: "user",
    fullName: "Linda Harris",
    phone: "+44 7700 900456",
    location: "Birmingham, UK",
    avatar: `${IMAGEKIT_URL}/tpauozgxh/processed_face.png?updatedAt=1750490979817`,
    linkedin: "linkedin.com/in/lindaharris-qe",
    github: "github.com/lindaharris",
    leetcode: "leetcode.com/lindaharris",
    portfolio: "lindaharris.dev",
    skills: ["Java", "Selenium", "Python", "React", "Data Science"],
    education: [
      {
        institution: "Nuneaton University",
        degree: "BSc Software Engineering",
        year: "2004–2008",
        gpa: "3.6"
      },
      {
        institution: "British Computer Society",
        degree: "ISEB Foundation in Software Testing",
        year: "2009",
        gpa: "Pass"
      }
    ],
    experience: [
      {
        company: "TeleComSoft Ltd.",
        position: "Senior Test Engineer",
        duration: "2008–2024",
        description: "Led acceptance and exploratory testing for B2B telecom systems. Collaborated with cross-functional teams using Agile practices to ensure software reliability and technical investigation of bugs in test environments."
      },
      {
        company: "QA AgileWorks",
        position: "Test Consultant (Contract)",
        duration: "2017–2018",
        description: "Advised on end-to-end test strategy for government IT systems, focusing on automation feasibility and improving test efficiency in sprint cycles."
      }
    ],
    projects: [
      {
        name: "Telecom Billing Verification Suite",
        tech: ["Python", "Selenium", "JIRA", "Postman"],
        description: "Built and maintained a test suite for telecom billing APIs. Enhanced test coverage and reduced regression time by 40%."
      },
      {
        name: "Agile Test Automation Framework",
        tech: ["Java", "TestNG", "Jenkins", "Docker"],
        description: "Designed a reusable automation framework integrated with CI/CD pipelines for frequent releases in a DevOps setup."
      }
    ],
    profileViews: 9,
    profileClicks: 7,
    profileLikes: 3,
    profileBookmarks: 4,
    pitchViews: 8,
    pitch: "Hi, I'm Linda Harris. I hold a Bachelor's degree in Software Engineering from Nuneaton University, completed in 2008. I've worked as a Test Engineer at an IT & Telecoms company for 16 years, handling the entire test process—from planning to execution and reporting. My key skills include acceptance testing, exploratory testing, technical investigation, Agile, and test environments. I'm ISEB certified and now looking to bring my expertise in software quality and testing to a forward-thinking organization.",
    video: `${IMAGEKIT_URL}/player/embed/tpauozgxh/imagespeech-0-100_enhanced%20(2).mp4?updatedAt=1750485214841&thumbnail=https%3A%2F%2Fik.imagekit.io%2Ftpauozgxh%2Fimagespeech-0-100_enhanced%2520%282%29.mp4%2Fik-thumbnail.jpg%3FupdatedAt%3D1750485214841&updatedAt=1750485214841`
  }
];


const recruiters = [
  {
    email: "priya.sharma@elephantventures.com",
    password: process.env.SEEDER_USER_PASSWORD,
    role: "recruiter",
    fullName: "Priya Sharma",
    phone: "+91 98765 12345",
    location: "Mumbai, Maharashtra, India",
    linkedin: "linkedin.com/in/priyasharma",
    portfolio: "priyasharma-recruiting.com",
    company: "Elephant Ventures",
    position: "Technical Recruiting Manager",
    industry: ["Fintech", "Healthtech", "Edtech", "Blockchain"],
    about: "Recruiting leader with expertise in emerging technologies. Specialized in building engineering teams for startups and scale-ups in regulated industries like finance and healthcare.",
    profileViews: 3,
    responseRate: 95,
    avatar: "https://randomuser.me/api/portraits/women/1.jpg"
  },
  {
    email: "rajesh.kumar@techinnovators.com",
    password: process.env.SEEDER_USER_PASSWORD,
    role: "recruiter",
    fullName: "Rajesh Kumar",
    phone: "+91 99887 65432",
    location: "Bangalore, Karnataka, India",
    linkedin: "linkedin.com/in/rajeshkumar",
    portfolio: "rajeshkumar-recruiting.com",
    company: "Tech Innovators India",
    position: "Senior Technical Recruiter",
    industry: ["Software Development", "Cloud Computing", "DevOps", "AI/ML"],
    about: "Passionate technical recruiter with deep understanding of software engineering roles. Expert in identifying top talent for high-growth tech companies and innovative startups.",
    profileViews: 4,
    responseRate: 83,
    avatar: "https://randomuser.me/api/portraits/men/2.jpg"
  },
  {
    email: "anita.patel@hireVue.com",
    password: process.env.SEEDER_USER_PASSWORD,
    role: "recruiter",
    fullName: "Anita Patel",
    phone: "+91 97654 32109",
    location: "Ahmedabad, Gujarat, India",
    linkedin: "linkedin.com/in/anitapatel",
    portfolio: "anitapatel-recruiting.com",
    company: "HireVue",
    position: "Lead Talent Acquisition Specialist",
    industry: ["QA Testing", "Automation", "Embedded Systems", "Automotive"],
    about: "Specialized in quality assurance and testing recruitment. Helping companies build robust QA teams with expertise in automation, manual testing, and embedded systems validation.",
    profileViews: 2,
    responseRate: 89,
    avatar: "https://randomuser.me/api/portraits/women/2.jpg"
  },
  {
    email: "vikram.singh@cohere.com",
    password: process.env.SEEDER_USER_PASSWORD,
    role: "recruiter",
    fullName: "Vikram Singh",
    phone: "+91 98123 45678",
    location: "Gurgaon, Haryana, India",
    linkedin: "linkedin.com/in/vikramsingh",
    portfolio: "vikramsingh-recruiting.com",
    company: "Cohere",
    position: "Technical Recruiting Manager",
    industry: ["Systems Engineering", "Infrastructure", "Cybersecurity", "Networking"],
    about: "Expert in systems and infrastructure recruitment. Connecting talented engineers with companies building scalable, secure, and reliable technology platforms.",
    profileViews: 4,
    responseRate: 94,
    avatar: "https://randomuser.me/api/portraits/men/1.jpg"
  },
  {
    email: "meera.reddy@cred.com",
    password: process.env.SEEDER_USER_PASSWORD,
    role: "recruiter",
    fullName: "Meera Reddy",
    phone: "+91 94567 89012",
    location: "Hyderabad, Telangana, India",
    linkedin: "linkedin.com/in/meerareddy",
    portfolio: "meerareddy-recruiting.com",
    company: "CRED",
    position: "Senior Technical Recruiter",
    industry: ["Data Science", "Machine Learning", "Analytics", "Research"],
    about: "Data science and ML recruitment specialist. Passionate about connecting data professionals with cutting-edge companies working on AI, analytics, and research initiatives.",
    profileViews: 3,
    responseRate: 91,
    avatar: "https://randomuser.me/api/portraits/women/3.jpg"
  }
];

module.exports = { users, recruiters };

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await Recruiter.deleteMany({});
    await Job.deleteMany({});
    await Message.deleteMany({});
    await Conversation.deleteMany({});
    await Application.deleteMany({});
    await Pitch.deleteMany({});
    await Avatar.deleteMany({});
    
    console.log("Database cleared");
    
    // Create users
    const createdUsers = [];
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const newUser = await User.create({
        ...user,
        password: hashedPassword
      });
      createdUsers.push(newUser);
    }
    
    console.log(`${createdUsers.length} users created`);
    
    // Create recruiters
    const createdRecruiters = [];
    for (const recruiter of recruiters) {
      const hashedPassword = await bcrypt.hash(recruiter.password, 10);
      const newRecruiter = await Recruiter.create({
        ...recruiter,
        password: hashedPassword
      });
      createdRecruiters.push(newRecruiter);
    }
    
    console.log(`${createdRecruiters.length} recruiters created`);
    
    // Create jobs - ENSURE EVERY RECRUITER HAS AT LEAST 2 JOBS
    const jobsData = [
      // Jobs for Priya Sharma (Elephant Ventures) - Fintech, Healthtech, Edtech, Blockchain
      {
        title: "Senior Frontend Developer - Fintech",
        company: "Elephant Ventures",
        location: "Mumbai, Maharashtra, India",
        type: "Full-time",
        salary: "₹18L - ₹25L",
        description: "We are looking for a senior frontend developer to join our fintech team to build innovative financial applications. The ideal candidate has deep expertise in React and modern JavaScript frameworks.",
        requirements: [
          "5+ years of experience with React",
          "Strong knowledge of TypeScript",
          "Experience with financial applications",
          "Understanding of payment gateways"
        ],
        responsibilities: [
          "Develop and maintain fintech applications",
          "Collaborate with backend teams on API integration",
          "Ensure security and compliance standards"
        ],
        skills: ["React", "TypeScript", "JavaScript", "Redux", "Payment APIs"],
        benefits: ["Health insurance", "Stock options", "Flexible work", "Learning budget"],
        status: "Active",
        postedBy: null, // Will be set below
        views: Math.floor(Math.random() * 10) ,
        applications: 0,
        recruiterIndex: 0 // Priya Sharma
      },
      {
        title: "QA Automation Engineer - Healthtech",
        company: "Elephant Ventures",
        location: "Mumbai, Maharashtra, India",
        type: "Full-time",
        salary: "₹12L - ₹18L",
        description: "Join our healthtech division to ensure quality in healthcare applications. We need an experienced QA professional with automation expertise.",
        requirements: [
          "3+ years QA experience",
          "Selenium automation expertise",
          "Healthcare domain knowledge preferred",
          "API testing experience"
        ],
        responsibilities: [
          "Design and execute test strategies",
          "Build automation frameworks",
          "Ensure regulatory compliance testing"
        ],
        skills: ["Selenium", "Java", "Python", "API Testing", "Healthcare"],
        benefits: ["Medical insurance", "Performance bonus", "Remote work", "Certification support"],
        status: "Active",
        postedBy: null,
        views: Math.floor(Math.random() * 10),
        applications: 3,
        recruiterIndex: 0 // Priya Sharma
      },
      
      // Jobs for Rajesh Kumar (Tech Innovators India) - Software Development, Cloud Computing, DevOps, AI/ML
      {
        title: "Cloud Solutions Architect",
        company: "Tech Innovators India",
        location: "Bangalore, Karnataka, India",
        type: "Full-time",
        salary: "₹25L - ₹35L",
        description: "Lead cloud architecture initiatives for our enterprise clients. Design scalable, secure cloud solutions using modern technologies.",
        requirements: [
          "7+ years cloud architecture experience",
          "AWS/Azure certifications",
          "Strong system design skills",
          "DevOps practices knowledge"
        ],
        responsibilities: [
          "Design cloud architecture solutions",
          "Lead technical discussions with clients",
          "Mentor development teams"
        ],
        skills: ["AWS", "Azure", "System Design", "DevOps", "Kubernetes"],
        benefits: ["Competitive salary", "Stock options", "International travel", "Training budget"],
        status: "Active",
        postedBy: null,
        views: Math.floor(Math.random() * 10),
        applications: 2,
        recruiterIndex: 1 // Rajesh Kumar
      },
      {
        title: "Python Developer - AI/ML",
        company: "Tech Innovators India",
        location: "Bangalore, Karnataka, India",
        type: "Full-time",
        salary: "₹15L - ₹22L",
        description: "Join our AI/ML team to build intelligent solutions. Work with cutting-edge technologies in machine learning and data science.",
        requirements: [
          "4+ years Python development",
          "Machine learning frameworks experience",
          "Data science background",
          "Statistical analysis skills"
        ],
        responsibilities: [
          "Develop ML models and algorithms",
          "Collaborate with data science team",
          "Deploy models to production"
        ],
        skills: ["Python", "Machine Learning", "TensorFlow", "Data Science", "Statistics"],
        benefits: ["Learning opportunities", "Conference attendance", "Flexible hours", "Health coverage"],
        status: "Active",
        postedBy: null,
        views: Math.floor(Math.random() * 10),
        applications: 4,
        recruiterIndex: 1 // Rajesh Kumar
      },
      
      // Jobs for Anita Patel (HireVue) - QA Testing, Automation, Embedded Systems, Automotive
      {
        title: "Senior QA Engineer - Automotive Testing",
        company: "HireVue",
        location: "Ahmedabad, Gujarat, India",
        type: "Full-time",
        salary: "₹16L - ₹24L",
        description: "Lead quality assurance for automotive embedded systems. Work with cutting-edge automotive technologies and testing frameworks.",
        requirements: [
          "6+ years automotive QA experience",
          "Embedded systems testing",
          "CANalyzer/CANoe knowledge",
          "ISTQB certification preferred"
        ],
        responsibilities: [
          "Design automotive test strategies",
          "Lead embedded systems validation",
          "Coordinate with hardware teams"
        ],
        skills: ["Automotive Testing", "CANalyzer", "Embedded Systems", "Python", "C"],
        benefits: ["Industry leading salary", "Car allowance", "Technical training", "Health insurance"],
        status: "Active",
        postedBy: null,
        views: Math.floor(Math.random() * 10),
        applications: 1,
        recruiterIndex: 2 // Anita Patel
      },
      {
        title: "Test Automation Lead",
        company: "HireVue",
        location: "Ahmedabad, Gujarat, India",
        type: "Full-time",
        salary: "₹20L - ₹28L",
        description: "Lead our test automation initiatives across multiple projects. Build and maintain robust automation frameworks.",
        requirements: [
          "8+ years automation experience",
          "Team leadership experience",
          "Multiple automation tools expertise",
          "CI/CD pipeline knowledge"
        ],
        responsibilities: [
          "Lead automation team",
          "Design automation strategies",
          "Implement CI/CD practices"
        ],
        skills: ["Selenium", "Java", "Python", "Jenkins", "Leadership"],
        benefits: ["Leadership development", "Stock options", "Flexible work", "Premium healthcare"],
        status: "Active",
        postedBy: null,
        views: Math.floor(Math.random() * 10),
        applications: 3,
        recruiterIndex: 2 // Anita Patel
      },
      
      // Jobs for Vikram Singh (Cohere) - Systems Engineering, Infrastructure, Cybersecurity, Networking
      {
        title: "Senior Systems Engineer - Infrastructure",
        company: "Cohere",
        location: "Gurgaon, Haryana, India",
        type: "Full-time",
        salary: "₹22L - ₹30L",
        description: "Build and maintain large-scale infrastructure systems. Work with modern cloud technologies and system architecture.",
        requirements: [
          "6+ years systems engineering",
          "Linux system administration",
          "Cloud infrastructure experience",
          "Networking knowledge"
        ],
        responsibilities: [
          "Design infrastructure solutions",
          "Maintain system reliability",
          "Optimize performance and security"
        ],
        skills: ["Linux", "AWS", "Docker", "Kubernetes", "Networking"],
        benefits: ["Cutting-edge tech", "Remote work", "Learning budget", "Health coverage"],
        status: "Active",
        postedBy: null,
        views: Math.floor(Math.random() * 10),
        applications: 0,
        recruiterIndex: 3 // Vikram Singh
      },
      {
        title: "Cybersecurity Engineer",
        company: "Cohere",
        location: "Gurgaon, Haryana, India",
        type: "Full-time",
        salary: "₹18L - ₹26L",
        description: "Protect our infrastructure and applications from security threats. Implement security best practices and monitoring.",
        requirements: [
          "5+ years cybersecurity experience",
          "Security frameworks knowledge",
          "Incident response experience",
          "Security certifications preferred"
        ],
        responsibilities: [
          "Implement security measures",
          "Monitor for threats",
          "Conduct security assessments"
        ],
        skills: ["Cybersecurity", "Networking", "Python", "Security Tools", "Linux"],
        benefits: ["Security training", "Certification support", "Competitive salary", "Work-life balance"],
        status: "Active",
        postedBy: null,
        views: Math.floor(Math.random() * 10),
        applications: 0,
        recruiterIndex: 3 // Vikram Singh
      },
      
      // Jobs for Meera Reddy (CRED) - Data Science, Machine Learning, Analytics, Research
      {
        title: "Senior Data Scientist",
        company: "CRED",
        location: "Hyderabad, Telangana, India",
        type: "Full-time",
        salary: "₹20L - ₹32L",
        description: "Drive data-driven decision making at CRED. Build ML models and analytics solutions for our fintech platform.",
        requirements: [
          "5+ years data science experience",
          "Strong statistical background",
          "ML model development",
          "Fintech domain knowledge"
        ],
        responsibilities: [
          "Develop predictive models",
          "Analyze user behavior data",
          "Present insights to stakeholders"
        ],
        skills: ["Python", "Machine Learning", "Statistics", "SQL", "Data Science"],
        benefits: ["Stock options", "Learning budget", "Flexible work", "Premium benefits"],
        status: "Active",
        postedBy: null,
        views: Math.floor(Math.random() * 10),
        applications: 0,
        recruiterIndex: 4 // Meera Reddy
      }
    ];
    
    // Assign recruiters to jobs and create them
    const createdJobs = [];
    for (const jobData of jobsData) {
      const recruiterIndex = jobData.recruiterIndex;
      delete jobData.recruiterIndex; // Remove this field before creating
      
      const job = await Job.create({
        ...jobData,
        postedBy: createdRecruiters[recruiterIndex]._id
      });
      createdJobs.push(job);
    }
    
    console.log(`${createdJobs.length} jobs created`);
    
    // Create applications - Each user applies to 2-3 relevant jobs
    const applications = [];
    
    for (const user of createdUsers) {
      // Filter jobs based on user's skills and background
      let relevantJobs = [];
      
      // Amit Verma (Automotive/Systems) - matches automotive and systems jobs
      if (user.email === "amit.verma@example.com") {
        relevantJobs = createdJobs.filter(job => 
          job.title.includes("Automotive") || 
          job.title.includes("Systems") ||
          job.skills.some(skill => user.skills.includes(skill))
        );
      }
      // Shanti Priya (QA) - matches QA and testing jobs
      else if (user.email === "shanti.priya@example.com") {
        relevantJobs = createdJobs.filter(job => 
          job.title.includes("QA") || 
          job.title.includes("Test") ||
          job.skills.some(skill => user.skills.includes(skill))
        );
      }
      // Kevin Lang (Systems) - matches systems and infrastructure jobs
      else if (user.email === "kevin.lang@example.com") {
        relevantJobs = createdJobs.filter(job => 
          job.title.includes("Systems") || 
          job.title.includes("Infrastructure") ||
          job.skills.some(skill => user.skills.includes(skill))
        );
      }
      // Linda Harris (QA/Testing) - matches QA and automation jobs
      else if (user.email === "linda.harris@example.com") {
        relevantJobs = createdJobs.filter(job => 
          job.title.includes("QA") || 
          job.title.includes("Test") || 
          job.title.includes("Automation") ||
          job.skills.some(skill => user.skills.includes(skill))
        );
      }
      
      // If no relevant jobs found, take random jobs
      if (relevantJobs.length === 0) {
        relevantJobs = createdJobs;
      }
      
      // Apply to 2-3 jobs
      const numApplications = Math.min(2 + Math.floor(Math.random() * 2), relevantJobs.length);
      const shuffledRelevantJobs = [...relevantJobs].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < numApplications; i++) {
        const job = shuffledRelevantJobs[i];
        const statuses = ['Applied', 'Reviewing', 'Shortlisted', 'Rejected'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        applications.push({
          job: job._id,
          applicant: user._id,
          recruiter: job.postedBy,
          status: randomStatus,
          cv: `https://example.com/cv/${user.fullName.replace(' ', '_')}.pdf`,
          coverLetter: `Dear Hiring Manager,\n\nI am excited to apply for the ${job.title} position at ${job.company}. With my ${user.experience[0].duration} of experience in ${user.skills.slice(0, 3).join(', ')}, I believe I would be a valuable addition to your team.\n\nMy background includes ${user.experience[0].description}\n\nI am particularly drawn to this role because of my expertise in ${job.skills.filter(skill => user.skills.includes(skill)).slice(0, 2).join(' and ')}.\n\nThank you for considering my application.\n\nBest regards,\n${user.fullName}`,
          notes: randomStatus === 'Shortlisted' ? `Strong candidate with relevant ${user.skills[0]} experience` : 
                 randomStatus === 'Rejected' ? `Skills don't fully match requirements` : 
                 randomStatus === 'Reviewing' ? `Good background, reviewing technical fit` :
                 'Application received, initial review pending',
          appliedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        });
        
        // Update job applications count
        await Job.findByIdAndUpdate(job._id, { $inc: { applications: 1 } });
      }
    }
    
    const createdApplications = await Application.insertMany(applications);
    console.log(`${createdApplications.length} applications created`);
    
    // Create pitches for users (keep existing logic)
    const pitches = [];
    for (const user of createdUsers) {
      const originalUserData = users.find(u => u.email === user.email);
      
      pitches.push({
        user: user._id,
        content: originalUserData.pitch,
        videoUrl: originalUserData.video,
        views: originalUserData.pitchViews || Math.floor(Math.random() * 10),
        likes: Math.floor(Math.random() * 9)
      });
      
      await User.findByIdAndUpdate(user._id, {
        pitch: originalUserData.pitch,
        videoUrl: originalUserData.video
      });
    }
    
    const createdPitches = await Pitch.insertMany(pitches);
    console.log(`${createdPitches.length} pitches created`);
    
    // IMPORTANT: Ensure every recruiter has bookmarked candidates
    for (const recruiter of createdRecruiters) {
      // Bookmark 2-3 random candidates for each recruiter
      const numBookmarks = 2 + Math.floor(Math.random() * 2);
      const shuffledCandidates = [...createdUsers].sort(() => 0.5 - Math.random());
      const bookmarkedCandidates = shuffledCandidates.slice(0, numBookmarks).map(user => user._id);
      
      await Recruiter.findByIdAndUpdate(recruiter._id, {
        bookmarkedCandidates
      });
    }
    
    // Create conversations and messages - Each recruiter talks to 2-3 relevant candidates
    const conversations = [];
    const messages = [];
    
    for (let recruiterIndex = 0; recruiterIndex < createdRecruiters.length; recruiterIndex++) {
      const recruiter = createdRecruiters[recruiterIndex];
      const recruiterJobs = createdJobs.filter(job => job.postedBy.toString() === recruiter._id.toString());
      
      // Get candidates who applied to this recruiter's jobs
      const relevantApplications = createdApplications.filter(app => 
        app.recruiter.toString() === recruiter._id.toString()
      );
      
      // Get unique users from applications
      const candidateIds = [...new Set(relevantApplications.map(app => app.applicant.toString()))];
      const relevantCandidates = createdUsers.filter(user => 
        candidateIds.includes(user._id.toString())
      );
      
      // If no relevant candidates, use bookmarked candidates
      let selectedCandidates = relevantCandidates;
      if (selectedCandidates.length === 0) {
        const bookmarkedIds = await Recruiter.findById(recruiter._id).select('bookmarkedCandidates');
        if (bookmarkedIds && bookmarkedIds.bookmarkedCandidates.length > 0) {
          selectedCandidates = createdUsers.filter(user => 
            bookmarkedIds.bookmarkedCandidates.some(id => id.toString() === user._id.toString())
          );
        } else {
          // If still no candidates, use random candidates
          selectedCandidates = createdUsers.slice(0, 2 + Math.floor(Math.random() * 2));
        }
      }
      
      // Create conversations with candidates
      const numConversations = Math.min(2 + Math.floor(Math.random() * 2), selectedCandidates.length);
      const candidatesForConversation = selectedCandidates.slice(0, numConversations);
      
      for (const candidate of candidatesForConversation) {
        // Find a job this candidate could have applied for
        let relatedJob = recruiterJobs[0]; // Default to first job if no specific match
        
        // Try to find a specific job match
        const candidateApplication = relevantApplications.find(app => 
          app.applicant.toString() === candidate._id.toString()
        );
        
        if (candidateApplication) {
          const jobMatch = recruiterJobs.find(job => 
            job._id.toString() === candidateApplication.job.toString()
          );
          if (jobMatch) relatedJob = jobMatch;
        }
        
        // Create conversation
        const conversation = {
          participants: [
            { user: recruiter._id, userModel: 'Recruiter' },
            { user: candidate._id, userModel: 'User' }
          ],
          unreadCount: Math.floor(Math.random() * 3)
        };
        
        const createdConversation = await Conversation.create(conversation);
        conversations.push(createdConversation);
        
        // Create realistic messages based on the actual job and candidate
        const messageContents = [
          // Recruiter messages
          `Hi ${candidate.fullName}, I reviewed your profile and I'm impressed with your background in ${candidate.skills.slice(0, 2).join(' and ')}!`,
          `We have a ${relatedJob.title} position at ${relatedJob.company} that offers ${relatedJob.salary}. Would you be interested?`,
          `I noticed you have ${candidate.experience[0].duration} of experience at ${candidate.experience[0].company}. Could you tell me more about your work with ${candidate.skills[0]}?`,
          `Would you be available for a brief call this week to discuss the opportunity in more detail?`,
          
          // Candidate messages
          `Hi ${recruiter.fullName}, thank you for reaching out! I'm very interested in learning more about the opportunity.`,
          `At ${candidate.experience[0].company}, I worked extensively with ${candidate.skills.slice(0, 3).join(', ')} for ${candidate.experience[0].duration}. I believe this experience would be valuable for your team.`,
          `The role sounds exciting! Could you share more details about the team and projects I would be working on?`,
          `I'm available for a call on Tuesday or Wednesday afternoon. Looking forward to discussing this further!`,
          `I've also worked on projects involving ${candidate.skills[0]}, which I think would be relevant for this position.`
        ];
        
        // Create 4-6 messages for this conversation
        const numMessages = 4 + Math.floor(Math.random() * 3);
        
        for (let j = 0; j < numMessages; j++) {
          const isRecruiterMessage = j % 2 === 0;
          const messageDate = new Date(Date.now() - (numMessages - j) * 12 * 60 * 60 * 1000); // Every 12 hours
          
          const message = {
            sender: isRecruiterMessage ? recruiter._id : candidate._id,
            senderModel: isRecruiterMessage ? 'Recruiter' : 'User',
            receiver: isRecruiterMessage ? candidate._id : recruiter._id,
            receiverModel: isRecruiterMessage ? 'User' : 'Recruiter',
            content: messageContents[j % messageContents.length],
            read: j < numMessages - conversation.unreadCount,
            createdAt: messageDate
          };
          
          const createdMessage = await Message.create(message);
          messages.push(createdMessage);
          
          // Update last message in conversation
          if (j === numMessages - 1) {
            await Conversation.findByIdAndUpdate(createdConversation._id, {
              lastMessage: createdMessage._id,
              updatedAt: messageDate
            });
          }
        }
      }
    }
    
    console.log(`${conversations.length} conversations created`);
    console.log(`${messages.length} messages created`);
    
    // Update recruiters with shortlisted and bookmarked candidates from actual applicants
    for (const recruiter of createdRecruiters) {
      const recruiterApplications = createdApplications.filter(app => 
        app.recruiter.toString() === recruiter._id.toString()
      );
      
      const applicantIds = recruiterApplications.map(app => app.applicant);
      
      // If no applications, use random candidates
      if (applicantIds.length === 0) {
        const randomCandidates = createdUsers
          .sort(() => 0.5 - Math.random())
          .slice(0, 2 + Math.floor(Math.random() * 3))
          .map(user => user._id);
          
        await Recruiter.findByIdAndUpdate(recruiter._id, {
          shortlistedCandidates: randomCandidates.slice(0, 2),
          bookmarkedCandidates: randomCandidates,
          rejectedCandidates: []
        });
      } else {
        // Shortlist some candidates
        const shortlistedCount = Math.min(1 + Math.floor(Math.random() * 2), applicantIds.length);
        const shortlistedCandidates = applicantIds.slice(0, shortlistedCount);
        
        // Bookmark some candidates
        const bookmarkedCount = Math.min(1 + Math.floor(Math.random() * 3), applicantIds.length);
        const bookmarkedCandidates = applicantIds.slice(0, bookmarkedCount);
        
        await Recruiter.findByIdAndUpdate(recruiter._id, {
          shortlistedCandidates,
          bookmarkedCandidates,
          rejectedCandidates: []
        });
      }
    }
    
    console.log("Recruiters updated with candidate lists");
    console.log("Database seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();