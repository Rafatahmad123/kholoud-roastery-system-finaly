'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { TrendingUp, Package, DollarSign, Coffee } from 'lucide-react'

interface DashboardCardProps {
  title: string
  value: string
  icon: ReactNode
  trend?: string
  color?: string
}

export default function DashboardCard({ title, value, icon, trend, color = 'text-amber-200' }: DashboardCardProps) {
  return (
    <div
      className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg p-4 hover:-translate-y-1 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${color}`}>
          {icon}
        </div>
        {trend && (
          <span className="text-sm font-tajawal text-slate-100 bg-emerald-500/20 px-2 py-1 rounded-full border border-emerald-500/30">
            {trend}
          </span>
        )}
      </div>
      
      <h3 className="text-lg font-tajawal text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mb-2">
        {title}
      </h3>
      
      <p className="text-2xl md:text-3xl font-bold font-tajawal text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {(value as any)?.toLocaleString?.('ar-SA') || String(value)}
      </p>
    </div>
  )
}
