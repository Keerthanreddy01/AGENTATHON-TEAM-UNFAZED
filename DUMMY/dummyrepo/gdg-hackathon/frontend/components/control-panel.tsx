'use client'

interface ControlPanelProps {
  isActive: boolean
  glassesMode: boolean
  isDetecting: boolean
  isConnected: boolean
  onStart: () => void
  onStop: () => void
  onToggleGlasses: () => void
}

export default function ControlPanel({
  isActive,
  glassesMode,
  isDetecting,
  isConnected,
  onStart,
  onStop,
  onToggleGlasses,
}: ControlPanelProps) {
  return (
    <div className="absolute top-6 left-6 bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 min-w-[280px] shadow-[0_20px_60px_rgba(0,0,0,0.55)] transition-all duration-300">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-3xl">🤖</span>
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Fillora</p>
          <h2 className="text-white text-2xl font-semibold">Spatial Assist</h2>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-4 h-4 rounded-full ${
              isDetecting ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
          />
          <span className="text-white/80 text-sm">Camera {isDetecting ? 'Active' : 'Inactive'}</span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`w-4 h-4 rounded-full ${
              isConnected ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span className="text-white/80 text-sm">Server {isConnected ? 'Connected' : 'Demo Mode'}</span>
        </div>
      </div>

      <div className="space-y-3">
        {!isActive ? (
          <button
            onClick={onStart}
            className="w-full bg-white text-black font-semibold py-3 px-6 rounded-xl transition-colors duration-200 hover:bg-neutral-200"
          >
            ▶ Start AR System
          </button>
        ) : (
          <button
            onClick={onStop}
            className="w-full bg-neutral-900 border border-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 hover:bg-neutral-800"
          >
            ■ Stop System
          </button>
        )}

        <button
          onClick={onToggleGlasses}
          disabled={!isActive}
          className={`w-full font-semibold py-3 px-6 rounded-xl border border-white/15 text-white transition-colors duration-200 ${
            glassesMode ? 'bg-neutral-900' : 'bg-neutral-800'
          } ${!isActive ? 'opacity-40 cursor-not-allowed' : 'hover:bg-neutral-700'}`}
        >
          🕶️ {glassesMode ? 'Exit' : 'Enter'} Ray-Ban Mode
        </button>
      </div>
    </div>
  )
}
