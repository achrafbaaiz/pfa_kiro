import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

function MiniRiskMeter({ risk }) {
  if (risk === null) return null
  const pct = Math.round(risk * 100)
  const color = pct < 30 ? '#2ecc71' : pct < 60 ? '#f39c12' : '#e74c3c'
  const label = pct < 30 ? 'Faible' : pct < 60 ? 'Moyen' : 'Élevé'
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-white/10 p-4 mb-5 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
          <span className="text-xs text-gray-300 font-medium tracking-wide">Risque en temps réel</span>
        </div>
        <motion.div key={pct} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex items-baseline gap-1">
          <span className="text-xl font-bold" style={{ color }}>{pct}</span>
          <span className="text-xs text-gray-500">%</span>
        </motion.div>
      </div>
      <div className="w-full h-3 rounded-full bg-gray-800/80 overflow-hidden border border-white/5">
        <motion.div className="h-full rounded-full shadow-lg" 
          animate={{ width: `${pct}%`, backgroundColor: color }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          style={{ boxShadow: `0 0 12px ${color}40` }} />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-gray-600">0%</span>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" 
          style={{ color, backgroundColor: `${color}15` }}>{label}</span>
        <span className="text-[10px] text-gray-600">100%</span>
      </div>
    </motion.div>
  )
}

export default function CreditForm({ setResults, setLoading, loading }) {
  const [features, setFeatures] = useState([])
  const [stats, setStats] = useState({})
  const [form, setForm] = useState({})
  const [bankruptExample, setBankruptExample] = useState({})
  const [error, setError] = useState(null)
  const [liveRisk, setLiveRisk] = useState(null)

  useEffect(() => {
    axios.get('/api/features').then(res => {
      setFeatures(res.data.features)
      setStats(res.data.stats)
      setBankruptExample(res.data.bankrupt_example || {})
      const init = {}
      res.data.features.forEach(f => { init[f] = res.data.stats[f]?.median || 0 })
      setForm(init)
    })
  }, [])

  useEffect(() => {
    if (features.length === 0) return
    const timer = setTimeout(() => {
      axios.post('/api/predict', { features: form }).then(res => {
        setLiveRisk(res.data.probabilite_defaut)
      }).catch(() => {})
    }, 400)
    return () => clearTimeout(timer)
  }, [form, features])

  const handleChange = (name, value) => {
    let v = parseFloat(value)
    if (isNaN(v)) v = 0
    // Prevent negative values for features that can't be negative
    if (stats[name]?.non_negative && v < 0) v = 0
    setForm(prev => ({ ...prev, [name]: v }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post('/api/predict', { features: form })
      setResults(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur de connexion au serveur")
    } finally {
      setLoading(false)
    }
  }

  if (features.length === 0) return (
    <div className="rounded-3xl bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-white/10 p-8 backdrop-blur-xl flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
        <span className="text-xs text-gray-500">Chargement des variables...</span>
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-3xl bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Données Financières</h2>
              <p className="text-xs text-gray-500">{features.length} indicateurs · Valeurs médianes pré-remplies</p>
            </div>
          </div>

          {/* Preset buttons */}
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => {
              const init = {}; features.forEach(f => { init[f] = stats[f]?.median || 0 }); setForm(init)
            }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Entreprise saine
            </button>
            <button type="button" onClick={() => setForm(bankruptExample)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Entreprise en faillite
            </button>
          </div>
        </div>

        {/* Risk meter */}
        <div className="px-6 pt-4">
          <MiniRiskMeter risk={liveRisk} />
        </div>

        {/* Form fields */}
        <div className="px-6 pb-2">
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-2" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(99,102,241,0.3) transparent'
          }}>
            {features.map((f, idx) => (
              <motion.div key={f} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="group relative rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-primary-500/30 hover:bg-white/[0.05] p-3 transition-all duration-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-gray-300 truncate max-w-[70%] group-hover:text-primary-300 transition-colors" title={f}>
                    {f}
                  </label>
                  <span className="text-[9px] text-gray-600 font-mono bg-gray-800/50 px-1.5 py-0.5 rounded">
                    {stats[f]?.min?.toFixed(2)} — {stats[f]?.max?.toFixed(2)}
                  </span>
                </div>
                <input type="number" step="any" value={form[f] ?? ''} onChange={e => handleChange(f, e.target.value)}
                  min={stats[f]?.non_negative ? 0 : undefined}
                  className="w-full bg-gray-900/60 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-gray-900/80 outline-none transition-all duration-200 font-mono" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mx-6 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="px-6 pb-6 pt-3 space-y-3">
          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-sm shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Analyser le Risque
              </>
            )}
          </motion.button>

          <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={async () => {
              const res = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ features: form }) })
              const blob = await res.blob()
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = 'rapport_risque_credit.pdf'; a.click()
            }}
            className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Télécharger Rapport PDF
          </motion.button>
        </div>
      </div>
    </form>
  )
}
