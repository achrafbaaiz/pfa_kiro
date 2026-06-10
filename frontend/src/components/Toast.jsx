import { useState, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ToastContext = createContext()

export function useToast() { return useContext(ToastContext) }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-20 right-6 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-md shadow-lg border ${
                t.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
                t.type === 'error' ? 'bg-red-500/10 border-red-500/20' :
                'bg-primary-500/10 border-primary-500/20'
              }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-primary-500'
              }`} />
              <span className={`text-sm font-medium ${
                t.type === 'success' ? 'text-green-400' : t.type === 'error' ? 'text-red-400' : 'text-primary-400'
              }`}>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
