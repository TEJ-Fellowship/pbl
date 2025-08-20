import React, { useEffect, useState, useMemo, useCallback } from "react";
import { generateItinerary } from "../../geminiService";

const STORAGE_KEY = "itinerary";

const ItineraryGenerator = () => {
  const [itinerary, setItinerary] = useState({});
  const [loading, setLoading] = useState(false);
  const [editDay, setEditDay] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(3);
  const [tripData, setTripData] = useState({});
  const [checkpoints, setCheckpoints] = useState([]);
  const [lastGenerated, setLastGenerated] = useState(null);

  // Load trip data and checkpoints from localStorage
  const loadLocalStorageData = useCallback(() => {
    try {
      const savedCheckpoints = JSON.parse(localStorage.getItem("checkpoints")) || [];
      const savedTripData = JSON.parse(localStorage.getItem("tripData")) || {};
      
      console.log("📱 Loading latest data from localStorage:", { 
        tripData: savedTripData, 
        checkpoints: savedCheckpoints.length 
      });
      
      setCheckpoints(savedCheckpoints);
      setTripData(savedTripData);
      
      return { savedCheckpoints, savedTripData };
    } catch (error) {
      console.error("❌ Error loading from localStorage:", error);
      setCheckpoints([]);
      setTripData({});
      return { savedCheckpoints: [], savedTripData: {} };
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadLocalStorageData();
    
    // Load saved itinerary if exists
    const savedItinerary = localStorage.getItem(STORAGE_KEY);
    if (savedItinerary) {
      try {
        const parsed = JSON.parse(savedItinerary);
        console.log("💾 Loaded saved itinerary from localStorage");
        setItinerary(parsed);
      } catch (error) {
        console.warn("⚠️ Failed to parse saved itinerary, removing corrupted data");
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [loadLocalStorageData]);

  const { startDate, endDate, destination } = tripData;

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  // Check if we have valid trip data
  const hasValidTripData = useMemo(() => {
    return !!(startDate && endDate && destination && checkpoints.length > 0);
  }, [startDate, endDate, destination, checkpoints.length]);

  // --- Helper Functions ---
  const getPlaceName = async (lat, lon) => {
    console.log(`📍 Resolving coordinates: ${lat}, ${lon}`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
      
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        { 
          headers: { 
            "User-Agent": "itinerary-generator/1.0",
            "Accept": "application/json"
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Extract a clean place name
      const placeName = data.display_name || 
                       data.name || 
                       `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      
      console.log("📍 Resolved place:", placeName);
      return placeName;
      
    } catch (err) {
      console.error("❌ Failed to resolve place name:", err);
      
      if (err.name === 'AbortError') {
        return `Location (${lat.toFixed(4)}, ${lon.toFixed(4)}) - Timeout`;
      }
      
      return `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
    }
  };

  const convertCheckpointsToPlaces = async (checkpointsArray) => {
    console.log("🔄 Converting checkpoints to place names");
    
    if (!checkpointsArray || checkpointsArray.length === 0) {
      throw new Error("No checkpoints provided");
    }

    try {
      const placePromises = checkpointsArray.map(async (cp, index) => {
        if (!cp?.coords || !Array.isArray(cp.coords) || cp.coords.length < 2) {
          console.warn(`⚠️ Invalid checkpoint at index ${index}:`, cp);
          return `Checkpoint ${index + 1}`;
        }
        
        const [lat, lon] = cp.coords;
        if (typeof lat !== 'number' || typeof lon !== 'number') {
          console.warn(`⚠️ Invalid coordinates at index ${index}:`, lat, lon);
          return `Checkpoint ${index + 1}`;
        }
        
        return await getPlaceName(lat, lon);
      });

      const places = await Promise.all(placePromises);
      console.log("✅ Successfully converted checkpoints to places:", places);
      return places;
      
    } catch (error) {
      console.error("❌ Error converting checkpoints:", error);
      throw new Error(`Failed to process location data: ${error.message}`);
    }
  };

  // --- Main Generate Function ---
  const handleGenerateItinerary = async () => {
    console.log("🎯 Generate Itinerary button clicked");
    
    // Load the latest data from localStorage
    const { savedCheckpoints, savedTripData } = loadLocalStorageData();
    
    const { startDate: latestStartDate, endDate: latestEndDate, destination: latestDestination } = savedTripData;
    
    // Validate we have all required data
    if (!latestStartDate || !latestEndDate || !latestDestination) {
      setError("Missing trip information. Please set your destination and travel dates first.");
      console.warn("⚠️ Missing trip data:", savedTripData);
      return;
    }

    if (!savedCheckpoints || savedCheckpoints.length === 0) {
      setError("No destinations selected. Please add some places to visit on your trip.");
      console.warn("⚠️ No checkpoints found");
      return;
    }

    setLoading(true);
    setError("");
    setLastGenerated(new Date().toISOString());
    
    console.log("⏳ Starting itinerary generation with latest data:", {
      destination: latestDestination,
      dates: `${latestStartDate} to ${latestEndDate}`,
      checkpoints: savedCheckpoints.length
    });

    try {
      // Convert coordinates to place names
      const places = await convertCheckpointsToPlaces(savedCheckpoints);
      
      // Calculate days with latest data
      const start = new Date(latestStartDate);
      const end = new Date(latestEndDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      console.log(`📅 Generating ${days} days of itinerary for places:`, places);

      // Generate itinerary using Gemini
      const generated = await generateItinerary(
        latestDestination,
        latestStartDate,
        latestEndDate,
        days,
        places
      );

      console.log("✅ Itinerary generated successfully:", generated);

      if (generated && typeof generated === 'object' && Object.keys(generated).length > 0) {
        setItinerary(generated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(generated));
        setVisibleCount(Math.min(3, Object.keys(generated).length)); // Reset visible count
        console.log("💾 Itinerary saved to localStorage");
      } else {
        throw new Error("Generated itinerary is empty or invalid format");
      }

    } catch (err) {
      console.error("❌ Error generating itinerary:", err);
      
      let errorMessage = "Failed to generate itinerary. Please try again.";
      
      if (err.message.includes('API key')) {
        errorMessage = "API key issue. Please check your Gemini API configuration.";
      } else if (err.message.includes('location data')) {
        errorMessage = "Unable to process your selected destinations. Please try selecting different locations.";
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setItinerary({});
    } finally {
      setLoading(false);
      console.log("⏹ Generation process completed");
    }
  };

  // --- Event Handlers ---
  const handleEditClick = (day) => {
    setEditDay(day);
    setEditedText(itinerary[day] || "");
    console.log(`✏️ Editing ${day}`);
  };

  const handleSaveClick = () => {
    if (!editedText.trim()) return;
    
    const updated = { ...itinerary, [editDay]: editedText.trim() };
    setItinerary(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log(`💾 Saved edit for ${editDay}`);
    
    setEditDay(null);
    setEditedText("");
  };

  const handleCancelClick = () => {
    console.log(`❌ Edit canceled for ${editDay}`);
    setEditDay(null);
    setEditedText("");
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 10 && visibleCount < Object.keys(itinerary).length) {
      setVisibleCount(prev => prev + 2);
      console.log("📄 Loading more days, new visibleCount:", visibleCount + 2);
    }
  };

  const handleReset = () => {
    console.log("🔄 Resetting itinerary");
    localStorage.removeItem(STORAGE_KEY);
    setItinerary({});
    setVisibleCount(3);
    setError("");
    setLastGenerated(null);
  };

  // --- Render Functions ---
  const renderItineraryItem = ([day, content]) => {
    if (editDay === day) {
      return (
        <div key={day} className="mb-4 p-4 border border-gray-700 rounded-lg bg-gray-800">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">{day}</h3>
          <textarea
            className="w-full p-3 text-gray-900 bg-gray-100 rounded-lg min-h-32 max-h-48 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-vertical"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            placeholder="Enter your itinerary details..."
          />
          <div className="mt-3 flex gap-2">
            <button
              disabled={!editedText.trim()}
              className={`px-4 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-2 ${
                !editedText.trim()
                  ? "bg-gray-600 cursor-not-allowed text-gray-400"
                  : "bg-green-600 hover:bg-green-700 focus:ring-green-400 text-white"
              }`}
              onClick={handleSaveClick}
            >
              Save Changes
            </button>
            <button
              className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 text-white"
              onClick={handleCancelClick}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={day} className="mb-4 p-4 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-750 transition duration-200">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-yellow-400">{day}</h3>
          <button
            className="bg-blue-600 px-3 py-1 rounded-lg hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-white"
            onClick={() => handleEditClick(day)}
          >
            Edit
          </button>
        </div>
        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </div>
    );
  };

  const renderTripSummary = () => {
    if (!hasValidTripData) return null;
    
    return (
      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">Trip Summary</h3>
        <div className="text-sm text-gray-300 space-y-1">
          <p><span className="text-yellow-400">Destination:</span> {destination}</p>
          <p><span className="text-yellow-400">Duration:</span> {totalDays} days</p>
          <p><span className="text-yellow-400">Dates:</span> {startDate} to {endDate}</p>
          <p><span className="text-yellow-400">Stops:</span> {checkpoints.length} locations</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl max-h-full mx-auto p-6 bg-[#0d0d0d] rounded-2xl shadow-xl text-gray-200 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-yellow-400">Trip Itinerary</h2>
        {lastGenerated && (
          <span className="text-xs text-gray-500">
            Generated: {new Date(lastGenerated).toLocaleTimeString()}
          </span>
        )}
      </div>

      {renderTripSummary()}

      {/* Generate/Reset Button Section */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={handleGenerateItinerary}
          disabled={loading || !hasValidTripData}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition duration-200 focus:outline-none focus:ring-2 ${
            loading
              ? "bg-gray-600 cursor-not-allowed text-gray-400"
              : !hasValidTripData
              ? "bg-gray-600 cursor-not-allowed text-gray-400"
              : "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-black"
          }`}
        >
          {loading ? "Generating..." : "Generate Itinerary"}
        </button>
        
        {Object.keys(itinerary).length > 0 && (
          <button
            onClick={handleReset}
            disabled={loading}
            className="bg-red-500 px-4 py-3 rounded-lg hover:bg-red-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 text-white font-semibold"
          >
            Reset
          </button>
        )}
      </div>

      {/* Status Messages */}
      {!hasValidTripData && !loading && (
        <div className="mb-4 p-4 bg-yellow-900 border border-yellow-600 rounded-lg">
          <p className="text-yellow-200 text-sm">
            ⚠️ Please set up your trip details and select destinations before generating an itinerary.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center space-x-3 py-12">
          <svg
            className="animate-spin h-8 w-8 text-yellow-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <div className="text-center">
            <p className="text-gray-300 font-medium">Generating your personalized itinerary...</p>
            <p className="text-gray-500 text-sm mt-1">This may take a few moments</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-900 border border-red-600 rounded-lg">
          <p className="text-red-200 mb-3">{error}</p>
          <button
            onClick={handleGenerateItinerary}
            disabled={loading || !hasValidTripData}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Itinerary Display */}
      {Object.keys(itinerary).length > 0 && !loading && (
        <div 
          className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar" 
          onScroll={handleScroll}
        >
          {Object.entries(itinerary)
            .slice(0, visibleCount)
            .map(renderItineraryItem)}
          
          {visibleCount < Object.keys(itinerary).length && (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">Scroll down to load more days...</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {Object.keys(itinerary).length === 0 && !loading && !error && hasValidTripData && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✈️</div>
          <p className="text-gray-400 mb-4">Ready to create your adventure!</p>
          <p className="text-gray-500 text-sm">Click "Generate Itinerary" to get started with your personalized travel plan.</p>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4a4a4a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6a6a6a;
        }
      `}</style>
    </div>
  );
};

export default ItineraryGenerator;