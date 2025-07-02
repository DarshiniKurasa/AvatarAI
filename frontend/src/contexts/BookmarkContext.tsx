import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";

interface BookmarkContextType {
  bookmarked: string[];
  loading: boolean;
  toggleBookmark: (candidateId: string) => Promise<void>;
  fetchBookmarks: () => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error("useBookmarks must be used within a BookmarkProvider");
  }
  return context;
};

export const BookmarkProvider = ({ children }: { children: ReactNode }) => {
  const [bookmarked, setBookmarked] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("userRole");
      if (userRole !== "recruiter") {
        setBookmarked([]);
        setLoading(false);
        return;
      }
      const res = await axios.get("http://localhost:5000/api/recruiter/bookmarked", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookmarked(res.data.map((user: any) => user._id));
    } catch (err) {
      setBookmarked([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const toggleBookmark = async (candidateId: string) => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "recruiter") return;
    console.log("toggleBookmark called for", candidateId);
    const isBookmarked = bookmarked.includes(candidateId);
    // Optimistic UI update
    setBookmarked((prev) =>
      isBookmarked
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/recruiter/bookmark",
        {
          candidateId,
          action: isBookmarked ? "remove" : "add"
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      // Re-fetch to ensure DB sync
      await fetchBookmarks();
    } catch (err) {
      await fetchBookmarks();
    }
  };

  return (
    <BookmarkContext.Provider value={{ bookmarked, loading, toggleBookmark, fetchBookmarks }}>
      {children}
    </BookmarkContext.Provider>
  );
}; 