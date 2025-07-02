import React, { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Mail, Phone, Globe, Download, Calendar, MessageSquare, Star, Award, Briefcase, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Candidate {
  _id: string;
  id: string;
  fullName: string;
  name: string;
  role: string;
  experience: { position: string; company: string; duration: string; description: string }[];
  avatar?: string;
  skills?: string[];
  email: string;
  phone?: string;
  location?: string;
  profileLikes?: number;
  videoUrl?: string | null;
  pitch?: string;
  about?: string;
  education?: { degree: string; institution: string; year: string; gpa?: string }[];
  projects?: { name: string; tech: string[]; description: string }[];
  resumePath?: string;
}

interface CandidateExperience {
  _id?: string;
  company: string;
  position: string;
  duration: string;
  description: string;
}

interface CandidateEducation {
  _id?: string;
  degree: string;
  institution: string;
  year: string;
}

interface CandidateProject {
  _id?: string;
  name: string;
  description: string;
}

interface CandidatePreviewProps {
  candidate: Candidate;
}

const CandidatePreview: React.FC<CandidatePreviewProps> = ({ candidate }) => {
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [messageForm, setMessageForm] = useState({ to: candidate?.email || '', subject: '', body: '' });
  const [interviewForm, setInterviewForm] = useState({ date: '', time: '', type: 'Video Call' });
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const handleSendMessage = async () => {
    // TODO: Connect to backend
    setMessageModalOpen(false);
    setMessageForm({ to: candidate?.email || '', subject: '', body: '' });
    // Optionally show a toast/notification
  };

  const handleScheduleInterview = async () => {
    // TODO: Connect to backend
    setInterviewModalOpen(false);
    setInterviewForm({ date: '', time: '', type: 'Video Call' });
    // Optionally show a toast/notification
  };

  const handleDownloadResume = async () => {
    if (!candidate.resumePath) return;
    setDownloading(true);
    setDownloadError('');
    try {
      // If resumePath is a direct URL, just open/download it
      const link = document.createElement('a');
      link.href = candidate.resumePath;
      link.download = candidate.name + '-resume';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setDownloadError('Failed to download resume.');
    } finally {
      setDownloading(false);
    }
  };

  if (!candidate) {
    return (
      <Card className="border-violet-100 shadow-lg">
        <CardContent className="p-12 text-center">
          <div className="text-gray-500 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Candidate Selected</h3>
            <p>Select a candidate to view their detailed profile, resume, and work history.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use dynamic data from candidate
  const workHistory = Array.isArray(candidate.experience) ? candidate.experience : [];
  const education = Array.isArray(candidate.education) && candidate.education.length > 0 ? candidate.education : [];
  const projects = Array.isArray(candidate.projects) && candidate.projects.length > 0 ? candidate.projects : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Profile Summary */}
        <div className="lg:col-span-2">
          <Card className="border-violet-100 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-6 mb-6">
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-violet-200"
                />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{candidate.name}</h1>
                  <p className="text-xl text-violet-600 font-semibold mb-2">{candidate.role}</p>
                  <p className="text-gray-600 mb-4">{candidate.about}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {candidate.location}
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-1" />
                      {Array.isArray(candidate.experience) && candidate.experience.length > 0
                        ? (candidate.experience[0]?.position || 'Experience') + (candidate.experience.length > 1 ? ` (+${candidate.experience.length - 1} more)` : '')
                        : 'No experience'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Skills & Technologies</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.isArray(candidate.skills) && candidate.skills.length > 0 ? candidate.skills.map((skill: string, index: number) => (
                    <div key={skill} className="flex items-center justify-between p-3 bg-violet-50 rounded-lg">
                      <span className="font-medium text-violet-700">{skill}</span>
                      <Progress value={85 + Math.random() * 15} className="w-16 h-2" />
                    </div>
                  )) : <span className="text-gray-500">No skills listed.</span>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600" onClick={() => setMessageModalOpen(true)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600" onClick={() => setInterviewModalOpen(true)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Interview
                </Button>
                {/* {candidate.resumePath ? (
                  <Button variant="outline" className="border-violet-200 text-violet-600" onClick={handleDownloadResume} disabled={downloading}>
                    <Download className="w-4 h-4 mr-2" />
                    {downloading ? 'Downloading...' : 'Download Resume'}
                  </Button>
                ) : (
                  <Tooltip content="Resume not available">
                    <span>
                      <Button variant="outline" className="border-violet-200 text-violet-600" disabled>
                        <Download className="w-4 h-4 mr-2" />
                        Download Resume
                      </Button>
                    </span>
                  </Tooltip>
                )}
                {downloadError && <span className="text-red-500 text-xs ml-2">{downloadError}</span>} */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <div>
          <Card className="border-violet-100 shadow-lg">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg">
                <Mail className="w-5 h-5 mr-3 text-violet-600" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{candidate.email}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                <Phone className="w-5 h-5 mr-3 text-emerald-600" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{candidate.phone}</p>
                </div>
              </div>
              
              {/* <div className="flex items-center p-3 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg">
                <Globe className="w-5 h-5 mr-3 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Portfolio</p>
                  <p className="font-medium text-blue-600">portfolio.example.com</p>
                </div>
              </div> */}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Work History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-violet-100 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Work Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Experience */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Work Experience</h3>
                {Array.isArray(candidate.experience) && candidate.experience.length > 0 ? (
                  <ul className="space-y-2">
                    {candidate.experience.map((exp: CandidateExperience) => (
                      <li key={exp._id || exp.position + exp.company} className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium">{exp.position} @ {exp.company}</div>
                        <div className="text-sm text-gray-600">{exp.duration}</div>
                        <div className="text-sm">{exp.description}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">No work experience listed.</div>
                )}
              </div>
              {/* Education */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Education</h3>
                {Array.isArray(candidate.education) && candidate.education.length > 0 ? (
                  <ul className="space-y-2">
                    {candidate.education.map((edu: CandidateEducation) => (
                      <li key={edu._id || edu.degree + edu.institution} className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium">{edu.degree} @ {edu.institution}</div>
                        <div className="text-sm text-gray-600">{edu.year}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">No education listed.</div>
                )}
              </div>
              {/* Projects */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Projects</h3>
                {Array.isArray(candidate.projects) && candidate.projects.length > 0 ? (
                  <ul className="space-y-2">
                    {candidate.projects.map((proj: CandidateProject) => (
                      <li key={proj._id || proj.name} className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium">{proj.name}</div>
                        <div className="text-sm">{proj.description}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">No projects listed.</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Message Modal */}
      <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to {candidate.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">To:</label>
              <input className="w-full border rounded p-2" value={messageForm.to} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium">Subject:</label>
              <input className="w-full border rounded p-2" value={messageForm.subject} onChange={e => setMessageForm(f => ({ ...f, subject: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Message:</label>
              <textarea className="w-full border rounded p-2" rows={5} value={messageForm.body} onChange={e => setMessageForm(f => ({ ...f, body: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button className="bg-violet-600 text-white" onClick={handleSendMessage}>Send</Button>
              <Button variant="outline" onClick={() => setMessageModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Interview Modal */}
      <Dialog open={interviewModalOpen} onOpenChange={setInterviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview with {candidate.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Date:</label>
              <input type="date" className="w-full border rounded p-2" value={interviewForm.date} onChange={e => setInterviewForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Time:</label>
              <input type="time" className="w-full border rounded p-2" value={interviewForm.time} onChange={e => setInterviewForm(f => ({ ...f, time: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Type:</label>
              <select className="w-full border rounded p-2" value={interviewForm.type} onChange={e => setInterviewForm(f => ({ ...f, type: e.target.value }))}>
                <option value="Video Call">Video Call</option>
                <option value="Phone Interview">Phone Interview</option>
                <option value="In-Person">In-Person</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button className="bg-emerald-600 text-white" onClick={handleScheduleInterview}>Schedule</Button>
              <Button variant="outline" onClick={() => setInterviewModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidatePreview;
