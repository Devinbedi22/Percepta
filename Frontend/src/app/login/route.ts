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

    // Call Flask backend - using NEXT_PUBLIC_API_URL from your .env
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000"
    
    console.log(`Calling backend login at: ${backendUrl}/api/login`)
    
    const backendResponse = await fetch(`${backendUrl}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      console.error("Backend login failed:", data)
      return NextResponse.json(
        { message: data.message || "Login failed" },
        { status: backendResponse.status }
      )
    }

    console.log("Login successful for:", email)

    // Return success response with token
    return NextResponse.json(
      {
        message: data.message,
        token: data.token,
        user: data.user
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error("Login API error:", error)
    return NextResponse.json(
      { message: "Unable to connect to server. Please ensure backend is running." },
      { status: 500 }
    )
  }
}