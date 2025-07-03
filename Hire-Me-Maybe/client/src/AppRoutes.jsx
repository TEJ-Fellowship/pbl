import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import ResumeUpload from "./components/resume/ResumeUpload";
import ResumeUploadOld from "./components/resume/ResumeUploadOld";
import ResumePreview from "./components/resume/ResumePreview";
import ResumeComparison from "./components/resume/ResumeComparison";
import ResumeAnalysis from "./components/resume/ResumeAnalysis";
import JobCustomization from "./components/resume/JobCustomization";
import Dashboard from "./components/Dashboard";
import Header from "./components/Header";
// import Profile from "./components/Profile";

// Navigation bar for authenticated routes
const Navigation = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          <Link
            to="/dashboard"
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              isActive("/dashboard")
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/upload"
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              isActive("/upload")
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Upload Resume
          </Link>
          <Link
            to="/resumes"
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              isActive("/resumes")
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            My Resumes
          </Link>
          <Link
            to="/profile"
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              isActive("/profile")
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Profile
          </Link>
        </div>
      </div>
    </nav>
  );
};

const AppRoutes = ({ user, onLogout }) => (
  <Router>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header user={user} onLogout={onLogout} />

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route
            path="/dashboard"
            element={<Dashboard user={user} onLogout={onLogout} />}
          />
          <Route path="/upload" element={<ResumeUpload />} />
          <Route path="/resumes" element={<ResumeUpload />} />
          <Route path="/profile" element={<ResumeUpload />} />
          <Route path="/resume-upload-old" element={<ResumeUploadOld />} />
          <Route path="/resume-preview" element={<ResumePreview />} />
          <Route path="/resume-comparison" element={<ResumeComparison />} />
          <Route path="/resume-analysis" element={<ResumeAnalysis />} />
          <Route path="/job-customization" element={<JobCustomization />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  </Router>
);

export default AppRoutes;
