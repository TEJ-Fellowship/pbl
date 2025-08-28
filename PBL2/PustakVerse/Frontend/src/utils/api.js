// utils/api.js

// Helper function to make authenticated API requests
export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  // If no token and we're trying to access a protected route, redirect to login
  if (!token && url.includes("/api/")) {
    window.location.href = "/login";
    throw new Error("Authentication required");
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  // For FormData requests, don't set Content-Type (let browser set it)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Authentication failed");
    }

    return response;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// Helper function to handle API errors
export const handleApiError = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;

    try {
      // Try to parse error response as JSON
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // If not JSON, try to get text response
      try {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      } catch {
        // Use default error message
      }
    }

    throw new Error(errorMessage);
  }
  return response;
};
