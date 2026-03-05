'use client'

import { Coffee } from 'lucide-react'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-black/20 backdrop-blur-sm border-b border-white/10 shadow-xl">
      <div className="container mx-auto px-4 py-4 h-full flex items-center">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Coffee className="w-8 h-8 text-amber-200" />
          <h1 className="text-2xl md:text-3xl font-bold font-tajawal text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            إدارة المحامص التجارية
          </h1>
        </div>
        
        <div className="flex items-center space-x-4 ml-auto">
          {/* Clock will be added here */}
          {/* User Profile/Settings will be added here */}
        </div>
      </div>
    </header>
  )
}
