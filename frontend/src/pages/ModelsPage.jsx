import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts'

const MODEL_COLORS = { 'XGBoost': '#3b82f6', 'Random Forest': '#10b981', 'Logistic Regression': '#f59e0b', 'Gradient Boosting': '#8b5cf6' }

export default function ModelsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    axios.get('/api/compare-models').then(res => { setData(res.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-purple-500/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <p className="text-gray-400 text-sm animate-pulse">Entrainement et comparaison des modeles...</p>
      </div>
    </div>
  )

  if (!data) return <div className="text-center text-gray-400 py-20">Erreur de chargement</div>

  const radarData = ['accuracy', 'precision', 'recall', 'f1_score', 'auc_roc'].map(metric => {
    const entry = { metric: metric.replace('_', ' ').toUpperCase() }
    data.models.forEach(m => { entry[m.model] = m[metric] })
    return entry
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Comparaison des Modeles</h2>
            <p className="text-sm text-gray-400 mt-1">{data.dataset_size} entreprises analysees · Taux de defaut: {data.positive_rate}%</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            </svg>
            <span className="text-sm text-green-400 font-medium">Meilleur: {data.best_model}</span>
          </div>
        </div>
      </motion.div>

      {/* Model Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {data.models.map((m, i) => (
          <motion.div key={m.model} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            onClick={() => setSelected(selected === m.model ? null : m.model)}
            className={`rounded-2xl p-5 backdrop-blur-sm cursor-pointer transition-all border ${
              selected === m.model ? 'bg-white/10 border-primary-500/40 shadow-lg shadow-primary-500/10' :
              m.model === data.best_model ? 'bg-white/5 border-green-500/20' : 'bg-white/5 border-white/10'
            } hover:bg-white/10`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MODEL_COLORS[m.model] }} />
              <h3 className="text-sm font-semibold text-white">{m.model}</h3>
              {m.model === data.best_model && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">BEST</span>}
            </div>
            <p className="text-3xl font-black" style={{ color: MODEL_COLORS[m.model] }}>{m.auc_roc}%</p>
            <p className="text-[10px] text-gray-500 mt-0.5">AUC-ROC</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div><p className="text-[10px] text-gray-500">Precision</p><p className="text-xs font-bold text-gray-300">{m.precision}%</p></div>
              <div><p className="text-[10px] text-gray-500">Recall</p><p className="text-xs font-bold text-gray-300">{m.recall}%</p></div>
              <div><p className="text-[10px] text-gray-500">F1</p><p className="text-xs font-bold text-gray-300">{m.f1_score}%</p></div>
              <div><p className="text-[10px] text-gray-500">CV ±</p><p className="text-xs font-bold text-gray-300">{m.cv_auc_std}%</p></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Performance Multi-Criteres</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fill: '#6b7280', fontSize: 9 }} domain={[0, 100]} />
              {data.models.map(m => (
                <Radar key={m.model} name={m.model} dataKey={m.model}
                  stroke={MODEL_COLORS[m.model]} fill={MODEL_COLORS[m.model]} fillOpacity={0.1} strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* AUC-ROC Comparison Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-300 mb-4">AUC-ROC (Cross-Validation 5-Fold)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.models.map(m => ({ name: m.model, auc: m.cv_auc_mean, std: m.cv_auc_std }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} domain={[80, 100]} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#d1d5db', fontSize: 11 }} width={130} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                formatter={(v, name) => [`${v}%`, name === 'auc' ? 'AUC moyen' : 'Ecart-type']} />
              <Bar dataKey="auc" radius={[0, 6, 6, 0]}>
                {data.models.map((m, i) => <Cell key={i} fill={MODEL_COLORS[m.model]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Feature Importance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Importance des Features (XGBoost)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.feature_importance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} />
              <YAxis type="category" dataKey="feature" tick={{ fill: '#d1d5db', fontSize: 9 }} width={140} axisLine={false}
                tickFormatter={v => v.replace(/_/g, ' ').substring(0, 22)} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                formatter={v => [v.toFixed(4), 'Importance']} />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                {data.feature_importance.map((_, i) => <Cell key={i} fill={`hsl(${210 + i * 12}, 70%, ${55 - i * 3}%)`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Confusion Matrix - Selected or Best */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Matrice de Confusion — {selected || data.best_model}</h3>
          {(() => {
            const m = data.models.find(x => x.model === (selected || data.best_model))
            const cm = m.confusion_matrix
            const total = cm.TP + cm.TN + cm.FP + cm.FN
            return (
              <div className="flex flex-col items-center justify-center h-[260px]">
                <div className="grid grid-cols-2 gap-3 w-64">
                  <motion.div whileHover={{ scale: 1.05 }} className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
                    <p className="text-[10px] text-gray-400">Vrai Negatif (TN)</p>
                    <p className="text-2xl font-bold text-green-400">{cm.TN}</p>
                    <p className="text-[9px] text-gray-500">{(cm.TN/total*100).toFixed(1)}%</p>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
                    <p className="text-[10px] text-gray-400">Faux Positif (FP)</p>
                    <p className="text-2xl font-bold text-red-400">{cm.FP}</p>
                    <p className="text-[9px] text-gray-500">{(cm.FP/total*100).toFixed(1)}%</p>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 text-center">
                    <p className="text-[10px] text-gray-400">Faux Negatif (FN)</p>
                    <p className="text-2xl font-bold text-orange-400">{cm.FN}</p>
                    <p className="text-[9px] text-gray-500">{(cm.FN/total*100).toFixed(1)}%</p>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-center">
                    <p className="text-[10px] text-gray-400">Vrai Positif (TP)</p>
                    <p className="text-2xl font-bold text-blue-400">{cm.TP}</p>
                    <p className="text-[9px] text-gray-500">{(cm.TP/total*100).toFixed(1)}%</p>
                  </motion.div>
                </div>
                <p className="text-xs text-gray-500 mt-4">Cliquez sur un modele pour voir sa matrice</p>
              </div>
            )
          })()}
        </motion.div>
      </div>

      {/* Detailed Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Tableau Comparatif Detaille</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-white/10">
                <th className="text-left py-2 px-3">Modele</th>
                <th className="text-right py-2 px-3">Accuracy</th>
                <th className="text-right py-2 px-3">Precision</th>
                <th className="text-right py-2 px-3">Recall</th>
                <th className="text-right py-2 px-3">F1-Score</th>
                <th className="text-right py-2 px-3">AUC-ROC</th>
                <th className="text-right py-2 px-3">CV Mean</th>
                <th className="text-right py-2 px-3">CV Std</th>
              </tr>
            </thead>
            <tbody>
              {data.models.map(m => (
                <tr key={m.model} className={`border-b border-white/5 hover:bg-white/5 transition ${m.model === data.best_model ? 'bg-green-500/5' : ''}`}>
                  <td className="py-2.5 px-3 font-medium text-white flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MODEL_COLORS[m.model] }} />
                    {m.model}
                    {m.model === data.best_model && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">★</span>}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-300">{m.accuracy}%</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-300">{m.precision}%</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-300">{m.recall}%</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-300">{m.f1_score}%</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold" style={{ color: MODEL_COLORS[m.model] }}>{m.auc_roc}%</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-300">{m.cv_auc_mean}%</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-500">±{m.cv_auc_std}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
