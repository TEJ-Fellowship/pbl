import React, { useState, useEffect } from "react";
import axios from "axios";
function RepoList({repos,setRepos}) {
  // const [commits, setCommits] = useState({});

  useEffect(() => {
    // console.log("URL Search Params:", window.location.search); // Debugging

    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");

    if (connected) {
      axios
        .get("http://localhost:5000/repos")
        .then((res) => setRepos(res.data.repos))
        // .then((res) => console.log("Repos from backend:", res.data.repos))
        .catch((err) => console.error(err));
    }
  }, []);

  // useEffect(() => {
  //   //fetch latest commit of each repo
  //   repos.forEach(async (repo) => {
  //     const commits = await axios.get(
  //       `https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits`,
  //       {
  //         headers: { Authorization: `token ${userAccessToken}` },
  //       }
  //     );

  //     if (commits.data.length > 0) {
  //       setCommits((prev) => ({
  //         ...prev,
  //         [repo.id]: {
  //           message: commits.data[0].commit.message,
  //           date: commits.data[0].commit.author.date,
  //         },
  //       }));
  //     }
  //   });
  // },[repos]);

  // useEffect(() => {
  //   // fetch latest commit of each repo
  //   repos.forEach(async (repo) => {
  //     try {
  //       const res = await axios.get(`http://localhost:5000/commits/${repo.owner.login}/${repo.name}`);

  //       console.log("Latest commit for repo:", repo.name, res.data);


  //       setCommits((prev) => ({
  //         ...prev,
  //         [repo.id]: res.data,
  //       }));
  //     } catch (err) {
  //       console.error("Failed to fetch commits:", err);
  //     }
  //   });
  // }, [repos]);
  



  return (
    <div>

<div className="flex justify-center">
  <h2 className="text-2xl font-semibold text-gray-800 border-b-2 border-gray-200 pb-2 mb-4">
    Your GitHub Repositories
  </h2>
  </div>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {repos.map((repo) => (
          <div
            key={repo.id}
            className="bg-white shadow-md rounded-xl p-4 border"
          >
            <h2>{repo.name}</h2>

            {repo.language && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {repo.language}
              </span>
            )}

            <p className="mt-2 text-gray-600">
              {repo.description || "No description"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Created: {new Date(repo.created_at).toLocaleDateString()}
            </p>


            <a 
        href={`https://github.com/${repo.owner.login}/${repo.name}`} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ color: "blue", textDecoration: "underline", fontSize: "14px" }}
      >
        View on GitHub
      </a>
{/* 
            {commits[repo.id] ? (
              <div className="mt-3 border-t pt-2">
                <p className="text-sm">
                  <strong>Last commit:</strong> {commits[repo.id].message}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(commits[repo.id].date).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-3">
                Loading latest commit...
              </p>
            )} */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RepoList;
