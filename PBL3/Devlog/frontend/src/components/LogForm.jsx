import React, { useState } from "react";
import Select from "react-select";


function LogForm({onAddLog}) {
  //state for the form logic
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState([]);
  const [time, setTime] = useState("");
  const [milestone, setMilestone] = useState(false);


  function handleSubmit(e){
    e.preventDefault();
    
    let newLog = {
        id:Date.now(),
        projectName,
        description,
        techStack,
        time,
        milestone
    }

    onAddLog(newLog)  // <-- This calls the function passed as prop, sending newLog back to parent

    setProjectName("")
    setDescription("")
    setTechStack([])
    setTime("")
    setMilestone(false)
  }

  const techOptions = [
    // Frontend frameworks & libraries
    { value: "react", label: "React" },
    { value: "angular", label: "Angular" },
    { value: "vue", label: "Vue.js" },
    { value: "svelte", label: "Svelte" },
    { value: "nextjs", label: "Next.js" },
    { value: "nuxtjs", label: "Nuxt.js" },
    { value: "jquery", label: "jQuery" },
  
    // Backend frameworks
    { value: "nodejs", label: "Node.js" },
    { value: "express", label: "Express.js" },
    { value: "nestjs", label: "NestJS" },
    { value: "django", label: "Django" },
    { value: "flask", label: "Flask" },
    { value: "springboot", label: "Spring Boot" },
    { value: "ruby_on_rails", label: "Ruby on Rails" },
    { value: "laravel", label: "Laravel" },
    { value: "aspnet", label: "ASP.NET" },
  
    // Databases
    { value: "mysql", label: "MySQL" },
    { value: "postgresql", label: "PostgreSQL" },
    { value: "mongodb", label: "MongoDB" },
    { value: "sqlite", label: "SQLite" },
    { value: "firebase", label: "Firebase" },
    { value: "redis", label: "Redis" },
  
    // Mobile
    { value: "react_native", label: "React Native" },
    { value: "flutter", label: "Flutter" },
    { value: "swift", label: "Swift" },
    { value: "kotlin", label: "Kotlin" },
  
    // DevOps / Cloud
    { value: "docker", label: "Docker" },
    { value: "kubernetes", label: "Kubernetes" },
    { value: "aws", label: "AWS" },
    { value: "azure", label: "Azure" },
    { value: "gcp", label: "Google Cloud Platform" },
    { value: "heroku", label: "Heroku" },
    { value: "vercel", label: "Vercel" },
    { value: "netlify", label: "Netlify" },
  
    // Other tools / languages
    { value: "typescript", label: "TypeScript" },
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "csharp", label: "C#" },
    { value: "cplus", label: "C++" },
    { value: "php", label: "PHP" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
  ];
  




  return (
    <div className="max-w-screen-xl mx-auto bg-white p-4 mt-16 rounded-lg shadow-md border border-gray-300">
      <form className="space-y-4 " onSubmit={handleSubmit}>
        {/* Input field */}
        <input
          type="text"
          placeholder="Project name"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />

        {/* Textarea */}
        <textarea
          placeholder="description..."
          rows="4"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>

        {/* Select option */}
        {/* <select
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          multiple
          onChange={handleSelect}
          value={techStack}
          
        >
          <option value="">Select a tech stack</option>
          <option value="react">React</option>
          <option value="angular">Angular</option>
          <option value="vue">Vue.js</option>
          <option value="svelte">Svelte</option>
          <option value="node">Node.js</option>
          <option value="express">Express.js</option>
          <option value="django">Django</option>
          <option value="flask">Flask</option>
          <option value="spring">Spring Boot</option>
          <option value="ruby-on-rails">Ruby on Rails</option>
          <option value="laravel">Laravel</option>
          <option value="next">Next.js</option>
          <option value="nuxt">Nuxt.js</option>
          <option value="tailwind">Tailwind CSS</option>
          <option value="bootstrap">Bootstrap</option>
          <option value="mysql">MySQL</option>
          <option value="postgresql">PostgreSQL</option>
          <option value="mongodb">MongoDB</option>
          <option value="firebase">Firebase</option>
          <option value="aws">AWS</option>
          <option value="azure">Azure</option>
          <option value="gcp">Google Cloud Platform</option>
          <option value="docker">Docker</option>
          <option value="kubernetes">Kubernetes</option>
        </select> */}



        <Select
        isMulti
        options={techOptions}
        value={techOptions.filter((op) => techStack.includes(op.value))}
        onChange={(selected) => setTechStack(selected.map(op=> op.value))}
        
        />

        {/* Another input field */}
        <input
          type="number"
          placeholder="Time spent"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />

        {/* Another input field */}

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            value={milestone}
            onChange={(e) => setMilestone(true)}
          />
          <span className="text-gray-700">Mark as milestone</span>
        </label>

        {/* Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Log
          </button>
          <button
            type="button"
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default LogForm;
