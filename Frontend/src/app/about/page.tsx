import Image from "next/image"
import { Navbar } from "../components/navbar"

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-pink-100">
      
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-5xl font-extrabold text-pink-600 mb-12 text-center">About Percepta AI</h1>

        <section className="mb-16 relative">
          <div className="absolute inset-0 bg-pink-50 transform -skew-y-6 z-0"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-pink-900 mb-4">Our Mission</h2>
              <p className="text-lg text-gray-700 mb-4">
                At Percepta AI, we're on a mission to revolutionize skincare through the power of artificial intelligence.
                We believe that everyone deserves to feel confident in their skin, and we're here to make that a
                reality.
              </p>
              <p className="text-lg text-gray-700">
                Our cutting-edge AI technology analyzes your unique skin profile to provide personalized skincare
                recommendations, helping you achieve your best skin ever.
              </p>
            </div>
            <div className="md:w-1/2">
              <div className="relative h-64 w-full md:h-96 rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition duration-300">
                <Image
                  src="/dyku6ejz.png"
                  alt="Percepta AI Team"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-pink-600 mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Innovation",
                description: "We're always pushing the boundaries of what's possible in skincare technology.",
              },
              {
                title: "Personalization",
                description:
                  "We believe that skincare isn't one-size-fits-all. Our solutions are as unique as you are.",
              },
              {
                title: "Transparency",
                description: "We're committed to being open and honest about our products, ingredients, and processes.",
              },
            ].map((value, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
              >
                <h3 className="text-xl font-semibold text-pink-600 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </section>
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <section>
          <h2 className="text-3xl font-bold text-pink-600 mb-8 text-center">Meet Our Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Kaavya Sidher", role: "Frontend Lead", image: "/placeholder.svg?height=300&width=300" },
              { name: "Arman Chaudhary", role: "AI Lead", image: "/placeholder.svg?height=300&width=300" },
              { name: "Abhipsit Bajpai", role: "Frontend Developer", image: "/placeholder.svg?height=300&width=300" },
              { name: "Manraj Singh Cheema", role: "Backend Developer", image: "/placeholder.svg?height=300&width=300" },
            ].map((member, index) => (
              <div
                key={index}
                className="text-center bg-white p-6 rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
              >
                <div className="relative h-48 w-48 mx-auto mb-4 rounded-full overflow-hidden">
                  <Image src={member.image || "/placeholder.svg"} alt={member.name} layout="fill" objectFit="cover" />
                </div>
                <h3 className="text-xl font-semibold text-pink-600">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </section>
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </main>
    </div>
  )
}

