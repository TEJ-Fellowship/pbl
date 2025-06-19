import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Github, User, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { authApi } from "../services/api";

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { acceptInvite, isAuthenticated } = useAuth();

  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    preferredName: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }

    validateInvite();
  }, [token, isAuthenticated]);

  const validateInvite = async () => {
    try {
      const response = await authApi.validateInvite(token);
      setInviteData(response.data.invite);
    } catch (error) {
      setError(
        error.response?.data?.message || "Invalid or expired invitation"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubAccept = () => {
    // Store token in localStorage temporarily for GitHub OAuth flow
    localStorage.setItem("pendingInviteToken", token);
    window.location.href = `${
      import.meta.env.VITE_API_URL || "http://localhost:5001"
    }/api/auth/github?invite=${token}`;
  };

  const handleManualAccept = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await acceptInvite(token, formData);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white shadow-xl rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Invitation
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={() => navigate("/login")} className="btn-primary">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-xl rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              You're Invited!
            </h2>
            <p className="text-gray-600">
              Welcome to the TEJ Bootcamp project showcase platform
            </p>
          </div>

          {inviteData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{inviteData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Role:</span>
                  <span className="capitalize">{inviteData.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Cohort:</span>
                  <span>{inviteData.cohort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Invited by:</span>
                  <span>{inviteData.invitedBy?.name}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* GitHub Accept */}
            <button
              onClick={handleGitHubAccept}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
            >
              <Github className="h-5 w-5 mr-2" />
              Accept with GitHub
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or create account manually
                </span>
              </div>
            </div>

            {/* Manual Accept Form */}
            <form onSubmit={handleManualAccept} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="input pl-10"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="preferredName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Preferred Name (Optional)
                </label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="preferredName"
                    name="preferredName"
                    type="text"
                    className="input pl-10"
                    placeholder="How would you like to be called?"
                    value={formData.preferredName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferredName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email (Pre-filled)
                </label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    disabled
                    className="input pl-10 bg-gray-50"
                    value={inviteData?.email || ""}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? "Creating Account..." : "Accept Invitation"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
