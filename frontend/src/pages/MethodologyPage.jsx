import { motion } from 'framer-motion'

const fadeIn = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

const PIPELINE_STEPS = [
  { num: "01", title: "Collecte des donnees", desc: "Dataset Taiwan Economic Journal - 6819 entreprises, 95 ratios financiers, variable cible: faillite (binaire)", color: "#3b82f6" },
  { num: "02", title: "Feature Selection", desc: "Selection des 20 variables les plus predictives par importance XGBoost. Reduction de dimensionnalite sans perte de performance", color: "#8b5cf6" },
  { num: "03", title: "Gestion du desequilibre", desc: "Dataset fortement desequilibre (~3% faillites). Utilisation de scale_pos_weight pour penaliser les faux negatifs", color: "#06b6d4" },
  { num: "04", title: "Entrainement XGBoost", desc: "300 arbres, profondeur 5, learning rate 0.05, regularisation L1/L2. Gradient boosting sequentiel avec early stopping", color: "#10b981" },
  { num: "05", title: "Validation croisee", desc: "Stratified 5-Fold CV pour evaluer la generalisation. AUC-ROC comme metrique principale (robuste au desequilibre)", color: "#f59e0b" },
  { num: "06", title: "Explicabilite SHAP", desc: "TreeExplainer pour decomposer chaque prediction en contributions individuelles de chaque feature (theorie des jeux de Shapley)", color: "#ec4899" },
]

const MODELS_INFO = [
  { name: "XGBoost", type: "Ensemble (Boosting)", desc: "Boosting de gradient avec arbres de decision. Construit sequentiellement, chaque arbre corrige les erreurs du precedent. Regularisation L1/L2 integree.", advantage: "Meilleure performance, supporte SHAP exact" },
  { name: "Random Forest", type: "Ensemble (Bagging)", desc: "Foret d'arbres de decision independants entraines sur des sous-echantillons bootstrap. Prediction par vote majoritaire.", advantage: "Robuste au bruit, peu de risque de surapprentissage" },
  { name: "Gradient Boosting", type: "Ensemble (Boosting)", desc: "Predecesseur de XGBoost. Meme principe de boosting sequentiel mais sans les optimisations computationnelles.", advantage: "Bon compromis biais-variance" },
  { name: "Regression Logistique", type: "Modele lineaire", desc: "Modele parametrique modelisant la log-probabilite comme combinaison lineaire des features. Baseline interpretable.", advantage: "Interpretabilite directe via coefficients" },
]

export default function MethodologyPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <motion.div {...fadeIn}>
        <h2 className="text-2xl font-bold text-white mb-2">Methodologie & Science</h2>
        <p className="text-sm text-gray-400 mb-10">Architecture du pipeline de Machine Learning et justification des choix techniques</p>
      </motion.div>

      {/* Pipeline Steps */}
      <div className="mb-16">
        <motion.h3 {...fadeIn} className="text-lg font-semibold text-white mb-6">Pipeline de Traitement</motion.h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PIPELINE_STEPS.map((step, i) => (
            <motion.div key={step.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm relative overflow-hidden group hover:border-white/20 transition">
              <span className="absolute top-3 right-4 text-4xl font-black opacity-5 group-hover:opacity-10 transition" style={{ color: step.color }}>{step.num}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 text-sm font-bold text-white" style={{ backgroundColor: step.color + '20', color: step.color }}>
                {step.num}
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">{step.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* XGBoost Deep Dive */}
      <motion.div {...fadeIn} className="mb-16 rounded-2xl bg-gradient-to-br from-primary-900/20 to-purple-900/20 border border-primary-500/10 p-8 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">XGBoost — Comment ca marche?</h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <p className="text-sm text-gray-300 leading-relaxed">
              XGBoost (eXtreme Gradient Boosting) est un algorithme d'ensemble qui construit des arbres de decision de maniere <span className="text-primary-400 font-medium">sequentielle</span>. Chaque nouvel arbre se concentre sur les erreurs commises par les arbres precedents.
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">
              A chaque iteration, le modele calcule le <span className="text-primary-400 font-medium">gradient de la fonction de perte</span> et ajuste les predictions dans la direction qui minimise l'erreur globale.
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">
              La regularisation (L1 + L2) empeche le surapprentissage en penalisant la complexite des arbres.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs text-gray-400 uppercase tracking-wider">Hyperparametres utilises</h4>
            <div className="space-y-1.5">
              {[
                ['n_estimators', '300', 'Nombre d\'arbres'],
                ['max_depth', '5', 'Profondeur maximale'],
                ['learning_rate', '0.05', 'Taux d\'apprentissage'],
                ['subsample', '0.8', 'Fraction des donnees/arbre'],
                ['colsample_bytree', '0.8', 'Fraction des features/arbre'],
                ['reg_alpha', '1', 'Regularisation L1'],
                ['reg_lambda', '2', 'Regularisation L2'],
              ].map(([param, val, desc]) => (
                <div key={param} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-white/5">
                  <code className="text-xs text-primary-400 font-mono w-32">{param}</code>
                  <span className="text-xs text-white font-bold w-10">{val}</span>
                  <span className="text-xs text-gray-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* SHAP Explanation */}
      <motion.div {...fadeIn} className="mb-16 rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">SHAP — Explicabilite des Decisions</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-purple-400 mb-2">Theorie de Shapley</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Issu de la theorie des jeux cooperatifs, la valeur de Shapley mesure la contribution marginale de chaque joueur (feature) au resultat final (prediction).
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-purple-400 mb-2">TreeExplainer</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Algorithme exact en O(TLD²) pour les modeles a base d'arbres. Calcule les valeurs SHAP sans approximation, contrairement a KernelSHAP.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-purple-400 mb-2">Interpretation</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Valeur SHAP positive = la feature augmente le risque. Negative = la feature protege l'entreprise. La somme des SHAP = prediction - base_value.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Model Comparison Theory */}
      <motion.div {...fadeIn} className="mb-16">
        <h3 className="text-lg font-semibold text-white mb-6">Modeles Compares</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {MODELS_INFO.map((m, i) => (
            <motion.div key={m.name} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">{m.name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{m.type}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">{m.desc}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-green-400">✓</span>
                <span className="text-[10px] text-gray-300">{m.advantage}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Dataset Info */}
      <motion.div {...fadeIn} className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Dataset</h3>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Source', value: 'Taiwan Economic Journal' },
            { label: 'Periode', value: '1999-2009' },
            { label: 'Entreprises', value: '6,819' },
            { label: 'Taux de faillite', value: '~3.2%' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-bold text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Le dataset contient 95 ratios financiers collectes aupres du Taiwan Economic Journal. Les features couvrent la rentabilite (ROA, ROE, marges),
          la liquidite (current ratio, quick ratio), l'endettement (debt ratio, leverage), la croissance et l'efficacite operationnelle.
          La variable cible est binaire : 0 (solvable) ou 1 (faillite). Le fort desequilibre des classes (~97% solvables) necessite
          une strategie adaptee (scale_pos_weight, metriques AUC-ROC au lieu de l'accuracy).
        </p>
      </motion.div>
    </div>
  )
}
