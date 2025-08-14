# Project-Based Learning Guidelines

## TEJ Bootcamp - Full Stack Software Engineering Fellows

### Overview

This document outlines the development process and standards for all projects in the TEJ bootcamp. Following these guidelines ensures consistent, high-quality code delivery and effective collaboration across teams.

## 1. Project Setup

### Repository Structure

- **Monorepo Template Provided**: You'll receive a pre-configured monorepo
- Put your project within that monorepo within a folder (e.g., `weather_and_AQI_app`)

### How to Get Started

1. Clone the provided repository template
2. Review the folder structure and understand the organization
3. Initialize project files in the appropriate directories

#### For Example:

**Frontend Application**

1. Navigate to the root directory: `PBL1/(your-project-folder)`
2. Execute the following commands in the terminal:
   ```bash
   npm create vite@latest . -- --template react
   ```
3. Start the project
4. Tailwind CSS setup:
   - Install Tailwind CSS:
     ```bash
     npm install -D tailwindcss@3 postcss autoprefixer
     npx tailwindcss init -p
     ```
   - Configure `tailwind.config.js`:
     ```javascript
     export default {
       content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
       theme: {
         extend: {},
       },
       plugins: [],
     };
     ```
   - Add Tailwind directives to your CSS file(index.css):
     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```

**Fullstack Application**

1. Navigate to the root directory: `PBL`
2. Create a new project directory using the terminal:
   ```bash
   mkdir your_project_name
   cd your_project_name
   ```
3. Create separate directories for the frontend and backend:
   ```bash
   mkdir your_project_frontend
   mkdir your_project_backend
   ```
4. Begin coding in the respective directories

## 2. User Stories & Requirements

### User Story Format

```
As a [persona], I want to [do something] so that [reason/benefit]
```

### Key Principles:

- Focus on user needs, not implementation details
- Stories should be testable and measurable
- Include acceptance criteria for each story

### Examples

- ✅ **Good**: "As a job seeker, I want to filter job listings by location so that I can find opportunities near me"
- ❌ **Bad**: "As a developer, I want to implement a React component with Material-UI"

### Story Management

- Break large stories into smaller, manageable tasks
- Prioritize stories based on user value
- Define clear acceptance criteria before development starts

## 3. Wireframe Design

Before starting development, create wireframes for your application. This helps visualize the user interface and user experience, making development more efficient and reducing the need for major changes later.

### Requirements:

- Create wireframes for all main pages and user flows
- Include both desktop and mobile layouts
- Use tools like Figma, Balsamiq, or pen and paper
- Share wireframes with your team for feedback before coding

## 4. Development Workflow

### Issue Management

- Every feature must have an issue before development begins
- Use descriptive issue titles and detailed descriptions
- Label issues appropriately (bug, feature, enhancement, etc.)
- Assign issues to specific team members

### Branch Strategy

```
main
├── feature/user-authentication
├── feature/job-search-filters
└── hotfix/login-validation-bug
```

#### Branch Naming Convention:

- `feature/[brief-description]`
- `bugfix/[brief-description]`
- `hotfix/[brief-description]`

### Development Process

1. Create issue for the feature/bug
2. Create feature branch from main
3. Develop iteratively following best practices
4. Create pull request when ready
5. Request peer review
6. Address feedback and merge

## 5. Development Best Practices

### Proactive Learning - ENCOURAGED!

We strongly encourage you to actively learn throughout your development process. Research, documentation, and community resources are powerful tools that can accelerate your understanding and productivity.

### Best Practices for Development

- **Iterative Development**: Break down complex problems into smaller, manageable tasks
- **Learn as You Go**: Research and understand concepts you don't know
- **Code Understanding**: Always understand the code you write before implementing
- **Conceptual Learning**: Study programming concepts and patterns

### When and How to Use Development Resources

#### For Learning & Understanding

- Research complex code sections and understand them thoroughly
- Study programming concepts and patterns from documentation
- Learn debugging approaches and error handling techniques
- Understand architectural decisions and design patterns

#### For Development

- Write clean, maintainable code from scratch
- Implement features using best practices and patterns
- Debug issues with systematic problem-solving approaches
- Optimize existing code for performance or readability

#### For Code Review

- Review your own code for potential issues
- Apply best practices and coding standards
- Consider security implications of your implementations

### Effective Development Strategies

- ❌ **Poor**: Copy-paste code without understanding
- ✅ **Good**: Research how JWT authentication works, then implement a login endpoint that validates user credentials and returns a JWT token

- ❌ **Poor**: Ignore error messages
- ✅ **Good**: When you get a 'Cannot read property of undefined' error on line 23, research the issue and understand what's happening before fixing it

### Learning Workflow

1. Encounter something new → Research and understand the concept
2. Before implementing → Plan your approach and break it down
3. After writing code → Review and understand what the code does
4. When debugging → Research error messages and understand the root cause
5. During code review → Identify potential improvements and best practices

## 6. Commit Standards

### Semantic Commit Messages

Use semantic commit messages to clearly communicate the purpose and scope of your changes. This helps with project history, automated changelog generation, and code review processes.

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

### Examples

```
feat: add user authentication with JWT tokens
fix: resolve login form validation error
docs: update API documentation for user endpoints
refactor: extract form validation logic into custom hook
test: add unit tests for user registration component
chore: update dependencies to latest versions
```

### Subject Line Rules (Header)
- Use the imperative mood: "Add", not "Added" or "Adds"
- Capitalize only the first letter
- No period (full-stop) at the end
- Keep under 50 characters

### Body Rules (Optional but Recommended)
- Insert a blank line between subject and body
- Use if additional context is needed
- Explain what was done and why, not how
- Wrap at 72 characters

### Example
```
feat(auth): Add JWT login for user authentication

Implement stateless login by issuing JWT tokens after user
authentication. This improves session handling and supports
token-based role management in future updates.

```

## 7. Pull Request Process

### Before Creating PR

- [ ] Code is properly formatted and linted
- [ ] No console.log or debugging code left in
- [ ] Feature works as expected

### PR Requirements

- **Detailed Description**: Explain what was implemented and why
- **Screenshots**: Include before/after screenshots for UI changes
- **Testing Plan**: Describe how to manual test the changes
- **Breaking Changes**: Clearly document any breaking changes
- **Linked Issues: Mention related issues using Closes #issue_number to auto-close them on merge

### PR Template

```
## Summary

Brief description of changes

## Changes Made

- List key changes
- Include any new dependencies
- Note any configuration changes

## Testing Plan

How you tested
E.g.:

1. Go to the home page
2. Click the "News" tab
3. Select a news article to view

## Screenshots

[Include relevant screenshots]

## Additional Notes
- Any other relevant information

Closes #12
```

## 8. Code Review Process

### For Reviewers

- **Mandatory Review**: All PRs require at least one peer review
- Review for code quality, not just functionality
- Check for proper error handling and edge cases
- Verify testing coverage
- Ensure code follows project conventions

### Review Checklist

- [ ] Code is readable and well-commented
- [ ] Proper error handling implemented
- [ ] No hardcoded values or secrets
- [ ] Performance considerations addressed
- [ ] Security best practices followed

### Providing Feedback

- Be constructive and specific in comments
- Explain the "why" behind suggested changes
- Approve only when all concerns are addressed
- Use GitHub's suggestion feature for minor changes

## 9. Code Quality Standards

### General Principles

- **Readability First**: Code should be self-documenting
- **DRY (Don't Repeat Yourself)**: Avoid code duplication
- **SOLID Principles**: Follow object-oriented design principles
- **Error Handling**: Always handle potential errors gracefully

### Code Style

- Use consistent naming conventions
- Keep functions small and focused
- Comment complex logic
- Remove unused code and imports

## 10. Definition of Done

A feature is considered complete when:

- [ ] All acceptance criteria are met
- [ ] Code is reviewed and approved
- [ ] Feature is well tested
- [ ] No breaking changes introduced
- [ ] Performance impact assessed

## 11. Common Pitfalls to Avoid

- **Passive Code Usage**: Don't just copy-paste code without understanding it
- **Skipping the Learning**: Always research and understand concepts you don't know
- **Single Large Features**: Break complex features into smaller, manageable tasks
- **Skipping Reviews**: Every PR needs human review
- **Large Commits**: Keep commits focused and atomic
- **Ignoring Edge Cases**: Test boundary conditions and consider potential issues
- **Poor Commit Messages**: Be descriptive and document your changes
- **Not Asking "Why"**: Always understand the reasoning behind your implementations

## 12. Resources & Support

### Getting Help

- Use issue comments for technical discussions
- Schedule pair programming sessions for complex features
- Reach out to mentors for architectural decisions

### Useful Tools

- **Cursor**: Modern code editor
- **GitHub Issues**: Project management
- **Pull Requests**: Code review process
- **GitHub Actions**: CI/CD pipeline

### Questions?

If you have questions about these guidelines, reach out to your TF/mentor.
