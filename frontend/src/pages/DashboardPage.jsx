import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, CartesianGrid,
  AreaChart, Area
} from 'recharts'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444']

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/stats').then(res => { setStats(res.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )

  if (!stats) return <div className="text-center text-gray-400 py-20">Erreur de chargement des statistiques</div>

  const pieData = [
    { name: 'Solvables', value: stats.total_entreprises - stats.total_defauts, fill: '#10b981' },
    { name: 'En defaut', value: stats.total_defauts, fill: '#ef4444' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-white mb-2">Dashboard Analytique</h2>
        <p className="text-sm text-gray-400 mb-8">Vue d'ensemble du portefeuille de {stats.total_entreprises} entreprises</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Entreprises", value: stats.total_entreprises, color: "#3b82f6", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
          { label: "En Defaut", value: stats.total_defauts, color: "#ef4444", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
          { label: "Taux de Defaut", value: `${stats.taux_defaut_global}%`, color: "#f59e0b", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
          { label: "Secteurs", value: stats.par_secteur.length, color: "#8b5cf6", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" },
        ].map(({ label, value, color, icon }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
              </svg>
              <span className="text-xs text-gray-400">{label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie Chart - Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Distribution Solvables vs Defaut</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" stroke="none">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bar Chart - Taux par secteur */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Taux de Defaut par Secteur</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.par_secteur}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="secteur" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                formatter={v => [`${v}%`, 'Taux defaut']} />
              <Bar dataKey="taux" radius={[4, 4, 0, 0]}>
                {stats.par_secteur.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bar Chart - Par taille */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Taux de Defaut par Taille d'Entreprise</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.par_taille} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} unit="%" />
              <YAxis type="category" dataKey="taille" tick={{ fill: '#9ca3af', fontSize: 11 }} width={120} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                formatter={v => [`${v}%`, 'Taux defaut']} />
              <Bar dataKey="taux" radius={[0, 4, 4, 0]} fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Correlations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Top Correlations avec le Defaut</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.top_correlations} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} domain={[-0.5, 0.5]} />
              <YAxis type="category" dataKey="variable" tick={{ fill: '#d1d5db', fontSize: 9 }} width={140} axisLine={false}
                tickFormatter={v => v.replace(/_/g, ' ').substring(0, 18)} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Bar dataKey="correlation" radius={[0, 4, 4, 0]}>
                {stats.top_correlations.map((entry, i) => (
                  <Cell key={i} fill={entry.correlation > 0 ? '#ef4444' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2 text-center">
            <span className="text-red-400">Rouge</span> = correle au defaut | <span className="text-green-400">Vert</span> = correle a la solvabilite
          </p>
        </motion.div>
      </div>

      {/* Volume par secteur table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Detail par Secteur</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-white/10">
                <th className="text-left py-2 px-3">Secteur</th>
                <th className="text-right py-2 px-3">Total</th>
                <th className="text-right py-2 px-3">Defauts</th>
                <th className="text-right py-2 px-3">Taux</th>
                <th className="text-left py-2 px-3 w-40">Risque</th>
              </tr>
            </thead>
            <tbody>
              {stats.par_secteur.map((s, i) => (
                <tr key={s.secteur} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="py-2.5 px-3 font-medium text-white">{s.secteur}</td>
                  <td className="py-2.5 px-3 text-right text-gray-300">{s.total}</td>
                  <td className="py-2.5 px-3 text-right text-red-400">{s.defauts}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-200">{s.taux}%</td>
                  <td className="py-2.5 px-3">
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${s.taux * 2}%`,
                        backgroundColor: s.taux > 50 ? '#ef4444' : s.taux > 35 ? '#f59e0b' : '#10b981'
                      }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
