'use client'

import { motion } from 'framer-motion'

export default function Footer() {
  return (
    <footer 
      className="fixed bottom-0 left-0 right-0 glass border-t border-gold/30 z-40 bg-transparent"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="text-center">
          <p className="text-sm font-tajawal text-white/70">
            بصمة وتطوير المهندس رأفت منصور أحمد © 2026
          </p>
        </div>
      </div>
    </footer>
  )
}
