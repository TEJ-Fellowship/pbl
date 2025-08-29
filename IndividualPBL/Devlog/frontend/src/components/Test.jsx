// import React from 'react'
// import { useEffect, useState } from "react";
// import axios from "axios";

// const token =  import.meta.env.VITE_GITHUB_TOKEN;
// function Test() {
// const [commits, setCommits] = useState([]);

// useEffect(()=>{
//     axios.get("https://api.github.com/repos/binita-hamal/fullstackopen/commits",{
//         headers:{
//             Authorization: `token ${import.meta.env.VITE_GITHUB_TOKEN}`
//         }
//     })
//     .then(res => setCommits(res.data))
//     // console.log('Token:', process.env.REACT_APP_GITHUB_TOKEN);

// },[]);



//   return (
//     <div>
//       <h2>Commit history</h2>
//       <ul>
//         {commits.map((c,index)=>(
//             <li key={index}>
//                 <strong>{c.commit.author.name}</strong> : {c.commit.message} <br/>
//                 <small>{new Date(c.commit.author.date).toLocaleDateString()}</small>
//             </li>
//         ))}
//       </ul>
//     </div>
//   )
// }

// export default Test




import React, { useEffect } from "react";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: import.meta.env.VITE_GITHUB_TOKEN,
});

function Github() {
  useEffect(() => {
    async function fetchGitHubData(username) {
      try {
        const response = await octokit.rest.repos.listForUser({
          username: username,
          per_page: 10,
        });
        console.log("Octocat repos:", response.data);

        const user = await octokit.rest.users.getByUsername({ username: "octocat" });
        console.log("Octocat info:", user.data);

        const repos = await octokit.rest.repos.listForAuthenticatedUser();
        console.log("My repos:", repos.data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchGitHubData("binita-hamal");
  }, []);

  return <div>Check console for GitHub API data!</div>;
}

export default Github;

