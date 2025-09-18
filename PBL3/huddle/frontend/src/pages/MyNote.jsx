import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { getUserVoiceNotes, deleteVoiceNote } from "../api/voiceNotes";
import { Tag, Mic, CalendarDays, Timer, Trash2 } from "lucide-react";

const MyNote = () => {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTag, setFilterTag] = useState("");
  
  const allTags = useMemo(
    () => [...new Set(voiceNotes.flatMap((note) => note.tags))],
    [voiceNotes]
  );

  const filteredNotes = useMemo(() => {
    return voiceNotes.filter((note) => {
      const matchesSearch =
        searchTerm === "" ||
        note.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = filterTag === "" || note.tags.includes(filterTag);
      return matchesSearch && matchesTag;
    });
  }, [voiceNotes, searchTerm, filterTag]);

  useEffect(() => {
    fetchVoiceNotes();
  }, []);

  // Function to fetch voice notes from the API
  const fetchVoiceNotes = async () => {
    try {
      setLoading(true);
      const notes = await getUserVoiceNotes();
      setVoiceNotes(notes);
    } catch (error) {
      console.error("Failed to fetch voice notes:", error);
      toast.error("Could not fetch voice notes");
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a voice note
  const handleDelete = async (noteId) => {
    try {
      if (!window.confirm("Are you sure you want to delete this voice note?")) {
        return;
      }

      await deleteVoiceNote(noteId);
      toast.success("Voice note deleted successfully");

      setVoiceNotes(voiceNotes.filter((note) => note._id !== noteId));
    } catch (error) {
      console.error("Failed to delete voice note:", error);
      toast.error("Could not delete the voice note");
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${sec}`;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">My Voice Notes</h1>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 bg-white rounded-lg p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search voice notes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tag filter */}
          <div className="w-full md:w-64">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-10">
          <div className="flex justify-center mb-2">
            <Mic className="w-14 h-14 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {voiceNotes.length === 0
              ? "No voice notes yet"
              : "No matching voice notes found"}
          </h3>
          <p className="text-gray-500">
            {voiceNotes.length === 0
              ? "Record your first voice note to get started!"
              : "Try adjusting your search or filter criteria"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <div
              key={note._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex justify-between">
                  <h3 className="text-xl font-semibold mb-3 truncate">
                    {note.title}
                  </h3>
                  <button
                    onClick={() => handleDelete(note._id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center text-gray-500 mb-3">
                  <Timer className="w-4 h-4 mr-1" />
                  <span className="text-sm">
                    {formatDuration(note.duration)}
                  </span>

                  <span className="mx-2">|</span>

                  <CalendarDays className="w-4 h-4 mr-1" />
                  <span className="text-sm">{formatDate(note.createdAt)}</span>
                </div>

                <div className="mb-7" style={{ minHeight: "28px" }}>
                  {note.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {note.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-pink-100 text-pink-800/80 text-xs px-2 py-1 rounded-full flex items-center"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Simple Audio Player */}
                <div className="my-0">
                  <audio src={note.fileUrl} controls style={{ width: "100%" }}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyNote;
