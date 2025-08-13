# 💸 Spendly — Smart Expense Tracker with AI-Powered Insights

**Spendly** is a modern expense tracking tool built with **React** and **TailwindCSS**. Designed as a progressive learning app, it evolves from fundamental React state management to API consumption and advanced AI integration.

---

## 🧩 Tier 1: Basic Expense Tracker (React Fundamentals – Week 1)

### ✅ Core Features
- Add new expenses with:
  - **Amount**
  - **Description**
  - **Category** (e.g., Food, Travel, Education)
  - **Date**
- Delete existing expenses
- Filter expenses by category
- View total expense summary
- Responsive, clean UI using **Vanilla CSS** or **TailwindCSS**
- Handle empty state (e.g., “No expenses yet!”)

### ⚙️ State Management
- `useState`, `useEffect`

### 🧱 Components
- `ExpenseForm`
- `ExpenseList`
- `ExpenseItem`
- `ExpenseSummary`
- `FilterBar`

### 🆕 Optional Enhancements
- Persist expenses using **localStorage**

---

## 🌐 Tier 2: Finance/Money Advice API Integration (API Integration – Week 2)

### 🔌 API Integration
Use any Finance/Money Fact API (e.g., [API Ninjas Finance API](https://api-ninjas.com/api/finance)) to:

- Display a random **fun finance fact** every time a new expense is added
- Include a **"New Fact / Refresh"** button to fetch a new fact manually
- Show **loading** and **error** states during API requests

### 🆕 Optional Enhancements
- Display **category-specific facts**
  - e.g., Food-related tips when adding a food expense

---

## 🧠 Tier 3: Gemini-Powered Spending Insights (Advanced AI Features – Optional)

### 🧠 AI-Powered Features (using Gemini/OpenAI)
- Analyze recent expense trends via a button: **“Analyze My Spending”**
- Generate personalized insights like:
  - _“You're spending a lot on food. Consider cooking at home this week.”_
- Offer **weekly savings tips** based on spending behavior
- Accept **natural language input**:
  - e.g., “I spent 200 on groceries today” → Parse into structured expense data

### 📈 Optional Enhancements
- Visualize expense trends using **Chart.js** or **Recharts**
- Let Gemini summarize 7-day expense data in **bullet points**

---

🚀 Built for incremental learning. Start small. Scale smart.  
**Happy tracking with Spendly!**
