import React from "react";
import MicIdle from "/mic1.png"; // your idle mic PNG
import MicActive from "/mic2.png"; // your listening mic PNG
const PromptInput = ({
  prompt,
  setPrompt,
  listening,
  startListening,
  stopListening,
}) => {
  return (
    // Make wrapper relative to position mic button inside
    <div className="relative w-full">
      <textarea
        placeholder="Describe your movie genre or preference..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full h-24 resize-none rounded-xl border border-[#333333] bg-[#141414] text-white px-3 py-2 text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E50000]"
      />

      <button
        onClick={listening ? stopListening : startListening}
        className="absolute bottom-2 right-2 rounded-full p-1 transition-transform hover:scale-110"
      >
        <img
          src={listening ? MicActive : MicIdle}
          alt="mic icon"
          className="w-6 h-6"
        />
      </button>
    </div>
  );
};

export default PromptInput;
