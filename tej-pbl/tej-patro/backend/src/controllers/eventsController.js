const eventService = require("../services/eventService");

async function create(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const event = await eventService.create(userId, req.body);
    res.status(201).json(event);
  } catch (err) {
    next(err); // let global error handler map to 400/409/500 and { error }
  }
}

module.exports = { create };