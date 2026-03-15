import React from "react";
function Hero() {
  return (
    <section className="py-16 bg-[#FFFBF8]">

      {/* Heading (centered) */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Why QuickPick?</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Best way to make group decisions.
        </p>
      </div>

      {/* Cards: these will align with the outer container edges (Spindle ↔ Sign up) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-red-100 rounded-xl shadow-md p-6 hover:shadow-xl transition h-full flex flex-col">
          <h2 className="text-xl font-semibold mb-2 text-red-500">Ask Anything</h2>
          <p className="text-gray-600 flex-1">"Where to go to eat?" "Movie tonight?"</p>
        </div>

        <div className="bg-red-100 rounded-xl shadow-md p-6 hover:shadow-xl transition h-full flex flex-col">
          <h2 className="text-xl font-semibold mb-2 text-red-500">Instant Votes</h2>
          <p className="text-gray-600 flex-1">One tap. No more chaotic chats.</p>
        </div>

        <div className="bg-red-100 rounded-xl shadow-md p-6 hover:shadow-xl transition h-full flex flex-col">
          <h2 className="text-xl font-semibold mb-2 text-red-500">Result</h2>
          <p className="text-gray-600 flex-1">Get live results.</p>
        </div>
      </div>
    </section>
  );
}

export default Hero;
