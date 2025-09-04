import React, { useState } from "react"

function Dashboard() {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [timer, setTimer] = useState("No timer")

  const handleOptionChange = (index, value) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions([...options, ""])
  }

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log({ question, options, timer })
    alert("Poll created successfully!")
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 border-b">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold text-red-500">Spindle</span>
          <ul className="flex gap-6 text-gray-700 font-medium">
            <li className="cursor-pointer hover:text-red-500">Home</li>
            <li className="cursor-pointer hover:text-red-500">My Polls</li>
            <li className="cursor-pointer hover:text-red-500">Explore</li>
          </ul>
        </div>
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white font-bold cursor-pointer">
          AL
        </div>
      </nav>

      {/* Form Section */}
      <div className="flex justify-center items-center flex-1 px-4">
        <div className="w-full max-w-lg bg-white p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Create a New Poll
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Quickly gather opinions and make group decisions.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Question
              </label>
              <input
                type="text"
                placeholder="e.g., Where should we go for lunch?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-400 focus:outline-none"
              />
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Answer Options
              </label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-400 focus:outline-none"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="text-red-500 text-sm font-medium hover:underline"
              >
                + Add another option
              </button>
            </div>

            {/* Timer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timer (Optional)
              </label>
              <select
                value={timer}
                onChange={(e) => setTimer(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-400 focus:outline-none"
              >
                <option>No timer</option>
                <option>5 minutes</option>
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>24 hours</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-full shadow-md transition-transform transform hover:scale-105"
            >
              Create Poll
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
