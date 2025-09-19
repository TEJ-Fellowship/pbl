import Poll from "../models/poll.js";
import User from "../models/user.js";

export const postPoll = async (req, res) => {
  try {
    const { question, options, timer, userId } = req.body;

    const user = await User.findById(userId); //fetch user from database

    if (!user) {
      return res.status(400).json({ error: "userId missing or invalid" });
    }

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
      user: user._id,
    });

    const savePoll = await poll.save();

    user.polls = user.polls.concat(savePoll._id);
    await user.save();

    res.status(201).json(savePoll);
  } catch (error) {
    console.log(error);
  }
};

export const getPoll = async (req, res) => {
  try {
    const userId = req.query.userId;

    const polls = await Poll.find({ user: userId }).populate("user", {
      username: 1,
      name: 1,
    });

    res.json(polls);
  } catch (error) {
    console.log(error);
  }
};

export const getPollById = async (req, res) => {
  try {
    const pollId = req.params.id;
    const poll = await Poll.findById(pollId);

    if (!poll) {
      return res.status(404).json({ message: "poll not found" });
    }
    res.json(poll);
  } catch (error) {
    console.log(error);
  }
};


export const deletePoll = async(req,res) =>{
  try {
    const pollId = req.params.id;
   const deletedPoll =  await Poll.findByIdAndDelete(pollId)

   if(!deletedPoll){
    return res.status(404).json({message:"poll not found"})
   }

   await User.findByIdAndUpdate(deletedPoll.user,{
    $pull: {
      polls: deletedPoll._id
    }
   })
    res.status(202).json({message:"poll deleted"})

  } catch (error) {
    console.log(error)
    
  }
}