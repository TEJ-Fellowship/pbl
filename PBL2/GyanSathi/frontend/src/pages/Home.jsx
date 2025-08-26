import React from "react";
import { Trash } from "lucide-react";

const Home = ({ notes, handleDelete }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="pt-12 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
              Our Course
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Opening soon to educate the world via online!
            </p>
          </div>
        </div>
      </div>

      {/* Notes Container */}
      <div className="px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {notes.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-xl opacity-20"></div>
                <div className="relative bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                  <svg
                    className="h-16 w-16 text-slate-400 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-3">
                No notes yet
              </h3>
              <p className="text-slate-500 mb-8 text-center max-w-md">
                Start your creative journey by adding your first note. Every
                great idea begins with a single thought.
              </p>
              <button className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <span className="relative z-10 flex items-center">
                  Create Your First Note
                  <svg
                    className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          ) : (
            /* Notes Display using Flexbox */
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
              {notes.map((note, index) => (
                <div
                  key={index}
                  className="group relative flex flex-col w-full sm:w-80 lg:w-72 xl:w-80 bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                >
                  {/* Card Header with Gradient */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                  {/* Card Content */}
                  <div className="flex flex-col flex-1 p-6">
                    {/* Title and Delete Button */}
                    <div className="flex items-start justify-between mb-4">
                      <h5 className="flex-1 text-xl font-bold text-slate-800 leading-tight mr-3 line-clamp-2">
                        {note.title || "Untitled Note"}
                      </h5>
                      <button
                        onClick={(e) => handleDelete(e, note._id)}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl hover:scale-110 flex-shrink-0"
                        aria-label="Delete note"
                      >
                        <Trash size={18} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 mb-6">
                      <p className="text-slate-600 leading-relaxed line-clamp-4 text-sm">
                        {note.content ||
                          "No content available. Click to add some thoughts and ideas to this note."}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-xs text-slate-400 font-medium">
                        {note.createdAt
                          ? new Date(note.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "No date"}
                      </span>
                      <div className="flex items-center space-x-3">
                        <button className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                          View
                        </button>
                        <button className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 -right-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
};

export default Home;
