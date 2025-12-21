'use client'

import type { Person } from '@/types'

interface PersonInfoPanelProps {
  person: Person | null
  visible: boolean
}

export default function PersonInfoPanel({ person, visible }: PersonInfoPanelProps) {
  if (!visible || !person) {
    return null
  }

  return (
    <div className="absolute bottom-6 right-6 bg-black/95 backdrop-blur-xl border-2 border-cyan-400 rounded-2xl p-6 min-w-[320px] shadow-[0_0_40px_rgba(0,255,255,0.3)] animate-slideIn">
      <div className="flex items-center gap-3 mb-4 border-b border-cyan-400/30 pb-3">
        <span className="text-3xl">👤</span>
        <h3 className="text-cyan-400 text-xl font-bold">Current Person</h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-cyan-400 font-semibold">Name:</span>
          <span className="text-white text-lg font-medium">{person.name}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-cyan-400 font-semibold">Relation:</span>
          <span className="text-white">{person.relationship}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-cyan-400 font-semibold">Confidence:</span>
          <span className="text-white">{person.confidence}%</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-cyan-400 font-semibold">Meetings:</span>
          <span className="text-white">{person.meetings}</span>
        </div>

        {person.lastInteraction && (
          <div className="mt-4 pt-4 border-t border-cyan-400/30">
            <div className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
              <span>💬</span>
              <span>Last Conversation:</span>
            </div>
            <p className="text-white/90 text-sm leading-relaxed bg-cyan-400/5 p-3 rounded-lg border border-cyan-400/20">
              "{person.lastInteraction}"
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
