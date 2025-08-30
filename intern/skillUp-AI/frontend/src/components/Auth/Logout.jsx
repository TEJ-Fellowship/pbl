import { useNavigate } from "react-router-dom";


const Logout=({setIsAuthenticated})=>{
     const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login");
  };
    return(
        <>
        <div>
       <button onClick={handleLogout}>Logout</button>
</div>
        </>
    )
}
export default Logout;