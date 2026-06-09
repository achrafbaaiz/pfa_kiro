import { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

const SLIDERS = [
  { name: "Ratio_Endettement", label: "Ratio d'Endettement", min: 0.1, max: 2.0, step: 0.05, default: 0.8 },
  { name: "Ratio_Liquidite_Generale", label: "Liquidite Generale", min: 0.3, max: 3.5, step: 0.05, default: 1.5 },
  { name: "ROA", label: "ROA (Rentabilite des Actifs)", min: -0.15, max: 0.3, step: 0.01, default: 0.05 },
  { name: "Marge_Nette", label: "Marge Nette", min: -0.2, max: 0.4, step: 0.01, default: 0.08 },
  { name: "Score_Altman_Z", label: "Score Altman Z", min: 0.5, max: 5.0, step: 0.1, default: 2.5 },
  { name: "Ratio_Couverture_Interets", label: "Couverture Interets", min: 0.5, max: 20, step: 0.5, default: 5.0 },
  { name: "Nb_Incidents_Paiement_12M", label: "Incidents Paiement (12M)", min: 0, max: 5, step: 1, default: 0 },
  { name: "Ratio_Fonds_Propres", label: "Fonds Propres", min: 0.05, max: 0.8, step: 0.05, default: 0.4 },
]

const BASE_ENTERPRISE = {
  Secteur: "Industrie", Taille_Entreprise: "PME", Anciennete_Annees: 10,
  Ratio_Liquidite_Generale: 1.5, Ratio_Liquidite_Reduite: 1.0,
  Ratio_Endettement: 0.8, Ratio_Capacite_Remboursement: 5.0, Taux_Endettement_Net: 0.5,
  ROE: 0.1, ROA: 0.05, Marge_Nette: 0.08, Marge_Brute: 0.35,
  Chiffre_Affaires_Log: 15.0, Croissance_CA: 0.1, Ratio_Fonds_Propres: 0.4,
  Ratio_Tresorerie_Nette: 0.2, Delai_Paiement_Clients_Jours: 45, Delai_Paiement_Fournisseurs_Jours: 40,
  Ratio_Couverture_Interets: 5.0, Score_Altman_Z: 2.5, Nb_Incidents_Paiement_12M: 0, Nb_Credits_En_Cours: 2
}

export default function SimulationPage() {
  const [sliders, setSliders] = useState(Object.fromEntries(SLIDERS.map(s => [s.name, s.default])))
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSlider = (name, value) => {
    setSliders(prev => ({ ...prev, [name]: parseFloat(value) }))
  }

  const simulate = async () => {
    setLoading(true)
    try {
      const res = await axios.post('/api/simulate', {
        base_data: BASE_ENTERPRISE,
        modifications: sliders
      })
      setResult(res.data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const comparisonData = result ? [
    { name: "Scenario Base", value: +(result.base.probabilite_defaut * 100).toFixed(1) },
    { name: "Scenario Modifie", value: +(result.modified.probabilite_defaut * 100).toFixed(1) },
  ] : []

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-white mb-2">Simulation What-If</h2>
        <p className="text-sm text-gray-400 mb-8">Modifiez les parametres financiers et observez l'impact sur le risque de credit en temps reel</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sliders Panel */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Parametres de simulation</h3>
          <div className="grid md:grid-cols-2 gap-5">
            {SLIDERS.map(({ name, label, min, max, step }) => (
              <div key={name}>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-gray-400">{label}</label>
                  <span className="text-xs font-mono text-primary-400">{sliders[name]}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={sliders[name]}
                  onChange={e => handleSlider(name, e.target.value)}
                  className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-primary-500" />
                <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                  <span>{min}</span><span>{max}</span>
                </div>
              </div>
            ))}
          </div>

          <motion.button onClick={simulate} disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-primary-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition disabled:opacity-50">
            {loading ? 'Simulation en cours...' : 'Lancer la Simulation'}
          </motion.button>
        </motion.div>

        {/* Results Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="space-y-4">
          {result ? (
            <>
              {/* Delta Card */}
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

              {/* Comparison Cards */}
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

              {/* Bar Chart Comparison */}
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
    </div>
  )
}
