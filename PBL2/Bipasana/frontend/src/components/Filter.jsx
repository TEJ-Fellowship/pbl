import React, { useState, useEffect } from "react";
import emojis from "../emojis";
import moreEmojis from "../moreEmojis";

function Filter({ journals, setJournals, originalJournals }) {
  const displayEmojis = [...emojis, ...moreEmojis];
  const [sortBy, setSortBy] = useState("newest");
  const [moodFilter, setMoodFilter] = useState("mood");
  const [searchText, setSearchText] = useState("");

  // Apply all filters whenever any filter changes
  useEffect(() => {
    // Don't filter if originalJournals is empty or not loaded yet
    if (!originalJournals || originalJournals.length === 0) {
      setJournals([]);
      return;
    }

    let filteredResults = [...originalJournals];

    // Apply mood filter
    if (moodFilter !== "mood") {
      filteredResults = filteredResults.filter(
        (journal) => journal.mood && journal.mood.label && journal.mood.label === moodFilter
      );
    }

    // Apply text search filter
    if (searchText.trim() !== "") {
      filteredResults = filteredResults.filter((journal) =>
        journal.name && 
        journal.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply sorting
    if (sortBy === "newest") {
      filteredResults.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
      });
    } else if (sortBy === "oldest") {
      filteredResults.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateA - dateB;
      });
    }

    setJournals(filteredResults);
  }, [moodFilter, searchText, sortBy, originalJournals, setJournals]);

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleMoodChange = (e) => {
    setMoodFilter(e.target.value);
  };

  const handleSearchText = (e) => {
    setSearchText(e.target.value);
  };

  return (
    <div className="flex flex-col items-center mt-8">
      <input
        type="text"
        value={searchText}
        onChange={handleSearchText}
        placeholder="🔍 Search journals..."
        className="w-[65%] p-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
      />

      <div className="flex flex-wrap justify-center gap-4 w-[65%]">
        <select
          value={sortBy}
          onChange={handleSortChange}
          className="p-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="newest">Sort by Newest 🔽</option>
          <option value="oldest">Sort by Oldest</option>
        </select>

        <select
          value={moodFilter}
          onChange={handleMoodChange}
          className="p-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="mood">All Moods</option>
          {displayEmojis.map((emoji, i) => {
            return (
              <option key={i} value={emoji.label}>
                {emoji.label} {emoji.symbol}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}

export default Filter;