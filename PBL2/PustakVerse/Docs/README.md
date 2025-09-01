# 📚 PustakVerse – Your Intelligent Digital Bookshelf

_"Don’t just read — read smarter with PustakVerse."_

## 🌍 Overview

PustakVerse is a platform designed to revolutionize how you interact with books. Whether you're an avid reader, a student, or simply looking to expand your knowledge, PustakVerse offers a suite of tools to enhance your reading experience. Discover new books, manage your digital bookshelf, and gain AI-powered insights that bring reading to the 21st century.

## ✨ Features

-   **Browse & Discover:** Explore a vast library of books, both from online sources (like Google Books) and user uploads.
-   **Personal Bookshelf:** Organize your favorite books, track your reading progress, and create custom reading lists.
-   **AI-Powered Insights:** Unlock deeper understanding with AI-generated summaries, reviews, and recommendations.
-   **User Authentication:** Securely manage your account, save your preferences, and access your bookshelf from any device.
-   **Upload & Share:** Contribute to the community by uploading your own books and sharing your thoughts.
-   **Mobile-Responsive Design:** Enjoy a seamless experience on any device, from desktops to tablets and smartphones.

## 🚀 Tech Stack

### Frontend

-   **React:** A JavaScript library for building user interfaces.
-   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
-   **Vite:** A fast build tool for modern web development.
-   **React Router DOM:** For navigation and routing within the app.
-   **Heroicons:** For beautiful and simple icons.

### Backend

-   **Node.js:** A JavaScript runtime built on Chrome's V8 JavaScript engine.
-   **Express:** A fast, unopinionated, minimalist web framework for Node.js.
-   **MongoDB:** A NoSQL database for storing book metadata, user information, and AI-generated content.
-   **Mongoose:** An ODM (Object Data Modeling) library for MongoDB and Node.js.
-   **Multer:** Node.js middleware for handling `multipart/form-data`, which is primarily used for uploading files.
-   **JSON Web Tokens (JWT):** For user authentication and authorization.
-   **bcrypt:** For password hashing.
-   **dotenv:** For managing environment variables.

### AI & Utilities

-   **Gemini API (Optional):** Google's AI model for generating book summaries, reviews, and recommendations.
-   **fileHelpers.js:** Utility functions for file handling.
-   **api.js:** Centralized API calls.

## 📁 Project Structure
```bash
PustakVerse/
├── db.json                       # Mock database (initial development)
├── package.json                  # Project dependencies and scripts
├── Backend/                      # Backend code
│   ├── .env                      # Environment variables
│   ├── index.js                  # Main server file
│   ├── package.json              # Backend dependencies
│   ├── config/                   # Configuration files
│   │   ├── database.js           # MongoDB connection
│   │   └── multer.js             # Multer configuration
│   ├── middleware/               # Custom middleware
│   │   ├── auth.js               # Authentication middleware
│   │   └── upload.js             # Upload middleware
│   ├── models/                   # Database models
│   │   ├── Book.js               # Book model
│   │   └── User.js               # User model
│   ├── routes/                   # API routes
│   │   ├── auth.js               # Authentication routes
│   │   └── books.js              # Book routes
│   ├── uploads/                  # Uploaded files storage
│   │   └── [filenames].{png,jpg,jpeg}
│   └── utils/                    # Utility functions
│   │   ├── fileHelpers.js        # File handling helpers
│   │   └── gemini.js             # Gemini API integration
├── Docs/                         # Documentation
│   ├── requirements.md           # Project requirements
│   ├── userFlow.png              # User flow diagram
│   └── wireframe.png             # Wireframe design
├── Frontend/                     # Frontend code
│   ├── .gitignore                # Git ignore file
│   ├── eslint.config.js          # ESLint configuration
│   ├── index.html                # Main HTML file
│   ├── package.json              # Frontend dependencies
│   ├── postcss.config.js         # PostCSS configuration
│   ├── README.md                 # Frontend README (auto-generated)
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   ├── vite.config.js            # Vite configuration
│   ├── public/                   # Static assets
│   │   └── logo.svg              # Project logo
│   └── src/                      # Source code
│       ├── App.jsx               # Main application component
│       ├── index.css             # Global styles
│       ├── main.jsx              # Entry point
│       ├── Components/           # React components
│       │   ├── BookCard.jsx      # Book card component
│       │   ├── BookGrid.jsx      # Book grid component
│       │   ├── BookModal.jsx     # Book modal component
│       │   ├── Browse.jsx        # Browse page component
│       │   ├── Form.jsx          # Form component
│       │   ├── GenreSelector.jsx # Genre selector component
│       │   ├── GoogleBooks.jsx   # Google Books component
│       │   ├── Home.jsx          # Home page component
│       │   ├── InsightsButton.jsx# AI Insights button
│       │   ├── InsightsPage.jsx  # AI Insights page
│       │   ├── Login.jsx         # Login component
│       │   ├── MyBooks.jsx       # My Books component
│       │   ├── Navbar.jsx        # Navbar component
│       │   ├── Profile.jsx       # Profile component
│       │   ├── Search.jsx        # Search component
│       │   └── Signup.jsx        # Signup component
│       └── utils/                # Utility functions
│           └── api.js            # API functions
└── README.md                     # Main README file
```

## ⚙️ Setup Instructions

### Prerequisites

-   Node.js (v18 or higher)
-   npm or yarn
-   MongoDB (local or cloud instance)
-   (Optional) Google Gemini API Key

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd PustakVerse
    ```

2.  **Install dependencies:**

    ```bash
    # For both frontend and backend
    cd Frontend
    npm install # or yarn install
    cd ../Backend
    npm install # or yarn install
    cd ..
    ```

3.  **Configure environment variables:**

    -   Create a `.env` file in the `Backend` directory.
    -   Add the following variables:

        ```
        PORT=5000
        MONGO_URI=<your_mongodb_connection_string>
        JWT_SECRET=<your_jwt_secret>
        GEMINI_API_KEY=<your_gemini_api_key> (optional)
        ```

### Running the Application

1.  **Start the backend server:**

    ```bash
    cd Backend
    npm run dev
    ```

2.  **Start the frontend development server:**

    ```bash
    cd Frontend
    npm run dev
    ```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch: `feature/your-feature-name`.
3.  Make your changes and commit them with descriptive messages.
4.  Submit a pull request.

## 📄 License

[Choose a license for your project. Example (MIT):]

MIT License

Copyright (c) 2025 Anjana Budhathoki

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction...

## 🔗 Links

-   [Project Documentation](Docs/requirements.md)
-   [Live Demo]([Deployment URL - if applicable])

## 🧑‍💻 Team

-   Anjana Bidhathoki
-   Swikar Ramdam