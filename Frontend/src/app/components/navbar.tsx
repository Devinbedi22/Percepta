"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu } from "lucide-react"
import type React from "react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-around gap-60 h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-pink-600 font-sarina">Percepta-Ai</span>
            </Link>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-20">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/about">About</NavLink>
            {/* <NavLink href="/services">Services</NavLink> */}
            <NavLink href="/blog">Blog</NavLink>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <CustomButton>
              <Link href="/login">Login</Link>
            </CustomButton>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <CustomButton variant="ghost" onClick={() => setIsOpen(!isOpen)}>
              <Menu className="h-6 w-6" />
            </CustomButton>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <MobileNavLink href="/">Home</MobileNavLink>
            <MobileNavLink href="/about">About</MobileNavLink>
            {/* <MobileNavLink href="/services">Services</MobileNavLink> */}
            <MobileNavLink href="/blog">Blog</MobileNavLink>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="mt-3 space-y-1">
              <MobileNavLink href="/login">Login</MobileNavLink>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
    >
      {children}
    </Link>
  )
}

function CustomButton({
  children,
  variant = "filled",
  onClick,
}: {
  children: React.ReactNode
  variant?: "filled" | "ghost"
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`${
        variant === "filled"
          ? "bg-pink-600 text-white hover:bg-pink-700"
          : "bg-transparent text-pink-600 hover:bg-gray-100"
      } px-4 py-2 rounded-md text-sm font-medium transition duration-300`}
    >
      {children}
    </button>
  )
}
