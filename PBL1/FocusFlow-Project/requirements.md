# 🍴 FocusFlow — Smart Task Sphere with AI Motivation

**Overview:**  
A productivity app to help users manage tasks with categories and due dates. It offers daily motivation using quote APIs and, in advanced stages, intelligent suggestions using Gemini.

---

## Tier 1: Basic Task Tracker (React Fundamentals)

**Users can:**  
- Add new tasks with title, description, due date  
- Delete existing tasks  
- Mark tasks as complete/incomplete  
- Assign categories (e.g., Work, Personal, Study) using a dropdown or chips  
- Filter tasks by category using buttons or dropdown  
- View tasks in list or card format  
- UI should be fully responsive using Tailwind CSS/Vanilla CSS  

**State managed via:**  
- React `useState` and props drilling or `useContext`

**Basic component decomposition:**  
- `TaskCard`  
- `TaskForm`  
- `FilterBar`

---

## Tier 2: Motivational Quote API (API Integration)

- Integrate ZenQuotes (or any other free APIs) API to fetch a daily motivational quote  
- Quote should appear in a prominent banner at the top of the UI  
- Show a new quote on page load or when a user clicks a **"New Quote"** button  
- Handle loading state and error state for quote fetch  
- Use `fetch` or `axios` for API calls

---

## Tier 3: Gemini-Powered Smart Motivation (Advanced AI Features)

Use Google Gemini API to:  
- Analyze tasks and generate a short motivational summary or affirmation (e.g., "You're 70% done! Keep pushing!")  
- Accept natural language input for tasks like "Remind me to call John tomorrow" and convert it into structured task format  
- Generate a daily motivational message based on pending tasks and streak

**Optional:**  
- Persist tasks in local storage  
- Add a streak counter or gamification bar based on task completion
