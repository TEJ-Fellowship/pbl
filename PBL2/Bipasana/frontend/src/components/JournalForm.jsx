import React from "react";
function JournalForm() {
  return (
    <div className="bg-gray-500 p-4 w-[60%] m-auto">
      <div className="flex items-center justify-between bg-white shadow-md p-4 rounded-lg">
        <h1>Back</h1>
        <h1>New Journal Entry</h1>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-lg 
             hover:bg-green-600 active:bg-green-700 
             transition-colors duration-200 shadow-md"
        >
          Save
        </button>
      </div>
      <div className="bg-white mt-2">
        <div className="flex justify-left">
          <h3>18</h3>
          <input type="date" />
        </div>
        <h1 className="mt-2 mb-2">😍How was your day?</h1>
        <div className="bg-purple-400">
          <div className="grid grid-cols-5  gap-2 pl-16 m-5">
            <h1 className="bg-gray-200 w-[50px] h-[50px] flex items-center justify-center text-xl rounded-lg">
              😂
            </h1>
            <h1 className="bg-gray-200 w-[50px] h-[50px] flex items-center justify-center text-xl rounded-lg">
              😍
            </h1>
            <h1 className="bg-gray-200 w-[50px] h-[50px] flex items-center justify-center text-xl rounded-lg">
              🔥
            </h1>
            <h1 className="bg-gray-200 w-[50px] h-[50px] flex items-center justify-center text-xl rounded-lg">
              🥰
            </h1>
            <h1 className="bg-gray-200 w-[50px] h-[50px] flex items-center justify-center text-xl rounded-lg">
              😥
            </h1>
            <h1 className="bg-gray-200 w-[50px] h-[50px] flex items-center justify-center text-xl rounded-lg">
              😭
            </h1>
            <h1 className="bg-gray-200 w-[50px] h-[50px] flex items-center justify-center text-xl rounded-lg">
              😠
            </h1>
            <h1 className="bg-gray-200 w-[50px] h-[50px] flex items-center justify-center text-xl rounded-lg">
              😇
            </h1>
            <h1 className="bg-gray-200 w-[50px] h-[50px] flex items-center justify-center text-xl rounded-lg">
              😔
            </h1>
            <h1 className="bg-gray-200 w-[50px] h-[50px] flex items-center justify-center text-xl rounded-lg">
              😃
            </h1>
          </div>

          <button className="ml-[600px] bg-white">More</button>
        </div>
      </div>
      <div className="bg-white p-5">
        <input type="text" placeholder="Add a title..." className="text-2xl" />
        <div className="flex gap-3 mt-5 mb-5">
          <div className="flex gap-3">
            <div className="bg-gray-300">B</div>
            <div className="bg-gray-300">I</div>
            <div className="bg-gray-300">U</div>
          </div>
          <div className="flex gap-3">
            <div className="bg-gray-300">H1</div>
            <div className="bg-gray-300">H2</div>
            <div className="bg-gray-300">H3</div>
          </div>
          <div className="flex gap-3">
            <div className="bg-gray-300">.List</div>
            <div className="bg-gray-300">1.List</div>
            <div className="bg-gray-300">"Quote</div>
          </div>
          <div className="flex gap-3">
            <div className="bg-gray-300">📸Image</div>
            <div className="bg-gray-300">🔗Link</div>
          </div>
          <div>
            <div>😇Emoji</div>
          </div>
        </div>
        <div>
          <textarea
            rows="10"
            placeholder="Write your thoughts here..."
            className="w-full p-2 border rounded-lg"
          ></textarea>
        </div>
      </div>
    </div>
  );
}

export default JournalForm;
