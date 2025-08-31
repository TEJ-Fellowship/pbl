import React, { useContext, useState } from "react";
import JournalCard from "./JournalCard";
import JournalReadCard from "./JournalReadCard"; 
import { ThemeContext } from "../ThemeContext";

const journalsData = [
  { id: 1, title: "Trip to Pokhara", date: "August 2, 2024", content: "Today I visited the beautiful city of Pokhara. The lakes were stunning and the mountain views were breathtaking." },
  { id: 2, title: "Trip to Pokhara", date: "August 3, 2024", content: "Second day in Pokhara was amazing. Went paragliding." },
  { id: 3, title: "Trip to Pokhara", date: "August 4, 2024", content: "Final day of the trip. Visited Sarangkot for sunrise." },
  { id: 4, title: "Trip to Pokhara", date: "August 4, 2024", content: "Visited local markets and tried Dal Bhat." },
  { id: 5, title: "Trip to Pokhara", date: "August 4, 2024", content: "Trekking to Australian Camp with amazing views." },
  { id: 6, title: "Trip to Pokhara", date: "August 4, 2024", content: "Paragliding day with breathtaking scenery." },
  { id: 7, title: "Trip to Pokhara", date: "August 4, 2024", content: "Sunset at lakeside, reflecting on the trip." },
  { id: 8, title: "Trip to Pokhara", date: "August 4, 2024", content: "Cultural exploration day visiting temples." },
  { id: 9, title: "Trip to Pokhara", date: "August 4, 2024", content: "Souvenir shopping and preparing to head back home." },
];

function Journals() {
  const {isDark} = useContext(ThemeContext)
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

  return (
    <div className={`min-h-screen p-6 pl-44 ${isDark?'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-900':'bg-gradient-to-br from-pink-200 via-purple-200 to-purple-300'}`}>
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-2xl font-bold mb-8 ${isDark?'text-gray-200':'text-gray-700'}`}>Recent Journals</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {journalsData.map((journal) => (
            <JournalCard
              key={journal.id}
              journal={journal}
              onClick={() => openPopup(journal)}
            />
          ))}
        </div>
      </div>

      {isPopupOpen && selectedJournal && (
        <JournalReadCard journal={selectedJournal} onClose={closePopup} />
      )}
    </div>
  );
}

export default Journals;
