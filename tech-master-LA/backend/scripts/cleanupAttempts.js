const mongoose = require("mongoose");
const Quiz = require("../models/quizModel");
require("dotenv").config();

const cleanupAttempts = async () => {
  try {
    console.log("Starting attempt cleanup...");

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to database");

    // Get all quizzes
    const quizzes = await Quiz.find({});
    console.log(`Found ${quizzes.length} quizzes to process`);

    let cleanedQuizzes = 0;
    let totalAttemptsCleaned = 0;

    for (const quiz of quizzes) {
      let needsUpdate = false;
      const originalAttemptCount = quiz.attempts.length;

      // Find all incomplete attempts
      const incompleteAttempts = quiz.attempts.filter((att) => !att.completed);

      if (incompleteAttempts.length > 1) {
        // Keep only the most recent incomplete attempt, mark others as abandoned
        const sortedIncomplete = incompleteAttempts.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        // Mark all but the most recent as abandoned
        for (let i = 1; i < sortedIncomplete.length; i++) {
          const attempt = quiz.attempts.id(sortedIncomplete[i]._id);
          if (attempt) {
            attempt.status = "abandoned";
            needsUpdate = true;
            totalAttemptsCleaned++;
          }
        }
      }

      // Add status field to attempts that don't have it
      quiz.attempts.forEach((attempt) => {
        if (!attempt.status) {
          attempt.status = attempt.completed ? "completed" : "in_progress";
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        await quiz.save();
        cleanedQuizzes++;
        console.log(
          `Cleaned quiz: ${quiz.title} (${originalAttemptCount} -> ${quiz.attempts.length} attempts)`
        );
      }
    }

    console.log(`\nCleanup completed!`);
    console.log(`- Quizzes processed: ${quizzes.length}`);
    console.log(`- Quizzes cleaned: ${cleanedQuizzes}`);
    console.log(`- Attempts marked as abandoned: ${totalAttemptsCleaned}`);

    // Disconnect from database
    await mongoose.disconnect();
    console.log("Disconnected from database");
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
};

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupAttempts();
}

module.exports = cleanupAttempts;
