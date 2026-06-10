import { useState } from 'react'
import { motion } from 'framer-motion'

export default function CreditCard3D({ risk = 0, niveau = 'Faible', companyName = 'Entreprise' }) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 })
  const [isFlipped, setIsFlipped] = useState(false)

  const pct = Math.round(risk * 100)
  const color = pct < 30 ? '#2ecc71' : pct < 60 ? '#f39c12' : '#e74c3c'
  const gradientFrom = pct < 30 ? '#065f46' : pct < 60 ? '#78350f' : '#7f1d1d'
  const gradientTo = pct < 30 ? '#0d9488' : pct < 60 ? '#d97706' : '#dc2626'

  const handleMouse = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientY - rect.top - rect.height / 2) / 10
    const y = -(e.clientX - rect.left - rect.width / 2) / 10
    setRotate({ x, y })
  }

  const score = Math.round(850 - (risk * 550)) // 300-850 range

  return (
    <div className="perspective-1000" onMouseMove={handleMouse} onMouseLeave={() => setRotate({ x: 0, y: 0 })}
      onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div
        animate={{ rotateX: isFlipped ? 180 : rotate.x, rotateY: isFlipped ? 0 : rotate.y }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-80 h-48 cursor-pointer"
      >
        {/* Front */}
        <div className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between shadow-2xl backface-hidden"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`, backfaceVisibility: 'hidden' }}>
          {/* Chip + Logo */}
          <div className="flex justify-between items-start">
            <div className="w-10 h-7 rounded-md bg-yellow-400/80 relative overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px p-0.5">
                {[...Array(9)].map((_, i) => <div key={i} className="bg-yellow-600/40 rounded-sm" />)}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full border-2 border-white/40" />
              <div className="w-6 h-6 rounded-full border-2 border-white/40 -ml-3.5" />
            </div>
          </div>

          {/* Score Display */}
          <div>
            <p className="text-white/50 text-[9px] uppercase tracking-widest">Credit Risk Score</p>
            <div className="flex items-baseline gap-2">
              <motion.span key={score} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-black text-white">{score}</motion.span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '30', color }}>
                {niveau.toUpperCase()}
              </span>
            </div>
            {/* Score bar */}
            <div className="w-full h-1 rounded-full bg-white/10 mt-2 overflow-hidden">
              <motion.div className="h-full rounded-full" animate={{ width: `${(score - 300) / 550 * 100}%` }}
                style={{ backgroundColor: color }} transition={{ type: 'spring', stiffness: 100 }} />
            </div>
            <div className="flex justify-between text-[8px] text-white/30 mt-0.5">
              <span>300</span><span>550</span><span>700</span><span>850</span>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[8px] text-white/40 uppercase">Analyse de</p>
              <p className="text-xs font-medium text-white/80 truncate max-w-[150px]">{companyName}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-white/40">PROB. DEFAUT</p>
              <p className="text-sm font-bold text-white">{pct}%</p>
            </div>
          </div>

          {/* Shine effect */}
          <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={{ background: `linear-gradient(${105 + rotate.y * 5}deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)` }} />
        </div>

        {/* Back */}
        <div className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between shadow-2xl"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, #111827)`, backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}>
          <div className="w-full h-8 bg-gray-900/80 rounded -mx-1 mt-2" />
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-white/40">RISQUE</span>
              <span className="text-xs font-bold" style={{ color }}>{niveau}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-white/40">PROBABILITE</span>
              <span className="text-xs font-bold text-white">{pct}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-white/40">MODELE</span>
              <span className="text-xs font-bold text-white">XGBoost</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-white/40">EXPLICABILITE</span>
              <span className="text-xs font-bold text-white">SHAP</span>
            </div>
          </div>
          <p className="text-[8px] text-white/20 text-center">CreditRisk · ENSIAS 2025/2026</p>
        </div>
      </motion.div>
      <p className="text-center text-[10px] text-gray-600 mt-3">Cliquez pour retourner · Bougez la souris pour l'effet 3D</p>
    </div>
  )
}
