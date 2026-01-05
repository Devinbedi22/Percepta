"use client"

import type React from "react"
import { useRef } from "react"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import { motion } from "framer-motion"
import { CircularProgressbar, buildStyles } from "react-circular-progressbar"
import "react-circular-progressbar/dist/styles.css"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

interface AnalysisResultsPageProps {
  imageUrl?: string
  results?: Array<{
    class: number
    confidence: number
    problem: string
    x1: number
    y1: number
    x2: number
    y2: number
  }>
  predictedProblems?: string[]
  recommendations?: string
}

const AnalysisResultsPage: React.FC<AnalysisResultsPageProps> = ({
  imageUrl = "/placeholder.svg",
  results = [],
  predictedProblems = [],
  recommendations = "",
}) => {
  const recommendationsRef = useRef<HTMLDivElement>(null)

  // Custom Button Component
  const CustomButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
    onClick,
    children,
  }) => (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all"
    >
      {children}
    </button>
  )

  // Filter results to include only unique problems
  const uniqueResults = results.filter(
    (result, index, self) =>
      index === self.findIndex((r) => r.problem === result.problem),
  )

  const downloadPDF = async () => {
    if (recommendationsRef.current) {
      const element = recommendationsRef.current
      const canvas = await html2canvas(element, { scrollY: -window.scrollY })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      let heightLeft = pdfHeight
      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight)
      heightLeft -= pdf.internal.pageSize.getHeight()

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight)
        heightLeft -= pdf.internal.pageSize.getHeight()
      }

      pdf.save("skin_analysis_recommendations.pdf")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-white flex flex-col items-center">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold text-pink-700 my-8 text-center"
      >
        Your Skin Analysis Results
      </motion.h1>

      <div className="max-w-6xl w-full px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative flex justify-center"
        >
          <div className="relative w-[400px] h-[400px]">
            <Image
              src={imageUrl}
              alt="Analyzed Skin"
              fill
              className="object-cover rounded-lg shadow-lg"
            />
          </div>
        </motion.div>

        {/* Analysis Details Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold text-pink-600 mb-4">
            Detected Issues
          </h2>

          {predictedProblems.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {uniqueResults.map((result, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-24 h-24 mb-2">
                    <CircularProgressbar
                      value={result.confidence * 100}
                      text={`${(result.confidence * 100).toFixed(0)}%`}
                      styles={buildStyles({
                        textSize: "24px",
                        pathColor: "#FF69B4",
                        textColor: "#FF69B4",
                        trailColor: "#FFF0F5",
                      })}
                    />
                  </div>
                  <span className="text-sm text-pink-700 text-center">
                    {result.problem}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No significant issues detected.</p>
          )}
        </motion.div>
      </div>

      {/* Recommendations Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="max-w-4xl w-full mt-12 px-4"
      >
        <h2 className="text-2xl font-semibold text-pink-600 mb-4">
          Recommendations
        </h2>

        <div
          ref={recommendationsRef}
          className="bg-white rounded-lg shadow-lg p-6 w-full mx-auto"
        >
          {recommendations ? (
            <ReactMarkdown
              className="prose prose-pink max-w-none"
              components={{
                ul: ({ ...props }) => <ul className="list-disc pl-6" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal pl-6" {...props} />,
                p: ({ ...props }) => <p className="mb-4" {...props} />,
              }}
            >
              {recommendations}
            </ReactMarkdown>
          ) : (
            <p className="text-gray-500">No recommendations available.</p>
          )}
        </div>

        <div className="mt-4 flex justify-end p-6">
          <CustomButton onClick={downloadPDF}>
            Download Recommendations as PDF
          </CustomButton>
        </div>
      </motion.div>
    </div>
  )
}

export default AnalysisResultsPage
