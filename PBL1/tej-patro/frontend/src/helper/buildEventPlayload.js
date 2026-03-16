export async function buildEventPlayload(event) {
  return {
    title: event.title,
    start: event.start,
    end: event.end,
    description: event.description,
    location: event.location ?? "",
  };
}
