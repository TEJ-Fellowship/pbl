# Hamro Calendar

Plan your schedule with confidence using an intuitive calendar platform that combines event management, country-based public holidays, and AI-powered weekly insights.

## Summary

Hamro Calendar is a modern calendar and event planning web application designed to simplify how individuals and teams organize their time. The platform helps users create, track, update, and manage events in a clean monthly calendar interface, while also surfacing relevant public holidays based on the selected country.

For end users, Eventia improves day-to-day productivity with quick event creation, search, holiday visibility, and concise AI summaries of upcoming events.

For stakeholders, Eventia provides a lightweight, extensible solution to digitize personal and team scheduling workflows while enabling future integrations and feature expansion.

For technical teams, the application uses a frontend-first architecture built with React and Vite, integrates external APIs for holidays and AI summaries, and follows modular, component-based development patterns.

## Key Features and Benefits

- **Calendar-Based Event Management:** Create, view, edit, and delete events from a monthly calendar UI.
- **Smart Event Search:** Quickly find events by title or category using live search.
- **Country-Aware Public Holidays:** Fetch and display public holidays dynamically for selected countries.
- **AI Weekly Event Summary:** Generate a short summary of upcoming events with insights and time-management tips via Gemini.
- **Local Data Persistence:** Preserve user events in browser local storage for seamless continuity between sessions.
- **Theme and UX Controls:** Toggle dark/light appearance and manage calendar settings in a simple, user-friendly navigation bar.

## Technology Stack

### Frontend

- **React 19.x** with functional components and hooks
- **Vite 5.x** for fast development and build tooling
- **CSS + Tailwind CSS** (Tailwind/PostCSS configured for utility-based styling)
- **React Flags Select** for country selection UI

### Integrations

- **Google Gemini API** via `@google/genai` for event summarization
- **Calendarific Holidays API** for country/year public holiday data
- **Browser Local Storage** for client-side persistence

### Development Tools

- **ESLint 9** for linting and code quality
- **PostCSS + Autoprefixer** for stylesheet processing
- **Environment-based configuration** using Vite `import.meta.env`

## Installation and Setup

### Prerequisites

- Node.js (v18.x or higher recommended)
- npm (or compatible package manager)
- Calendarific API key
- Gemini API key

### Setup

```bash
# Clone repository and enter project
git clone <your-repository-url>
cd eventia

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_HOLIDAY_API_KEY=your_calendarific_api_key
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

## Usage Instructions

1. **Add Events:** Use the create button to open the event form and save a new event.
2. **Browse Calendar:** Navigate months/years and view events directly in date cells.
3. **Search Events:** Enter a keyword in the search bar to filter by title or category.
4. **Manage Events:** Open an event to edit details or delete it.
5. **Toggle Holidays:** Enable or disable public holidays from the side panel.
6. **Change Country:** Select a country in settings to load relevant holidays.
7. **Get AI Summary:** Open the AI panel and generate a concise summary of upcoming events.

## Project Structure

```text
eventia/
├── api/
│   └── holidayapi.js           # Holiday fetch/format utilities
├── src/
│   ├── components/             # Reusable UI and interaction components
│   ├── css/                    # Component-specific stylesheets
│   ├── pages/                  # Page-level components
│   ├── App.jsx                 # App shell, state management, persistence
│   ├── GeminiApi.jsx           # Gemini summary integration logic
│   ├── data.json               # Seed event data
│   └── main.jsx                # React entry point
├── eslint.config.js            # ESLint configuration
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
├── vite.config.js              # Vite configuration
└── package.json                # Scripts and dependencies
```

## Best Practices and Design Principles

- **Maintainability:** Modular component structure with clear separation of concerns.
- **Performance:** Vite-powered development/build flow and optimized UI rendering.
- **Usability:** Clean interaction design for fast event creation and navigation.
- **Extensibility:** API utilities and component boundaries make future enhancements easier.
- **Consistency:** Linting standards enforce predictable code style and reduce regressions.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint checks

## Contribution Guidelines

- Follow existing code conventions and component patterns.
- Keep changes modular and review-friendly.
- Run linting before submitting changes.
- Document notable feature or behavior updates.
- Use descriptive commit messages focused on intent.

## License

This project is proprietary software owned by TEJ Fellowship. All rights reserved.

## Contact Information

**Project Maintainers:**

- Mahesh Chaudhary
- Anu Ale Magar
- Project Manager: Sanjeev Rai

**Technical Support:**

- Email: initx.mahesh@gmail.com || anumagar354@gmail.com
