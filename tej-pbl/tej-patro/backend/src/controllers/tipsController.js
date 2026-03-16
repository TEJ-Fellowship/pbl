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

/*NOTE (No events in range): 
We still call Gemini with this message when there are no events. The system prompt tells the model to return 3 general time-management
 tips, so the frontend always gets a valid tips array or a proper error.*/
const NO_EVENTS_USER_MESSAGE = "I have no events in this range.";


/**
 * Checks if an error is caused by Gemini's safety or content filtering.
 *
 * Looks for keywords like "block", "safety", "filter", "content policy", or "harm"
 * in the error message. Returns true if any are found, otherwise false.
 */
function isBlockOrSafetyError(err) {
  const msg = (err?.message ?? String(err)).toLowerCase();
  return (
    msg.includes("block") ||
    msg.includes("safety") ||
    msg.includes("filter") ||
    msg.includes("blocked") ||
    msg.includes("content policy") ||
    msg.includes("harm")
  );
}

/** Ensures value is a non-empty array of strings (valid tips format). */
function isArrayOfStrings(arr) {
  return Array.isArray(arr) && arr.length > 0 && arr.every((item) => typeof item === "string");
}

async function getTips(req, res, next) {
  const { start, end } = req.query;
    
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
      
    const eventsForPrompt = events.map((e) => ({
      title: e.title,
      start: e.start,
      end: e.end,
      description: e.description ?? "",
    }));

 // STATIC FALLBACK for no events:
// If there are no events in the range, do NOT call Gemini.
// Return a fixed set of generic productivity tips instead.
if (eventsForPrompt.length === 0) {
  return res.json({
    data: [
      "Add events in this range to get personalized tips.",
      "Block time for focused work in your calendar.",
      "Review your week and plan key tasks.",
    ],
  });
}
// For non-empty event lists, we still call Gemini as before.
const userMessage = `Here are the calendar events:\n${JSON.stringify(eventsForPrompt)}`;
const fullPrompt = `${TIPS_SYSTEM_PROMPT}\n\n${userMessage}`;    

   let text;
   try {
     text = await generateText(fullPrompt);
   } catch (err) {
     // NOTE: Safety/block — return 422 with a user-friendly message so frontend can show or retry.
     if (isBlockOrSafetyError(err)) {
       return res.status(422).json({
         error: "Content was filtered; try different events or dates.",
       });
     }
     throw err;
   }
   // NOTE: Empty or missing Gemini response — do not treat as success; return 502.
   const trimmed = text != null ? String(text).trim() : "";
   if (!trimmed) {
     return res.status(502).json({ error: "AI did not return insights" });
   }
   let data;
   try {
     const parsedData = JSON.parse(trimmed);
     // NOTE: Invalid format — must be a non-empty array of strings; otherwise 502 + log for debugging.
     if (!isArrayOfStrings(parsedData)) {
       console.error("Invalid insights format - raw response:", trimmed);
       return res.status(502).json({ error: "Invalid insights format" });
     }
     data = parsedData;
   } catch {
     // NOTE: JSON.parse threw; return 502 and log raw text for debugging.
     console.error("Invalid insights format - parse error, raw response:", trimmed);
     return res.status(502).json({ error: "Invalid insights format" });
   }
   res.json({ data });
 } catch (error) {
   next(error);
 }
}


module.exports = {
  getTips,
};