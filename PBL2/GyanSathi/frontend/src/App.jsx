import { useEffect, useState } from "react";
import "./App.css";
import { Route, Routes, useNavigate } from "react-router";
import Home from "./pages/Home";
import Tips from "./pages/Tips";
import toast from "react-hot-toast";
import axios from "axios";
import Navbar from "./components/Navbar";
import Create from "./pages/Create";

function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNote = async () => {
      try {
        setLoading(true);
        const allNotes = await axios.get("http://localhost:8080/api/notes");
        // const data = await allNotes.json();
        console.log(allNotes.data);
        setNotes(allNotes.data);

        toast.success("All Data successfully fetched!");
      } catch (error) {
        console.log("Error during Fetch");
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, []);

  const handleSubmit = async (title, content, e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8080/api/notes", { title, content });
      toast.success("Note created Successfully!");
      const allNotes = await axios.get("http://localhost:8080/api/notes");
      setNotes(allNotes.data);
      navigate("/");
    } catch (error) {
      console.log("Error during creating");
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    console.log(`http://localhost:8080/api/notes/${id}`);
    if (!window.confirm("Are you sure to delete?")) return;
    try {
      await axios.delete(`http://localhost:8080/api/notes/${id}`);
      toast.success("Delete Success!");
      const allNotes = await axios.get("http://localhost:8080/api/notes");
      setNotes(allNotes.data);
    } catch (error) {
      console.log("Some error during delete!");
    }
  };
  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={<Home notes={notes} handleDelete={handleDelete} />}
        />
        <Route
          path="/create"
          element={<Create handleSubmit={handleSubmit} />}
        />
        <Route path="/tips" element={<Tips />} />
      </Routes>
    </>
  );
}

export default App;
