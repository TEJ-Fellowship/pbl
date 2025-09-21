import express from "express"
import Vote from "../models/vote.js"


export const fetchUser=async(req,res)=>{
    const {pollId,optionId}  = req.params

    try {
        const votes = await Vote.find({pollId,optionId}).populate("userId","username")
        const voters = votes.map(vote => vote.userId)
        res.json(voters)
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
        
    }

}