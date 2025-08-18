# 📚 PustakVerse – Your Intelligent Digital Bookshelf

_"Don’t just read — read smarter with PustakVerse."_

**Category:** Productivity / Education

---

## 🌍 Overview

PustakVerse is a mini E-Library platform where users can browse, search, and save books to their favorites list. Admins can manage the collection.

**Users can:**

- ✅ Browse books by title or genre
- ✅ Save books to “My Favorites”
- ✅ Track book collection with filters and categories
- ✅ Get AI-powered summaries and reviews (optional)

---

## 🧩 Tier 1: Basic Library Manager (React + Node.js + Express)

### 🔹 Features:

- 📚 View list of books with title, author, genre, and description
- ➕ Add new books (basic form)
- ✏️ Edit existing books
- ❌ Delete books
- ❤️ Mark books as “Favorite” (stored locally)
- 📱 Mobile-responsive UI using Tailwind CSS
- 🌓 Dark/light mode toggle

### 🔹 Tech Stack:

- **Frontend:** React (useState, props, context) + Tailwind CSS
- **Backend:** Node.js + Express REST API
- **Database:** In-memory store (for later MongoDB integration)

### 🔹 Core Components:

- `BookForm`
- `BookList`
- `BookItem`
- `FavoritesList`
- `FilterBar`

### 🔹 Backend Routes (Postman-Testable):

- `POST /books` → Create a book
- `GET /books` → Get all books
- `PUT /books/:id` → Update a book
- `DELETE /books/:id` → Delete a book

---

## 🧩 Tier 2: Database Integration (MongoDB + Mongoose)

### 🔹 Features:

- 💾 Store books in MongoDB with Mongoose schemas
- 🔎 Fetch books by genre or title (filter support)
- ❤️ Persistent favorites saved in database

### 🔹 Tech Stack:

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose ODM)

### 🔹 Backend Routes (Postman-Testable):

- `POST /books` → Create book
- `GET /books` → Fetch all books
- `GET /books/genre/:genre` → Fetch books by genre
- `GET /books/title/:title` → Search by title
- `PUT /books/:id` → Update book
- `DELETE /books/:id` → Delete book
- `GET /favorites` → Fetch favorites
- `POST /favorites/:bookId` → Add to favorites
- `DELETE /favorites/:bookId` → Remove from favorites

### 🔹 Optional Enhancements:

- Sort books by author or published year
- Pagination for large collections

---

## 🤖 Tier 3: AI-Powered Smart Features

### 🔹 Features:

- 🧠 AI-generated short book summaries if none exist
- 📝 Auto-generate a sample review for books without reviews
- 📊 Daily or weekly highlights of most-favorited books
- 📖 “Recommended Books” based on user favorites

### 🔹 Tech Stack:

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express + MongoDB
- **AI Suggestion Engine:** Gemini API / OpenAI API

### 🔹 Optional Enhancements:

- Related books section (“If you liked this, try…”)
- Export favorites list as PDF or shareable link

---

## 🔐 Tier 4: User Authentication & Access Control

### 🔹 Features:

- 👤 User Registration & Login with JWT authentication
- 🔒 Password hashing with bcrypt
- 📂 Protected routes → only logged-in users can manage favorites
- 👤 Profile management → update name, email, password

### 🔹 Tech Stack:

- **Frontend:** React + Tailwind CSS (Login/Signup forms, protected routes)
- **Backend:** Node.js + Express + MongoDB (Users collection)
- **Authentication:** JWT + bcrypt

### 🔹 Backend Routes (Postman-Testable):

#### **Auth:**

- `POST /auth/register` → Register new user
- `POST /auth/login` → Login user
- `GET /auth/me` → Get current user info

#### **Protected (Books & Favorites):**

- `GET /books` → Fetch all books
- `POST /books` → Add book
- `PUT /books/:id` → Update book
- `DELETE /books/:id` → Delete book
- `GET /favorites` → Fetch logged-in user favorites
- `POST /favorites/:bookId` → Add book to favorites
- `DELETE /favorites/:bookId` → Remove book from favorites

### 🔹 Optional Enhancements:

- Email verification for new users
- Password reset via email
