// UserDashboard.tsx
import ProfileAnalytics from "@/components/ProfileAnalytics";
import axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  Star,
  TrendingUp,
  Upload,
  Mail,
  Phone,
  MapPin,
  Briefcase,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UserSidebar from "@/components/UserSidebar";
import VoiceRecorder from "@/components/VoiceRecorder";
import { Edit, Video, Play } from 'lucide-react';

interface EducationEntry {
  institution: string;
  degree: string;
  year: string;
  gpa?: string;
}

interface ExperienceEntry {
  company: string;
  position: string;
  duration: string;
  description: string;
}

interface ProjectEntry {
  name: string;
  tech: string;
  description: string;
}

interface UserData {
  _id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  leetcode?: string;
  portfolio?: string;
  skills?: string;
  availability?: string;
  avatar?: string;
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  projects?: ProjectEntry[];
  videoUrl?: string;
}

interface SaveMessage {
  type: string;
  text: string;
}

const UserDashboard: React.FC = () => {
  const [userData, setUserData] = useState<UserData>({
    education: [],
    experience: [],
    projects: [],
  });
  const [activeSection, setActiveSection] = useState("profile");
  const [saveMessage, setSaveMessage] = useState<SaveMessage>({ type: "", text: "" });
  const [pitchText, setPitchText] = useState("Welcome to my profile! I'm a passionate professional with expertise in various technologies and a strong commitment to delivering exceptional results. With my diverse skill set and experience, I'm ready to contribute to your team's success and take on new challenges that drive innovation and growth.");
  const [isEditingPitch, setIsEditingPitch] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [hasGeneratedVideo, setHasGeneratedVideo] = useState(false);
  const [sentMessages, setSentMessages] = useState([]);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [gender, setGender] = useState<string>("male");
  const [nationality, setNationality] = useState<string>("");
  const [videoProgress, setVideoProgress] = useState<string>("");
  const [videoJobId, setVideoJobId] = useState<string>("");
  const [resumeStatus, setResumeStatus] = useState<string>("");
  const [uploadedResume, setUploadedResume] = useState<string>("");
  
  const resumeFileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get("http://localhost:5000/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Fetched user data:", res.data);
        setUserData(res.data);
        
        if (res.data.pitch) {
          setPitchText(res.data.pitch);
        }
        
        // Set video URL if available
        if (res.data.videoUrl) {
          setHasGeneratedVideo(true);
        }
        
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
  
    fetchUser();
  }, []);

  const handleResumeUpload = () => resumeFileRef.current?.click();
  const handleAvatarUpload = () => avatarFileRef.current?.click();

  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaveMessage({ type: "info", text: "Uploading and parsing resume..." });
    setResumeStatus("");
    setUploadedResume("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      // 1. Parse resume for elevator pitch and profile fields
      const response = await axios.post("http://localhost:5000/api/parse-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      processResumeResponse(response.data, file.name, response.data.resumePath);
      // 2. Upload resume to user db and ImageKit for universal path
      const token = localStorage.getItem("token");
      const saveRes = await axios.post("http://localhost:5000/api/user/resume", formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }
      });
      
    } catch (err: unknown) {
      // Fallback to external API for parsing only
      try {
        const response = await axios.post("http://localhost:5000/api/parse-resume-external", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        processResumeResponse(response.data, file.name, response.data.resumePath);
        // Still try to save resume to user db
        const token = localStorage.getItem("token");
        const saveRes = await axios.post("http://localhost:5000/api/user/resume", formData, {
          headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }
        });
      } catch (err2: unknown) {
        let errorMessage = "Failed to parse resume. Please try again.";
        if (
          typeof err2 === 'object' && err2 !== null &&
          'response' in err2 &&
          (err2 as any).response?.data?.error
        ) {
          errorMessage = (err2 as any).response.data.error;
        }
        setSaveMessage({ type: "error", text: errorMessage });
        setResumeStatus("");
        setUploadedResume("");
      }
    }
  };

  const processResumeResponse = (data: any, fileName?: string, resumePath?: string) => {
    const profileData = data.data?.attributes?.result || {};
    const parsedData = data.data || {};
    // Extract skills and format as string
    const skillsData = data.skills || profileData.skills || [];
    const skillsString = Array.isArray(skillsData) 
      ? skillsData.join(", ") 
      : typeof skillsData === 'string' 
        ? skillsData 
        : "";
    // Extract professional profiles from text content
    const extractProfileUrl = (text: string, platform: string) => {
      if (!text) return "";
      const regex = {
        linkedin: /linkedin\.com\/in\/([\w-]+)/i,
        github: /github\.com\/([\w-]+)/i,
        leetcode: /leetcode\.com\/([\w-]+)/i,
        portfolio: /(https?:\/\/[\w.-]+\.[\w.-]+\/?[\w\/-]*)/i
      };
      const match = text.match(regex[platform]);
      return match ? match[0] : "";
    };
    // Get text content if available
    const textContent = parsedData.text_content || "";
    
    // Create updated user data object
    const updatedUserData = {
      fullName: profileData.candidate_name || parsedData.profileData?.name || "",
      email: profileData.candidate_email || parsedData.profileData?.email || "",
      phone: profileData.candidate_phone || parsedData.profileData?.phone || "",
      location: profileData.candidate_location || parsedData.profileData?.location || "",
      linkedin: profileData.linkedin || extractProfileUrl(textContent, "linkedin") || "",
      github: profileData.github || extractProfileUrl(textContent, "github") || "",
      leetcode: profileData.leetcode || extractProfileUrl(textContent, "leetcode") || "",
      portfolio: profileData.portfolio || extractProfileUrl(textContent, "portfolio") || "",
      education: parsedData.education || profileData.education_qualifications || [],
      experience: parsedData.experience || profileData.positions || [],
      skills: skillsString || ""
    };
    
    // Update user data state
    setUserData(prev => {
      // Create merged data that preserves existing data when parsed data is empty
      const mergedData = {
        ...prev,
        fullName: profileData.candidate_name || parsedData.profileData?.name || prev.fullName || "",
        email: profileData.candidate_email || parsedData.profileData?.email || prev.email || "",
        phone: profileData.candidate_phone || parsedData.profileData?.phone || prev.phone || "",
        location: profileData.candidate_location || parsedData.profileData?.location || prev.location || "",
        linkedin: profileData.linkedin || extractProfileUrl(textContent, "linkedin") || prev.linkedin || "",
        github: profileData.github || extractProfileUrl(textContent, "github") || prev.github || "",
        leetcode: profileData.leetcode || extractProfileUrl(textContent, "leetcode") || prev.leetcode || "",
        portfolio: profileData.portfolio || extractProfileUrl(textContent, "portfolio") || prev.portfolio || "",
        education: parsedData.education || profileData.education_qualifications || prev.education || [],
        experience: parsedData.experience || profileData.positions || prev.experience || [],
        skills: skillsString || prev.skills || ""
      };
      
      return mergedData;
    });
    
    // Automatically save the updated profile to the database
    const token = localStorage.getItem("token");
    
    // Get current user data first to merge with parsed data
    axios.get("http://localhost:5000/api/user/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(currentProfileResponse => {
      const currentData = currentProfileResponse.data;
      
      // Create merged data that preserves existing data when parsed data is empty
      const mergedData = {
        fullName: profileData.candidate_name || parsedData.profileData?.name || currentData.fullName || "",
        email: profileData.candidate_email || parsedData.profileData?.email || currentData.email || "",
        phone: profileData.candidate_phone || parsedData.profileData?.phone || currentData.phone || "",
        location: profileData.candidate_location || parsedData.profileData?.location || currentData.location || "",
        linkedin: profileData.linkedin || extractProfileUrl(textContent, "linkedin") || currentData.linkedin || "",
        github: profileData.github || extractProfileUrl(textContent, "github") || currentData.github || "",
        leetcode: profileData.leetcode || extractProfileUrl(textContent, "leetcode") || currentData.leetcode || "",
        portfolio: profileData.portfolio || extractProfileUrl(textContent, "portfolio") || currentData.portfolio || "",
        education: parsedData.education || profileData.education_qualifications || currentData.education || [],
        experience: parsedData.experience || profileData.positions || currentData.experience || [],
        skills: skillsString || currentData.skills || ""
      };
      
      // Update the database with merged data
      return axios.put(
        "http://localhost:5000/api/user/profile",
        mergedData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    })
    .then(profileResponse => {
      console.log("Profile automatically updated:", profileResponse.data);
    })
    .catch(profileError => {
      console.error("Error auto-updating profile:", profileError);
    });
    
    // Generate a pitch based on the parsed resume data
    if (data.data && data.data.pitch) {
      // If the Python service already generated a pitch, use it
      const generatedPitch = data.data.pitch;
      setPitchText(generatedPitch);
      
      // Automatically save the pitch to the database
      const token = localStorage.getItem("token");
      axios.post("http://localhost:5000/api/user/pitch", 
        { content: generatedPitch },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      .then(saveResponse => {
        console.log("Pitch automatically saved:", saveResponse.data);
      })
      .catch(saveError => {
        console.error("Error auto-saving pitch:", saveError);
      });
    } else if (data.pitch) {
      // If pitch is directly in the response
      const generatedPitch = data.pitch;
      setPitchText(generatedPitch);
      
      // Automatically save the pitch to the database
      const token = localStorage.getItem("token");
      axios.post("http://localhost:5000/api/user/pitch", 
        { content: generatedPitch },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      .then(saveResponse => {
        console.log("Pitch automatically saved:", saveResponse.data);
      })
      .catch(saveError => {
        console.error("Error auto-saving pitch:", saveError);
      });
    } else {
      // Otherwise, call the pitch generation endpoint
      axios.post("http://localhost:8000/generate-pitch", {
        resume_text: (data.data?.text_content || data.text_content || "")
      })
      // Inside handleResumeFileChange function, after pitch generation
      .then(pitchResponse => {
        if (pitchResponse.data && pitchResponse.data.pitch) {
          const generatedPitch = pitchResponse.data.pitch;
          setPitchText(generatedPitch);
          
          // Automatically save the pitch to the database
          const token = localStorage.getItem("token");
          axios.post("http://localhost:5000/api/user/pitch", 
            { content: generatedPitch },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          )
          .then(saveResponse => {
            console.log("Pitch automatically saved:", saveResponse.data);
          })
          .catch(saveError => {
            console.error("Error auto-saving pitch:", saveError);
          });
        }
      })
      .catch(pitchError => {
        console.error("Error generating pitch:", pitchError);
        // Keep the current pitch text if generation fails
      });
    }
    
    setSaveMessage({ 
      type: "success", 
      text: "Resume parsed and profile updated successfully!" 
    });
    
    // Switch to profile section to show the updated profile
    setActiveSection("profile");
    setTimeout(() => setActiveSection('pitch'), 1000); // Redirect to pitch section after 1s
  };

  // Update the handleAvatarFileChange function
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Show loading state
    setSaveMessage({ type: "info", text: "Uploading avatar..." });
    
    const formData = new FormData();
    formData.append("avatar", file);
    
    // Upload the avatar
    axios.post("http://localhost:5000/api/user/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
    .then(response => {
      console.log("Avatar uploaded:", response.data);
      
      // Update user data with new avatar URL
      setUserData(prev => ({
        ...prev,
        avatar: response.data.avatarUrl
      }));
      
      setSaveMessage({ 
        type: "success", 
        text: "Avatar updated successfully!" 
      });
    })
    .catch(error => {
      console.error("Error uploading avatar:", error);
      setSaveMessage({ 
        type: "error", 
        text: "Failed to upload avatar. Please try again." 
      });
    });
  };

  // Add a function to handle the "Generate New Avatar" button click
  const handleGenerateAvatar = () => {
    if (avatarFileRef.current?.files?.length) {
      handleAvatarFileChange({ target: { files: avatarFileRef.current.files } } as React.ChangeEvent<HTMLInputElement>);
    } else {
      setSaveMessage({ 
        type: "error", 
        text: "Please select an image first." 
      });
    }
  };

  const handleSavePitch = () => {
    // Save the pitch to the backend
    const token = localStorage.getItem("token");
    
    axios.post("http://localhost:5000/api/user/pitch", 
      { content: pitchText },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    .then(response => {
      setIsEditingPitch(false);
      setSaveMessage({ 
        type: "success", 
        text: "Pitch saved successfully!" 
      });
    })
    .catch(error => {
      console.error("Error saving pitch:", error);
      setSaveMessage({ 
        type: "error", 
        text: "Failed to save pitch. Please try again." 
      });
    });
  };

  const handleGenerateVideo = async () => {
    // Check if user has an avatar
    if (!userData.avatar) {
      setSaveMessage({
        type: "error",
        text: "Please upload an avatar image first."
      });
      return;
    }
    setIsGeneratingVideo(true);
    setSaveMessage({ type: "info", text: "Generating video..." });
    setVideoProgress("");
    const token = localStorage.getItem("token");
    try {
      // Step 1: Start the video generation job
      const startRes = await axios.post(
        "http://localhost:5000/api/user/avatar/generate-video",
        {
          avatarUrl: userData.avatar,
          pitch: pitchText,
          gender: gender,
          nationality: nationality
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      const jobId = startRes.data.jobId;
      setVideoJobId(jobId); // Store jobId for stopping
      // Step 2: Poll for job status
      const pollStatus = async () => {
        try {
          const statusRes = await axios.get(
            `http://localhost:5000/api/user/avatar/generate-video/status/${jobId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          // Show progress if available
          if (statusRes.data.progress) {
            setVideoProgress(statusRes.data.progress);
          }
          if (statusRes.data.status === "success" && statusRes.data.videoUrl) {
            setIsGeneratingVideo(false);
            setHasGeneratedVideo(true);
            setUserData(prevData => ({
              ...prevData,
              videoUrl: statusRes.data.videoUrl
            }));
            setSaveMessage({
              type: "success",
              text: "Video generated and saved successfully!"
            });
            setVideoProgress(""); // Clear progress
            setVideoJobId(""); // Clear jobId
          } else if (statusRes.data.status === "error") {
            setIsGeneratingVideo(false);
            setSaveMessage({
              type: "error",
              text: statusRes.data.error || "Failed to generate video. Please try again."
            });
            setVideoProgress(""); // Clear progress
            setVideoJobId(""); // Clear jobId
          } else {
            // Still processing, poll again after a delay
            setTimeout(pollStatus, 3000);
          }
        } catch (err) {
          setIsGeneratingVideo(false);
          setSaveMessage({
            type: "error",
            text: "Failed to check video generation status."
          });
          setVideoProgress(""); // Clear progress
          setVideoJobId(""); // Clear jobId
        }
      };
      pollStatus();
    } catch (error) {
      setIsGeneratingVideo(false);
      setSaveMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to start video generation."
      });
      setVideoProgress("");
      setVideoJobId("");
    }
  };

  // Add a function to stop the video generation job
  const handleStopVideoJob = async () => {
    if (!videoJobId) return;
    setSaveMessage({ type: "info", text: "Stopping video generation..." });
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `http://localhost:5000/api/user/avatar/generate-video/stop/${videoJobId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setIsGeneratingVideo(false);
      setVideoProgress("");
      setVideoJobId("");
      setSaveMessage({ type: "success", text: "Video generation stopped." });
    } catch (err) {
      setSaveMessage({ type: "error", text: "Failed to stop video generation." });
    }
  };

  const saveProfile = async () => {
    try {
      setSaveMessage({ type: "", text: "" }); // Clear previous messages
      const token = localStorage.getItem("token");
      
      const response = await axios.put(
        "http://localhost:5000/api/user/profile",
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSaveMessage({ 
        type: "success", 
        text: "Profile updated successfully!" 
      });
      
      // Update localStorage with new name if it changed
      if (userData?.fullName) {
        localStorage.setItem("userName", userData.fullName);
      }
      
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveMessage({ 
        type: "error", 
        text: "Failed to update profile. Please try again." 
      });
    }
  };

  const renderProfileSection = () => (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-lg bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-blue-800">Professional Profile</CardTitle>
          <CardDescription className="text-blue-600">
            Complete your profile to attract top recruiters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Welcome Message */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-800">
              Welcome, {userData?.fullName || "User"}
            </h3>
          </div>
          
          {/* Resume Upload */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">
              Resume Upload
            </Label>
            <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
              <Upload className="w-10 h-10 text-blue-500 mx-auto mb-3" />
              <p className="text-sm text-gray-700 mb-3 font-medium">
                Upload your resume to Generate Pitch.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResumeUpload}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                Upload Resume
              </Button>
              <p className="text-xs text-gray-500 mt-3">PDF, DOC up to 5MB</p>
            </div>
            <input
              ref={resumeFileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeFileChange}
              className="hidden"
            />
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-semibold text-gray-700">Full Name</Label>
              <Input 
                className="mt-2 border-gray-300 focus:border-blue-500" 
                value={userData?.fullName || ""}
                onChange={(e) => setUserData({...userData, fullName: e.target.value})}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">Phone Number</Label>
              <Input 
                className="mt-2 border-gray-300 focus:border-blue-500" 
                value={userData?.phone || ""}
                onChange={(e) => setUserData({...userData, phone: e.target.value})}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">Email</Label>
              <Input 
                className="mt-2 border-gray-300 focus:border-blue-500" 
                value={userData?.email || ""}
                onChange={(e) => setUserData({...userData, email: e.target.value})}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">Location</Label>
              <Input 
                className="mt-2 border-gray-300 focus:border-blue-500" 
                value={userData?.location || ""}
                onChange={(e) => setUserData({...userData, location: e.target.value})}
              />
            </div>
          </div>

          {/* Professional Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              Professional Profiles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700">LinkedIn</Label>
                <Input 
                  className="mt-2 border-gray-300 focus:border-blue-500" 
                  value={userData?.linkedin || ""}
                  onChange={(e) => setUserData({...userData, linkedin: e.target.value})}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">GitHub</Label>
                <Input 
                  className="mt-2 border-gray-300 focus:border-blue-500" 
                  value={userData?.github || ""}
                  onChange={(e) => setUserData({...userData, github: e.target.value})}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">LeetCode</Label>
                <Input 
                  className="mt-2 border-gray-300 focus:border-blue-500" 
                  value={userData?.leetcode || ""}
                  onChange={(e) => setUserData({...userData, leetcode: e.target.value})}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">Portfolio</Label>
                <Input 
                  className="mt-2 border-gray-300 focus:border-blue-500" 
                  value={userData?.portfolio || ""}
                  onChange={(e) => setUserData({...userData, portfolio: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Skills</Label>
            <Textarea 
              className="mt-2 border-gray-300 focus:border-blue-500" 
              value={userData?.skills || ""}
              onChange={(e) => setUserData({...userData, skills: e.target.value})}
            />
          </div>

          {/* Education Section */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Education</Label>
            {(userData.education || []).map((edu, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2 items-center">
                <Input
                  className="border-gray-300 focus:border-blue-500"
                  placeholder="Institution"
                  value={edu.institution}
                  onChange={e => {
                    const updated = [...(userData.education || [])];
                    updated[idx].institution = e.target.value;
                    setUserData({ ...userData, education: updated });
                  }}
                />
                <Input
                  className="border-gray-300 focus:border-blue-500"
                  placeholder="Degree"
                  value={edu.degree}
                  onChange={e => {
                    const updated = [...(userData.education || [])];
                    updated[idx].degree = e.target.value;
                    setUserData({ ...userData, education: updated });
                  }}
                />
                <Input
                  className="border-gray-300 focus:border-blue-500"
                  placeholder="Year"
                  value={edu.year}
                  onChange={e => {
                    const updated = [...(userData.education || [])];
                    updated[idx].year = e.target.value;
                    setUserData({ ...userData, education: updated });
                  }}
                />
                <Input
                  className="border-gray-300 focus:border-blue-500"
                  placeholder="GPA (optional)"
                  value={edu.gpa || ''}
                  onChange={e => {
                    const updated = [...(userData.education || [])];
                    updated[idx].gpa = e.target.value;
                    setUserData({ ...userData, education: updated });
                  }}
                />
                <Button variant="destructive" size="sm" onClick={() => {
                  const updated = [...(userData.education || [])];
                  updated.splice(idx, 1);
                  setUserData({ ...userData, education: updated });
                }}>Remove</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setUserData({ ...userData, education: [...(userData.education || []), { institution: '', degree: '', year: '', gpa: '' }] })}>Add Education</Button>
          </div>

          {/* Experience Section */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Experience</Label>
            {(userData.experience || []).map((exp, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2 items-center">
                <Input
                  className="border-gray-300 focus:border-blue-500"
                  placeholder="Company"
                  value={exp.company}
                  onChange={e => {
                    const updated = [...(userData.experience || [])];
                    updated[idx].company = e.target.value;
                    setUserData({ ...userData, experience: updated });
                  }}
                />
                <Input
                  className="border-gray-300 focus:border-blue-500"
                  placeholder="Position"
                  value={exp.position}
                  onChange={e => {
                    const updated = [...(userData.experience || [])];
                    updated[idx].position = e.target.value;
                    setUserData({ ...userData, experience: updated });
                  }}
                />
                <Input
                  className="border-gray-300 focus:border-blue-500"
                  placeholder="Duration"
                  value={exp.duration}
                  onChange={e => {
                    const updated = [...(userData.experience || [])];
                    updated[idx].duration = e.target.value;
                    setUserData({ ...userData, experience: updated });
                  }}
                />
                <Input
                  className="border-gray-300 focus:border-blue-500"
                  placeholder="Description"
                  value={exp.description}
                  onChange={e => {
                    const updated = [...(userData.experience || [])];
                    updated[idx].description = e.target.value;
                    setUserData({ ...userData, experience: updated });
                  }}
                />
                <Button variant="destructive" size="sm" onClick={() => {
                  const updated = [...(userData.experience || [])];
                  updated.splice(idx, 1);
                  setUserData({ ...userData, experience: updated });
                }}>Remove</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setUserData({ ...userData, experience: [...(userData.experience || []), { company: '', position: '', duration: '', description: '' }] })}>Add Experience</Button>
          </div>

          {/* Projects Section */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Projects</Label>
            {(userData.projects || []).map((proj, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2 items-center">
                <Input
                  className="border-gray-300 focus:border-blue-500"
                  placeholder="Project Name"
                  value={proj.name}
                  onChange={e => {
                    const updated = [...(userData.projects || [])];
                    updated[idx].name = e.target.value;
                    setUserData({ ...userData, projects: updated });
                  }}
                />
                <Input
                  className="border-gray-300 focus:border-blue-500"
                  placeholder="Tech Stack (comma separated)"
                  value={proj.tech}
                  onChange={e => {
                    const updated = [...(userData.projects || [])];
                    updated[idx].tech = e.target.value;
                    setUserData({ ...userData, projects: updated });
                  }}
                />
                <Input
                  className="border-gray-300 focus:border-blue-500"
                  placeholder="Description"
                  value={proj.description}
                  onChange={e => {
                    const updated = [...(userData.projects || [])];
                    updated[idx].description = e.target.value;
                    setUserData({ ...userData, projects: updated });
                  }}
                />
                <Button variant="destructive" size="sm" onClick={() => {
                  const updated = [...(userData.projects || [])];
                  updated.splice(idx, 1);
                  setUserData({ ...userData, projects: updated });
                }}>Remove</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setUserData({ ...userData, projects: [...(userData.projects || []), { name: '', tech: '', description: '' }] })}>Add Project</Button>
          </div>

          {/* Availability */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Availability</Label>
            <select 
              className="w-full border border-gray-300 rounded-md px-3 py-2 mt-2 focus:border-blue-500"
              value={userData?.availability || ""}
              onChange={(e) => setUserData({...userData, availability: e.target.value})}
            >
              <option value="">Select availability</option>
              <option value="Available immediately">Available immediately</option>
              <option value="Available in 2 weeks">Available in 2 weeks</option>
              <option value="Available in 1 month">Available in 1 month</option>
              <option value="Not actively looking">Not actively looking</option>
            </select>
          </div>

          {/* Save Profile Button */}
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 hover:from-blue-700 hover:to-indigo-700"
            onClick={saveProfile}
          >
            Save Profile
          </Button>
          
          {/* Display save message if present */}
          {saveMessage.text && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              saveMessage.type === "success" 
                ? "bg-green-50 text-green-600 border border-green-200" 
                : saveMessage.type === "info"
                ? "bg-blue-50 text-blue-600 border border-blue-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}>
              {saveMessage.text}
            </div>
          )}
          {resumeStatus && (
            <div className="mt-2 text-green-600 text-sm font-medium">{resumeStatus}</div>
          )}
          {uploadedResume && (
            <div className="mt-1 text-blue-700 text-xs">Uploaded: {uploadedResume}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderAvatarSection = () => (
    <Card className="border-gray-200 shadow-lg bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-blue-800">Avatar Creation</CardTitle>
        <CardDescription className="text-blue-600">
          Create and manage your professional avatar
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="text-center">
          <div className="w-40 h-40 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            {userData?.avatar ? (
              <img src={userData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <Briefcase className="w-20 h-20 text-blue-600" />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-800">Current Avatar</h3>
          <p className="text-gray-600 mb-4">
            Upload a clear photo to generate your avatar
          </p>
        </div>
        <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
          <Upload className="w-10 h-10 text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-gray-700 mb-3 font-medium">
            Upload a new photo
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAvatarUpload}
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            Choose Photo
          </Button>
          <p className="text-xs text-gray-500 mt-3">JPG, PNG up to 2MB</p>
        </div>
        <input
          ref={avatarFileRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={handleAvatarFileChange}
          className="hidden"
        />
        
        <Button 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 hover:from-blue-700 hover:to-indigo-700"
          onClick={handleGenerateAvatar}
        >
          Generate New Avatar
        </Button>
      </CardContent>
    </Card>
  );

  const renderPitchSection = () => (
    <Card className="border-gray-200 shadow-lg bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-blue-800">Elevator Pitch</CardTitle>
        <CardDescription className="text-blue-600">Create and manage your professional pitch</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Pitch Text Display */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Your Pitch</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingPitch(!isEditingPitch)}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <Edit className="w-4 h-4 mr-1" />
              {isEditingPitch ? 'Cancel' : 'Edit'}
            </Button>
          </div>
          
          {isEditingPitch ? (
            <div className="space-y-4">
              <Textarea
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                className="min-h-[120px] border-blue-300 focus:border-blue-500"
                placeholder="Write your elevator pitch here..."
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSavePitch}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingPitch(false);
                    // Reset to original text if needed
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700 leading-relaxed">{pitchText}</p>
            </div>
          )}
        </div>

        {/* Video Generation Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Video Generation Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Voice Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nationality">Voice Accent</Label>
              <Select value={nationality} onValueChange={setNationality}>
                <SelectTrigger id="nationality">
                  <SelectValue placeholder="Select accent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="india">Indian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Generate Video Button */}
        <div className="space-y-4">
          <Button
            onClick={handleGenerateVideo}
            disabled={isGeneratingVideo || isEditingPitch}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3"
          >
            <Video className="w-5 h-5 mr-2" />
            {isGeneratingVideo ? 'Generating Video...' : 'Generate Pitch Video'}
          </Button>
          
          {isGeneratingVideo && videoProgress && (
            <div className="mt-2 text-purple-700 text-center text-sm">
              {videoProgress}
            </div>
          )}
        </div>

        {/* Generated Video Display */}
        {hasGeneratedVideo && userData?.videoUrl && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Generated Pitch Video</h4>
            {/\.(mp4|webm|ogg)$/i.test(userData.videoUrl)
              ? (
                <video
                  src={userData.videoUrl}
                  controls
                  className="w-full rounded-lg border"
                  style={{ maxHeight: '400px' }}
                >
                  Your browser does not support the video tag.
                </video>
              )
              : (
                <iframe
                  src={userData.videoUrl}
                  className="w-full rounded-lg border"
                  style={{ maxHeight: '400px', minHeight: '300px' }}
                  allowFullScreen
                  title="Pitch Video"
                  frameBorder={0}
                />
              )
            }
          </div>
        )}

        {/* Stop Video Generation Button */}
        {isGeneratingVideo && videoJobId && (
          <Button
            onClick={handleStopVideoJob}
            className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold"
            disabled={!isGeneratingVideo}
          >
            Stop Video Generation
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const renderAnalyticsSection = () => <ProfileAnalytics user={userData} />;
  
  // Add these state variables at the top of your component

  
  // Add this useEffect to fetch messages when the component mounts
  useEffect(() => {
    if (activeSection === "messaging") {
      fetchMessages();
    }
  }, [activeSection]);
  
  // Add this function to fetch messages
  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/messages', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Process messages into sent and received
      const allMessages = response.data;
      const sent = [];
      const received = [];
      
      allMessages.forEach(msg => {
        const messageObj = {
          id: msg._id,
          sender: msg.senderModel === 'Recruiter' 
            ? (msg.sender?.fullName || 'Recruiter')
            : 'You',
          receiver: msg.receiverModel === 'Recruiter'
            ? (msg.receiver?.fullName || 'Recruiter') 
            : 'You',
          content: msg.content,
          timestamp: new Date(msg.createdAt).toLocaleString(),
          status: msg.read ? 'read' : 'unread'
        };
        
        if (msg.senderModel === 'User') {
          sent.push(messageObj);
        } else {
          received.push(messageObj);
        }
      });
      
      setSentMessages(sent);
      setReceivedMessages(received);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };
  
  // Update the renderMessagingSection function
  const renderMessagingSection = () => (
    <Card className="border-gray-200 shadow-lg bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-blue-800">Messages</CardTitle>
        <CardDescription className="text-blue-600">
          Manage your conversations
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>
          <TabsContent value="received" className="space-y-4">
            {loadingMessages ? (
              <p className="text-center py-4">Loading messages...</p>
            ) : receivedMessages.length === 0 ? (
              <p className="text-center py-4">No messages received yet.</p>
            ) : (
              receivedMessages.map((message) => (
                <Card key={message.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">From: {message.sender}</h4>
                      <span className="text-sm text-gray-500">{message.timestamp}</span>
                    </div>
                    <p className="text-gray-600 mb-2">{message.content}</p>
                    <Button size="sm" variant="outline">
                      Reply
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          <TabsContent value="sent" className="space-y-4">
            {loadingMessages ? (
              <p className="text-center py-4">Loading messages...</p>
            ) : sentMessages.length === 0 ? (
              <p className="text-center py-4">No messages sent yet.</p>
            ) : (
              sentMessages.map((message) => (
                <Card key={message.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">To: {message.receiver}</h4>
                      <span className="text-sm text-gray-500">{message.timestamp}</span>
                    </div>
                    <p className="text-gray-600 mb-2">{message.content}</p>
                    <Button size="sm" variant="outline">
                      View Thread
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  const renderSettingsSection = () => (
    <Card className="border-gray-200 shadow-lg bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-blue-800">Settings</CardTitle>
        <CardDescription className="text-blue-600">
          Manage your account preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 text-center text-gray-500">
        Settings panel is currently under development
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return renderProfileSection();
      case "avatar":
        return renderAvatarSection();
      case "pitch":
        return renderPitchSection();
      case "analytics":
        return renderAnalyticsSection();
      case "messaging":
        return renderMessagingSection();
      case "settings":
        return renderSettingsSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex">
        <UserSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          userData={userData} 
        />
        <main className="flex-1 p-6 ml-64">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;