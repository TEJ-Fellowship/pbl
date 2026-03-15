import React from "react";
import { Plus } from "lucide-react";

const Stories = () => {
  const stories = [
    { id: 1, name: "Your Story", avatar: "👤", isOwn: true },
    { id: 2, name: "Sarah M", avatar: "👩‍🦰", status: "helping" },
    { id: 3, name: "Mike R", avatar: "👨‍🦲", status: "available" },
    { id: 4, name: "Emma L", avatar: "👩‍🦱", status: "busy" },
    { id: 5, name: "David K", avatar: "👨‍🦳", status: "available" },
  ];
  return (
    <>
      <div className="p-4">
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {stories.map((story) => (
            <div key={story.id} className="flex-shrink-0 text-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl relative ${
                  story.isOwn
                    ? "border-3 border-dashed border-gray-400"
                    : story.status === "helping"
                    ? "ring-3 ring-green-400"
                    : story.status === "available"
                    ? "ring-3 ring-green-400"
                    : "ring-3 ring-gray-300"
                } bg-white`}
              >
                {story.isOwn ? (
                  <Plus className="w-6 h-6 text-gray-600" />
                ) : (
                  story.avatar
                )}
                {story.isOwn && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1 max-w-16 truncate">
                {story.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Stories;
