import { useEffect, useState } from "react";
import VideoModal from "../components/VideoModel";
import { ArrowLeft, Film } from "lucide-react";
import clipService from "../services/clip";

const Timeline = () => {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  if (error) {
    return (
      <div className="p-4 md:p-8 w-full mx-auto">
        <h3 className="py-2 text-xl font-semibold text-gray-600 flex gap-3">
          Error: {error}
        </h3>
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="p-4 md:p-8 w-full mx-auto">
        <h3 className="py-2 text-xl font-semibold text-gray-600 flex gap-3">
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

  return (
    <div className="p-4 md:p-8 w-full mx-auto">
      {sortedMonthYearKeys.map((monthYearKey) => (
        <div key={monthYearKey}>
          <div className="flex justify-between items-center py-2">
            <h3 className="text-xl font-semibold text-gray-600 flex gap-3">
              {monthYearKey}
            </h3>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-2 md:gap-6 mt-4">
            {groupedData[monthYearKey].map((glimpse) => (
              <div
                key={glimpse.id}
                onClick={() => {
                  setSelectedVideo(glimpse.videoUrl);
                  setSelectedClipId(glimpse.id);
                }}
                className={`relative overflow-hidden aspect-[3/4] rounded-lg shadow-md group transition-all duration-300 transform-gpu cursor-pointer ${
                  glimpse.isToday
                    ? "border-2 border-violet-500 ring-2 ring-violet-200 ring-opacity-50"
                    : ""
                } hover:scale-105 hover:shadow-xl`}
                style={{
                  backgroundImage: `url(${
                    glimpse.thumbnailUrl ||
                    `https://picsum.photos/200?random=${glimpse.id}`
                  })`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-end items-center p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                  <p className="font-bold text-xs">
                    {glimpse.date}
                    {console.log("thubnailurlx", glimpse.thumbnailUrl)}
                  </p>
                  <p className="text-xs mt-0.5 italic leading-tight">
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