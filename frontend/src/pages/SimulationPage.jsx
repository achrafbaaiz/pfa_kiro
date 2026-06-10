import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

export default function SimulationPage() {
  const [features, setFeatures] = useState([])
  const [stats, setStats] = useState({})
  const [sliders, setSliders] = useState({})
  const [baseData, setBaseData] = useState({})
  const [result, setResult] = useState(null)
  const [stressResult, setStressResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stressLoading, setStressLoading] = useState(false)

  useEffect(() => {
    axios.get('/api/features').then(res => {
      const feats = res.data.features.slice(0, 8)
      setFeatures(feats)
      setStats(res.data.stats)
      const base = {}
      const sl = {}
      res.data.features.forEach(f => { base[f] = res.data.stats[f]?.median || 0 })
      feats.forEach(f => { sl[f] = res.data.stats[f]?.median || 0 })
      setBaseData(base)
      setSliders(sl)
    })
  }, [])

  const handleSlider = (name, value) => {
    setSliders(prev => ({ ...prev, [name]: parseFloat(value) }))
  }

  const simulate = async () => {
    setLoading(true)
    try {
      const res = await axios.post('/api/simulate', { base_data: baseData, modifications: sliders })
      setResult(res.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const runStressTest = async () => {
    setStressLoading(true)
    try {
      const res = await axios.post('/api/stress-test', { base_data: { ...baseData, ...sliders } })
      setStressResult(res.data)
    } catch (err) { console.error(err) }
    setStressLoading(false)
  }

  const comparisonData = result ? [
    { name: "Base", value: +(result.base.probabilite_defaut * 100).toFixed(1) },
    { name: "Modifie", value: +(result.modified.probabilite_defaut * 100).toFixed(1) },
  ] : []

  if (features.length === 0) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-white mb-2">Simulation What-If</h2>
        <p className="text-sm text-gray-400 mb-8">Modifiez les parametres financiers et observez l'impact sur le risque de credit</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Parametres de simulation (Top 8 features)</h3>
          <div className="grid md:grid-cols-2 gap-5">
            {features.map(f => {
              const s = stats[f] || { min: 0, max: 1 }
              return (
                <div key={f}>
                  <div className="flex justify-between mb-1">
                    <label className="text-[10px] text-gray-400 truncate max-w-[200px]" title={f}>{f}</label>
                    <span className="text-[10px] font-mono text-primary-400">{sliders[f]?.toFixed(4)}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={(s.max - s.min) / 100}
                    value={sliders[f] ?? s.median} onChange={e => handleSlider(f, e.target.value)}
                    className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-primary-500" />
                  <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
                    <span>{s.min?.toFixed(3)}</span><span>{s.max?.toFixed(3)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <motion.button onClick={simulate} disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-primary-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition disabled:opacity-50">
            {loading ? 'Simulation en cours...' : 'Lancer la Simulation'}
          </motion.button>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
          {result ? (
            <>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm text-center">
                <p className="text-xs text-gray-400 mb-1">Impact de la modification</p>
                <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className={`text-3xl font-bold ${result.delta_pct <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {result.delta_pct > 0 ? '+' : ''}{result.delta_pct}%
                </motion.p>
                <p className={`text-xs mt-1 ${result.delta_pct <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {result.impact === 'positif' ? 'Risque reduit' : result.impact === 'negatif' ? 'Risque augmente' : 'Aucun impact'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                  <p className="text-[10px] text-gray-400">Base</p>
                  <p className="text-xl font-bold" style={{ color: result.base.couleur_risque }}>
                    {(result.base.probabilite_defaut * 100).toFixed(1)}%
                  </p>
                  <p className="text-[10px]" style={{ color: result.base.couleur_risque }}>{result.base.niveau_risque}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                  <p className="text-[10px] text-gray-400">Modifie</p>
                  <p className="text-xl font-bold" style={{ color: result.modified.couleur_risque }}>
                    {(result.modified.probabilite_defaut * 100).toFixed(1)}%
                  </p>
                  <p className="text-[10px]" style={{ color: result.modified.couleur_risque }}>{result.modified.niveau_risque}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      formatter={v => [`${v}%`, 'Risque']} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      <Cell fill={result.base.couleur_risque} />
                      <Cell fill={result.modified.couleur_risque} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-white/5 border border-dashed border-white/10 p-8 backdrop-blur-sm text-center min-h-[300px] flex items-center justify-center">
              <div className="text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <p className="text-sm">Ajustez les sliders et lancez la simulation</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Stress Test Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🔥</span> Stress Test
            </h3>
            <p className="text-xs text-gray-400 mt-1">Testez la resilience de l'entreprise face a des chocs economiques</p>
          </div>
          <motion.button onClick={runStressTest} disabled={stressLoading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-500 text-white font-semibold text-sm shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition disabled:opacity-50">
            {stressLoading ? '⏳ Analyse...' : '⚡ Lancer le Stress Test'}
          </motion.button>
        </div>

        <AnimatePresence>
          {stressResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Resilience Score */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Score Résilience</p>
                  <p className="text-3xl font-black" style={{ color: stressResult.resilience_score > 60 ? '#2ecc71' : stressResult.resilience_score > 35 ? '#f39c12' : '#e74c3c' }}>
                    {stressResult.resilience_score}%
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Risque de Base</p>
                  <p className="text-3xl font-black" style={{ color: stressResult.base.couleur_risque }}>
                    {(stressResult.base.probabilite_defaut * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Pire Scenario</p>
                  <p className="text-sm font-bold text-red-400">{stressResult.worst_case}</p>
                </div>
              </div>

              {/* Scenario cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {stressResult.scenarios.map((s, i) => (
                  <motion.div key={s.scenario} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className={`rounded-2xl border p-5 backdrop-blur-sm ${s.survives ? 'bg-white/5 border-white/10' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-lg font-bold text-white flex items-center gap-2">
                          <span>{s.icon}</span> {s.scenario}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{s.description}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.survives ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {s.survives ? '✓ Survit' : '✗ Défaut'}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-black" style={{ color: s.couleur_risque }}>
                          {(s.probabilite_defaut * 100).toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-gray-500">Risque sous stress</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${s.delta_pct > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {s.delta_pct > 0 ? '+' : ''}{s.delta_pct}%
                        </p>
                        <p className="text-lg font-black" style={{ color: s.credit_rating.color }}>
                          {s.credit_rating.rating}
                        </p>
                      </div>
                    </div>
                    {/* Mini progress bar */}
                    <div className="mt-3 w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                      <motion.div className="h-full rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${s.probabilite_defaut * 100}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                        style={{ backgroundColor: s.couleur_risque }} />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Comparative bar chart */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Comparaison des Scenarios</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={[
                    { name: 'Base', value: +(stressResult.base.probabilite_defaut * 100).toFixed(1) },
                    ...stressResult.scenarios.map(s => ({ name: s.scenario, value: +(s.probabilite_defaut * 100).toFixed(1) }))
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      formatter={v => [`${v}%`, 'Risque']} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      <Cell fill={stressResult.base.couleur_risque} />
                      {stressResult.scenarios.map((s, i) => <Cell key={i} fill={s.couleur_risque} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
