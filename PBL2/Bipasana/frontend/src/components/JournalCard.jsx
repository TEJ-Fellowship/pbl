import React from "react";

function JournalCard() {
  return (
    <div class="w-[250px] bg-white shadow-2xl rounded-lg overflow-hidden">
      <div class="h-[150px] bg-gray-100 flex items-center justify-center">
        <img
          src="../../public/travel.svg"
          alt="Travel"
          class="w-20 h-20 object-cover"
        />
      </div>

      <div class="p-3 flex gap-2">
        <h2 class="font-semibold text-gray-800">Trip to Pokhara</h2>

        <div class="flex items-center text-sm text-gray-500 gap-2 mt-1">
          <p>August 2, 2024</p>
        </div>
      </div>
    </div>
  );
}

export default JournalCard;
