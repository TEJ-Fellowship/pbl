import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Github, User, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { authApi } from "../services/api";

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
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

    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }

    if (!token) {
      setError("No invitation token provided");
      setLoading(false);
      return;
    }

    validateInvite();
  }, [token, isAuthenticated, navigate]);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600"></div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-md">
          <div className="p-8 text-center bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Invalid Invitation
            </h2>
            <p className="mb-6 text-gray-600">{error}</p>
            <button onClick={() => navigate("/login")} className="btn-primary">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        <div className="p-8 bg-white rounded-lg shadow-xl">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100">
              <CheckCircle className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              You're Invited!
            </h2>
            <p className="text-gray-600">
              Welcome to the TEJ Bootcamp project showcase platform
            </p>
          </div>

          {inviteData && (
            <div className="p-4 mb-6 rounded-lg bg-gray-50">
              <div className="space-y-2 text-sm text-gray-600">
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
            <div className="flex items-center px-4 py-3 mb-6 text-red-600 border border-red-200 rounded-lg bg-red-50">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* GitHub Accept */}
            <button
              onClick={handleGitHubAccept}
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition-all duration-200 bg-gray-800 border border-transparent rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <Github className="w-5 h-5 mr-2" />
              Accept with GitHub
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-500 bg-white">
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
                <div className="relative mt-1">
                  <User className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="pl-10 input"
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
                <div className="relative mt-1">
                  <User className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    id="preferredName"
                    name="preferredName"
                    type="text"
                    className="pl-10 input"
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
                <div className="relative mt-1">
                  <Mail className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    disabled
                    className="pl-10 input bg-gray-50"
                    value={inviteData?.email || ""}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary"
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
