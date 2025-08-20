import React from "react";
import NewJournalCard from "../components/NewJournalCard";
import FlashBack from "../components/FlashBack";
import Filter from "../components/FIlter";
import Journal from "../components/Journal";
function Dashboard() {
  return (
    <div>
      <NewJournalCard />
      <FlashBack />
      <Filter  />
      <Journal />
    </div>
  )
}

export default Dashboard;
