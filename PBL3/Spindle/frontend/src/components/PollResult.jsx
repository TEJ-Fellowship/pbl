import React,{useEffect,useState} from 'react'
import { useParams } from 'react-router-dom'
import axios from "axios"

function PollResult() {
    const {id} = useParams();

    useEffect(()=>{
        axios.get(`http://localhost:5000/api/createPoll/`)

    },[])


  return (
   <>

   </>
  )
}

export default PollResult
