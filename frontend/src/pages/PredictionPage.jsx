import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../components/Toast'
import CreditForm from '../components/CreditForm'
import ResultsDashboard from '../components/ResultsDashboard'
import axios from 'axios'

function FeatureImpactGuide() {
  const [data, setData] = useState(null)

  useEffect(() => {
    axios.get('/api/stats').then(res => setData(res.data)).catch(() => {})
  }, [])

  if (!data) return null

  const { feature_importance, top_correlations } = data

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Guide d'Impact des Variables</h3>
          <p className="text-xs text-gray-500">Comment chaque variable influence le risque de défaut</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {feature_importance.map((item, i) => {
          const pct = Math.round(item.importance * 100)
          const corr = top_correlations.find(c => c.variable === item.feature)
          const direction = corr && corr.correlation > 0 ? 'augmente' : 'diminue'
          const dirColor = direction === 'augmente' ? 'text-red-400' : 'text-green-400'
          return (
            <motion.div key={item.feature} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-primary-500/20 p-3 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-600 w-5">#{i + 1}</span>
                  <span className="text-xs font-medium text-gray-200 truncate max-w-[300px]" title={item.feature}>
                    {item.feature}
                  </span>
                </div>
                <span className="text-xs font-bold text-primary-400">{(item.importance * 100).toFixed(1)}%</span>
              </div>
              {/* Importance bar */}
              <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden mb-1.5">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-purple-500"
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }} />
              </div>
              {corr && (
                <p className="text-[10px] text-gray-500">
                  Quand cette valeur augmente, le risque <span className={`font-medium ${dirColor}`}>{direction}</span>
                  {' '}(corrélation: {corr.correlation.toFixed(3)})
                </p>
              )}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default function PredictionPage() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const toast = useToast()

  const handleResults = (data) => {
    setResults(data)
    setHistory(prev => [{ ...data, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, 10))
    toast(
      data.prediction === 1 ? '⚠️ Risque eleve detecte' : '✓ Analyse terminee - Entreprise solvable',
      data.prediction === 1 ? 'error' : 'success'
    )
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

      {/* Feature Impact Guide */}
      <div className="mt-10">
        <FeatureImpactGuide />
      </div>
    </div>
  )
}
