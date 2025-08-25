# Quiz Attempt Management System

## Overview

This document describes the improved quiz attempt management system that prevents inconsistent attempt numbers and provides better tracking of quiz progress.

## Key Features

### 1. Attempt Status Tracking

Each attempt now has a status field with three possible values:

- `in_progress`: Currently being worked on
- `completed`: Finished and scored
- `abandoned`: Started but never completed

### 2. Single Incomplete Attempt Rule

The system enforces that only one incomplete attempt can exist per quiz at any time. This prevents:

- Multiple incomplete attempts from rapid clicking
- Inconsistent attempt counting
- Confusion about which attempt to continue

### 3. Automatic Cleanup

- Incomplete attempts are automatically cleaned up when starting a new quiz
- Abandoned attempts are preserved for audit purposes but not counted in statistics

## Database Schema Changes

### Attempt Schema

```javascript
const attemptSchema = new mongoose.Schema({
  userAnswers: {
    type: Map,
    of: String,
    required: false,
  },
  score: {
    type: Number,
    required: false,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["in_progress", "completed", "abandoned"],
    default: "in_progress",
  },
  date: { type: Date, default: Date.now },
});
```

### Quiz Schema Validation

```javascript
attempts: {
  type: [attemptSchema],
  validate: {
    validator: function(attempts) {
      const incompleteCount = attempts.filter(att => !att.completed && att.status !== 'abandoned').length;
      return incompleteCount <= 1;
    },
    message: 'Only one incomplete attempt allowed per quiz'
  }
}
```

## API Endpoints

### New Endpoints

#### Abandon Attempt

```
POST /api/quiz/:id/abandon
Body: { attemptId: string }
```

Marks an incomplete attempt as abandoned.

#### Cleanup Attempts

```
POST /api/quiz/:id/cleanup
```

Removes all abandoned attempts from a quiz.

#### Get Quiz Stats

```
GET /api/quiz/:id/stats
```

Returns statistics for a specific quiz (only completed attempts).

### Updated Endpoints

#### Start Quiz

- Now automatically cleans up abandoned attempts
- Returns existing incomplete attempt if available
- Creates new attempt only if no incomplete attempt exists

#### Submit Quiz

- Marks attempt as completed and sets status to 'completed'
- Prevents submission of abandoned attempts

#### Regenerate Quiz

- Marks incomplete attempts as abandoned instead of deleting them
- Preserves attempt history for audit purposes

## Service Methods

### QuizService Methods

#### `startQuiz(quizId, userId)`

- Cleans up abandoned attempts
- Returns existing incomplete attempt or creates new one
- Ensures only one incomplete attempt per quiz

#### `abandonAttempt(quizId, attemptId, userId)`

- Marks an attempt as abandoned
- Cannot abandon completed attempts

#### `cleanupIncompleteAttempts(quizId, userId)`

- Removes all abandoned attempts from a quiz
- Keeps completed attempts intact

#### `getQuizStats(quizId, userId)`

- Returns statistics using only completed attempts
- Provides accurate attempt counts and scores

## Statistics Calculation

### Completed Attempts Only

All statistics now use only completed attempts:

- Total attempt counts
- Average scores
- Best scores
- Latest scores

### Frontend Display

- Shows "completed attempts" count instead of total attempts
- Displays latest score from completed attempts only
- Properly handles quizzes with no completed attempts

## Migration

### Running the Cleanup Script

To fix existing inconsistent data:

```bash
npm run cleanup-attempts
```

This script will:

1. Find all quizzes with multiple incomplete attempts
2. Mark all but the most recent as abandoned
3. Add status fields to attempts that don't have them
4. Preserve all attempt history for audit purposes

### What the Cleanup Does

- **Multiple incomplete attempts**: Keeps the most recent, marks others as abandoned
- **Missing status fields**: Adds appropriate status based on completion state
- **No data loss**: All attempts are preserved, just marked appropriately

## Benefits

### 1. Consistent Attempt Numbers

- Only completed attempts are counted in statistics
- No more inflated attempt counts from incomplete attempts

### 2. Better User Experience

- Clear indication of quiz progress
- Proper handling of interrupted attempts
- Accurate score tracking

### 3. Data Integrity

- Validation prevents multiple incomplete attempts
- Audit trail preserved through abandoned attempts
- Consistent state across all operations

### 4. Scalability

- Efficient database queries using only completed attempts
- Reduced memory usage in statistics calculations
- Better performance for large datasets

## Usage Examples

### Starting a Quiz

```javascript
const { quiz, attempt } = await quizService.startQuiz(quizId, userId);
// Returns existing incomplete attempt or creates new one
```

### Abandoning an Attempt

```javascript
await quizService.abandonAttempt(quizId, attemptId, userId);
// Marks attempt as abandoned, can be cleaned up later
```

### Getting Quiz Statistics

```javascript
const stats = await quizService.getQuizStats(quizId, userId);
// Returns: { totalAttempts, bestScore, averageScore, latestScore }
```

## Error Handling

### Common Errors

- **"Only one incomplete attempt allowed per quiz"**: Validation error when trying to create multiple incomplete attempts
- **"Cannot abandon a completed attempt"**: Attempting to abandon an already completed quiz
- **"Cannot submit an abandoned attempt"**: Attempting to submit an abandoned attempt

### Error Prevention

- Automatic cleanup of abandoned attempts
- Validation at database level
- Clear error messages for debugging

## Monitoring

### Key Metrics to Track

- Number of abandoned attempts per quiz
- Time between attempt start and completion
- Frequency of attempt abandonment
- Quiz completion rates

### Logging

All attempt operations are logged for debugging and monitoring purposes.
