"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface AnalysisResultProps {
  isLoading: boolean
  result: any
  onClose: () => void
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({
  isLoading,
  result,
  onClose,
}) => {
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && result) {
      // ✅ Defensive checks
      const safeResults = Array.isArray(result?.results)
        ? result.results
        : []

      const resultsData = {
        imageUrl: result?.imageUrl ?? "/placeholder.svg",
        results: safeResults,
        predictedProblems: safeResults.map(
          (r: any) => r?.problem ?? "Unknown"
        ),
        recommendations: result?.recommendations ?? "",
      }

      // Small delay for smoother UX
      const timer = setTimeout(() => {
        router.push(
          `/analysis-results?data=${encodeURIComponent(
            JSON.stringify(resultsData)
          )}`
        )
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [isLoading, result, router])

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-pink-50 bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-pink-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pink-700 text-lg font-semibold">
            Analyzing your skin...
          </p>
        </div>
      </div>
    )
  }

  return null
}

export default AnalysisResult
