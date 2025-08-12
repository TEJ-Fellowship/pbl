import React from 'react'

import {useState,useEffect} from 'react';

const url = 'https://api.api-ninjas.com/v1/quotes'
const apiKey = 'NV4/rx1TxpXG0gXBmAbiUw==KCarrbV5OD5cjzAM'



function Quote() {
    const[quote,setQuote] = useState("")


  useEffect(()=>{
    let today = new Date().toDateString();
    let savedDate = localStorage.getItem("date");
    let savedQuote = localStorage.getItem("quote");
  
  
    if(savedDate === today && savedQuote){
      setQuote(savedQuote)
    }
    else{
      fetch(url,{
        method:"GET",
        headers:{
          "X-Api-Key": apiKey
        }
      })
      .then(res => res.json())
      .then(data =>{
        const newQuote = data[0].quote
        setQuote(newQuote);
  
        localStorage.setItem("date",today)
        localStorage.setItem("quote",newQuote)
      })
    }
      
    },[])

 
    return (
        <>
        <p className="quote">{quote}</p>
        
        </>
      )
    }

export default Quote
