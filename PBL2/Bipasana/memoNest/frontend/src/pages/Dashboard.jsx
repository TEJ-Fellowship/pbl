import React from "react";
import NewJournalCard from "../components/NewJournalCard";
import FlashBack from "../components/FlashBack";
import Filter from "../components/FIlter";
import Journal from "../components/Journal";
import JournalForm from "../components/JournalForm";
function Dashboard() {
  return (
    <div>
      <NewJournalCard />
      <FlashBack />
      <Filter  />
      <Journal />
      <JournalForm />
    </div>
  )
}

export default Dashboard;
