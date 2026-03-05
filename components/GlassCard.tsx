'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  tilt?: boolean
}

export default function GlassCard({ children, className = '', hover = true, tilt = false }: GlassCardProps) {
  return (
    <motion.div
      className={`glass rounded-3xl p-6 ${hover ? 'hover:shadow-gold-glow' : ''} ${tilt ? 'tilt-card' : ''} smooth-transition ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { scale: 1.02 } : {}}
      style={{
        transformStyle: tilt ? 'preserve-3d' : 'flat',
      }}
    >
      {children}
    </motion.div>
  )
}
