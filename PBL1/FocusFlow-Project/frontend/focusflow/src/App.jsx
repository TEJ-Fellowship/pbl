import { useState } from "react";
import "./App.css";
import Productivity from "./components/Productivity";
import YourTask from "./components/YourTask";
import QuickAdd from "./components/QuickAdd";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <QuickAdd />
      <YourTask />
      <Productivity />
    </>
  );
}

export default App;
