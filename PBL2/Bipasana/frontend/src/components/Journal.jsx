import React from "react";
import JournalCard from "./JournalCard";
function Journal() {
  return (
    <div className="w-[65%] mx-auto" >
      <h1 className="text-2xl text-bold">Recent Journals</h1>
      <div className="flex gap-4 mb-4">
        <JournalCard />
        <JournalCard />
        <JournalCard />
        <JournalCard />
        <JournalCard />
      </div>
      <div className="flex gap-4 mb-4">
        <JournalCard />
        <JournalCard />
        <JournalCard />
        <JournalCard />
        <JournalCard />
      </div>
      <div className="flex gap-4 mb-4">
        <JournalCard />
        <JournalCard />
        <JournalCard />
        <JournalCard />
        <JournalCard />
      </div>
    </div>
  );
}

export default Journal;
