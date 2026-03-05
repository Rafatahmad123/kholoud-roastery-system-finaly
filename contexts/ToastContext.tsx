'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import Toast, { ToastProps } from '../components/Toast'

interface ToastContextType {
  showToast: (message: string, type?: ToastProps['type'], duration?: number) => void
  showError: (message: string) => void
  showSuccess: (message: string) => void
  showInfo: (message: string) => void
  showWarning: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const showToast = (message: string, type: ToastProps['type'] = 'info', duration?: number) => {
    const id = Date.now().toString()
    const newToast: ToastProps = {
      id,
      message,
      type,
      duration,
      onClose: (id) => setToasts(prev => prev.filter(toast => toast.id !== id))
    }
    setToasts(prev => [...prev, newToast])
  }

  const showError = (message: string) => showToast(message, 'error', 10000)
  const showSuccess = (message: string) => showToast(message, 'success', 3000)
  const showInfo = (message: string) => showToast(message, 'info', 5000)
  const showWarning = (message: string) => showToast(message, 'warning', 7000)

  const value = {
    showToast,
    showError,
    showSuccess,
    showInfo,
    showWarning
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
