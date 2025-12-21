'use client'

import { useEffect, useState } from 'react'
import type { Person } from '@/types'

export function usePersonData(currentPerson: Person | null) {
  const [displayPerson, setDisplayPerson] = useState<Person | null>(null)

  useEffect(() => {
    if (currentPerson) {
      setDisplayPerson(currentPerson)
    }
  }, [currentPerson])

  const updatePerson = (updates: Partial<Person>) => {
    if (!displayPerson) return
    setDisplayPerson({ ...displayPerson, ...updates })
  }

  return {
    displayPerson,
    updatePerson,
  }
}
