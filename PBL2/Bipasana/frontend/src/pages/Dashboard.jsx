import React from "react";
import NewJournalCard from "../components/NewJournalCard";
import FlashBack from "../components/FlashBack";
import Filter from "../components/FIlter";
import Journal from "../components/Journal";
import JournalForm from "../components/JournalForm";
import JournalReadCard from "../components/JournalReadCard";
function Dashboard() {
  return (
    <div>
      <JournalReadCard />
      <NewJournalCard />
      <FlashBack />
      <Filter  />
      <Journal />
      <JournalForm />

    </div>
  )
}

export default Dashboard;
