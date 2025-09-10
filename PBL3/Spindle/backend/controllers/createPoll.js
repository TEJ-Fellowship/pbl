import express from "express";
import Poll from "../models/poll.js";
export const postPoll = async (req, res) => {
  try {
    const { question, options, timer } = req.body;

    //calculate expiry time
    let expiresAt = null;
    if (timer !== "no-timer") {
      const duration = {
        "5m": 5 * 60 * 1000,
        "15m": 15 * 60 * 1000,
        "30m": 30 * 60 * 1000,
        "1h": 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000,
      };
      expiresAt = new Date(Date.now() + duration[timer]);
    }

    const poll = new Poll({
      question,
      options: options.map((op) => ({ text: op })),
      timer,
      expiresAt,
    });

    await poll.save();
    res.status(201).json(poll);
  } catch (error) {
    console.log(error);
  }
};


export const getPoll= async(req,res)=>{
    try {

        const polls = await Poll.find({})
        res.json(polls)
        
    } catch (error) {
        console.log(error)
        
    }
}
