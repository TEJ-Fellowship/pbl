import { useState } from "react";
import "./App.css";
import Productivity from "./components/Productivity";
import YourTask from "./components/YourTask";
import QuickAdd from "./components/QuickAdd";
import Navbar from "./components/Navbar";
function App() {
  const [tasks, setTasks] = useState([]); //[{},{},{}]

  const addTask = (task) => {
    //task=newTask
    setTasks((prev) => [...prev, task]);
  };

  const handleCompleteTask = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, isComplete: true } : task
      )
    );
  };

  const handleDeleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  return (
    <>
      <Navbar />
      <QuickAdd onAdd={addTask} />
      <YourTask
        tasks={tasks}
        onCompleteTask={handleCompleteTask}
        onDeleteTask={handleDeleteTask}
      />
      <Productivity tasks={tasks} />
    </>
  );
}

export default App;
