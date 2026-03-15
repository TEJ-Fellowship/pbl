import React,{useState,useEffect} from 'react'
import { useContext } from 'react'
import GeminiApi from '../GeminiApi'
import Meditation from '../components/Meditation'
import SessionLog from '../components/SessionLog'
import { addDoc, collection } from "firebase/firestore";
import {  query, where, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { ThemeContext } from '../ThemeContext'
import { db } from "../firebase";
const date = new Date().toISOString().split("T")[0];
function Dashboard({streak,setStreak}) {
  const [totalSessions, setTotalSessions] = useState(0);
const [totalDuration, setTotalDuration] = useState(0);
  const {isDark}=useContext(ThemeContext)
  async function handleCreateSession(duration){
      const auth=getAuth();
      const user=auth.currentUser;
      if(!user){
            alert("You must be logged in to create a session.");
      return;
      }
      try{
        await addDoc(collection(db,'sessions'),{
          date:date,
          duration:duration,
          userId:user.uid
        });
      }catch(error){
          console.log("Error creating session: " + error.message);
      }
  }


//getting data from backend

useEffect(() => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;


  const q = query(collection(db, "sessions"), where("userId", "==", user.uid));


  const unsubscribe = onSnapshot(q, (snapshot) => {
    let durationSum = 0;
    snapshot.forEach((doc) => {
      durationSum += doc.data().duration;
    });

    setTotalSessions(snapshot.size);
    setTotalDuration(durationSum);  
  });

  return () => unsubscribe();
}, []);

  return (
<div className={`${isDark ? "bg-[#1A1A1A] text-white" : "bg-[#FFF4F3] text-black"}`}>

    <GeminiApi />
    <Meditation handleCreateSession={handleCreateSession}/>
    <SessionLog  session={totalSessions} totalTime={totalDuration} streak={streak} setStreak={setStreak}/>
    </div>
  )
}

export default Dashboard