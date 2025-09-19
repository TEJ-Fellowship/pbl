// import { createContext, useContext, useEffect, useState } from "react";

// const API_URL = "http://localhost:5000/api/auth";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const fetchUser = async () => {
//     try {
//       const res = await fetch(`${API_URL}/me`, {
//         method: "GET",
//         credentials: "include",
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "failed to fetch user");

//       setUser(data.user);
//     } catch (err) {
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUser();
//   }, []);

//   const login = async (email, password) => {
//     const res = await fetch(`${API_URL}/login`{
//       method: 'POST',

//     });
//   };
// };
