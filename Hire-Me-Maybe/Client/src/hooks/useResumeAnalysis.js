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
      const result = await aiService.analyzeResume(resumeId);
      setAnalysisResult(result.data);
      return result.data;
    } catch (error) {
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
