const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/user");

router.post("/register", async (request, response, next) => {
  try {
    const { fullName, email, password } = request.body;

    const newUser = new User({ fullName, email, password });

    const oldUser = await User.findOne({email:email});
    if(!oldUser){
      return response.send({data:"User already exist"});
    }

    await newUser.save();

    response
      .status(201)
      .json({ message: "user created successfully", user: newUser });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (request, response, next)=>{
  try {
    const {email, password} = request.body;

    const loginUser = await User.findOne({email:email})

    if(!loginUser){
      response.send({data:"User doesn't exist"});
    }

    if(password===loginUser.password){

    }


  } catch (error) {
    
  }

})

module.exports = router;