import React from 'react'
import RepoList from './RepoList'
import Github from "../components/Github"
function SyncGithub({repos,setRepos}) {
  return (
    <div>
      <Github/>
      <RepoList repos={repos} setRepos={setRepos}/>
  
    </div>
  )
}

export default SyncGithub
