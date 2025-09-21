import { useEffect, useState } from "react";
import VideoModal from "../components/VideoModel";
import { ArrowLeft, Film } from "lucide-react";
import { useNavigate } from "react-router-dom";
import clipService from "../services/clip";

const Timeline = () => {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingMontage, setGeneratingMontage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClips = async () => {
      try {
        setLoading(true);
        const response = await clipService.getAll();
        console.log("Fetched clips:", response);
        setClips(response || []); // response.data is not needed since clipService already returns the data
        setError(null);
      } catch (err) {
        console.error("Error fetching clips:", err);
        setError(err.message);
        setClips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClips();
  }, []);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedClipId, setSelectedClipId] = useState(null);

  // Filter out clips without date and add error handling
  const validClips = clips.filter((clip) => clip && clip.date);

  const sortedData = [...validClips].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const groupedData = sortedData.reduce((acc, glimpse) => {
    if (!glimpse || !glimpse.date) return acc; // Additional safety check

    const date = new Date(glimpse.date);
    const monthYearKey = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    if (!acc[monthYearKey]) {
      acc[monthYearKey] = [];
    }
    acc[monthYearKey].push(glimpse);
    return acc;
  }, {});
  const sortedMonthYearKeys = Object.keys(groupedData);

  if (loading) {
    return (
      <div className="p-4 md:p-8 w-full mx-auto">
        <h3 className="py-2 text-xl font-semibold text-gray-600 flex gap-3">
          <ArrowLeft onClick={() => navigate("/")} className="cursor-pointer" />
          Loading...
        </h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 w-full mx-auto">
        <h3 className="py-2 text-xl font-semibold text-gray-600 flex gap-3">
          <ArrowLeft onClick={() => navigate("/")} className="cursor-pointer" />
          Error: {error}
        </h3>
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="p-4 md:p-8 w-full mx-auto">
        <h3 className="py-2 text-xl font-semibold text-gray-600 flex gap-3">
          <ArrowLeft onClick={() => navigate("/")} className="cursor-pointer" />
          No clips found
        </h3>
      </div>
    );
  }

  const handleDelete = async (clipId) => {
    try {
      if (!window.confirm("Are you sure you want to delete this clip?")) {
        return;
      }

      console.log("Deleting clip:", clipId);

      await clipService.deleteClip(clipId);

      setClips(clips.filter((clip) => clip.id !== clipId));

      console.log("Clip deleted successfully");
    } catch (error) {
      console.error("Error deleting clip:", error);
      alert("Failed to delete clip: " + error.message);
    }
  };

  const handleGenerateMontage = async (monthYearKey) => {
    console.log("Generate Montage button clicked for:", monthYearKey);
    try {
      setGeneratingMontage(monthYearKey);

      // Parse month and year from the key (e.g., "January 2024")
      const [monthName, year] = monthYearKey.split(" ");
      const month = new Date(Date.parse(monthName + " 1, 2024")).getMonth() + 1; // Get month number (1-12)

      console.log(
        `Generating montage for ${monthName} ${year} (month: ${month})`
      );
      console.log("About to call clipService.generateMontage...");

      const result = await clipService.generateMontage(month, parseInt(year));

      console.log("Montage generation result:", result);

      if (result.success) {
        alert(`Montage generated successfully! URL: ${result.montageUrl}`);
        // Optionally, you could open the montage in a new tab or modal
        window.open(result.montageUrl, "_blank");
      } else {
        alert("Failed to generate montage: " + result.message);
      }
    } catch (error) {
      console.error("Error generating montage:", error);
      alert("Failed to generate montage: " + error.message);
    } finally {
      setGeneratingMontage(null);
    }
  };

  return (
    <div className="p-4 md:p-8 w-full mx-auto">
      {sortedMonthYearKeys.map((monthYearKey) => (
        <div key={monthYearKey}>
          <div className="flex justify-between items-center py-2">
            <h3 className="text-xl font-semibold text-gray-600 flex gap-3">
              <ArrowLeft
                onClick={() => navigate("/")}
                className="cursor-pointer"
              />
              {monthYearKey}
            </h3>
            <button
              onClick={() => handleGenerateMontage(monthYearKey)}
              disabled={generatingMontage === monthYearKey}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Film size={16} />
              {generatingMontage === monthYearKey
                ? "Generating..."
                : "Generate Montage"}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-4">
            {groupedData[monthYearKey].map((glimpse) => (
              <div
                key={glimpse.id}
                onClick={() => {
                  setSelectedVideo(glimpse.videoUrl);
                  setSelectedClipId(glimpse.id);
                }}
                className={`relative overflow-hidden aspect-[3/4] rounded-xl shadow-lg group transition-all duration-300 transform-gpu cursor-pointer ${
                  glimpse.isToday
                    ? "border-4 border-[--glimpse-accent] ring-4 ring-white ring-opacity-50"
                    : ""
                } hover:scale-105 hover:shadow-2xl`}
                style={{
                  backgroundImage: `url(${
                    glimpse.thumbnailUrl ||
                    `https://picsum.photos/400?random=${glimpse.id}`
                  })`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-end items-center p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                  <p className="font-bold text-sm md:text-base">
                    {glimpse.date}
                    {console.log("thubnailurlx", glimpse.thumbnailUrl)}
                  </p>
                  <p className="text-xs md:text-sm mt-1 italic leading-tight">
                    {glimpse.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {selectedVideo && (
        <VideoModal
          videoUrl={selectedVideo}
          clipId={selectedClipId}
          onClose={() => {
            setSelectedVideo(null);
            setSelectedClipId(null);
          }}
          handleDelete={(clipId) => {
            handleDelete(clipId);
            setSelectedVideo(null);
            setSelectedClipId(null);
          }}
        />
      )}
    </div>
  );
};

export default Timeline;
