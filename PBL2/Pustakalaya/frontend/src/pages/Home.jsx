import { useEffect } from "react";
import API_URL from "../config/api";

const Home = () => {
  useEffect(() => {
    fetch("/api/books")
      .then(() => console.log("Backend connected"))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-serif font-bold text-2xl text-gray-900 mb-4 text-center">
        Welcome to TEJ Pustakalaya
      </h1>
    </div>
  );
};

export default Home;
