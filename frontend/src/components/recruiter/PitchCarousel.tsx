import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCards } from 'swiper/modules';
import { motion } from 'framer-motion';
import { Play, Heart, X, Bookmark, MessageSquare, Calendar, Star, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import type { Swiper as SwiperClass } from 'swiper';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-cards';

interface CandidateExperience {
  position: string;
  endDate?: string;
}

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
}

interface User {
  _id: string;
  fullName: string;
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
  experience?: { position: string; company: string; duration: string; description: string }[];
  projects?: { name: string; tech: string[]; description: string }[];
}

interface PitchCarouselProps {
  onCandidateSelect: (candidate: Candidate) => void;
  isRecruiterDashboard?: boolean;
}

const PitchCarousel: React.FC<PitchCarouselProps> = ({ onCandidateSelect, isRecruiterDashboard }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notes, setNotes] = useState<{[key: string]: string}>({});
  const [actions, setActions] = useState<{[key: string]: 'shortlist' | 'reject' | 'bookmark' | null}>({});
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const [likes, setLikes] = useState<{[key: string]: number}>({});
  const [bookmarks, setBookmarks] = useState<{[key: string]: boolean}>({});
  const [userRole, setUserRole] = useState<string>("");
  const [playingVideos, setPlayingVideos] = useState<{[key: string]: boolean}>({});

  // Helper function to get display position
  const getDisplayPosition = (user: { experience?: CandidateExperience[] }): string => {
    if (user.experience && user.experience.length > 0) {
      // Sort experiences by end date (most recent first)
      const sortedExperience = user.experience.sort((a, b) => {
        if (!a.endDate && b.endDate) return -1; // Current job (no end date) comes first
        if (a.endDate && !b.endDate) return 1;
        if (!a.endDate && !b.endDate) return 0;
        return new Date(b.endDate!).getTime() - new Date(a.endDate!).getTime();
      });
      return sortedExperience[0].position || 'Professional';
    }
    return 'Student';
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("userRole");
        setUserRole(role || "");

        let transformedData: Candidate[] = [];

        // If we're on the recruiter dashboard, only fetch bookmarked candidates
        if (isRecruiterDashboard && role === "recruiter") {
          const bookmarksRes = await axios.get("http://localhost:5000/api/recruiter/bookmarked", {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          transformedData = bookmarksRes.data.map((user: Candidate): Candidate => ({
            _id: user._id,
            id: user._id,
            fullName: user.fullName,
            name: user.fullName,
            role: getDisplayPosition(user),
            experience: user.experience || [],
            avatar: user.avatar || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=400&fit=crop&crop=face',
            skills: user.skills || ['React', 'JavaScript'],
            email: user.email,
            phone: user.phone || 'Not provided',
            location: user.location || 'Remote',
            profileLikes: user.profileLikes || 0,
            videoUrl: user.videoUrl || null,
            pitch: user.pitch || 'No pitch available',
            about: user.about || 'No description available',
            education: user.education || [],
            projects: user.projects || []
          }));
          
          // Set all candidates as bookmarked
          const bookmarkedMap: { [key: string]: boolean } = {};
          transformedData.forEach((candidate) => {
            bookmarkedMap[candidate.id] = true;
          });
          setBookmarks(bookmarkedMap);
        } else {
          // Original code for fetching all users
          const res = await axios.get("http://localhost:5000/api/user/all", {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          transformedData = res.data.map((user: Candidate): Candidate => ({
            _id: user._id,
            id: user._id,
            fullName: user.fullName,
            name: user.fullName,
            role: getDisplayPosition(user),
            experience: user.experience || [],
            avatar: user.avatar || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=400&fit=crop&crop=face',
            skills: user.skills || ['React', 'JavaScript'],
            email: user.email,
            phone: user.phone || 'Not provided',
            location: user.location || 'Remote',
            profileLikes: user.profileLikes || 0,
            videoUrl: user.videoUrl || null,
            about: user.about || 'No description available',
            education: user.education || [],
            projects: user.projects || []
          }));

          if (role === "recruiter") {
            const bookmarksRes = await axios.get("http://localhost:5000/api/recruiter/bookmarked", {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const bookmarkedMap: { [key: string]: boolean } = {};
            bookmarksRes.data.forEach((candidate: Candidate) => {
              bookmarkedMap[candidate._id] = true;
            });
            setBookmarks(bookmarkedMap);
          }
        }

        setCandidates(transformedData);
        setVisibleCards(new Set(transformedData.map((c: Candidate) => c.id)));
        
        // Initialize likes
        const initialLikes: {[key: string]: number} = {};
        transformedData.forEach((user: Candidate) => {
          initialLikes[user.id] = user.profileLikes || 0;
        });
        setLikes(initialLikes);

        setLoading(false);
        
        if (transformedData && transformedData.length > 0) {
          onCandidateSelect(transformedData[0]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [onCandidateSelect, isRecruiterDashboard]);

  const handleAction = (candidateId: string, action: 'shortlist' | 'reject' | 'bookmark') => {
    setActions(prev => ({ ...prev, [candidateId]: action }));
    onCandidateSelect(candidates[currentIndex]);
    
    if (action === 'reject') {
      setVisibleCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(candidateId);
        return newSet;
      });
    }
  };

  const handleLike = async (candidateId: string) => {
    try {
      setLikes(prev => ({
        ...prev,
        [candidateId]: (prev[candidateId] || 0) + 1
      }));
  
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5000/api/user/analytics/${candidateId}`, {
        type: 'profileLike'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Error liking profile:", error);
      setLikes(prev => ({
        ...prev,
        [candidateId]: Math.max((prev[candidateId] || 0) - 1, 0)
      }));
    }
  };

  const handleBookmark = async (candidateId: string) => {
    try {
      setBookmarks(prev => ({
        ...prev,
        [candidateId]: !prev[candidateId]
      }));

      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/recruiter/bookmark", {
        candidateId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Error bookmarking candidate:", error);
      setBookmarks(prev => ({
        ...prev,
        [candidateId]: !prev[candidateId]
      }));
    }
  };

  const handleNoteChange = (candidateId: string, note: string) => {
    setNotes(prev => ({ ...prev, [candidateId]: note }));
  };

  const handleSlideChange = (swiper: SwiperClass) => {
    const activeIndex = swiper.activeIndex;
    setCurrentIndex(activeIndex);
    const visibleCandidates = candidates.filter(c => visibleCards.has(c.id));
    if (visibleCandidates[activeIndex]) {
      onCandidateSelect(visibleCandidates[activeIndex]);
    }
    
    // Pause all videos when sliding
    setPlayingVideos({});
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.pause();
      video.currentTime = 0;
    });
  };

  const handleVideoClick = (candidateId: string) => {
    // For iframes, we can't directly control play/pause
    // We'll just use this to toggle the play button overlay
    setPlayingVideos(prev => ({
      ...prev,
      [candidateId]: !prev[candidateId]
    }));
  };

  const handleVideoEnded = (candidateId: string) => {
    setPlayingVideos(prev => ({ ...prev, [candidateId]: false }));
  };

  const visibleCandidates = candidates.filter(candidate => visibleCards.has(candidate.id));

  // Show loading state
  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no candidates
  if (visibleCandidates.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center h-[600px]">
        <div className="text-center">
          <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Bookmarked Candidates</h3>
          <p className="text-gray-500">Start bookmarking candidates to see them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Carousel */}
        <div className="lg:col-span-2">
          <Swiper
            modules={[Navigation, Pagination, EffectCards]}
            effect="cards"
            cardsEffect={{
              perSlideOffset: 8,
              perSlideRotate: 2,
              rotate: true,
              slideShadows: true,
            }}
            navigation
            pagination={{ clickable: true }}
            onSlideChange={handleSlideChange}
            className="h-[600px] rounded-2xl"
          >
            {visibleCandidates.map((candidate, index) => (
              <SwiperSlide key={candidate.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full"
                >
                  <Card className="h-full border-0 shadow-2xl overflow-hidden relative">
                    {/* X Button */}
                    <button
                      onClick={() => handleAction(candidate.id, 'reject')}
                      className="absolute top-4 right-4 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="relative h-full bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
                      {/* Header */}
                      <div className="p-6 pb-0">
                        <div className="flex items-center mb-4">
                          <img
                            src={candidate.avatar}
                            alt={candidate.name}
                            className="w-16 h-16 rounded-full object-cover mr-4 border-4 border-white shadow-lg"
                          />
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900">{candidate.name}</h3>
                            <p className="text-blue-600 font-semibold">{candidate.role}</p>
                            <div className="flex items-center text-gray-500 text-sm mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              {candidate.location}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {Array.isArray(candidate.experience) && candidate.experience.length > 0
                                ? candidate.experience[0].position + (candidate.experience.length > 1 ? ` (+${candidate.experience.length - 1} more)` : '')
                                : 'No experience'}
                            </p>
                          </div>
                        </div>

                        {/* Availability Status */}
                        <div className="mb-4">
                          <Badge className="bg-green-100 text-green-700 border-0">
                            <Clock className="w-3 h-3 mr-1" />
                            {"Available Now"}
                          </Badge>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {candidate.skills?.slice(0, 4).map((skill) => (
                            <Badge key={skill} className="bg-blue-100 text-blue-700">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills?.length > 4 && (
                            <Badge className="bg-gray-100 text-gray-600">
                              +{candidate.skills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Pitch Video */}
                      <div className="px-6 mb-4">
                        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl h-48 overflow-hidden">
                          {candidate.videoUrl ? (
                            <div className="relative w-full h-full">
                              {/\.(mp4|webm|ogg)$/i.test(candidate.videoUrl)
                                ? (
                                  <video
                                    src={candidate.videoUrl}
                                    controls
                                    className="w-full h-full object-contain rounded-xl bg-black"
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                )
                                : (
                                  <iframe
                                    src={candidate.videoUrl}
                                    className="w-full h-full object-contain rounded-xl bg-black"
                                    allowFullScreen
                                    title={`${candidate.name}'s Pitch Video`}
                                    frameBorder="0"
                                  />
                                )
                              }
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-white/20 backdrop-blur-sm text-white rounded-full p-6 hover:bg-white/30 transition-all duration-300 opacity-50"
                                disabled
                              >
                                <Play className="w-8 h-8" />
                              </motion.button>
                              <span className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                No video available
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Pitch Content - Added below the video */}
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Elevator Pitch</h4>
                          <p className="text-sm text-gray-600">
                            {candidate.pitch || "No pitch information available."}
                          </p>
                        </div>

                        {/* Education Section */}
                        {candidate.education && candidate.education.length > 0 && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Education</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {candidate.education.map((edu, idx) => (
                                <li key={idx}>
                                  <span className="font-semibold">{edu.degree}</span> at {edu.institution} ({edu.year})
                                  {edu.gpa && <span>, GPA: {edu.gpa}</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Projects Section */}
                        {candidate.projects && candidate.projects.length > 0 && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Key Projects</h4>
                            <ul className="text-sm text-gray-600 space-y-2">
                              {candidate.projects.map((proj, idx) => (
                                <li key={idx}>
                                  <span className="font-semibold">{proj.name}</span> <span className="text-xs text-gray-500">[{proj.tech.join(', ')}]</span>
                                  <div>{proj.description}</div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Side Panel - Notes & Actions */}
        <div className="space-y-6">
          {/* Current Candidate Info */}
          <Card className="border-gray-200 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" className="w-full border-blue-200 text-blue-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Interview
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-gray-200 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Notes</h3>
              <Textarea
                placeholder="Add your notes about this candidate..."
                value={notes[visibleCandidates[currentIndex]?.id] || ''}
                onChange={(e) => handleNoteChange(visibleCandidates[currentIndex]?.id, e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <Button className="w-full mt-3 bg-gradient-to-r from-blue-600 to-blue-700">
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PitchCarousel;