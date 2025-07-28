# 📅 Eventia — AI Calendar with Context-Aware Holidays

**Overview:**  
A modern calendar tool that allows users to schedule personal or team events, view them by date and category, and get smart insights about their week using Gemini. Includes local holiday highlights using the Calendarific API.

---

## Tier 1: Basic Event Calendar (React Fundamentals)

**Users can:**  
- Create events with title, category, date, time, and notes  
- Edit and delete existing events  
- View events in a monthly grid using a simple calendar component  
- Click on any date to add a new event  
- Categorize events (e.g., Meeting, Personal, Travel)  
- View event details on click or hover  
- UI should be fully responsive using Tailwind CSS/Vanilla CSS  

**State handled with:**  
- `useState` or `useContext`

**Components:**  
- `CalendarView`  
- `EventForm`  
- `EventList`  
- `EventCard`

---

## Tier 2: Holiday API Integration (API Integration)

- Integrate Calendarific API:  
  - Fetch public holidays based on country code  
  - Display holidays in the calendar (e.g., colored banner or icon on date cell)  
  - Show holiday name in tooltip or modal when clicked  
  - Add UI control to toggle holiday visibility  
  - Show warning when an event is scheduled on a public holiday  
  - Handle loading and error states for API calls

---

## Tier 3: Gemini Summary Generator (Advanced AI Features)

Use Gemini API to:  
- Generate a weekly summary for the user based on scheduled events (e.g., "You have 5 meetings and 2 personal events next week")  
- Provide time management suggestions ("Try scheduling your focus work before 10 AM")  
- Detect overloaded days and suggest redistributions

**Optional enhancements:**  
- Natural language input: "Lunch with Sarah next Friday at 1 PM"  
- Gemini-generated daily planning tips  
- Store and persist events in localStorage
