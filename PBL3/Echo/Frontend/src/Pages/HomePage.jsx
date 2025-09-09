import Recorder from "../Components/Recorder";
import Feed from "../Components/Feed";
const HomePage = ({ setIsLoggedIn }) => {
  function handleLogout() {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1>Welcome to HomePage 🎉</h1>

      <Recorder />
      <Feed />
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default HomePage;
