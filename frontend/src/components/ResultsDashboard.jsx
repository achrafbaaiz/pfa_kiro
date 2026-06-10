import { motion } from 'framer-motion'
import CreditCard3D from './CreditCard3D'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, LineChart, Line, CartesianGrid, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'

// --- Animated Risk Gauge ---
function RiskGauge({ probability, niveau, couleur }) {
  const angle = probability * 180
  const radius = 80, strokeWidth = 14
  const polarToCartesian = (cx, cy, r, deg) => {
    const rad = (deg - 180) * Math.PI / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  const describeArc = (cx, cy, r, s, e) => {
    const start = polarToCartesian(cx, cy, r, e), end = polarToCartesian(cx, cy, r, s)
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${e - s > 180 ? 1 : 0} 0 ${end.x} ${end.y}`
  }

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        <path d={describeArc(100, 100, radius, 0, 180)} fill="none" stroke="#1f2937" strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Gradient zones */}
        <path d={describeArc(100, 100, radius, 0, 54)} fill="none" stroke="#2ecc71" strokeWidth={strokeWidth - 6} strokeLinecap="round" opacity="0.15" />
        <path d={describeArc(100, 100, radius, 54, 108)} fill="none" stroke="#f39c12" strokeWidth={strokeWidth - 6} strokeLinecap="round" opacity="0.15" />
        <path d={describeArc(100, 100, radius, 108, 180)} fill="none" stroke="#e74c3c" strokeWidth={strokeWidth - 6} strokeLinecap="round" opacity="0.15" />
        <motion.path d={describeArc(100, 100, radius, 0, angle)} fill="none" stroke={couleur} strokeWidth={strokeWidth} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} />
        <text x="100" y="80" textAnchor="middle" className="fill-white font-bold" fontSize="30">{(probability * 100).toFixed(1)}%</text>
        <text x="100" y="108" textAnchor="middle" className="fill-gray-400" fontSize="11">Probabilite de defaut</text>
      </svg>
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }}
        className="mt-2 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide" style={{ backgroundColor: couleur + '20', color: couleur, border: `1px solid ${couleur}40` }}>
        RISQUE {niveau.toUpperCase()}
      </motion.span>
    </div>
  )
}

// --- SHAP Waterfall Chart ---
function ShapChart({ shap_values }) {
  const sorted = Object.entries(shap_values)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 10)
    .map(([name, value]) => ({ name: name.replace(/_/g, ' ').substring(0, 20), value: +value.toFixed(4) }))
    .reverse()

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 5, right: 20, top: 5, bottom: 5 }}>
        <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: '#d1d5db', fontSize: 10 }} width={120} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} labelStyle={{ color: '#fff' }}
          formatter={(v) => [v.toFixed(4), 'Impact SHAP']} />
        <ReferenceLine x={0} stroke="#4b5563" />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {sorted.map((entry, i) => <Cell key={i} fill={entry.value > 0 ? '#ef4444' : '#10b981'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// --- Risk Breakdown Pie Chart ---
function RiskPieChart({ shap_values }) {
  const positive = Object.entries(shap_values).filter(([, v]) => v > 0)
  const negative = Object.entries(shap_values).filter(([, v]) => v < 0)
  const data = [
    { name: 'Facteurs de risque', value: Math.abs(positive.reduce((s, [, v]) => s + v, 0)), fill: '#ef4444' },
    { name: 'Facteurs protecteurs', value: Math.abs(negative.reduce((s, [, v]) => s + v, 0)), fill: '#10b981' },
  ]
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
          {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// --- Financial Health Radar (5 dimensions) ---
function FinancialHealthRadar({ shap_values, probability }) {
  // Group features into financial dimensions and compute scores
  const dimensions = [
    { name: 'Liquidité', keywords: ['liquid', 'cash', 'current', 'tresorerie'] },
    { name: 'Solvabilité', keywords: ['debt', 'leverage', 'solvab', 'altman', 'equity', 'fonds'] },
    { name: 'Rentabilité', keywords: ['roa', 'roe', 'profit', 'margin', 'marge', 'income', 'net'] },
    { name: 'Activité', keywords: ['turnover', 'revenue', 'sales', 'growth', 'ca', 'rotation'] },
    { name: 'Historique', keywords: ['incident', 'payment', 'delay', 'credit', 'history', 'age'] },
  ]

  const data = dimensions.map(dim => {
    const related = Object.entries(shap_values).filter(([k]) =>
      dim.keywords.some(kw => k.toLowerCase().includes(kw))
    )
    // Score: higher = healthier (inverse of positive SHAP = risk)
    const avgImpact = related.length > 0
      ? related.reduce((sum, [, v]) => sum + v, 0) / related.length
      : 0
    // Convert to 0-100 score: negative SHAP = good = high score
    const score = Math.max(5, Math.min(95, 50 - avgImpact * 200))
    return { dimension: dim.name, score: Math.round(score), fullMark: 100 }
  })

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: '#d1d5db', fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// --- Radar Chart for key ratios ---
function RiskRadar({ results }) {
  const shap = results.shap_values
  const keys = Object.keys(shap).slice(0, 6)
  const data = keys.map(k => ({
    metric: k.replace(/_/g, ' ').substring(0, 12),
    impact: Math.abs(shap[k]) * 100
  }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 9 }} />
        <PolarRadiusAxis tick={false} axisLine={false} />
        <Radar dataKey="impact" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// --- Recommendations Panel ---
function Recommendations({ probability, shap_values }) {
  const top_risk = Object.entries(shap_values)
    .filter(([, v]) => v > 0.05)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const recommendations = top_risk.map(([feature, val]) => {
    const name = feature.replace(/_/g, ' ')
    if (feature.includes('Endettement')) return { text: `Reduire le ratio d'endettement`, detail: `Impact: +${(val*100).toFixed(1)}% sur le risque`, icon: '↓' }
    if (feature.includes('ROA') || feature.includes('ROE')) return { text: `Ameliorer la rentabilite (${name})`, detail: `Impact: +${(val*100).toFixed(1)}% sur le risque`, icon: '↑' }
    if (feature.includes('Liquidite')) return { text: `Renforcer la liquidite`, detail: `Impact: +${(val*100).toFixed(1)}% sur le risque`, icon: '↑' }
    if (feature.includes('Incidents')) return { text: `Reduire les incidents de paiement`, detail: `Impact: +${(val*100).toFixed(1)}% sur le risque`, icon: '↓' }
    if (feature.includes('Altman')) return { text: `Ameliorer le score de solvabilite`, detail: `Impact: +${(val*100).toFixed(1)}% sur le risque`, icon: '↑' }
    return { text: `Optimiser: ${name}`, detail: `Impact: +${(val*100).toFixed(1)}% sur le risque`, icon: '!' }
  })

  if (recommendations.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Recommandations
      </h4>
      {recommendations.map((r, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 + i * 0.2 }}
          className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
          <span className="text-amber-400 font-mono text-sm mt-0.5">{r.icon}</span>
          <div>
            <p className="text-xs text-gray-200 font-medium">{r.text}</p>
            <p className="text-xs text-gray-500">{r.detail}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// --- History Mini Chart ---
function HistoryChart({ history }) {
  if (history.length < 2) return null
  const data = history.slice(0, 8).reverse().map((h, i) => ({
    name: `#${i + 1}`,
    risque: +(h.probabilite_defaut * 100).toFixed(1)
  }))
  return (
    <div>
      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Historique des analyses</h4>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} domain={[0, 100]} />
          <Line type="monotone" dataKey="risque" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '11px' }}
            formatter={(v) => [`${v}%`, 'Risque']} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// --- Main Results Dashboard ---
export default function ResultsDashboard({ results, history = [] }) {
  const { probabilite_defaut, prediction, niveau_risque, couleur_risque, shap_values, base_value, credit_rating } = results

  return (
    <div className="space-y-4">
      {/* Risk Gauge Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm text-center">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Resultat de l'Analyse</h2>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${prediction === 1 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
            <div className={`w-2 h-2 rounded-full ${prediction === 1 ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
            {prediction === 1 ? 'Defaut probable' : 'Entreprise solvable'}
          </div>
        </div>
        <RiskGauge probability={probabilite_defaut} niveau={niveau_risque} couleur={couleur_risque} />
      </motion.div>

      {/* Credit Rating Card */}
      {credit_rating && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Credit Rating (S&P Scale)</p>
              <p className="text-xs text-gray-400">{credit_rating.description}</p>
            </div>
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.5, type: 'spring' }}
              className="flex flex-col items-center">
              <span className="text-4xl font-black tracking-tight" style={{ color: credit_rating.color }}>{credit_rating.rating}</span>
              <div className="flex gap-0.5 mt-1">
                {['AAA','AA','A','BBB','BB','B','CCC','CC','C','D'].map(r => (
                  <div key={r} className={`w-2 h-1 rounded-full ${r === credit_rating.rating ? 'opacity-100' : 'opacity-20'}`}
                    style={{ backgroundColor: r === credit_rating.rating ? credit_rating.color : '#4b5563' }} />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* 3D Credit Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
        className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm flex justify-center">
        <CreditCard3D risk={probabilite_defaut} niveau={niveau_risque} />
      </motion.div>

      {/* Financial Health Radar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Santé Financière</h4>
        <FinancialHealthRadar shap_values={shap_values} probability={probabilite_defaut} />
      </motion.div>

      {/* Pie + Radar side by side */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Balance risque</h4>
          <RiskPieChart shap_values={shap_values} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Profil de risque</h4>
          <RiskRadar results={results} />
        </motion.div>
      </div>

      {/* SHAP Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Explicabilite - Facteurs d'influence (SHAP)</h3>
        <ShapChart shap_values={shap_values} />
        <p className="text-xs text-gray-500 mt-1 text-center">
          <span className="text-red-400">Rouge</span> = augmente le risque | <span className="text-green-400">Vert</span> = diminue le risque
        </p>
      </motion.div>

      {/* Recommendations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
        <Recommendations probability={probabilite_defaut} shap_values={shap_values} />
      </motion.div>

      {/* History */}
      {history.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
          <HistoryChart history={history} />
        </motion.div>
      )}

      {/* Summary Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
        className="grid grid-cols-4 gap-3">
        {[
          { label: "Probabilite", value: `${(probabilite_defaut * 100).toFixed(1)}%`, color: couleur_risque },
          { label: "Base SHAP", value: base_value.toFixed(3), color: "#64748b" },
          { label: "Facteurs risque", value: Object.values(shap_values).filter(v => v > 0.05).length, color: "#ef4444" },
          { label: "Facteurs positifs", value: Object.values(shap_values).filter(v => v < -0.05).length, color: "#10b981" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <p className="text-[10px] text-gray-400">{label}</p>
            <p className="text-lg font-bold mt-0.5" style={{ color }}>{value}</p>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
