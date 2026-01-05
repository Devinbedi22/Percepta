"use client"

import type React from "react"
import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Upload, Camera, X, Sun } from "lucide-react"
import AnalysisResult from "./AnalysisResult"

interface ImageUploaderProps {
  onClose: () => void
  onSubmit: (data: {
    image: string | null
    age: string
    gender: string
    imageUrl: string | null
  }) => void
}

export function ImageUploader({ onClose, onSubmit }: ImageUploaderProps) {
  const [image, setImage] = useState<string | null>(null)
  const [isCaptureMode, setIsCaptureMode] = useState(false)
  const [age, setAge] = useState<string>("")
  const [gender, setGender] = useState<string>("")
  const [showAgeGender, setShowAgeGender] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  /** ✅ BACKEND URL (Render) */
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  if (!API_URL) {
    console.error("NEXT_PUBLIC_API_URL is not defined")
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
        setIsCaptureMode(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCapture = async () => {
    if (isCaptureMode && videoRef.current) {
      const canvas = document.createElement("canvas")
      const video = videoRef.current

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext("2d")?.drawImage(video, 0, 0)

      const imageDataUrl = canvas.toDataURL("image/jpeg")
      setImage(imageDataUrl)

      stopCamera()
      setIsCaptureMode(false)
    } else {
      setIsCaptureMode(true)
      setImage(null)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error("Error accessing camera:", err)
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
    }
  }

  const handleContinue = () => {
    if (image) {
      setShowAgeGender(true)
    }
  }

   const handleSubmit = async () => {
  if (!image || !age || !gender || !API_URL) {
    alert("Missing required data")
    return
  }

  setIsLoading(true)
  const formData = new FormData()

  try {
    // ✅ Convert base64 → Blob
    const byteCharacters = atob(image.split(",")[1])
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: "image/jpeg" })

    // ✅ MUST MATCH Flask: request.files["file"]
    formData.append("file", blob, "image.jpg")
    formData.append("age", age)
    formData.append("gender", gender)

    const response = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`)
    }

    const result = await response.json()

    const analysisResults = {
      ...result,
      imageUrl: image,
    }

    setAnalysisResult(analysisResults)
    onSubmit(analysisResults)
  } catch (error) {
    console.error("Error uploading data:", error)
    alert("AI server error. Please try again.")
  } finally {
    setIsLoading(false)
  }
}


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-pink-700">Upload Your Photo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {!showAgeGender ? (
          <>
            {image ? (
              <div className="mb-6">
                <div className="w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-pink-200 shadow-lg">
                  <img
                    src={image || "/placeholder.svg"}
                    alt="Uploaded"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : isCaptureMode ? (
              <div className="mb-6">
                <video
                  ref={videoRef}
                  autoPlay
                  className="w-full rounded-lg border-4 border-pink-200 shadow-lg"
                />
              </div>
            ) : (
              <div className="mb-6 border-2 border-dashed border-pink-300 rounded-lg p-8 text-center bg-pink-50">
                <Sun className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                <p className="text-pink-600 font-medium">
                  Upload or capture your photo in a well-lit area for more accurate results
                </p>
              </div>
            )}

            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isCaptureMode}
                className={`flex items-center px-6 py-3 rounded-full text-white font-medium transition-all ${
                  isCaptureMode
                    ? "bg-pink-300 cursor-not-allowed"
                    : "bg-pink-500 hover:bg-pink-600 shadow-md hover:shadow-lg"
                }`}
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={handleCapture}
                disabled={!!image && !isCaptureMode}
                className={`flex items-center px-6 py-3 rounded-full text-white font-medium transition-all ${
                  !!image && !isCaptureMode
                    ? "bg-pink-300 cursor-not-allowed"
                    : "bg-pink-500 hover:bg-pink-600 shadow-md hover:shadow-lg"
                }`}
              >
                <Camera className="h-5 w-5 mr-2" />
                {isCaptureMode ? "Capture" : "Camera"}
              </button>
            </div>

            {image && (
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setImage(null)}
                  className="px-6 py-3 border-2 border-pink-500 text-pink-500 rounded-full font-medium hover:bg-pink-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleContinue}
                  className="px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors shadow-md hover:shadow-lg"
                >
                  Continue
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-pink-700 mb-2">
                Age
              </label>
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age"
                className="w-full px-4 py-3 bg-pink-50 border border-pink-300 rounded-lg text-pink-700 placeholder-pink-400
                          focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-pink-700 mb-2">Gender</span>
              <div className="grid grid-cols-3 gap-4">
                {["Male", "Female", "Other"].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center justify-center p-3 bg-pink-50 border border-pink-300 rounded-lg cursor-pointer transition-all hover:bg-pink-900 hover:text-white ${
                      gender === option.toLowerCase()
                        ? "text-white bg-pink-900 hover:text-white"
                        : "text-pink-500 hover:text-white"
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name="gender"
                      value={option.toLowerCase()}
                      checked={gender === option.toLowerCase()}
                      onChange={(e) => setGender(e.target.value)}
                    />
                    <span className="text-sm font-medium">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowAgeGender(false)}
                className="px-6 py-3 border-2 border-pink-500 text-pink-500 rounded-full font-medium hover:bg-pink-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!age || !gender}
                className={`px-6 py-3 rounded-full text-white font-medium transition-all ${
                  !age || !gender
                    ? "bg-pink-300 cursor-not-allowed"
                    : "bg-pink-500 hover:bg-pink-600 shadow-md hover:shadow-lg"
                }`}
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {(isLoading || analysisResult) && (
          <AnalysisResult
            isLoading={isLoading}
            result={analysisResult}
            onClose={() => {
              setAnalysisResult(null)
              onClose()
            }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}
