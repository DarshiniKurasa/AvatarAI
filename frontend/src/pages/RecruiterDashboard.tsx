import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Users, Calendar, Star, TrendingUp, Upload, Mail, Phone, MapPin, Briefcase, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';
import DashboardOverview from '@/components/recruiter/DashboardOverview';
import JobsSection from '@/components/recruiter/JobsSection';
import CandidatesSection from '@/components/recruiter/CandidatesSection';
import MessagingSection from '@/components/recruiter/MessagingSection';
import Settings from '@/components/Settings';

const RecruiterDashboard = () => {
  // State declarations at the top - ALL hooks must be here
  const [activeSection, setActiveSection] = useState<'profile' | 'avatar' | 'overview' | 'jobs' | 'candidates' | 'messaging' | 'analytics' | 'settings'>('overview');
  const [userData, setUserData] = useState(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<{
    id: number;
    name: string;
    email: string;
    phone: string;
  } | null>(null);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });
  const [pitchText, setPitchText] = useState("");
  
  // Messaging-related state (moved from renderMessagingSection)
  const [sentMessages, setSentMessages] = useState([]);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Refs
  const resumeFileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/recruiter/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  // Fetch messages effect (moved from renderMessagingSection)
  useEffect(() => {
    if (activeSection === 'messaging') {
      fetchMessages();
    }
  }, [activeSection]);

  // Message fetching function (moved from renderMessagingSection)
  const fetchMessages = async () => {
    setMessagesLoading(true);
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
          candidate: msg.receiverModel === 'User' ? 
            (msg.receiver?.fullName || 'Candidate') : 
            (msg.sender?.fullName || 'Candidate'),
          content: msg.content,
          timestamp: new Date(msg.createdAt).toLocaleString(),
          status: msg.read ? 'read' : 'unread'
        };
        
        if (msg.senderModel === 'Recruiter') {
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
      setMessagesLoading(false);
    }
  };

  // Profile management handlers
  const saveProfile = async () => {
    try {
      setSaveMessage({ type: "", text: "" });
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/recruiter/profile",
        userData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setSaveMessage({ type: "success", text: "Profile updated successfully!" });
      if (userData?.fullName) {
        localStorage.setItem("userName", userData.fullName);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveMessage({ type: "error", text: "Failed to update profile. Please try again." });
    }
  };

  // File upload handlers
  const handleResumeUpload = () => resumeFileRef.current?.click();
  const handleAvatarUpload = () => avatarFileRef.current?.click();

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaveMessage({ type: "info", text: "Uploading avatar..." });
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/recruiter/avatar", 
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      if (response.data.avatarUrl) {
        setUserData(prev => ({ ...prev, avatar: response.data.avatarUrl }));
      }
      setSaveMessage({ type: "success", text: "Avatar uploaded successfully!" });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to upload avatar. Please try again.";
      setSaveMessage({ type: "error", text: errorMessage });
    }
  };

  const handleGenerateAvatar = () => {
    if (avatarFileRef.current?.files?.length) {
      handleAvatarFileChange({ 
        target: { files: avatarFileRef.current.files } 
      } as React.ChangeEvent<HTMLInputElement>);
    } else {
      setSaveMessage({ type: "error", text: "Please select an image first." });
    }
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Selected resume file:", file.name);
    }
  };

  // Navigation handlers
  const handleOverviewModeSelect = (mode: string) => {
    const sectionMap = {
      candidates: 'candidates',
      jobs: 'jobs',
      messaging: 'messaging'
    };
    setActiveSection(sectionMap[mode] || 'candidates');
  };

  // Modal handlers
  const handleSendMessage = () => setMessageModalOpen(true);
  const handleScheduleInterview = () => setInterviewModalOpen(true);
  const handleReply = () => setReplyModalOpen(true);
  const handleViewApplicantProfile = (applicant: { id: number; name: string }) => {
    console.log('Viewing profile for:', applicant);
  };
  const handleInterviewApplicant = (applicant: {
    id: number;
    name: string;
    email: string;
    phone: string;
  }) => {
    setSelectedCandidate(applicant);
    setInterviewModalOpen(true);
  };

  // Section renderers
  const renderOverviewSection = () => (
    <DashboardOverview onModeSelect={handleOverviewModeSelect} activeMode={activeSection} />
  );

  const renderProfileSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recruiter Profile</CardTitle>
          <CardDescription>Complete your profile to increase visibility to candidates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Welcome Message */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-800">
              Welcome, {userData?.fullName || "Recruiter"}
            </h3>
          </div>
          
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                 
                value={userData?.fullName || ""}
                onChange={(e) => setUserData({...userData, fullName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                value={userData?.phone || ""}
                onChange={(e) => setUserData({...userData, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={userData?.email || ""}
                onChange={(e) => setUserData({...userData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                
                value={userData?.location || ""}
                onChange={(e) => setUserData({...userData, location: e.target.value})}
              />
            </div>
          </div>

          {/* Professional Profiles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Professional Profiles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input 
                  id="linkedin" 
                  
                  value={userData?.linkedin || ""}
                  onChange={(e) => setUserData({...userData, linkedin: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="github">GitHub</Label>
                <Input 
                  id="github" 
                  
                  value={userData?.github || ""}
                  onChange={(e) => setUserData({...userData, github: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="leetcode">LeetCode</Label>
                <Input 
                  id="leetcode" 
                  
                  value={userData?.leetcode || ""}
                  onChange={(e) => setUserData({...userData, leetcode: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="portfolio">Portfolio</Label>
                <Input 
                  id="portfolio" 
                  
                  value={userData?.portfolio || ""}
                  onChange={(e) => setUserData({...userData, portfolio: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <Label htmlFor="skills">Skills</Label>
            <Textarea 
              id="skills" 
              
              value={userData?.skills || ""}
              onChange={(e) => setUserData({...userData, skills: e.target.value})}
            />
          </div>

          {/* Availability */}
          <div>
            <Label htmlFor="availability">Availability</Label>
            <select 
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={userData?.availability || ""}
              onChange={(e) => setUserData({...userData, availability: e.target.value})}
            >
              <option value="">Select availability</option>
              <option value="Available immediately">Available immediately</option>
              <option value="Available in 2 weeks">Available in 2 weeks</option>
              <option value="Available in 1 month">Available in 1 month</option>
              <option value="Not actively recruiting">Not actively recruiting</option>
            </select>
          </div>

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={saveProfile}
          >
            Save Profile
          </Button>
          
          {/* Display save message if present */}
          {saveMessage.text && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              saveMessage.type === "success" 
                ? "bg-green-50 text-green-600 border border-green-200" 
                : "bg-red-50 text-red-600 border border-red-200"
            }`}>
              {saveMessage.text}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderAvatarSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Avatar Creation</CardTitle>
        <CardDescription>Create and manage your professional avatar</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Avatar */}
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
              {userData?.avatar ? (
                <img 
                  src={userData.avatar} 
                  alt="User Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Briefcase className="w-16 h-16 text-blue-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">Current Avatar</h3>
            <p className="text-gray-600 mb-4">Upload a clear photo to generate your professional avatar</p>
          </div>

          {/* Upload New Photo */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">Upload a new photo</p>
            <Button variant="outline" size="sm" onClick={handleAvatarUpload}>
              Choose Photo
            </Button>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG up to 2MB</p>
          </div>
          <input
            ref={avatarFileRef}
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={handleAvatarFileChange}
            className="hidden"
          />

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleGenerateAvatar}
          >
            Generate New Avatar
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Fixed messaging section - no hooks inside
  const renderMessagingSection = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>Manage your conversations with candidates</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {messagesLoading ? (
            <div className="flex justify-center p-4">Loading messages...</div>
          ) : (
            <Tabs defaultValue="received" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="received">Messages from Candidates</TabsTrigger>
                <TabsTrigger value="sent">Messages Sent to Candidates</TabsTrigger>
              </TabsList>
              <TabsContent value="received" className="space-y-4">
                <div className="space-y-4">
                  {receivedMessages.length > 0 ? receivedMessages.map((message) => (
                    <Card key={message.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{message.candidate}</h4>
                          <span className="text-sm text-gray-500">{message.timestamp}</span>
                        </div>
                        <p className="text-gray-600 mb-2">{message.content}</p>
                        <Button size="sm" variant="outline" onClick={handleReply}>Reply</Button>
                      </CardContent>
                    </Card>
                  )) : (
                    <p className="text-center text-gray-500">No messages received yet</p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="sent" className="space-y-4">
                <div className="space-y-4">
                  {sentMessages.length > 0 ? sentMessages.map((message) => (
                    <Card key={message.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">To: {message.candidate}</h4>
                          <span className="text-sm text-gray-500">{message.timestamp}</span>
                        </div>
                        <p className="text-gray-600 mb-2">{message.content}</p>
                        <Button size="sm" variant="outline">View Thread</Button>
                      </CardContent>
                    </Card>
                  )) : (
                    <p className="text-center text-gray-500">No messages sent yet</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAnalyticsSection = () => (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Analytics Dashboard</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Talent Response Rate</h4>
                <p className="text-2xl font-bold text-blue-600">76%</p>
                <p className="text-sm text-gray-600">Job click-through rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Talent Acquisition Rate</h4>
                <p className="text-2xl font-bold text-green-600">23%</p>
                <p className="text-sm text-gray-600">Successful hires</p>
              </CardContent>
            </Card>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Detailed analytics charts coming soon...
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderJobsSection = () => (
    <div className="space-y-6">
      <JobsSection />
    </div>
  );

  const renderCandidatesSection = () => (
    <div className="space-y-6">
      <CandidatesSection />
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSendMessage}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Message
            </Button>
            <Button 
              variant="outline" 
              className="border-blue-200 text-blue-600"
              onClick={handleScheduleInterview}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Interview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'avatar':
        return renderAvatarSection();
      case 'overview':
        return renderOverviewSection();
      case 'jobs':
        return renderJobsSection();
      case 'candidates':
        return renderCandidatesSection();
      case 'messaging':
        return renderMessagingSection();
      case 'analytics':
        return renderAnalyticsSection();
      case 'settings':
        return <div></div>; // Keep settings blank as requested
      default:
        return renderOverviewSection();
    }
  };

return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-black dark:via-black dark:to-black">
      <div className="flex">
        <RecruiterSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          recruiterData={userData}
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

      {/* Message Modal */}
      <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient">To:</Label>
              <Input id="recipient" placeholder="Candidate name or email" />
            </div>
            <div>
              <Label htmlFor="subject">Subject:</Label>
              <Input id="subject" placeholder="Message subject" />
            </div>
            <div>
              <Label htmlFor="message">Message:</Label>
              <Textarea id="message" placeholder="Type your message here..." rows={5} />
            </div>
            <div className="flex gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700">Send Message</Button>
              <Button variant="outline" onClick={() => setMessageModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Interview Modal */}
      <Dialog open={interviewModalOpen} onOpenChange={setInterviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCandidate && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900">Contact Details</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-blue-600" />
                    <span>{selectedCandidate.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-blue-600" />
                    <span>{selectedCandidate.phone}</span>
                  </div>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="interviewDate">Interview Date:</Label>
              <Input id="interviewDate" type="datetime-local" />
            </div>
            <div>
              <Label htmlFor="interviewType">Interview Type:</Label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                <option>Video Call</option>
                <option>Phone Interview</option>
                <option>In-Person</option>
              </select>
            </div>
            <div>
              <Label htmlFor="notes">Notes:</Label>
              <Textarea id="notes" placeholder="Additional notes for the interview..." rows={3} />
            </div>
            <div className="flex gap-2">
              <Button className="bg-green-600 hover:bg-green-700">Schedule Interview</Button>
              <Button variant="outline" onClick={() => setInterviewModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reply Modal */}
      <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Original Message:</h4>
              <p className="text-sm text-gray-600">Thank you for reaching out about the React position. I'm very interested in discussing this opportunity further...</p>
            </div>
            <div>
              <Label htmlFor="replyMessage">Your Reply:</Label>
              <Textarea id="replyMessage" placeholder="Type your reply here..." rows={5} />
            </div>
            <div className="flex gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700">Send Reply</Button>
              <Button variant="outline" onClick={() => setReplyModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecruiterDashboard;