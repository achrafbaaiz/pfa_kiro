import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ToastProvider } from './components/Toast'
import LandingPage from './pages/LandingPage'
import PredictionPage from './pages/PredictionPage'
import SimulationPage from './pages/SimulationPage'
import DashboardPage from './pages/DashboardPage'
import ModelsPage from './pages/ModelsPage'
import MethodologyPage from './pages/MethodologyPage'

function FloatingParticles() { return null }

const NAV_ITEMS = [
  { to: "/", label: "Accueil", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { to: "/predict", label: "Prediction", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { to: "/simulation", label: "Simulation", icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" },
  { to: "/dashboard", label: "Dashboard", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { to: "/models", label: "Modeles", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
  { to: "/methodology", label: "Science", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
]

export default function App() {
  return (
    <ToastProvider>
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-primary-900 relative">
        {/* Ambient background glow */}
        <div className="bg-ambient">
          <div className="bg-ambient-extra" />
        </div>
        <FloatingParticles />

        {/* Header + Nav */}
        <header className="relative z-10 border-b border-white/10 backdrop-blur-md bg-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-3">
              <motion.div whileHover={{ rotate: 10 }} className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">CreditRisk</h1>
                <p className="text-xs text-gray-400">Plateforme intelligente d'analyse de risque</p>
              </div>
            </NavLink>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map(({ to, label, icon }) => (
                <NavLink key={to} to={to} end={to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${isActive ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`
                  }>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                  </svg>
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400">XGBoost actif</span>
            </div>
          </div>
        </header>

        {/* Routes */}
        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/predict" element={<PredictionPage />} />
            <Route path="/simulation" element={<SimulationPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
          </Routes>
        </main>

        <footer className="relative z-10 border-t border-white/5 mt-12">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between text-xs text-gray-600">
            <span>PFA 2025 - Detection de risque de credit bancaire</span>
            <span>XGBoost + SHAP + FastAPI + React</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
    </ToastProvider>
  )
}
