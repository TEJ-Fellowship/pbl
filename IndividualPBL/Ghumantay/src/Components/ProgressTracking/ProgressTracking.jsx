import React, { useEffect, useState, useRef } from "react";

const ProgressTracking = () => {
  const [checkpoints, setCheckpoints] = useState(() => {
    const saved = localStorage.getItem("checkpoints");
    return saved ? JSON.parse(saved) : [];
  });

  const [localChecked, setLocalChecked] = useState({});
  const [showCheckpoints, setShowCheckpoints] = useState(false);

  const containerRef = useRef(null);
  const itemRefs = useRef({});

  // Initialize localChecked whenever checkpoints change
  useEffect(() => {
    const initialChecked = {};
    checkpoints.forEach((cp) => (initialChecked[cp.id] = cp.completed));
    setLocalChecked(initialChecked);
  }, [checkpoints]);

  // Handle checkbox toggle
  const handleCheckboxChange = (id) => {
    setLocalChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Save a single checkpoint
  const handleSave = (id) => {
    const updated = checkpoints.map((cp) =>
      cp.id === id ? { ...cp, completed: localChecked[id] } : cp
    );
    setCheckpoints(updated);
    localStorage.setItem("checkpoints", JSON.stringify(updated));

    setTimeout(() => scrollToFirstIncomplete(updated), 100);
  };

  // Reset all checkpoints
  const handleResetAll = () => {
    const updated = checkpoints.map((cp) => ({ ...cp, completed: false }));
    setCheckpoints(updated);

    const resetChecked = {};
    updated.forEach((cp) => (resetChecked[cp.id] = false));
    setLocalChecked(resetChecked);

    localStorage.setItem("checkpoints", JSON.stringify(updated));
  };

  // Refresh from localStorage
  const handleRefresh = () => {
    const saved = localStorage.getItem("checkpoints");
    if (saved) setCheckpoints(JSON.parse(saved));
  };

  // Scroll to first incomplete checkpoint
  const scrollToFirstIncomplete = (list) => {
    const firstIncomplete = list.find((cp) => !cp.completed);
    if (!firstIncomplete) {
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const el = itemRefs.current[firstIncomplete.id];
    if (el && containerRef.current) {
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const elemTop = el.getBoundingClientRect().top;
      const scrollOffset = elemTop - containerTop + containerRef.current.scrollTop;

      containerRef.current.scrollTo({ top: scrollOffset, behavior: "smooth" });
    }
  };

  const highlightedId = checkpoints.find((cp) => !cp.completed)?.id ?? null;

  return (
    <div className="max-w-md max-h-full mx-auto p-4 bg-[#0d0d0d] rounded-2xl shadow-lg border border-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-yellow-400">Progress Tracking</h2>

      {!showCheckpoints ? (
        <button
          onClick={() => setShowCheckpoints(true)}
          className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-200"
        >
          Show Checkpoints
        </button>
      ) : (
        <>
          {/* Reset + Refresh Buttons */}
          {checkpoints.length > 0 && (
            <div className="flex justify-end mb-6 space-x-2">
              <button
                onClick={handleResetAll}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
              >
                Reset All
              </button>
              <button
                onClick={handleRefresh}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                Refresh
              </button>
            </div>
          )}

          {checkpoints.length === 0 ? (
            <div className="text-center mt-6">
              <p className="text-gray-400 mb-4">No checkpoints found.</p>
              <button
                onClick={handleRefresh}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                Try Again
              </button>
            </div>
          ) : (
            <ul
              ref={containerRef}
              className="overflow-y-auto max-h-[37.5rem] border border-gray-800 rounded-md"
              style={{ scrollBehavior: "smooth" }}
            >
              {checkpoints.map(({ id, name }) => {
                const isHighlighted = id === highlightedId;
                const isCompleted = localChecked[id];

                return (
                  <li
                    key={id}
                    ref={(el) => (itemRefs.current[id] = el)}
                    className={`flex items-center justify-between border-b border-gray-800 py-2 px-3 last:border-none transition-colors ${
                      isHighlighted ? "bg-yellow-500/20 font-semibold" : "bg-[#1a1a1a]"
                    }`}
                  >
                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!localChecked[id]}
                        onChange={() => handleCheckboxChange(id)}
                        className="form-checkbox h-5 w-5 text-green-500 bg-gray-900 border-gray-600 rounded"
                      />
                      <span className={isCompleted ? "line-through text-gray-500" : "text-gray-200"}>
                        {name}
                      </span>
                    </label>

                    <button
                      onClick={() => handleSave(id)}
                      className="ml-4 px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-500 transition"
                    >
                      Save
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default ProgressTracking;
