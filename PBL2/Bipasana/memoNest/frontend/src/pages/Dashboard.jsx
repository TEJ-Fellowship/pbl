import React from "react";

function Dashboard() {
  return (
    <div>
      <div class="flex items-center justify-center mt-16">
        <div class="w-[70%] max-w-4xl h-[370px] max-h-[90vh] flex flex-col items-center text-center bg-blue-100 rounded-2xl shadow-lg p-8">
          <h1 class="text-4xl md:text-5xl font-extrabold mb-6">
            How was your day today?
          </h1>
          <p class="text-lg max-w-xl mb-12 mt-8">
            Capture your thoughts, experiences, and reflections in a beautiful
            and intuitive way. Relive your memories with our unique and engaging
            reading experiences.
          </p>
          <div class="flex gap-[15px]">
            <button class="px-6 py-3 rounded-full bg-green-500 text-white shadow-md hover:bg-green-600 transition cursor-pointer">
              ✨ Create New Journal
            </button>
            <button class="px-6 py-3 rounded-full border-2 border-purple-500 text-purple-600 shadow-md hover:bg-purple-100 transition cursor-pointer">
              🎨 Browse Templates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
