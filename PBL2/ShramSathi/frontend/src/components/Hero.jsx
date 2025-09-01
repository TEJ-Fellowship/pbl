import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dog from "/images/dog.jpg";

import im1 from "/images/i1.jpg";
import im2 from "/images/i2.jpg";
import im3 from "/images/i3.jpg";

function Hero() {
  const images = [im1, im2, im3];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div>
      <section
        className=" bg-white mt-20
      bg-cover bg-center bg-no-repeat 
      max-w-screen-xl mx-auto

      rounded-lg shadow-md border border-gray-300

      "
        style={{ backgroundImage: `url(${images[index]})` }}
      >
        <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12">
          {/* <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Don’t just volunteer! <br />
            volunteer smartly with{" "}
            <span className="text-blue-700">ShramSathi</span>.
          </h1>

          <p className="mt-6 text-lg text-white">
            Join community programs, track your tasks, and make a real impact in
            your community.
          </p> */}

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            <span className="text-blue-700">CommunityFlow</span>:Helping NGOs & small teams organize smarter with AI-powered local insights.
          </h1>

          <p className="mt-6 text-lg text-white">
            From plantation program to clean-up campaigns, ShramSathi makes plannning and tracking your tasks simple, so your team can focus on change.
          </p>

          <div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
            <Link
              to="/login"
              className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-gray-900 rounded-lg border border-gray-300 
              bg-blue-700
              
              hover:scale-105 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-blue-700 dark:hover:bg-blue-700

            

               dark:focus:ring-gray-800 mt-5"

              //  onClick={()=>setShowLanding(false) }
            >
              GET STARTED
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto mt-12 flex  justify-center gap-6  text-left ">
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-300">
          <h3 className="text-xl font-semibold mb-2 text-blue-600">
            Easy Task Tracking
          </h3>
          <p className="text-gray-600">
            Organize all your tasks and track your progress efficiently.
          </p>
        </div>

        {/* <div className="p-6 bg-white rounded-lg shadow-md border border-gray-300">
          <h3 className="text-xl font-semibold mb-2">Community Programs</h3>
          <p className="text-gray-600">
            Participate in local initiatives and make a real impact.
          </p>
        </div> */}

        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-300">
          <h3 className="text-xl font-semibold mb-2 text-blue-600">
            AI-Powered Community Insights
          </h3>
          <p className="text-gray-600">
            With the help of{" "}
            <span className="font-semibold text-green-700">Gemini AI</span>,
            ShramSathi brings you real news from trusted Nepali sources.AI
            highlights the key issues around your community—like waste
            management, health, or education—and suggests programs your team can
            run to make a lasting impact.
          </p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-300">
          <h3 className="text-xl font-semibold mb-2 text-blue-600">
            Organize tasks by day or category
          </h3>
          <p className="text-gray-600">
            Plan your activities efficiently by sorting tasks by day or by
            category, making it easier to focus on what matters most.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Hero;
