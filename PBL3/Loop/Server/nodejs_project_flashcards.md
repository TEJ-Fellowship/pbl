I will create a PDF-style flashcard layout for a Node.js project folder structure, showing where each type of data or logic is stored.

---

# Config folder
**Folder/File:** src/config/db.js
**Purpose:** Database connection setup
**Data/Logic:** DB credentials (via .env), connection initialization, error handling

# Models Folder
**Folder/File:** src/models/
**Purpose:** Data models
**Data/Logic:** Schema definitions, field types, validations, relationships

# Routes Folder
**Folder/File:** src/routes/
**Purpose:** API routing
**Data/Logic:** Route paths, HTTP methods, input validation, linking to controllers

# Controllers Folder
**Folder/File:** src/controllers/
**Purpose:** Business logic
**Data/Logic:** CRUD operations, DB queries, response formatting

# Middleware Folder
**Folder/File:** src/middleware/
**Purpose:** Middleware functions
**Data/Logic:** Authentication, authorization, logging, error handling

# Utils Folder
**Folder/File:** src/utils/
**Purpose:** Helper functions
**Data/Logic:** Reusable utility functions like JWT creation, password hashing, formatting helpers

# Services Folder (Optional)
**Folder/File:** src/services/
**Purpose:** External service integration
**Data/Logic:** APIs, payment gateways, third-party services logic

# Generally App,js or Server.js
**Folder/File:** src/app.js / src/server.js
**Purpose:** App bootstrap
**Data/Logic:** Express app initialization, middleware & route registration, server listen

# Logs Folder
**Folder/File:** logs/
**Purpose:** Logging
**Data/Logic:** Request logs, error logs, debugging info

# Tests Folder
**Folder/File:** tests/ or __tests__/
**Purpose:** Testing
**Data/Logic:** Unit tests, integration tests, mock DB calls

