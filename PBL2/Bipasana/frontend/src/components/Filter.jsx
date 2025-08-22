import React from 'react'

function FIlter() {
  return (
<div class="flex flex-col items-center mt-8">
  <input 
    type="text" 
    placeholder="🔍 Search journals..." 
    class="w-[65%] p-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
  />

  <div class="flex flex-wrap justify-center gap-4 w-[65%]">
    
    <select class="p-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
      <option value="all">All Categories 🔽</option>
      <option value="travel">Travel</option>
      <option value="daily reflection">Daily Reflection</option>
      <option value="pregnancy">Pregnancy</option>
    </select>

    <select class="p-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
      <option value="newest">Sort by Newest 🔽</option>
      <option value="oldest">Sort by Oldest</option>
      <option value="alphabets">Sort by Alphabets</option>
    </select>

    <select class="p-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
      <option value="mood">Sort by Mood</option>
      <option value="happy">Happy</option>
      <option value="sad">Sad</option>
      <option value="angry">Angry</option>
      <option value="fear">Fear</option>
      <option value="emotional">Emotional</option>
      <option value="grief">Grief</option>
    </select>

  </div>
</div>

  )
}

export default FIlter