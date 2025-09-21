import React, { useState, useEffect } from "react";
import {
  Film,
  Download,
  Share2,
  Calendar,
  PlayCircle,
  Loader,
  Music,
  Volume2,
  VolumeX,
  Search,
} from "lucide-react";
import clipService from "../services/clip";
import musicService from "../services/music";
import externalMusicService from "../services/externalMusic";

function Montage() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentMontage, setCurrentMontage] = useState(null);
  const [montageHistory, setMontageHistory] = useState([]);
  const [error, setError] = useState(null);

  // Music-related state
  const [availableMusic, setAvailableMusic] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [musicPreview, setMusicPreview] = useState(null);
  const [musicSearchQuery, setMusicSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("library"); // "library" or "search"
  const [isApplyingMusic, setIsApplyingMusic] = useState(false);

  // Get current month as default
  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    setSelectedMonth(currentMonth);

    // Load user's montage history
    loadMontageHistory();

    // Load available music
    loadAvailableMusic();
  }, []);

  const loadAvailableMusic = async () => {
    try {
      // First try to seed the database if no music exists
      await musicService.seedMusic();

      const response = await musicService.getAllMusic();
      if (response.success) {
        setAvailableMusic(response.music);
      }
    } catch (error) {
      console.error("Failed to load music:", error);
    }
  };

  const loadMontageHistory = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/montage", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setMontageHistory(data.montages);
      }
    } catch (error) {
      console.error("Failed to load montage history:", error);
    }
  };

  const handleGenerateMontage = async () => {
    if (!selectedMonth) {
      setError("Please select a month");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const [year, monthStr] = selectedMonth.split("-");
      const month = parseInt(monthStr);

      console.log(
        `Generating montage for ${month}/${year} (music can be added later)`
      );

      const result = await clipService.generateMontage(month, parseInt(year));

      if (result.success) {
        setCurrentMontage(result);
        setError(null);
        // Reload montage history to include the new one
        await loadMontageHistory();
      } else {
        setError(result.message || "Failed to generate montage");
      }
    } catch (error) {
      console.error("Error generating montage:", error);
      setError(error.response?.data?.error || "Failed to generate montage");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMusicSelect = (music) => {
    setSelectedMusic(music);
    setShowMusicSelector(false);
    // Stop any current preview
    if (musicPreview) {
      musicPreview.pause();
      setMusicPreview(null);
    }
  };

  const playMusicPreview = (music) => {
    // Stop current preview if playing
    if (musicPreview) {
      musicPreview.pause();
    }

    const audio = new Audio(music.url);
    audio.volume = 0.3;
    audio.play();
    setMusicPreview(audio);

    // Stop preview after 10 seconds
    setTimeout(() => {
      audio.pause();
      if (musicPreview === audio) {
        setMusicPreview(null);
      }
    }, 10000);
  };

  const stopMusicPreview = () => {
    if (musicPreview) {
      musicPreview.pause();
      setMusicPreview(null);
    }
  };

  const searchExternalMusic = async (query) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const results = await externalMusicService.searchAll(query, 20);
      setSearchResults(results);
    } catch (error) {
      console.error("Music search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setMusicSearchQuery(query);

    // Debounced search
    clearTimeout(window.musicSearchTimeout);
    window.musicSearchTimeout = setTimeout(() => {
      if (query.trim()) {
        searchExternalMusic(query);
      } else {
        setSearchResults([]);
      }
    }, 500);
  };

  const handleApplyMusic = async () => {
    if (!currentMontage || !selectedMusic) {
      setError("Please select both a montage and music");
      return;
    }

    setIsApplyingMusic(true);
    setError(null);

    try {
      console.log(
        `🎵 Applying music ${selectedMusic.title} to montage ${currentMontage.id}`
      );

      const result = await clipService.addMusicToMontage(
        currentMontage.id,
        selectedMusic.id
      );

      if (result.success) {
        // Update current montage with the new version that has music
        setCurrentMontage({
          ...currentMontage,
          videoUrl: result.montageUrl,
          musicUrlId: selectedMusic.id,
          appliedMusic: selectedMusic, // Store the applied music info
        });

        setError(null);

        // Show success message
        alert(`🎵 Music "${selectedMusic.title}" applied successfully!`);

        // Reload montage history to include the new version
        await loadMontageHistory();
      } else {
        setError(result.message || "Failed to apply music");
      }
    } catch (error) {
      console.error("Error applying music:", error);
      setError(error.response?.data?.error || "Failed to apply music");
    } finally {
      setIsApplyingMusic(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0f0b1a] via-[#1a0f2e] to-[#0f0b1a] min-h-screen text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Monthly Montages
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform your daily moments into cinematic highlights. Generate,
            preview, and share your monthly video compilations.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
          {/* Left Panel - Controls */}
          <div className="lg:w-1/3 space-y-6">
            {/* Month Selection */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Select Month
              </h3>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />

              <button
                onClick={handleGenerateMontage}
                disabled={isGenerating || !selectedMonth}
                className="w-full mt-4 flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 rounded-xl transition duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Film className="w-5 h-5" />
                    Generate Montage
                  </>
                )}
              </button>
              {error && (
                <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Export Options */}
            {currentMontage && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Export & Share</h3>
                <div className="space-y-3">
                  <a
                    href={currentMontage.montageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition"
                  >
                    <Download className="w-4 h-4" />
                    Download MP4
                  </a>
                  <button
                    onClick={() =>
                      navigator.share?.({ url: currentMontage.montageUrl })
                    }
                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Montage
                  </button>
                </div>
              </div>
            )}

            {/* Montage History */}
            {montageHistory.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Your Montages</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {montageHistory.map((montage) => (
                    <button
                      key={montage.id}
                      onClick={() => {
                        setCurrentMontage(montage);
                        // If this montage has music, set it as selected
                        if (montage.musicUrlId) {
                          setSelectedMusic(montage.musicUrlId);
                        } else {
                          setSelectedMusic(null);
                        }
                      }}
                      className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition"
                    >
                      <div className="text-sm font-medium">
                        {new Date(0, montage.month - 1).toLocaleDateString(
                          "en-US",
                          { month: "long" }
                        )}{" "}
                        {montage.year}
                        {montage.musicUrlId && (
                          <span className="ml-2 text-purple-300">🎵</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {montage.clipsCount ||
                          montage.shortClipsIds?.length ||
                          0}{" "}
                        clips
                        {montage.musicUrlId && (
                          <span className="ml-2 text-green-400">
                            • Music: {montage.musicUrlId.title || "Applied"}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Video Display */}
          <div className="lg:w-2/3">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 h-full">
              <h3 className="text-2xl font-semibold mb-6 text-center">
                {currentMontage
                  ? `${new Date(
                      0,
                      (currentMontage.month || 9) - 1
                    ).toLocaleDateString("en-US", { month: "long" })} ${
                      currentMontage.year || 2025
                    } Montage`
                  : "Your Montage Will Appear Here"}
              </h3>

              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <Loader className="w-16 h-16 animate-spin text-purple-400 mb-6" />
                  <h4 className="text-xl font-medium mb-2">
                    Creating Your Montage
                  </h4>
                  <p className="text-gray-400">
                    This may take a few moments...
                  </p>
                  <div className="mt-4 text-sm text-gray-500">
                    ✅ Finding your clips
                    <br />
                    ⬇️ Downloading videos
                    <br />
                    🎬 Processing with FFmpeg
                    <br />
                    ☁️ Uploading to cloud
                    <br />
                  </div>
                </div>
              ) : currentMontage ? (
                <div className="space-y-4">
                  <video
                    controls
                    className="w-full rounded-xl shadow-2xl"
                    src={currentMontage.montageUrl || currentMontage.videoUrl}
                    poster={currentMontage.thumbnailUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>
                      {currentMontage.clipsCount ||
                        currentMontage.shortClipsIds?.length ||
                        0}{" "}
                      clips combined
                    </span>
                    <span>
                      Created:{" "}
                      {new Date(currentMontage.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Music Controls - After Montage Preview */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mt-6">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Music className="w-5 h-5 text-purple-400" />
                      Add Background Music
                    </h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Now that you've seen your montage, choose the perfect
                      soundtrack to enhance the mood!
                    </p>

                    {selectedMusic ? (
                      <div className="space-y-3">
                        <div className="bg-white/10 rounded-lg p-4 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">
                              {selectedMusic.title}
                            </div>
                            <div className="text-sm text-gray-400">
                              {selectedMusic.artist} • {selectedMusic.genre}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => playMusicPreview(selectedMusic)}
                              className="p-2 hover:bg-white/10 rounded-lg transition"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setSelectedMusic(null)}
                              className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={handleApplyMusic}
                          disabled={isApplyingMusic}
                          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          {isApplyingMusic ? (
                            <>
                              <Loader className="w-5 h-5 animate-spin" />
                              Applying Music...
                            </>
                          ) : (
                            "🎵 Apply Music to Montage"
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowMusicSelector(true)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Music className="w-5 h-5" />
                        Choose Background Music
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <PlayCircle className="w-24 h-24 text-gray-600 mb-6" />
                  <h4 className="text-xl font-medium mb-2 text-gray-300">
                    No Montage Selected
                  </h4>
                  <p className="text-gray-500">
                    Select a month and click "Generate Montage" to create your
                    video compilation
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Music Selector Modal */}
        {showMusicSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Choose Perfect Music</h3>
                <button
                  onClick={() => {
                    setShowMusicSelector(false);
                    stopMusicPreview();
                    setActiveTab("library");
                    setMusicSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-4">
                <button
                  onClick={() => setActiveTab("library")}
                  className={`px-4 py-2 rounded-lg transition ${
                    activeTab === "library"
                      ? "bg-purple-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  📚 Music Library
                </button>
                <button
                  onClick={() => setActiveTab("search")}
                  className={`px-4 py-2 rounded-lg transition ${
                    activeTab === "search"
                      ? "bg-purple-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  🔍 Search Online
                </button>
              </div>

              {/* Search Tab */}
              {activeTab === "search" && (
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={musicSearchQuery}
                      onChange={handleSearchInputChange}
                      placeholder="Search for mood, genre, or artist (e.g., 'upbeat', 'chill', 'cinematic')"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  {isSearching && (
                    <div className="flex items-center justify-center py-4">
                      <Loader className="w-5 h-5 animate-spin text-purple-400" />
                      <span className="ml-2 text-gray-400">
                        Searching music...
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Music Grid */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(activeTab === "library"
                    ? availableMusic
                    : searchResults
                  ).map((music) => (
                    <div
                      key={music.id}
                      className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition cursor-pointer border border-white/10"
                      onClick={() => handleMusicSelect(music)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-white">
                            {music.title}
                          </div>
                          <div className="text-sm text-gray-400">
                            {music.artist}
                          </div>
                          <div className="text-xs text-purple-300 mt-1 flex items-center gap-2">
                            <span>
                              {music.genre} • {music.mood}
                            </span>
                            {music.source && (
                              <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                                {music.source}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playMusicPreview(music);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Duration: {Math.floor(music.duration / 60)}:
                        {(music.duration % 60).toString().padStart(2, "0")}
                        {music.license && (
                          <span className="ml-2">• {music.license}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* No Results */}
                {activeTab === "search" &&
                  searchResults.length === 0 &&
                  musicSearchQuery &&
                  !isSearching && (
                    <div className="text-center py-8">
                      <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">
                        No tracks found for "{musicSearchQuery}"
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Try searching for mood like "happy", "chill", or "epic"
                      </p>
                    </div>
                  )}
              </div>

              <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-sm text-blue-300">
                  💡 <strong>Future Updates:</strong> Integration with Spotify
                  Web API, YouTube Music API, and Free Music Archive for
                  millions of tracks!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Montage;
