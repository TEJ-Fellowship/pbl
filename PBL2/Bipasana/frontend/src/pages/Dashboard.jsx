import React, { useState, useContext, useEffect } from "react";
import NewJournalCard from "../components/NewJournalCard";
import FlashBack from "../components/FlashBack";
import Filter from "../components/Filter";
import Journals from "../components/Journals";
import JournalReadCard from "../components/JournalReadCard";
import { AuthContext } from "../AuthContext";
import { ThemeContext } from "../ThemeContext";
import axios from "axios";

function Dashboard() {
  const {isDark} = useContext(ThemeContext)
  const { isLoggedIn } = useContext(AuthContext);
  const [originalJournals, setOriginalJournals] = useState([]); // Store original data
  const [journals, setJournals] = useState([]); // Store filtered data


  const fetchJournals = async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      return;
    }
    
    try {
      const response = await axios.get("http://localhost:3001/api/journals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const journalsData = response.data || [];
      setOriginalJournals(journalsData);
      setJournals(journalsData); 
    } catch (err) {
      setOriginalJournals([]);
      setJournals([]);
    }
  };

  // Function to add new journal to original data
  const addJournal = (newJournal) => {
    setOriginalJournals(prev => [...prev, newJournal]);
  };

  // Function to update journals (for updates/deletes from Journals component)
  const updateOriginalJournals = (updatedJournals) => {
    setOriginalJournals(updatedJournals);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchJournals();
    } else {
      // Clear journals when logged out
      setOriginalJournals([]);
      setJournals([]);
    }
  }, [isLoggedIn]);

  return (
    <div className={`min-h-screen ${isDark?'bg-gray-900':'bg-gray-200'}`}>
      <NewJournalCard addJournal={addJournal} />
      <FlashBack />
      <Filter 
        journals={journals} 
        setJournals={setJournals}
        originalJournals={originalJournals}
      />
      <Journals 
        journals={journals} 
        setJournals={setJournals}
        originalJournals={originalJournals}
        setOriginalJournals={updateOriginalJournals}
      />
    </div>
  );
}

export default Dashboard;