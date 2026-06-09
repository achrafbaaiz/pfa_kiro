import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

// Animated counter
function AnimatedNumber({ value, suffix = '', duration = 2 }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {value}{suffix}
      </motion.span>
    </motion.span>
  )
}

// Animated network/graph SVG
function NetworkAnimation() {
  const nodes = [
    { x: 50, y: 30 }, { x: 150, y: 60 }, { x: 250, y: 25 }, { x: 350, y: 70 },
    { x: 100, y: 120 }, { x: 200, y: 100 }, { x: 300, y: 130 }, { x: 400, y: 40 },
    { x: 80, y: 180 }, { x: 180, y: 170 }, { x: 280, y: 190 }, { x: 380, y: 160 },
  ]
  const edges = [
    [0,1],[1,2],[2,3],[0,4],[1,5],[2,6],[3,7],[4,5],[5,6],[6,7],[4,8],[5,9],[6,10],[7,11],[8,9],[9,10],[10,11]
  ]
  return (
    <svg viewBox="0 0 450 220" className="w-full h-full opacity-20">
      {edges.map(([a, b], i) => (
        <motion.line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
          stroke="url(#lineGrad)" strokeWidth="0.8"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.6, 0.3] }}
          transition={{ duration: 2 + Math.random() * 2, delay: i * 0.15, repeat: Infinity, repeatType: 'reverse' }}
        />
      ))}
      {nodes.map((n, i) => (
        <motion.circle key={i} cx={n.x} cy={n.y} r="3" fill="#3b82f6"
          animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
          transition={{ duration: 3, delay: i * 0.2, repeat: Infinity }}
        />
      ))}
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Floating credit score card
function FloatingCard() {
  return (
    <motion.div
      animate={{ y: [0, -10, 0], rotateY: [0, 5, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className="relative w-72 h-44 rounded-2xl overflow-hidden shadow-2xl shadow-primary-500/20"
      style={{ perspective: '1000px' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 border border-white/20 rounded-2xl p-5 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Credit Score</p>
            <motion.p className="text-3xl font-bold text-white mt-1"
              animate={{ opacity: [1, 0.7, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              742
            </motion.p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
        <div>
          <div className="w-full h-1.5 rounded-full bg-gray-700 overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
              initial={{ width: '0%' }} animate={{ width: '74%' }} transition={{ duration: 2, delay: 0.5 }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[9px] text-gray-500">
            <span>300</span><span>500</span><span>700</span><span>850</span>
          </div>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[9px] text-gray-500">RISQUE</p>
            <p className="text-xs font-semibold text-green-400">FAIBLE</p>
          </div>
          <p className="text-[9px] text-gray-600 font-mono">AI-POWERED</p>
        </div>
      </div>
    </motion.div>
  )
}

const FEATURES = [
  { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", title: "Prediction XGBoost", desc: "Modele de Machine Learning haute precision pour evaluer le risque de credit", color: "#3b82f6" },
  { icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", title: "Explicabilite SHAP", desc: "Comprendre les facteurs d'influence derriere chaque decision du modele", color: "#8b5cf6" },
  { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", title: "Dashboard Analytique", desc: "Visualisations interactives du portefeuille de risque en temps reel", color: "#06b6d4" },
  { icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z", title: "Comparaison Multi-Modeles", desc: "XGBoost vs Random Forest vs Gradient Boosting vs Regression Logistique", color: "#f59e0b" },
  { icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4", title: "Simulation What-If", desc: "Simuler l'impact de modifications financieres sur le score de risque", color: "#10b981" },
  { icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", title: "Rapport PDF", desc: "Generation automatique de rapports d'analyse de risque telechargeables", color: "#ec4899" },
]

const STATS = [
  { value: "97.2", suffix: "%", label: "Precision du modele" },
  { value: "4", suffix: "+", label: "Modeles compares" },
  { value: "22", suffix: "", label: "Features analysees" },
  { value: "<1", suffix: "s", label: "Temps de prediction" },
]

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center">
        <div className="absolute inset-0 pointer-events-none">
          <NetworkAnimation />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6">
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-xs text-primary-300 font-medium">Powered by XGBoost + SHAP</span>
            </motion.div>

            <h1 className="text-5xl lg:text-6xl font-black leading-tight">
              <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">Detection de</span>
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Risque de Credit</span>
            </h1>

            <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-lg">
              Plateforme d'intelligence artificielle pour l'evaluation du risque de credit des entreprises.
              Predictions explicables, analyses en temps reel, rapports automatises.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/predict">
                <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(59,130,246,0.4)' }} whileTap={{ scale: 0.95 }}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-500/25 transition">
                  Commencer l'Analyse
                </motion.button>
              </Link>
              <Link to="/models">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/10 transition">
                  Voir les Modeles
                </motion.button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-2">
                {['bg-primary-500', 'bg-purple-500', 'bg-cyan-500', 'bg-green-500'].map((c, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-gray-900 flex items-center justify-center text-white text-[10px] font-bold`}>
                    {['ML', 'AI', 'XG', 'RF'][i]}
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500">
                <p className="text-gray-300 font-medium">4 algorithmes de ML</p>
                <p>Compares et valides scientifiquement</p>
              </div>
            </div>
          </motion.div>

          {/* Right side - Floating Card */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
            className="flex justify-center">
            <FloatingCard />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8">
            {STATS.map(({ value, suffix, label }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center">
                <p className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                  <AnimatedNumber value={value} suffix={suffix} />
                </p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white">Fonctionnalites Avancees</h2>
            <p className="text-gray-400 mt-3 max-w-2xl mx-auto">Une suite complete d'outils pour l'analyse de risque bancaire, du scoring ML a l'explicabilite des decisions</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon, title, desc, color }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, borderColor: color + '40' }}
                className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm transition-all group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: color + '15' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white">Stack Technologique</h2>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-4">
            {['XGBoost', 'SHAP', 'FastAPI', 'React', 'Scikit-learn', 'Pandas', 'Recharts', 'Framer Motion'].map((tech, i) => (
              <motion.div key={tech} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.1, borderColor: '#3b82f680' }}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 font-medium transition-all">
                {tech}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-br from-primary-900/40 to-purple-900/40 border border-primary-500/20 p-12 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-white mb-4">Pret a analyser le risque?</h2>
            <p className="text-gray-400 mb-8">Entrez les donnees financieres d'une entreprise et obtenez une prediction explicable en moins d'une seconde.</p>
            <Link to="/predict">
              <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(59,130,246,0.3)' }} whileTap={{ scale: 0.95 }}
                className="px-10 py-4 rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-primary-500 text-white font-bold shadow-lg shadow-primary-500/25 transition text-sm">
                Lancer une Analyse
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
