const Event = require("../models/Event");
const { ValidationError } = require("../errors");

/*
Note:
 * Creates an event for the given user.
  - Validates business rules (e.g. end > start).
  - Builds the event with userId from the argument (never from client).
  - Saves and returns the created event, or throws ValidationError.
*/ 
async function create(userId, eventData) {
  const { title, start, end, description, location, isAllDay, color } = eventData;

  // Business rule: end must be after start
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (endDate <= startDate) {
    throw new ValidationError("End time must be after start time");
  }

  // Build document: only allowed fields; userId always from argument
  const doc = {
    title,
    start: startDate,
    end: endDate,
    userId,
    description: description ?? "",
    location: location ?? "",
    isAllDay: isAllDay ?? false,
    color: color ?? "#2196F3",
  };

  const event = await Event.create(doc);
  return event;
}

/*
Note:

यस function को काम: एउटा user का सबै events ल्याउने, र आवश्यक भएमा date अनुसार फिल्टर गर्ने।

-userId अनुसार फिल्टर: पहिले events userId सँग मेल खाने छनोट गरिन्छ।
-start date दिइएमा: त्यो date पछि सकिने event मात्र समावेश हुन्छ।
-end date दिइएमा: त्यो date भन्दा पहिले सुरु भएका event मात्र समावेश हुन्छ।
-date validation: string date भएमा Date object मा रूपान्तरण गरी ठिक छ कि छैन जाँचिन्छ।
-sort र return: events start date अनुसार क्रमबद्ध गरी plain JavaScript object को रूपमा फर्काइन्छ।
*/
async function list(userId, options = {}) {
  const query = { userId };

  if (options.start != null) {
    const startDate = options.start instanceof Date ? options.start : new Date(options.start);
    if (!isNaN(startDate.getTime())) {
      query.end = { ...(query.end || {}), $gte: startDate };
    }
  }
  if (options.end != null) {
    const endDate = options.end instanceof Date ? options.end : new Date(options.end);
    if (!isNaN(endDate.getTime())) {
      query.start = { ...(query.start || {}), $lte: endDate };
    }
  }

  const events = await Event.find(query).sort({ start: 1 }).lean();
  return events;
}

module.exports = { create, list };
