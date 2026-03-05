'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface NeumorphicCardProps {
  children: ReactNode
  className?: string
  inset?: boolean
  hover?: boolean
}

export default function NeumorphicCard({ children, className = '', inset = false, hover = true }: NeumorphicCardProps) {
  return (
    <motion.div
      className={`${inset ? 'neumorphic-inset' : 'neumorphic'} rounded-3xl p-6 ${hover ? 'hover:shadow-gold-glow' : ''} smooth-transition ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { scale: 1.02 } : {}}
    >
      {children}
    </motion.div>
  )
}
