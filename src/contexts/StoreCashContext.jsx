import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../config/supabase'
import { todayStr } from '../utils/dateHelpers'

// Shared "store cash on hand" drawer. Balance = sum(in) - sum(out) across cash_movements.
// Kept in context so the header badge updates instantly whenever any screen records cash.
const StoreCashContext = createContext({
  balance: 0, movements: [], loading: true,
  recordIn: async () => {}, recordOut: async () => {},
  removeByReference: async () => {}, deleteMovement: async () => {},
  setOpeningBalance: async () => {}, refetch: async () => {},
})

export function StoreCashProvider({ children }) {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('cash_movements')
      .select('*')
      .order('movement_date', { ascending: false })
      .order('created_at', { ascending: false })
    // Swallow errors silently (e.g. table not created yet) — feature degrades to balance 0.
    if (!error) setMovements(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  const balance = movements.reduce(
    (s, m) => s + (m.direction === 'in' ? 1 : -1) * (parseFloat(m.amount) || 0), 0
  )

  async function record(direction, { amount, source = 'manual', reference_id = null, note = null, date } = {}) {
    const amt = parseFloat(amount) || 0
    if (amt <= 0) return false
    const { error } = await supabase.from('cash_movements').insert([{
      direction, amount: amt, source, reference_id, note,
      movement_date: date || todayStr(),
    }])
    if (error) return false
    await refetch()
    return true
  }

  const recordIn = (p) => record('in', p)
  const recordOut = (p) => record('out', p)

  // Reverse any cash movement(s) tied to a deleted source row (payment/expense/...).
  async function removeByReference(reference_id) {
    if (!reference_id) return
    await supabase.from('cash_movements').delete().eq('reference_id', reference_id)
    await refetch()
  }

  async function deleteMovement(id) {
    await supabase.from('cash_movements').delete().eq('id', id)
    await refetch()
  }

  // Single 'opening' row that sets the starting cash; re-setting replaces it.
  async function setOpeningBalance(amount) {
    const amt = parseFloat(amount) || 0
    await supabase.from('cash_movements').delete().eq('source', 'opening')
    await supabase.from('cash_movements').insert([{
      direction: amt >= 0 ? 'in' : 'out',
      amount: Math.abs(amt),
      source: 'opening',
      note: 'Opening balance',
      movement_date: todayStr(),
    }])
    await refetch()
  }

  return (
    <StoreCashContext.Provider value={{
      balance, movements, loading,
      recordIn, recordOut, removeByReference, deleteMovement, setOpeningBalance, refetch,
    }}>
      {children}
    </StoreCashContext.Provider>
  )
}

export const useStoreCash = () => useContext(StoreCashContext)
