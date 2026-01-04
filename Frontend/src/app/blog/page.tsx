"use client";

import { useState } from "react";
import Link from "next/link";

const blogPosts = [
  {
    id: 1,
    title: "5 Essential Skincare Tips for Radiant Skin",
    excerpt: "Discover the key steps to achieve a glowing complexion...",
    content: [
      "Cleanse your face twice daily to remove dirt and oil.",
      "Exfoliate weekly to remove dead skin cells.",
      "Use a moisturizer that suits your skin type.",
      "Apply sunscreen with SPF 30+ daily.",
      "Stay hydrated and maintain a balanced diet."
    ],
    date: "June 15, 2023",
  },
  {
    id: 2,
    title: "Understanding Different Skin Types",
    excerpt: "Learn how to identify your skin type and choose the right products...",
    content: [
      "Normal skin: Balanced moisture and texture.",
      "Dry skin: Flaky, rough, and prone to irritation.",
      "Oily skin: Shiny appearance with frequent breakouts.",
      "Combination skin: Oily in T-zone, dry elsewhere.",
      "Sensitive skin: Reacts easily to new products."
    ],
    date: "June 22, 2023",
  },
  {
    id: 3,
    title: "The Benefits of Regular Facials",
    excerpt: "Explore how professional facials can transform your skin...",
    content: [
      "Deep cleanses pores and removes blackheads.",
      "Improves blood circulation for a glowing complexion.",
      "Hydrates and nourishes skin for a fresh look.",
      "Reduces stress and relaxes facial muscles.",
      "Prevents premature aging and improves elasticity."
    ],
    date: "June 29, 2023",
  },
  {
    id: 4,
    title: "How to Build a Simple Skincare Routine",
    excerpt: "A step-by-step guide to creating a daily skincare routine...",
    content: [
      "Step 1: Cleanser – Removes dirt and oil.",
      "Step 2: Toner – Balances skin’s pH levels.",
      "Step 3: Serum – Targets specific skin concerns.",
      "Step 4: Moisturizer – Locks in hydration.",
      "Step 5: Sunscreen – Protects against UV damage."
    ],
    date: "July 5, 2023",
  },
  {
    id: 5,
    title: "Common Skincare Mistakes to Avoid",
    excerpt: "Avoid these mistakes to keep your skin healthy and glowing...",
    content: [
      "Using hot water to wash your face (causes dryness).",
      "Skipping sunscreen, even on cloudy days.",
      "Over-exfoliating, leading to skin irritation.",
      "Not removing makeup before bed.",
      "Using too many skincare products at once."
    ],
    date: "July 12, 2023",
  },
  {
    id: 6,
    title: "The Science Behind Anti-Aging Skincare",
    excerpt: "Discover how anti-aging ingredients work to keep skin youthful...",
    content: [
      "Retinol boosts collagen production and reduces wrinkles.",
      "Hyaluronic acid hydrates and plumps the skin.",
      "Vitamin C brightens skin and reduces dark spots.",
      "Peptides improve skin elasticity and firmness.",
      "Antioxidants protect skin from environmental damage."
    ],
    date: "July 19, 2023",
  },
  {
    id: 7,
    title: "DIY Face Masks for Glowing Skin",
    excerpt: "Make natural face masks with ingredients from your kitchen...",
    content: [
      "Honey & Yogurt Mask: Hydrates and soothes dry skin.",
      "Turmeric & Milk Mask: Brightens and reduces acne scars.",
      "Oatmeal & Banana Mask: Exfoliates and nourishes sensitive skin.",
      "Aloe Vera & Lemon Mask: Reduces oiliness and refreshes skin.",
      "Cucumber & Rose Water Mask: Soothes irritation and redness."
    ],
    date: "July 26, 2023",
  },
  {
    id: 8,
    title: "The Connection Between Diet and Skincare",
    excerpt: "How your food choices impact your skin’s health...",
    content: [
      "Drink plenty of water to keep skin hydrated.",
      "Eat foods rich in Omega-3s (salmon, walnuts) for healthy skin.",
      "Include antioxidants (berries, green tea) to fight aging.",
      "Avoid excess sugar and processed foods to prevent breakouts.",
      "Get enough vitamins A, C, and E for a glowing complexion."
    ],
    date: "August 2, 2023",
  },
  {
    id: 9,
    title: "Best Skincare Routine for Acne-Prone Skin",
    excerpt: "Manage acne with these dermatologist-approved steps...",
    content: [
      "Use a gentle foaming cleanser with salicylic acid.",
      "Apply a lightweight, oil-free moisturizer.",
      "Use benzoyl peroxide or tea tree oil for spot treatment.",
      "Exfoliate weekly to prevent clogged pores.",
      "Avoid touching your face to prevent bacteria transfer."
    ],
    date: "August 9, 2023",
  },
  {
    id: 10,
    title: "Night Skincare Routine for Healthy Skin",
    excerpt: "A perfect nighttime routine for skin repair and rejuvenation...",
    content: [
      "Remove makeup with micellar water or cleansing balm.",
      "Wash face with a gentle cleanser.",
      "Apply toner to balance pH levels.",
      "Use a hydrating serum or retinol.",
      "Finish with a night cream or sleeping mask."
    ],
    date: "August 16, 2023",
  }
];

export default function Blog() {
  const [expandedPost, setExpandedPost] = useState<number | null>(null);

  const toggleReadMore = (id: number) => {
    setExpandedPost(expandedPost === id ? null : id);
  };

  return (
    <div className="container mx-auto py-12 px-6">
      <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-12">
        Face Health Blog
      </h1>
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <div
            key={post.id}
            className="relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                {post.title}
              </h2>
              <p className="text-gray-600 mb-4">{post.excerpt}</p>
              {expandedPost === post.id && (
                <ul className="mt-2 list-disc list-inside text-gray-700 space-y-2">
                  {post.content.map((point, index) => (
                    <li key={index} className="leading-relaxed">
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-r from-pink-100 to-white text-gray-800 text-sm font-medium py-3 px-6 flex justify-between items-center">
              <span>{post.date}</span>
              <button
                onClick={() => toggleReadMore(post.id)}
                className="hover:underline focus:outline-none"
              >
                {expandedPost === post.id ? "Show Less" : "Read More"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
    </div>
  );
}