import { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const FIELDS = [
  { section: "Identification", fields: [
    { name: "Secteur", type: "select", options: ["Industrie","Commerce","Services","BTP","Agriculture","Tech","Transport"] },
    { name: "Taille_Entreprise", type: "select", options: ["TPE","PME","ETI","Grande Entreprise"] },
    { name: "Anciennete_Annees", label: "Anciennete (annees)", type: "number", min: 1, max: 50 },
  ]},
  { section: "Liquidite", fields: [
    { name: "Ratio_Liquidite_Generale", label: "Liquidite Generale", type: "number", step: 0.01, min: 0 },
    { name: "Ratio_Liquidite_Reduite", label: "Liquidite Reduite", type: "number", step: 0.01, min: 0 },
  ]},
  { section: "Endettement", fields: [
    { name: "Ratio_Endettement", label: "Ratio Endettement", type: "number", step: 0.01, min: 0 },
    { name: "Ratio_Capacite_Remboursement", label: "Capacite Remboursement", type: "number", step: 0.1 },
    { name: "Taux_Endettement_Net", label: "Endettement Net", type: "number", step: 0.01, min: 0 },
  ]},
  { section: "Rentabilite", fields: [
    { name: "ROE", type: "number", step: 0.001 },
    { name: "ROA", type: "number", step: 0.001 },
    { name: "Marge_Nette", type: "number", step: 0.001 },
    { name: "Marge_Brute", type: "number", step: 0.001 },
  ]},
  { section: "Structure Financiere", fields: [
    { name: "Chiffre_Affaires_Log", label: "CA (log)", type: "number", step: 0.01 },
    { name: "Croissance_CA", label: "Croissance CA", type: "number", step: 0.001 },
    { name: "Ratio_Fonds_Propres", label: "Fonds Propres", type: "number", step: 0.01, min: 0 },
  ]},
  { section: "Tresorerie & BFR", fields: [
    { name: "Ratio_Tresorerie_Nette", label: "Tresorerie Nette", type: "number", step: 0.01 },
    { name: "Delai_Paiement_Clients_Jours", label: "Delai Clients (j)", type: "number", min: 0 },
    { name: "Delai_Paiement_Fournisseurs_Jours", label: "Delai Fournisseurs (j)", type: "number", min: 0 },
  ]},
  { section: "Solvabilite & Historique", fields: [
    { name: "Ratio_Couverture_Interets", label: "Couverture Interets", type: "number", step: 0.01 },
    { name: "Score_Altman_Z", label: "Score Altman Z", type: "number", step: 0.01 },
    { name: "Nb_Incidents_Paiement_12M", label: "Incidents (12M)", type: "number", min: 0 },
    { name: "Nb_Credits_En_Cours", label: "Credits en cours", type: "number", min: 0 },
  ]},
]

const DEFAULT_VALUES = {
  Secteur: "Industrie", Taille_Entreprise: "PME", Anciennete_Annees: 10,
  Ratio_Liquidite_Generale: 1.5, Ratio_Liquidite_Reduite: 1.0,
  Ratio_Endettement: 0.8, Ratio_Capacite_Remboursement: 5.0, Taux_Endettement_Net: 0.5,
  ROE: 0.1, ROA: 0.05, Marge_Nette: 0.08, Marge_Brute: 0.35,
  Chiffre_Affaires_Log: 15.0, Croissance_CA: 0.1, Ratio_Fonds_Propres: 0.4,
  Ratio_Tresorerie_Nette: 0.2, Delai_Paiement_Clients_Jours: 45, Delai_Paiement_Fournisseurs_Jours: 40,
  Ratio_Couverture_Interets: 5.0, Score_Altman_Z: 2.5, Nb_Incidents_Paiement_12M: 0, Nb_Credits_En_Cours: 2
}

export default function CreditForm({ setResults, setLoading, loading }) {
  const [form, setForm] = useState(DEFAULT_VALUES)
  const [error, setError] = useState(null)

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = { ...form }
      // Convert numeric strings to numbers
      Object.keys(payload).forEach(k => {
        if (k !== 'Secteur' && k !== 'Taille_Entreprise') payload[k] = Number(payload[k])
      })
      const res = await axios.post('/api/predict', payload)
      setResults(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur de connexion au serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-semibold mb-4 text-white">Donnees Financieres</h2>
        
        <div className="space-y-5">
          {FIELDS.map(({ section, fields }) => (
            <div key={section}>
              <h3 className="text-xs font-medium text-primary-500 uppercase tracking-wider mb-2">{section}</h3>
              <div className="grid grid-cols-2 gap-3">
                {fields.map(({ name, label, type, options, ...props }) => (
                  <div key={name} className={type === 'select' ? '' : ''}>
                    <label className="block text-xs text-gray-400 mb-1">{label || name.replace(/_/g, ' ')}</label>
                    {type === 'select' ? (
                      <select value={form[name]} onChange={e => handleChange(name, e.target.value)}
                        className="w-full bg-gray-800/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition">
                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type="number" value={form[name]} onChange={e => handleChange(name, e.target.value)}
                        {...props}
                        className="w-full bg-gray-800/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </motion.div>
        )}

        <motion.button type="submit" disabled={loading}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Analyse en cours...' : 'Analyser le Risque'}
        </motion.button>

        <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={async () => {
            const payload = { ...form }
            Object.keys(payload).forEach(k => { if (k !== 'Secteur' && k !== 'Taille_Entreprise') payload[k] = Number(payload[k]) })
            const res = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = 'rapport_risque_credit.pdf'; a.click()
          }}
          className="mt-3 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/10 transition flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Telecharger Rapport PDF
        </motion.button>
      </div>
    </form>
  )
}
