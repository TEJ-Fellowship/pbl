import ProjectList from "./components/projects/ProjectList";
import "./App.css";

function App() {
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold text-center my-8">Project Showcase</h1>
      <ProjectList />
    </div>
  );
}

export default App;
