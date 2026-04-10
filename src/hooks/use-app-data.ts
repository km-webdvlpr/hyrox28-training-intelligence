import { useContext } from 'react'
import { AppDataContext } from '../context/app-data-context.ts'

export function useAppData() {
  const context = useContext(AppDataContext)

  if (!context) {
    throw new Error('useAppData must be used inside AppDataProvider.')
  }

  return context
}
