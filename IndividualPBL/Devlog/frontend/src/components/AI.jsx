import React, { useState } from "react";

function AI({ logs, repos }) {
  const [reflection, setReflection] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGemini = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs, repos }),
      });
      console.log("Request body sent to backend:", { logs, repos }); // Debug log
      console.log("Response status:", res.status); // Debug log

      if (!res.ok) {
        const text = await res.text();
        console.error("Backend error response:", text);
        throw new Error("Gemini API failed");
      }

      const data = await res.json();
      // console.log("Response data from backend:", data); // Debug log
      // setReflection(data.parsed.active_projects[0].description); // show result

      setReflection(data.parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <div className="flex justify-center my-6">
          <button
            className={`px-6 py-3 rounded-md font-medium text-white transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            onClick={handleGemini}
            disabled={loading}
          >
            {loading ? "Summarizing..." : "Summarize"}
          </button>
        </div>

        {/* {reflection.map((r)=>{
          <pre>
             {JSON.stringify(reflection, null, 2)}
          </pre>
        })} */}

        {/* {reflection && (
          <pre className="bg-gray-100 p-4 rounded mt-4 text-sm">
            {JSON.stringify(reflection, null, 2)}
          </pre>
        )}  */}

        {/* Reflection Display */}
        {reflection && (
          <div className="bg-white p-6 rounded-lg shadow-md mt-6 max-w-3xl mx-auto space-y-6">
            {/* Summary */}
            {reflection.summary && (
              <section>
                <h2 className="text-xl font-bold mb-2">Summary</h2>
                <p className="text-gray-700">{reflection.summary}</p>
              </section>
            )}

            {/* Active Projects */}
            {reflection.active_projects &&
              reflection.active_projects.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-2">Active Projects</h2>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    {reflection.active_projects.map((project, idx) => (
                      <li key={idx}>
                        <strong>{project.name}</strong>: {project.description}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

            {/* Top Tech Stacks */}
            {reflection.top_tech_stacks &&
              reflection.top_tech_stacks.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-2">Top Tech Stacks</h2>
                  <div className="flex flex-wrap gap-2">
                    {reflection.top_tech_stacks.map((tech, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </section>
              )}

            {/* Recommendations */}
            {reflection.recommendation &&
              reflection.recommendation.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-2">Recommendations</h2>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    {reflection.recommendation.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </section>
              )}

            {/* Achievements */}
            {reflection.achivements && reflection.achivements.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-2">Achievements</h2>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  {reflection.achivements.map((ach, idx) => (
                    <li key={idx}>{ach}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default AI;
