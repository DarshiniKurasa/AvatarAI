import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Briefcase,
  Star,
  Play,
  MessageSquare,
  User,
  Mail,
  Heart,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ContactModal from "@/components/ContactModal";

interface Experience {
  _id: string;
  company: string;
  position: string;
  duration: string;
  description: string;
}

interface UserType {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  location?: string;
  avatar?: string;
  about?: string;
  skills?: string[];
  experience?: Experience[];
  videoUrl?: string;
  pitch?: string;
  phone?: string;
}

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [bookmarkedUsers, setBookmarkedUsers] = useState<Set<string>>(new Set());
  const [likedUsers, setLikedUsers] = useState<Set<string>>(new Set());
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState({
    name: "",
    email: "",
    phone: "",
    type: "candidate" as "candidate" | "recruiter",
  });
  const [users, setUsers] = useState<UserType[]>([]);
  const [userRole, setUserRole] = useState("");
  const skills = ["React", "Python", "JavaScript", "Node.js", "UI/UX", "Data Science"];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/user/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
        console.log("Fetched users:", res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    // Get user role from localStorage or decode from token
    const role = localStorage.getItem("userRole") || "candidate";
    setUserRole(role);
    
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const nameMatch =
      !searchTerm ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const skillMatch =
      selectedSkill === "" ||
      (user.skills?.includes(selectedSkill));
    return nameMatch && skillMatch;
  });

  const toggleBookmark = (userId: string) => {
    const newSet = new Set(bookmarkedUsers);
    if (newSet.has(userId)) newSet.delete(userId);
    else {
      newSet.add(userId);
      axios.post(`http://localhost:5000/api/user/analytics/${userId}`, { type: "profileBookmark" }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).catch(console.error);
    }
    setBookmarkedUsers(newSet);
  };

  const handleLike = (userId: string) => {
    const newSet = new Set(likedUsers);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
      // Optional: Send analytics for like action
      axios.post(`http://localhost:5000/api/user/analytics/${userId}`, { type: "profileLike" }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).catch(console.error);
    }
    setLikedUsers(newSet);
  };

  const handleBookmark = (userId: string) => {
    toggleBookmark(userId);
  };

  const handleContactCandidate = (user: UserType) => {
    setSelectedContact({
      name: user.fullName,
      email: user.email,
      phone: user.phone || "",
      type: "candidate",
    });
    setContactModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Discover Talent
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Connect with Professionals
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by name or skills"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={!selectedSkill ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSkill("")}
            >
              All Skills
            </Button>
            {skills.map((skill) => (
              <Button
                key={skill}
                variant={selectedSkill === skill ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSkill(skill)}
              >
                {skill}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user, idx) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="bg-white hover:shadow-lg transition">
                <CardContent>
                  <div className="flex items-center mb-4">
                    <img
                      src={user.avatar || "https://i.pravatar.cc/150?img=54"}
                      alt={user.fullName}
                      className="w-16 h-16 rounded-full mr-4 border-2 border-blue-100"
                    />
                    <div>
                      <h3 className="text-lg font-semibold">{user.fullName}</h3>
                      <p className="text-blue-600">
                        {user.experience?.length
                          ? user.experience[0].position
                          : "Student"}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" /> {user.location || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <Briefcase className="w-4 h-4 mr-2" />
                    {user.experience?.length
                      ? user.experience[0].position
                      : "N/A"}
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {user.skills?.slice(0, 3).map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                    {user.skills && user.skills.length > 3 && (
                      <Badge variant="outline">+{user.skills.length - 3}</Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() =>
                            axios.post(
                              `http://localhost:5000/api/user/analytics/${user._id}`,
                              { type: "profileView" },
                              { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                            )
                          }>
                            <User className="w-4 h-4 mr-1" /> View Profile
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center">
                              <User className="w-5 h-5 mr-2" /> {user.fullName}'s Profile
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={user.avatar || "https://i.pravatar.cc/150?img=54"}
                                alt={user.fullName}
                                className="w-20 h-20 rounded-full border-2 border-blue-100"
                              />
                              <div>
                                <h3 className="text-xl font-semibold">{user.fullName}</h3>
                                <p className="text-blue-600">{user.role}</p>
                                <div className="flex items-center text-sm text-gray-500">
                                  <MapPin className="w-4 h-4 mr-1" /> {user.location || "N/A"}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="font-medium">Skills</h4>
                              <div className="flex flex-wrap gap-2">
                                {user.skills?.map((skill) => (
                                  <Badge key={skill}>{skill}</Badge>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="font-medium">Experience</h4>
                              {user.experience?.map((exp) => (
                                <div key={exp._id} className="border-l-2 border-gray-200 pl-4">
                                  <div className="font-medium">{exp.position}</div>
                                  <div className="text-sm text-gray-600">{exp.company}</div>
                                  <div className="text-sm text-gray-500">{exp.duration}</div>
                                  <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-2 pt-4">
                              <Button onClick={() => handleContactCandidate(user)}>
                                <Mail className="w-4 h-4 mr-2" />
                                Contact
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Like Button */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(user._id);
                        }}
                        className={likedUsers.has(user._id) ? "bg-rose-100 border-rose-300 text-rose-600" : "border-gray-200 text-gray-400 hover:bg-rose-50"}
                      >
                        <Heart className={`w-4 h-4 ${likedUsers.has(user._id) ? "fill-current" : ""}`} />
                      </Button>

                      {/* Bookmark Button - Only show for recruiters */}
                      {userRole === "recruiter" && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookmark(user._id);
                          }}
                          className={bookmarkedUsers.has(user._id) ? "bg-amber-100 border-amber-300 text-amber-600" : "border-gray-200 text-gray-400 hover:bg-amber-50"}
                        >
                          <Bookmark className={`w-4 h-4 ${bookmarkedUsers.has(user._id) ? "fill-current" : ""}`} />
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Play className="w-4 h-4 mr-1" /> Watch Pitch
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Video Pitch</DialogTitle>
                          </DialogHeader>
                          <div className="aspect-video">
                            {user.videoUrl ? (
                              /\.(mp4|webm|ogg)$/i.test(user.videoUrl)
                                ? (
                                  <video
                                    src={user.videoUrl}
                                    controls
                                    className="w-full h-full"
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                )
                                : (
                                  <iframe
                                    src={user.videoUrl}
                                    className="w-full h-full"
                                    allowFullScreen
                                  />
                                )
                            ) : (
                              <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
                                No pitch video available
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="outline" onClick={() => handleContactCandidate(user)}>
                        <MessageSquare className="w-4 h-4 mr-1" /> Contact
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold">No professionals found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        contact={selectedContact}
      />
    </div>
  );
};

export default Users;