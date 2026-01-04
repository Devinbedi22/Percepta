"use client"

import type React from "react"
import { useState } from "react"
import { ImageUploader } from "../components/image-uploader"
import AnalysisResultsPage from "../components/AnalysisResultsPage"

interface AnalysisResults {
  imageUrl: string
  results: Array<{
    class: number
    confidence: number
    problem: string
    x1: number
    y1: number
    x2: number
    y2: number
  }>
  predictedProblems: string[]
  recommendations: string
}

const SkinAnalysisPage: React.FC = () => {
  const [showUploader, setShowUploader] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null)

  const handleAnalysisComplete = (results: any) => {
    setAnalysisResults({
      imageUrl: results.imageUrl || "/placeholder.svg",
      results: results.results || [],
      predictedProblems: results.predicted_problems || [], // Fix property name
      recommendations: results.recommendations || "",
    })
    setShowUploader(false)
  }

  if (analysisResults) {
    return <AnalysisResultsPage {...analysisResults} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-pink-700 mb-8">Skin Analysis</h1>
      <button
        onClick={() => setShowUploader(true)}
        className="px-6 py-3 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors text-lg font-semibold shadow-lg"
      >
        Start Your Skin Analysis
      </button>
      {showUploader && <ImageUploader onClose={() => setShowUploader(false)} onSubmit={handleAnalysisComplete} />}
    </div>
  )
}

export default SkinAnalysisPage
