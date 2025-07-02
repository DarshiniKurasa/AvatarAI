import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AccessibilityPanel from "./components/AccessibilityPanel";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./pages/UserDashboard";
import ViewCandidates from "./pages/ViewCandidates";
import Leaderboard from "./pages/Leaderboard";
import Carousel from "./pages/Carousel";
import About from "./pages/About";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import BookmarkedCandidates from "./pages/BookmarkedCandidates";
import JobManagement from "./pages/JobManagement";
import JobApplication from "./pages/JobApplication";
import NotFound from "./pages/NotFound";
import Talent from "./pages/Talent";
import Jobs from "./pages/Jobs";
import Recruiters from "./pages/Recruiters";
import { BookmarkProvider } from "./contexts/BookmarkContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BookmarkProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/user-dashboard" element={<UserDashboard />} />
                <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />
                <Route path="/bookmarked-candidates" element={<BookmarkedCandidates />} />
                <Route path="/job-management" element={<JobManagement />} />
                <Route path="/job-application" element={<JobApplication />} />
                <Route path="/users" element={<Talent />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/recruiters" element={<Recruiters />} />
                <Route path="/candidates" element={<ViewCandidates />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/carousel" element={<Carousel />} />
                <Route path="/about" element={<About />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <AccessibilityPanel />
          </div>
        </BrowserRouter>
      </BookmarkProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
