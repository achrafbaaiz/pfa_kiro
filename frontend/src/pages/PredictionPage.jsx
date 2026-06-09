import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CreditForm from '../components/CreditForm'
import ResultsDashboard from '../components/ResultsDashboard'

export default function PredictionPage() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  const handleResults = (data) => {
    setResults(data)
    setHistory(prev => [{ ...data, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, 10))
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <CreditForm setResults={handleResults} setLoading={setLoading} loading={loading} />
        </motion.div>

        <div>
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
    </div>
  )
}
