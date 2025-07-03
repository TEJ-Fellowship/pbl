import { useState, useCallback } from "react";
import { aiService } from "../services/aiService";

export const useResumeAnalysis = () => {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  const analyzeResume = useCallback(async (resumeId) => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      console.log("=== FRONTEND ANALYSIS DEBUG ===");
      console.log("Calling analyzeResume with ID:", resumeId);

      const result = await aiService.analyzeResume(resumeId);

      console.log("Raw API response:", result);
      console.log("Response data:", result.data);
      console.log("Analysis result:", result.data?.data);

      setAnalysisResult(result.data?.data);
      return result.data?.data;
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysisError(error.message || "Analysis failed");
      throw error;
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setAnalysisError(null);
  }, []);

  return {
    analyzeResume,
    analysisResult,
    analysisLoading,
    analysisError,
    clearAnalysis,
  };
};
