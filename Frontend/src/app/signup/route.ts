import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      )
    }

    // Call Flask backend - using NEXT_PUBLIC_API_URL from your .env
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000"
    
    console.log(`Calling backend signup at: ${backendUrl}/api/signup`)
    
    const backendResponse = await fetch(`${backendUrl}/api/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      console.error("Backend signup failed:", data)
      return NextResponse.json(
        { message: data.message || "Signup failed" },
        { status: backendResponse.status }
      )
    }

    console.log("Signup successful for:", email)

    // Return success response with token
    return NextResponse.json(
      {
        message: data.message,
        token: data.token,
        user: data.user
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error("Signup API error:", error)
    return NextResponse.json(
      { message: "Unable to connect to server. Please ensure backend is running." },
      { status: 500 }
    )
  }
}