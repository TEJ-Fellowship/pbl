# 🍽️ NourishNow — AI Recipe Concierge + Fun Food Insights

## Overview:

A delightful recipe discovery and organization tool. Users can add, browse, and categorize recipes. Includes fun food facts from Spoonacular API and AI-powered smart suggestions via Gemini for dietary substitutions and nutritional tips.

---

## Tier 1: Recipe Organizer (React Fundamentals)

● Users can:  
○ Add a recipe with title, ingredients, steps, prep time  
○ Categorize recipes (Breakfast, Lunch, Dinner, Dessert, etc.)  
○ View recipes in card format with a preview  
○ Click on a recipe card to view full details  
○ Edit or delete saved recipes  
○ Search recipes by title or category

● Responsive layout using Tailwind CSS  
● Components: RecipeForm, RecipeCard, RecipeDetail, CategoryFilter, SearchBar  
● State managed via useState or Context API  
● Optional: Save to localStorage

---

## Tier 2: Food Fact API (API Integration)

● Integrate Spoonacular API:  
○ Fetch and display a fun food fact on the homepage  
○ Display a food trivia card in the RecipeDetail component

● Refresh fact on page reload or via a "New Fact" button  
● Handle loading and error states gracefully

---

## Tier 3: AI-Powered Suggestions (Advanced AI Features)

● Use Gemini API to:  
○ Suggest ingredient substitutions when a user selects an ingredient ("Out of butter? Try coconut oil")  
○ Generate AI nutrition tip for each recipe based on ingredients ("Low carb and gluten-free")  
○ Create a caption for sharing the recipe ("Perfect for a quick weeknight dinner!")

---

### Optional features:

○ Natural language input for recipe creation ("Add a vegan pasta with mushrooms and garlic")  
○ Gemini-powered meal planning assistant: suggest weekly menu based on saved recipes  
○ Generate grocery list from selected recipes
