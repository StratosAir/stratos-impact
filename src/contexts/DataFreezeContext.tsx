import { createContext, useContext, useState, type ReactNode } from 'react'
import { LATEST_FREEZE_ID } from '@/data/freezes'

interface DataFreezeContextValue {
  selectedFreeze: string
  setSelectedFreeze: (id: string) => void
  compareFreeze: string | null
  setCompareFreeze: (id: string | null) => void
}

const DataFreezeContext = createContext<DataFreezeContextValue | null>(null)

export function DataFreezeProvider({ children }: { children: ReactNode }) {
  const [selectedFreeze, setSelectedFreeze] = useState(LATEST_FREEZE_ID)
  const [compareFreeze, setCompareFreeze] = useState<string | null>(null)
  return (
    <DataFreezeContext.Provider value={{ selectedFreeze, setSelectedFreeze, compareFreeze, setCompareFreeze }}>
      {children}
    </DataFreezeContext.Provider>
  )
}

export function useDataFreeze() {
  const ctx = useContext(DataFreezeContext)
  if (!ctx) throw new Error('useDataFreeze must be used within DataFreezeProvider')
  return ctx
}
