const { getModel, generateText } = require("../config/gemini");
const eventService = require("../services/eventService");

const TIPS_SYSTEM_PROMPT = `You are a productivity assistant that analyzes calendar events and suggests ways to improve time management.

You will receive a JSON array of events. Each event may include:
- title
- start time
- end time
- description (optional)

Your task:
Analyze the schedule and provide exactly 3 short productivity tips.

Rules:
- Each tip must be actionable and relevant to the schedule.
- Each tip must be maximum 15 words.
- Avoid generic advice unless it clearly relates to the events.
- Do not repeat ideas.
- Keep the language simple and clear.
- Respond in the same language as the event titles, or in English if not specified.
- If there are no events or very few, still return exactly 3 general time-management tips.

Output format:
3 short tips as plain text, one per line. No other text, markdown, or explanation.

Example:
["Group similar tasks to reduce context switching.","Schedule short breaks between long meetings.","Reserve a focus block for deep work."]`;

async function getTips(req, res, next) {
  const { start, end } = req.query;
    
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const options = {};
      if (start != null && start !== "") {
        const startDate = new Date(start);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ error: "Invalid start date format" });
        }
        options.start = startDate;
      }
      if (end != null && end !== "") {
        const endDate = new Date(end);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ error: "Invalid end date format" });
        }
        options.end = endDate;
      }

      const events = await eventService.list(userId, options);
    const eventsForPrompt = events.map((e) => ({
      title: e.title,
      start: e.start,
      end: e.end,
      description: e.description ?? "",
    }));

    const userMessage = `Here are the calendar events:\n${JSON.stringify(eventsForPrompt)}`;
    const fullPrompt = `${TIPS_SYSTEM_PROMPT}\n\n${userMessage}`;

    const text = await generateText(fullPrompt);

    let data;
    try {
      const parsed = JSON.parse(text.trim());
      data = Array.isArray(parsed) ? parsed : [text];
    } catch {
      data = [text];
    }
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTips,
};