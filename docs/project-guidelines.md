
# Project-Based Learning(PBL) Guidelines
**TEJ Bootcamp - Full Stack Software Engineering Fellows**

## Overview

This document outlines the development process and standards for all projects in the TEJ bootcamp. Following these guidelines ensures consistent, high-quality code delivery and effective collaboration across teams.

## 1. Project Setup

### Repository Structure
- **Monorepo Template Provided**: You'll receive a pre-configured monorepo
- Put your project within that monorepo within a folder (e.g. `weather_and_AQI_app`)

### Getting Started Checklist
- [ ] Clone the provided repository template
- [ ] Review the folder structure and understand the organization
- [ ] Initialize your project files in the appropriate directories

## 2. User Stories & Requirements

### User Story Format
```
As a [persona], I want to [do something] so that [reason/benefit]
```

### Key Principles
- Focus on user needs, not implementation details
- Stories should be testable and measurable
- Include acceptance criteria for each story

### Examples
✅ **Good**: "As a job seeker, I want to filter job listings by location so that I can find opportunities near me"

❌ **Bad**: "As a developer, I want to implement a React component with Material-UI"

### Story Management
- Break large stories into smaller, manageable tasks
- Prioritize stories based on user value
- Define clear acceptance criteria before development starts

## 3. Development Workflow

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

### Branch Naming Convention
- `feature/[brief-description]`
- `bugfix/[brief-description]`
- `hotfix/[brief-description]`

### Development Process
1. Create issue for the feature/bug
2. Create feature branch from main
3. Develop iteratively (see AI-Assisted Development section)
4. Create pull request when ready
5. Request peer review
6. Address feedback and merge

## 4. AI-Assisted Development with Cursor

### Proactive AI Usage - ENCOURAGED!
We strongly encourage you to use AI tools throughout your development process. AI is a powerful learning and development tool that can accelerate your understanding and productivity.

### Best Practices for AI Usage
- **Iterative Prompting**: Break down complex problems into smaller, focused prompts
- **Learn as You Go**: Use AI to explain concepts you don't understand
- **Code Understanding**: Always ask AI to explain generated code before implementing
- **Conceptual Learning**: Use AI to clarify programming concepts and patterns

### When and How to Use AI Tools

#### For Learning & Understanding
- Ask AI to explain complex code sections in simple terms
- Request explanations of programming concepts and patterns
- Get clarification on error messages and debugging approaches
- Understand architectural decisions and design patterns

#### For Development
- Generate boilerplate code and starter templates
- Get suggestions for implementing specific features
- Debug issues with detailed error analysis
- Optimize existing code for performance or readability

#### For Code Review
- Ask AI to review your code for potential issues
- Get suggestions for improvements and best practices
- Understand security implications of your implementations

### Effective Prompting Strategies

❌ **Poor**: "Build me a login system"

✅ **Good**: "Explain how JWT authentication works, then help me implement a login endpoint that validates user credentials and returns a JWT token"

❌ **Poor**: "Fix this bug"

✅ **Good**: "I'm getting a 'Cannot read property of undefined' error on line 23. Here's my code: [paste code]. Can you explain what's happening and suggest a fix?"

### AI Learning Workflow
1. Encounter something new → Ask AI to explain the concept
2. Before implementing → Ask AI to break down the approach
3. After generating code → Ask AI to explain what the code does
4. When debugging → Use AI to understand error messages
5. During code review → Ask AI to identify potential improvements

## 5. Commit Standards

### AI-Enhanced Commit Format

```
## AI Prompts Used
[List the key prompts you used with AI tools]

## Code Generated vs Manual
[Describe what was AI-generated vs what you wrote manually]

## Understanding Check
[Briefly explain what the code does in your own words]

## Description
[Clear description of what this commit accomplishes]
```

### Example

```
## AI Prompts Used
- "Explain how React useEffect hook works with cleanup functions"
- "Help me create a custom hook for managing form state with validation"

## Code Generated vs Manual
- AI generated the basic hook structure and validation logic
- I manually added specific validation rules for our user registration form
- I wrote the error handling and user feedback components myself

## Understanding Check
This commit adds a reusable useFormValidation hook that manages form state, validates inputs in real-time, and provides error messages. The hook uses useEffect to validate on input changes and useCallback to optimize performance.

## Description
Implemented custom form validation hook for user registration with real-time validation and error handling
```

## 6. Pull Request Process

### Before Creating PR
- [ ] Code is properly formatted and linted
- [ ] No console.log or debugging code left in
- [ ] Feature works as expected

### PR Requirements
- **Detailed Description**: Explain what was implemented and why
- **Screenshots**: Include before/after screenshots for UI changes
- **Testing Plan**: Describe how you tested the changes
- **Breaking Changes**: Clearly document any breaking changes

### PR Template

```markdown
## Summary
Brief description of changes

## Changes Made
- List key changes
- Include any new dependencies
- Note any configuration changes

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Cross-browser testing (if applicable)

## Screenshots
[Include relevant screenshots]

## Additional Notes
Any other relevant information
```

## 7. Code Review Process

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

## 8. Code Quality Standards

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

## 9. Testing Requirements

### Minimum Testing Standards
- Unit tests for all utility functions
- Integration tests for API endpoints
- Component tests for React components
- End-to-end tests for critical user flows

### Testing Strategy
- Write tests before or alongside development
- Aim for meaningful test coverage, not just high percentages
- Test both happy path and error scenarios

## 10. Definition of Done

A feature is considered complete when:
- [ ] All acceptance criteria are met
- [ ] Code is reviewed and approved
- [ ] Feature is well tested
- [ ] No breaking changes introduced
- [ ] Performance impact assessed

## 11. Common Pitfalls to Avoid

- **Passive AI Usage**: Don't just copy-paste AI code without understanding it
- **Skipping the Learning**: Always ask AI to explain concepts you don't understand
- **Single Large Prompts**: Break complex requests into smaller, focused prompts
- **Skipping Reviews**: Every PR needs human review, even AI-generated code
- **Large Commits**: Keep commits focused and atomic
- **Ignoring Edge Cases**: Test boundary conditions and ask AI about potential issues
- **Poor Commit Messages**: Be descriptive and document your AI usage
- **Not Asking "Why"**: Always understand the reasoning behind AI suggestions

## 12. Resources & Support

### Getting Help
- Use issue comments for technical discussions
- Schedule pair programming sessions for complex features
- Reach out to mentors for architectural decisions

### Useful Tools
- **Cursor**: AI-powered code editor
- **GitHub Issues**: Project management
- **Pull Requests**: Code review process
- **GitHub Actions**: CI/CD pipeline

---

**Questions?**  
If you have questions about these guidelines, reach out to your mentor.