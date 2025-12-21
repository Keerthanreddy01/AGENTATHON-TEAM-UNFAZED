"use client"

import { useEffect } from "react"

interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  ctrl?: boolean
  shift?: boolean
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
        
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch
        ) {
          event.preventDefault()
          shortcut.action()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}

export function KeyboardShortcutsHelp({ shortcuts }: { shortcuts: KeyboardShortcut[] }) {
  return (
    <div className="absolute bottom-20 left-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-4 text-white text-xs max-w-xs">
      <h4 className="font-semibold mb-2">Keyboard Shortcuts</h4>
      <div className="space-y-1">
        {shortcuts.map((shortcut, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="text-white/70">{shortcut.description}</span>
            <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 font-mono">
              {shortcut.ctrl && "Ctrl+"}
              {shortcut.shift && "Shift+"}
              {shortcut.key.toUpperCase()}
            </kbd>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-white/10 text-white/50">
        Press <kbd className="px-1 py-0.5 bg-white/10 rounded">?</kbd> to toggle this help
      </div>
    </div>
  )
}
