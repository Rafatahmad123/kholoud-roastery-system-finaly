'use client'

import { useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Dashboard from '../components/Dashboard'
import Inventory from '../components/Inventory'
import POS from '../components/POS'
import ExchangeRateControl from '../components/ExchangeRateControl'
import { BarChart3, Package, ShoppingCart, Menu, X, Settings, CreditCard, Receipt } from 'lucide-react'

type TabType = 'dashboard' | 'inventory' | 'pos' | 'audit' | 'debts' | 'expenses' | 'settings'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const tabs = [
    { id: 'dashboard' as TabType, name: 'لوحة التحكم', icon: BarChart3 },
    { id: 'inventory' as TabType, name: 'المخزون', icon: Package },
    { id: 'pos' as TabType, name: 'نقطة البيع', icon: ShoppingCart },
    { id: 'audit' as TabType, name: 'الجرد والتدقيق', icon: CreditCard },
    { id: 'debts' as TabType, name: 'الديون والذمم', icon: CreditCard },
    { id: 'expenses' as TabType, name: 'المصاريف والسحوبات', icon: Receipt },
    { id: 'settings' as TabType, name: 'سعر الصرف', icon: Settings },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />
      case 'inventory': return <Inventory />
      case 'pos': return <POS />
      case 'audit': if (typeof window !== 'undefined') window.location.href = '/audit'; return null
      case 'debts': if (typeof window !== 'undefined') window.location.href = '/debts'; return null
      case 'expenses': if (typeof window !== 'undefined') window.location.href = '/expenses'; return null
      case 'settings': return <ExchangeRateControl />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-transparent relative z-10 overflow-x-hidden">
      <Header />

      {/* زر القائمة في الموبايل */}
      <div className="lg:hidden fixed top-24 right-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-black/20 backdrop-blur-sm border border-white/10 shadow-xl rounded-2xl p-3 text-white hover:bg-emerald-500/20 transition-all duration-300"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* قائمة الموبايل */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden bg-black/20 backdrop-blur-sm border-l border-white/10 shadow-xl rounded-2xl p-4 min-w-[240px] fixed top-32 right-4 z-40"
        >
          <div className="flex flex-col gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-emerald-600/30 text-emerald-300 border-r-4 border-emerald-500'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-emerald-300' : 'text-slate-200'}`} />
                  <span className="font-tajawal font-medium">{tab.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex">

        {/* الشريط الجانبي (ديسكتوب) */}
        <aside className="hidden lg:block fixed top-0 right-0 h-full w-72 bg-black/20 backdrop-blur-sm border-l border-white/10 shadow-xl z-30 pt-24 overflow-y-auto">
          <div className="p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-emerald-600/30 text-emerald-300 border-r-4 border-emerald-500 shadow-lg'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${activeTab === tab.id ? 'text-emerald-300' : 'text-slate-200'}`} />
                  <span className="font-tajawal font-medium">{tab.name}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* منطقة المحتوى */}
        <main className="flex-1 lg:mr-72 min-h-screen relative z-10 px-4 md:px-8 py-6 pt-24">
          <div className="container mx-auto bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg p-4">
            {renderContent()}
          </div>

          <Footer />
        </main>
      </div>
    </div>
  )
}
