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

/*
-Login check: req.user.id बाट user verify गर्छ; नभए 401 पठाउँछ।
-Query params पढ्ने: req.query.start र req.query.end बाट URL मा आएका date filters लिन्छ।
-Date validation: start/end string लाई Date object मा बदल्छ र गलत format भए 400 पठाउँछ।
-Service call: eventService.list(userId, options) मार्फत database बाट filtered events ल्याउँछ।
-Response: JSON मा events पठाउँछ (status 200)।
-Error handling: try-catch मा error आए next(err) मार्फत Express error handler मा पठाउँछ।*/ 

async function list(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const parsed = eventService.parseListOptionsFromQuery(req.query);
    if (parsed.error) {
      return res.status(parsed.statusCode).json({ error: parsed.error });
    }
    const events = await eventService.list(userId, parsed.options);
    res.status(200).json(events);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const eventId = req.params.id;
    const updatedEvent = await eventService.update(userId, eventId, req.body);
    res.status(200).json(updatedEvent);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const eventId = req.params.id;
    await eventService.remove(userId, eventId);
    res.status(200).json({ message: "Event deleted" });  
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, update, remove };
