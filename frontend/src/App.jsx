import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CreditForm from './components/CreditForm'
import ResultsDashboard from './components/ResultsDashboard'

// Floating particles background
function FloatingParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(20)].map((_, i) => (
        <motion.div key={i}
          className="absolute rounded-full bg-primary-500/10"
          style={{ width: 4 + Math.random() * 12, height: 4 + Math.random() * 12, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 4 + Math.random() * 6, repeat: Infinity, delay: Math.random() * 3 }}
        />
      ))}
    </div>
  )
}

export default function App() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  const handleResults = (data) => {
    setResults(data)
    setHistory(prev => [{ ...data, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, 10))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-primary-900 relative">
      <FloatingParticles />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ rotate: 10 }} className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </motion.div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">CreditRisk AI</h1>
              <p className="text-xs text-gray-400">Plateforme intelligente d'analyse de risque de credit</p>
            </div>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400">Modele XGBoost actif</span>
          </div>
        </div>
      </header>

      {/* Stats Banner */}
      <div className="relative z-10 border-b border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-center gap-8">
          {[
            { label: "Precision modele", value: "85%", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
            { label: "Analyses effectuees", value: history.length, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            { label: "Variables analysees", value: "22", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" },
            { label: "Algorithme", value: "XGBoost", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex items-center gap-2 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
              </svg>
              <span className="text-sm font-semibold text-white">{value}</span>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <CreditForm setResults={handleResults} setLoading={setLoading} loading={loading} />
          </motion.div>

          {/* Right: Results */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-center min-h-[400px]">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                      <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-purple-500/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    </div>
                    <p className="text-gray-400 text-sm animate-pulse">Analyse par intelligence artificielle...</p>
                  </div>
                </motion.div>
              )}
              {!loading && results && (
                <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                  <ResultsDashboard results={results} history={history} />
                </motion.div>
              )}
              {!loading && !results && (
                <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 min-h-[400px] backdrop-blur-sm">
                  <div className="text-center text-gray-500 p-8">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </motion.div>
                    <p className="text-sm font-medium">En attente de donnees</p>
                    <p className="text-xs mt-1 text-gray-600">Remplissez le formulaire et cliquez sur "Analyser le Risque"</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between text-xs text-gray-600">
          <span>PFA 2025 - Detection de risque de credit bancaire</span>
          <span>XGBoost + SHAP + FastAPI + React</span>
        </div>
      </footer>
    </div>
  )
}
