"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { ArrowRight, Upload, Camera, Sparkles } from "lucide-react"
import { ImageUploader } from "./components/image-uploader"
import AnalysisResultsPage from "./components/AnalysisResultsPage";
import { Navbar } from "./components/navbar"

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
export default function Home() {
  // const [showUploader, setShowUploader] = useState(false)
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 overflow-hidden">
      {/* Hero Section */}
      
      <section className="relative py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between relative z-10">
            <div className="lg:w-1/2 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
                  <span className="block">Discover Your</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                    Perfect Skincare
                  </span>
                </h1>
                <div className="absolute -top-10 -left-10 w-20 h-20 bg-yellow-300 rounded-full opacity-50 blur-xl"></div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pink-300 rounded-full opacity-50 blur-xl"></div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl text-gray-600 max-w-md"
              >
                Experience the future of skincare with our AI-powered analysis and personalized recommendations.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <CustomButton
                  size="lg"
                  className="w-200 flex justify-center bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-300"
                  onClick={() => setShowUploader(true)}
                >
                  Get Started  <ArrowRight className="m-auto h-5 w-5 ml-2" />
                </CustomButton>
                
              </motion.div>
            </div>
            <div className="lg:w-1/2 mt-10 lg:mt-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full transform -rotate-6 scale-95 blur-2xl opacity-70"></div>
                <div className="relative z-10">
                  <Image
                    src="/Girl.png"
                    alt="Skincare Analysis"
                    width={500}
                    height={500}
                    className="rounded-3xl shadow-2xl"
                  />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="absolute -bottom-6 -left-6 bg-white z-10 opacity-75 rounded-full shadow-xl p-4 flex items-center space-x-2"
                >
                  <Sparkles className="text-yellow-500" />
                  <p className="text-sm z-20 font-medium text-gray-900">AI-Powered Magic</p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
        {/* Background Elements */}
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-pink-100 transform -skew-y-6"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl font-extrabold text-center text-gray-900 sm:text-5xl mb-16">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3 relative">
            {[
              {
                title: "Upload Photo",
                icon: <Upload className="h-8 w-8 text-white" />,
                description: "Securely upload your selfie",
              },
              {
                title: "AI Analysis",
                icon: <Camera className="h-8 w-8 text-white" />,
                description: "Our AI analyzes your skin",
              },
              {
                title: "Get Recommendations",
                icon: <ArrowRight className="h-8 w-8 text-white" />,
                description: "Receive personalized skincare tips",
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="relative bg-white rounded-lg shadow-xl p-8 z-10 transform hover:scale-105 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-200 to-purple-200 rounded-bl-full"></div>
                <div className="relative z-10">
                  <div className="flex justify-center items-center w-16 h-16 mx-auto bg-gradient-to-br from-pink-400 to-purple-400 rounded-full mb-6 text-white">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      </section>

      {/* Image Uploader Modal */}
      {showUploader && <ImageUploader onClose={() => setShowUploader(false)} onSubmit={handleAnalysisComplete} />}
      
    </div>
  )
}

function CustomButton({
  children,
  onClick,
  type = "button",
  className,
  size = "md",
}: {
  children: React.ReactNode
  onClick?: () => void
  type?: "button" | "submit" | "reset"
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-6 text-base",
    lg: "py-4 px-8 text-lg",
  }

  return (
    <button
      onClick={onClick}
      type={type}
      className={`${sizeClasses[size]
        } ${className} text-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 shadow-lg`}
    >
      {children}
    </button>
  )
}

