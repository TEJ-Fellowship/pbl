import React, { useContext, useState } from "react";
import JournalCard from "./JournalCard";
import JournalReadCard from "./JournalReadCard";
import { ThemeContext } from "../ThemeContext";

function Journals({ journals, setJournals, originalJournals, setOriginalJournals }) {
  const { isDark } = useContext(ThemeContext);

  const [selectedJournal, setSelectedJournal] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const openPopup = (journal) => {
    setSelectedJournal(journal);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setSelectedJournal(null);
    setIsPopupOpen(false);
  };
  // Function to handle journal updates
  const handleJournalUpdate = (updatedJournal) => {
    // Update both original and filtered journals
    const updatedOriginals = originalJournals.map((j) =>
      j.id === updatedJournal.id ? updatedJournal : j
    );
    setOriginalJournals(updatedOriginals);
    
    // Update filtered journals
    setJournals((prevJournals) =>
      prevJournals.map((j) =>
        j.id === updatedJournal.id ? updatedJournal : j
      )
    );
    
    setSelectedJournal(updatedJournal);
  };

  // Function to handle journal deletion
  const handleJournalDelete = (deletedJournalId) => {
    // Remove from both original and filtered journals
    const updatedOriginals = originalJournals.filter((j) => j.id !== deletedJournalId);
    setOriginalJournals(updatedOriginals);
    
    setJournals((prevJournals) =>
      prevJournals.filter((j) => j.id !== deletedJournalId)
    );
  };

  return (
    <div className="w-[65%] mx-auto">
      <h1 className="text-2xl font-bold mb-8">Recent Journals</h1>
      <div className="flex flex-wrap gap-3">
        {journals?.map((journal) => {
          return (

            <JournalCard
              key={journal.id}
              journal={journal}
              onClick={() => openPopup(journal)}
            />

          );
        })}
      </div>

      {isPopupOpen && selectedJournal && (
        <JournalReadCard
          journal={selectedJournal}
          onClose={closePopup}
          journals={journals}
          setJournals={setJournals}
          onUpdate={handleJournalUpdate}
          onDelete={handleJournalDelete}
        />

      )}
    </div>
  );
}

export default Journals;