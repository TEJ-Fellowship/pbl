import React, { useState } from "react";
import { XMarkIcon, SparklesIcon } from "@heroicons/react/24/solid"; // npm install @heroicons/react
import axios from "axios";

function CreatePoll() {
  const [options, setOptions] = useState(["", ""]); // start with 2 options

  const [timer, setTimer] = useState("no-timer");

  const [titleText, setTitleText] = useState("");

  const [aiSuggestion, setAiSuggestion] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const storedUser = JSON.parse(localStorage.getItem("user"));

    try {
      let obj = {
        question: titleText,
        options,
        timer,
        userId: storedUser?._id || storedUser?.id,
      };

      const response = await axios.post(
        "http://localhost:5000/api/createPoll",
        obj
      );
      console.log("poll created", response.data);

      setTitleText("");
      setOptions(["", ""]);
      setTimer("");

      setAiSuggestion([]);

      alert("Poll created!");
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  //ai suggestion

  const getAiSuggestion = async () => {
    if (!titleText.trim()) {
      alert("Please enter a question first");
      return;
    }
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/gemini", {
        question: titleText,
      });
      console.log("gemini response", res.data.text);
      setAiSuggestion(res.data.text);

      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  const addSuggestionToOptions = (suggestion) => {
    const newOptions = [...options];
    const emptyIndex = newOptions.findIndex((opt) => opt.trim() === "");
    if (emptyIndex !== -1) {
      // put the suggestion into the first empty option field
      newOptions[emptyIndex] = suggestion;
    } else {
      // if no empty option left, append to the end
      newOptions.push(suggestion);
    }
    setOptions(newOptions);
  };

  return (
    <section className="bg-white">
      <div className="py-8 lg:py-16 px-4 mx-auto max-w-screen-md">
        <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-center text-gray-900">
          Create a New Poll
        </h2>

        <p className="mb-8 lg:mb-16 font-light text-center text-gray-500 sm:text-xl">
          make chaotic group decisions fast
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Question */}
          <div>
            <label
              htmlFor="question"
              className="block mb-2 text-sm font-medium text-gray-900"
            >
              Your question
            </label>
            <input
              type="text"
              id="question"
              className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="e.g. Where should we go for a birthday party?"
              required
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
            />
          </div>

          {/* AI SUGGESTIONS*/}

          <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <SparklesIcon className="w-5 h-5 text-red-500" />

              <p className="text-sm text-gray-700 font-medium">
                Need ideas? Get AI suggestions for poll options
              </p>
            </div>

            <button
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow disabled:opacity-50"
              onClick={getAiSuggestion}
              disabled={loading}
            >
              {loading ? "Getting suggestions..." : "✨ Get AI Suggestions"}
            </button>
          </div>

          {/* show ai suggestion */}
          {aiSuggestion.length > 0 && (
            <div className="mt-4 space-y-2">
              {aiSuggestion.map((a, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm border"
                >
                  <span className="text-gray-700 text-sm">{a}</span>

                  <button
                    type="button"
                    onClick={() => addSuggestionToOptions(a)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Options */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Options
            </label>

            <div className="space-y-3">
              {options.map((opt, index) => (
                <div key={index} className="relative">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="block w-full p-3 pr-10 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {/* remove button */}
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-red-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add option button */}
            <button
              type="button"
              onClick={addOption}
              className="mt-3 px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-600 hover:text-white transition"
            >
              ➕ Add option
            </button>
          </div>

          {/* Question */}
          <div>
            <label
              htmlFor="timer"
              className="block mb-2 text-sm font-medium text-gray-900"
            >
              Poll Timer
            </label>
            <select
              id="timer"
              value={timer}
              onChange={(e) => setTimer(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5"
            >
              <option value="no-timer">No timer</option>
              <option value="5m">5 minutes</option>
              <option value="15m">15 minutes</option>
              <option value="30m">30 minutes</option>
              <option value="1h">1 hour</option>
              <option value="24h">24 hours</option>
            </select>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="py-3 px-6 text-sm font-medium text-center text-white rounded-full bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300"
          >
            Create Poll
          </button>
        </form>
      </div>
    </section>
  );
}

export default CreatePoll;
