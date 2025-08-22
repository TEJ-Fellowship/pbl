import React from "react";
function JournalForm() {
  return (
    <div className="bg-gray-500 p-4">
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
        <div>
          <div className="grid grid-cols-5 bg-purple-400 gap-2 pl-16 m-5">
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

          <p>More</p>
        </div>
      </div>
      <div className="bg-white p-5">
        <input type="text" placeholder="Add a title..." className="text-2xl" />
        <div>
          <div>
            <div>B</div>
            <div>I</div>
            <div>U</div>
          </div>
          <div>
            <div>H1</div>
            <div>H2</div>
            <div>H3</div>
          </div>
          <div>
            <div>.List</div>
            <div>1.List</div>
            <div>"Quote</div>
          </div>
          <div>
            <div>📸Image</div>
            <div>🔗Link</div>
          </div>
          <div>
            <div>😇Emoji</div>
          </div>
        </div>
        <div>
          <input type="textarea" placeholder="Write your thoughts here..." />
        </div>
      </div>
    </div>
  );
}

export default JournalForm;
