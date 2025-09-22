import rippleService from "../services/rippleService.js";
import contactService from "../services/contactService.js";

const getFriendsRipple = async (req, res) => {
  try {
    const userId = req.user.userId;
    const friends = await contactService.getFriends(userId);
    const ripples = await rippleService.getFriendsRipple(friends);
    res.json(ripples);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getGlobalRipples = async (req, res) => {
  try {
    const ripples = await rippleService.getGlobalRipples();
    res.json(ripples);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createRipple = async (req, res) => {
  try {
    const userId = req.user.userId;
    const ripple = await rippleService.createRipple(
      userId,
      req.body.visibility
    );
    res.json(ripple);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// New endpoint for ripple back
const respondToRipple = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { rippleId, type } = req.body; // type: "friends" or "global"
    
    const result = await rippleService.respondToRipple(rippleId, userId, type);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default { getFriendsRipple, getGlobalRipples, createRipple, respondToRipple };