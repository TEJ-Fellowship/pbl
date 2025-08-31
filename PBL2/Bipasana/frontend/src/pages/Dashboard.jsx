import React from "react";
import NewJournalCard from "../components/NewJournalCard";
import FlashBack from "../components/FlashBack";
import Filter from "../components/FIlter";
import Journals from "../components/Journals";
import JournalReadCard from "../components/JournalReadCard";
function Dashboard() {
  return (
    <div>
      <JournalReadCard />
      <NewJournalCard />
      <FlashBack />
      <Filter />
      <Journals />
    </div>
  );
}

export default Dashboard;
