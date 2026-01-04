import type React from "react";
import { useEffect } from "react";
import AnalysisResultsPage from "./AnalysisResultsPage";

interface AnalysisResultProps {
  isLoading: boolean;
  result: any;
  onClose: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ isLoading, result, onClose }) => {
  useEffect(() => {
    if (!isLoading && result) {
      // Redirect logic here
      const resultsData = {
        imageUrl: result.imageUrl || "/placeholder.svg",
        results: result.results || [],
        predictedProblems: result.results.map((r: any) => r.problem) || [],
        recommendations: result.recommendations || "",
      };
      setTimeout(() => {
        window.location.href = `/analysis-results?data=${encodeURIComponent(JSON.stringify(resultsData))}`;
      }, 500); // Short delay for smooth transition
    }
  }, [isLoading, result]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-pink-50 bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-pink-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pink-700 text-lg font-semibold">Analyzing your skin...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AnalysisResult;
