"use client"
import { Map, BarChart, Cpu, Bot, User } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface VerticalNavbarProps {
  onPageChange: (page: string) => void
}

export default function VerticalNavbar({ onPageChange }: VerticalNavbarProps) {
  const router = useRouter()

  // ⭐ MAIN NAV ITEMS
  const navItems = [
    { icon: Map, label: "Map View", onClick: () => onPageChange("map"), page: "map" },
    { icon: BarChart, label: "Analytics", onClick: () => onPageChange("analytics"), page: "analytics" },
    { icon: Cpu, label: "Device", onClick: () => onPageChange("device"), page: "device" },
    { icon: Bot, label: "AI", onClick: () => onPageChange("ai"), page: "ai" },
  ]

  const bottomItems = [
    { icon: User, label: "Profile", onClick: () => onPageChange("profile"), page: "profile" },
  ]

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 h-[95%] w-20 bg-white rounded-full flex flex-col items-center py-6 shadow-2xl shadow-black/10 border border-gray-100 z-100">
      
      {/* Logo */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/")} 
          className="w-16 h-16 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
          aria-label="Home"
        >
          <Image src="/star.svg" alt="Star logo" width={32} height={32} className="object-contain" />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col space-y-6 flex-1">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors duration-200 group cursor-pointer"
            aria-label={item.label}
          >
            <item.icon size={20} className="text-gray-700 group-hover:text-gray-900" />
          </button>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="flex flex-col space-y-4 mt-auto">
        {bottomItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
            aria-label={item.label}
          >
            <item.icon size={20} className="text-gray-700 group-hover:text-gray-900" />
          </button>
        ))}
      </div>

    </div>
  )
}
