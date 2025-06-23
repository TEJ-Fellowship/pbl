import React from "react";

const QuizDebug = ({ quiz }) => {
  if (!quiz) return <div className="text-red-500 p-4">No quiz data</div>;

  return (
    <div className="bg-yellow-100 p-4 rounded-lg mb-4 border border-yellow-300">
      <h3 className="font-bold text-yellow-800 mb-2">Quiz Debug Info:</h3>
      <div className="text-xs overflow-auto max-h-40">
        <pre className="text-yellow-700">{JSON.stringify(quiz, null, 2)}</pre>
      </div>
      <div className="mt-2 text-sm text-yellow-700">
        <p>
          <strong>Quiz ID:</strong> {quiz._id || "No ID"}
        </p>
        <p>
          <strong>Title:</strong> {quiz.title || "No title"}
        </p>
        <p>
          <strong>Questions Count:</strong> {quiz.questions?.length || 0}
        </p>
        <p>
          <strong>Questions Structure:</strong>{" "}
          {quiz.questions?.[0] ? "Valid" : "Invalid"}
        </p>
      </div>
    </div>
  );
};

export default QuizDebug;
