import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const [isAuth, setIsAuth] = useState(null); // null = loading, true = authenticated, false = not
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Call refresh endpoint to check authentication
    fetch('http://localhost:5000/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',  // important to send cookies
    })
      .then(res => {
        if (res.ok) {
          setIsAuth(true);
        } else {
          setIsAuth(false);
        }
      })
      .catch(() => setIsAuth(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div>Loading...</div>; // or your loader component
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
