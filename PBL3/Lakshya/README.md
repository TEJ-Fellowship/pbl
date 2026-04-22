# Lakshya

**Design your career roadmap with a modern dashboard for interests, goals, and AI-powered learning recommendations.**

## Summary

Lakshya is a career planning web application that helps learners identify their interests, define measurable goals, and receive personalized recommendations for courses and skill development.

For **learners and mentors**, Lakshya offers a focused interface to track career progress, persist plans locally, and quickly generate actionable next steps.

For **technical teams**, the project demonstrates a modular React architecture powered by Vite, Tailwind CSS, client-side routing, and Gemini API integration for recommendation workflows.

## Key Features and Benefits

- **Career Interest Selection**: Users can choose from popular career areas and add custom interests for a personalized profile
- **Goal Tracking Dashboard**: Add, update, complete, and remove career goals with progress percentages, deadlines, and overdue indicators
- **AI Course and Skill Recommender**: Generate tailored course suggestions and skill priorities based on saved interests and goals
- **Persistent Local Data**: Store interests and goals in localStorage for continuity across browser sessions
- **Responsive Dashboard Experience**: Use the platform across desktop and mobile breakpoints with Tailwind-based responsive layouts
- **Dark Mode Support**: Switch between light and dark themes for improved usability in different environments

## Technology Stack

### Frontend

- React 19.x with functional components and hooks
- React Router for client-side navigation
- Tailwind CSS for utility-first responsive styling
- Lucide React for iconography
- Gemini client SDK (`@google/generative-ai`) for AI recommendations

### Development Tools

- Vite for fast local development and optimized builds
- ESLint for code quality and consistency
- PostCSS + Autoprefixer for CSS tooling

## Tools and Libraries Used

- React (frontend UI)
- React Router DOM (routing/navigation)
- Vite (dev server + build tool)
- Tailwind CSS (styling)
- PostCSS + Autoprefixer (CSS processing)
- ESLint (linting/code quality)
- Lucide React (icons)
- @google/generative-ai (Gemini API integration for AI recommendations)
- @mui/material + @emotion/react + @emotion/styled (UI/component tooling)
- @mui/x-charts (charting support)

## Installation and Setup

### Prerequisites

- Node.js (v18.x or higher recommended)
- npm (or another compatible package manager)
- Google Gemini API key

### Project Setup

```bash
# Navigate to project directory
cd Lakshya

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the `Lakshya` root:

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Run the App

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage Instructions

1. **Open Dashboard**: Start at the dashboard to access all modules from the sidebar
2. **Select Career Interests**: Go to Career and choose predefined interests or add custom ones
3. **Save Interests**: Persist your selected interests to local storage
4. **Track Goals**: Use Goal Tracker to create goals, assign deadlines, and update progress
5. **Generate AI Recommendations**: Visit AI Advisor to receive course and skill recommendations from Gemini
6. **Refresh Insights**: Re-run recommendation generation as your goals and interests evolve

## Project Structure

```text
Lakshya/
├── public/                    # Static public assets
├── src/
│   ├── assets/                # Images and visual assets
│   ├── components/            # Shared layout and UI components
│   ├── pages/                 # Route-level pages (Career, Goals, AI Advisor, etc.)
│   ├── App.jsx                # Main app layout and route definitions
│   ├── main.jsx               # App bootstrap with BrowserRouter
│   └── index.css              # Global styles
├── package.json               # Scripts and dependencies
├── tailwind.config.js         # Tailwind configuration
├── vite.config.js             # Vite configuration
└── README.md                  # Project documentation
```

## Current Module Status

- **Implemented**: Dashboard, Career, Goal Tracker, AI Advisor
- **Planned / Coming Soon**: Job Market, Resources, Calendar

## Best Practices and Design Principles

- **Modular UI Architecture**: Components and pages are separated for easier maintenance and extension
- **Data Persistence by Default**: User profile inputs are retained locally to reduce repeated work
- **Progress-Oriented UX**: Goal metrics and visual progress indicators encourage consistent learning
- **Incremental Feature Delivery**: Core features are shipped first, with future modules scaffolded for phased rollout
- **API Safety and Resilience**: AI recommendation workflow includes loading and error states to improve reliability

## Contribution Guidelines

1. Follow the existing ESLint and React code patterns
2. Keep pull requests focused and reviewable
3. Use clear commit messages that explain the intent of changes
4. Validate UI behavior across light/dark themes and responsive breakpoints
5. Update this README when introducing major features or architectural changes

## License

This project is proprietary software owned by TEJ Fellowship. All rights reserved.

## Contact Information

**Project Maintainers:**

- Frontend Lead: Mahesh Chaudhary
- Product Manager: Sanjeev Rai

## Technical Support

- Email: initx.mahesh@gmail.com