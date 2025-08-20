import { Heart, X, Plus } from "lucide-react";
import { React, useState } from "react";

const careerAreas = [
  "Software Development",
  "Digital Marketing",
  "Business Analysis",
  "Data Science",
  "Machine Learning",
  "Product Management",
  "UX/UI Design",
  "Cybersecurity",
  "Artificial Intelligence",
  "Cloud Computing",
  "Project Management",
  "Web Development",
  "Mobile Development",
  "DevOps",
  "Sales",
  "Finance",
  "Human Resources",
  "Content Writing",
  "Graphic Design",
  "Consulting",
];

const Career = () => {
  const [selectedInterests, setSelectedInterests] = useState(() => {
    const savedInterests = localStorage.getItem("careerInterests");
    return savedInterests ? JSON.parse(savedInterests) : [""];
  });

  const [customInterest, setCustomInterest] = useState("");

  const removeInterest = (interestToRemove) => {
    setSelectedInterests(
      selectedInterests.filter((interest) => interest !== interestToRemove)
    );
  };

  const addCustomInterest = () => {
    if (
      customInterest.trim() &&
      !selectedInterests.includes(customInterest.trim())
    ) {
      setSelectedInterests([...selectedInterests, customInterest.trim()]);
      setCustomInterest("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-slate-700 dark:text-white mb-2">
          What interests you?
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Select your career interests to get personalized recommendations
        </p>
      </div>
      <div className="mb-8 bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-rose-500 dark:text-rose-100" />
          <h2 className="text-lg font-medium text-slate-700 dark:text-white">
            Your Selected Interests ({selectedInterests.length})
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {selectedInterests.map((interest, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/80 text-white text-sm font-medium rounded-full hover:bg-blue-500 transition-colors"
            >
              <span>{interest}</span>
              <button
                onClick={() => removeInterest(interest)}
                className="hover:bg-blue-600 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${interest}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Add Custom Interest
        </h3>

        <div className="flex gap-3">
          <input
            type="text"
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
            placeholder="Enter a custom career interest..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 dark:text-gray-200 dark:bg-gray-800 placeholder-gray-400"
          />
          <button
            onClick={addCustomInterest}
            disabled={!customInterest.trim()}
            className="px-4 py-3 bg-blue-500/70 text-white rounded-lg hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="Add interest"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Popular Career Areas */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Popular Career Areas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {careerAreas.map((area, index) => (
            <button
              key={index}
              onClick={() => {
                if (!selectedInterests.includes(area)) {
                  setSelectedInterests([...selectedInterests, area]);
                }
              }}
              className={`text-left px-4 py-3 rounded-lg transition-colors ${
                selectedInterests.includes(area)
                  ? "bg-blue-500/80 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              disabled={selectedInterests.includes(area)}
            >
              {area}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-8">
        <button
          className="px-6 py-3 bg-blue-500/70 text-white rounded-lg hover:bg-blue-500 transition-colors"
          onClick={() => {
            localStorage.setItem(
              "careerInterests",
              JSON.stringify(selectedInterests)
            );
            alert("Your interests have been saved successfully!");
          }}
        >
          Save My Interests
        </button>
      </div>
    </div>
  );
};

export default Career;
