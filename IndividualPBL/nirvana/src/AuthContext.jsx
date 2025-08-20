import React, { useEffect, useState, createContext} from "react";
import { getAuth, onAuthStateChanged,signOut } from "firebase/auth";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  useEffect(() => {
    const auth=getAuth();
    const unsubscribe=onAuthStateChanged(auth,(user)=>{
        if(user){
              user.getIdToken().then((token) => {
          localStorage.setItem("token", token);
          setToken(token);
          setIsLoggedIn(true);
        });
        }else{
              localStorage.removeItem("token");
        setToken(null);
        setIsLoggedIn(false);
        }
    });
        return () => unsubscribe();
  }, []);

  function login() {
    setIsLoggedIn(true);
  }
 function logout() {
  const auth = getAuth();
  signOut(auth)
    .then(() => {
      setIsLoggedIn(false);
      localStorage.removeItem("token");
    })
    .catch((error) => {
      alert("Logout failed: " + error.message);
    });
}

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};