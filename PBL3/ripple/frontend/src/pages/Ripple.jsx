import { useState } from "react";
import { socket } from "../utils/socket.js"; // import your socket instance

const Main = ({ userId }) => {
  const [ripples, setRipples] = useState([]);

  const handleClick = () => {
    const id = Date.now(); // unique ripple id
    setRipples((prev) => [...prev, id]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r !== id));
    }, 5000);

    // Emit ripple via socket instead of fetch
    socket.emit("sendRipple", {
      visibility: ["friends", "global"], // or just ["friends"] / ["global"]
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle, #043317, #072b15, #092412, #081c0f, #05150a, #071004, #070a01, #030300, #030200, #030100, #020000, #000000)",
      }}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Render ripples */}
        {ripples.map((id) => (
          <div key={id} className="absolute flex items-center justify-center">
            <div className="absolute w-48 h-48 rounded-full bg-[#38e07b]/20 animate-[rippleEffect_5s]" />
            <div className="absolute w-72 h-72 rounded-full bg-[#38e07b]/20 animate-[rippleEffect_5s]" />
            <div className="absolute w-96 h-96 rounded-full bg-[#38e07b]/20 animate-[rippleEffect_5s]" />
          </div>
        ))}

        <button
          onClick={handleClick}
          className="relative w-36 h-36 bg-[#38e07b] rounded-full shadow-lg shadow-[#38e07b]/30 transform 
          hover:scale-110 active:scale-95 transition-transform duration-200 ease-out"
        ></button>

        <div className="fixed bottom-4 text-primary text-4xl font-bold tracking-tight mt-12 text-center">
          <h1>Tap . Ripple . Connect</h1>
        </div>
      </div>
    </div>
  );
};

export default Main;
