import { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import "./App.css";
import Productivity from "./components/Productivity";
import YourTask from "./components/YourTask";
import QuickAdd from "./components/QuickAdd";
import Navbar from "./components/Navbar";
import Banner from "./components/Banner";

const apiKey = import.meta.env.VITE_GEMINI_KEY;
const ai = new GoogleGenAI({ apiKey });

function App() {
  const [tasks, setTasks] = useState([]); //[{},{},{}]
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState([]);
  const [prompt, setPrompt] = useState("");

  const getTaskBreakdownPrompt = (userGoal) => {
    const today = new Date().toDateString();
    return `
        Today is: ${today}
        You are a smart task manager. Based on the goal or objective provided by the user, evaluate as the person looking at the nepali patro/google calender about how many day are remaining from today's date to the given user duedate and put it in "precise remaining days" in the JSON FORMAT, generate a structured task breakdown in the following JSON format:

        {
          "goals": [
            {
              "id": number,
              "title": "Subgoal or Phase Title",
              "duedate": "date given by user",
              "tasks": [
                { "id": number, "text": "Specific task or action step", "message": "You have (precise remaining days) remained till (put due date given by user)" }
              ]
            }
          ]
        }

        Rules:
        - Each "goal" is a major step, phase, or milestone.
        - Each goal must have 2–4 actionable tasks.
        - Output only the JSON. No extra explanation.

        User's goal:
        "${userGoal}"
        `;
  };

  const handleGemini = async () => {
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: getTaskBreakdownPrompt(prompt),
      });

      console.log(response.text);
      let cleanedResponse = response.text
        .replace(/```json\n?/g, "") // Remove ```json
        .replace(/```\n?/g, "") // Remove ```
        .trim(); // Remove extra whitespace

      let finalData = JSON.parse(cleanedResponse);
      setAiResponse(finalData.goals.map((tasks) => tasks));
      setLoading(false);
    } catch (error) {
      console.log(error.message);
      setAiResponse(error.message);
    }
  };

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
      <br />
      <br />
      <Banner />
      <QuickAdd onAdd={addTask} />
      <YourTask
        tasks={tasks}
        onCompleteTask={handleCompleteTask}
        onDeleteTask={handleDeleteTask}
      />
      <Productivity tasks={tasks} />
      <section id="gemini">
        <h2>Gemini Suggestions</h2>
        <div>
          <textarea
            rows={10}
            cols={50}
            type="text"
            placeholder="Enter a prompt here"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button onClick={handleGemini}>
            {loading ? "Thinking..." : "Ask Gemini"}
          </button>
        </div>
        <div className="container">
          {aiResponse.map((tasks, idx) => (
            <div className="fluid-container" key={idx}>
              <h5>{tasks.title} </h5>
              <span>{tasks.tasks[0].message}</span>
              <hr />
              <span>
                <h5>Suggestions</h5>
                {tasks.tasks.map((task, index) => (
                  <li key={index}>{task.text} </li>
                ))}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default App;
