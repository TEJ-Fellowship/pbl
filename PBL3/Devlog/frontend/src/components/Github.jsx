import React from 'react'

function Github() {

    function handleClick(){
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      const redirectUrl = "http://localhost:5000/auth/github/callback"
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUrl}&scope=read:user repo:read`;


      window.location.href = githubAuthUrl


    }


  return (
    <div className="max-w-screen-xl mx-auto mt-10 mb-10 p-6 bg-white rounded-xl shadow-md text-center border border-gray-300">
    <h2 className="text-lg font-semibold mb-4">Connect to GitHub</h2>
    <p className="text-gray-600 mb-6">
      Link your GitHub account to enable project syncing.
    </p>
    <button
     onClick={handleClick}
      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
    >
      🔗 Connect to GitHub
    </button>
  </div>
  )
}

export default Github


