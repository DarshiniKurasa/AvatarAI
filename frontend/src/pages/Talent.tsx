import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { User, Heart, Bookmark, Play, MessageSquare, Mail, MapPin, Briefcase, Badge, Search } from "lucide-react";
import { useBookmarks } from "../contexts/BookmarkContext";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ContactModal from "@/components/ContactModal";
import { Input } from "@/components/ui/input";

const Talent = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [likedUsers, setLikedUsers] = useState(new Set());
  const { bookmarked, loading: bookmarkLoading, toggleBookmark } = useBookmarks();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState({
    name: "",
    email: "",
    phone: "",
    type: "candidate" as "candidate" | "recruiter",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const skills = ["React", "Python", "JavaScript", "Node.js", "UI/UX", "Data Science"];

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    setUserRole(role);
    // Initialize liked users from localStorage
    const savedLikedUsers = localStorage.getItem("likedUsers");
    if (savedLikedUsers) {
      setLikedUsers(new Set(JSON.parse(savedLikedUsers)));
    }
  }, []);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/user/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLike = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const isCurrentlyLiked = likedUsers.has(userId);
      
      // Make API call
      await axios.post(
        `http://localhost:5000/api/user/analytics/${userId}`,
        { 
          type: "profileLike",
          action: isCurrentlyLiked ? "unlike" : "like"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      const newLikedUsers = new Set(likedUsers);
      if (isCurrentlyLiked) {
        newLikedUsers.delete(userId);
      } else {
        newLikedUsers.add(userId);
      }
      setLikedUsers(newLikedUsers);
      
      // Save to localStorage
      localStorage.setItem("likedUsers", JSON.stringify([...newLikedUsers]));
      
      console.log(`User ${userId} ${isCurrentlyLiked ? 'unliked' : 'liked'}`);
    } catch (error) {
      console.error("Error liking/unliking user:", error);
    }
  };

  const handleContactCandidate = (user) => {
    setSelectedContact({
      name: user.fullName,
      email: user.email,
      phone: user.phone || "",
      type: "candidate",
    });
    setContactModalOpen(true);
  };

  const filteredUsers = users.filter((user) => {
    const nameMatch =
      !searchTerm ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const skillMatch =
      selectedSkill === "" ||
      (user.skills?.includes(selectedSkill));
    return nameMatch && skillMatch;
  });

  return (
    <div className="p-6 space-y-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Discover Talent</h1>
        <p className="text-sm text-gray-600 mt-2">Find Best talent for your team</p>
      </div>

      {/* Filtering Section */}
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <div key={user._id} className="border p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <img
                  src={user.avatar || "https://i.pravatar.cc/150?img=54"}
                  alt={user.fullName}
                  className="w-12 h-12 rounded-full mr-3 object-cover border-2 border-gray-100"
                />
                <div>
                  <h3 className="text-lg font-semibold">{user.fullName}</h3>
                  <p className="text-blue-600">
                    {user.experience && user.experience.length > 0
                      ? user.experience[0].position
                      : "Student"}
                  </p>
                  <p className="text-sm text-gray-600">{user.location || "Location not specified"}</p>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="font-medium text-blue-600">
                  Skills:
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.skills?.slice(1, 4).map((skill, index) => (
                    <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                  {user.skills?.length > 4 && (
                    <span className="text-xs text-gray-500">+{user.skills.length - 4} more</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={async () => {
                        try {
                          // Track profile view
                          const token = localStorage.getItem("token");
                          await axios.post(
                            `http://localhost:5000/api/user/analytics/${user._id}`,
                            { type: "profileView" },
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          console.log(`Profile view tracked for user ${user._id}`);
                        } catch (error) {
                          console.error("Error tracking profile view:", error);
                        }
                      }}
                    >
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
                          {user.skills && user.skills.length > 0 ? (
                            user.skills.map((skill, idx) => (
                              <span key={idx} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">No skills listed</span>
                          )}
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
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(user._id);
                  }}
                  className={
                    likedUsers.has(user._id) 
                      ? "bg-rose-100 border-rose-300 text-rose-600 hover:bg-rose-200" 
                      : "border-gray-200 text-gray-400 hover:bg-rose-50 hover:border-rose-300"
                  }
                  title={likedUsers.has(user._id) ? "Unlike" : "Like"}
                >
                  <Heart className={`w-4 h-4 ${likedUsers.has(user._id) ? "fill-current" : ""}`} />
                </Button>
                
                {userRole === "recruiter" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleBookmark(user._id)}
                    disabled={bookmarkLoading}
                    aria-label={bookmarked.includes(user._id) ? "Remove bookmark" : "Add bookmark"}
                  >
                    {bookmarked.includes(user._id) ? (
                      <Bookmark fill="#2563eb" color="#2563eb" />
                    ) : (
                      <Bookmark />
                    )}
                  </Button>
                )}
              </div>
              <div className="flex gap-2 mt-2">
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
          ))}
        </div>
      )}
      
      {!loading && users.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold">No candidates found</h3>
          <p>Check back later for new talent.</p>
        </div>
      )}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        contact={selectedContact}
      />
    </div>
  );
};

export default Talent;