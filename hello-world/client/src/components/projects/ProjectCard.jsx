import React from "react";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ProjectCard({ project }) {
  const { title, description, collaborators, createdAt } = project;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-gray-600 line-clamp-2">{description}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {collaborators.map((collaborator, index) => (
              <div
                key={collaborator.userId}
                className={`relative inline-block ${index > 0 ? "-ml-2" : ""}`}
                style={{ zIndex: collaborators.length - index }}
              >
                {collaborator.user?.avatar ? (
                  <img
                    src={collaborator.user.avatar}
                    alt={collaborator.user.name}
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                    {collaborator.user?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <span className="sr-only">{collaborator.user?.name}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
