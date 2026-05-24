import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'
import { useLanguage } from '../contexts/LanguageContext'

export function useMarketSellers() {
  const { t } = useLanguage()
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('market_sellers')
      .select('*, market_transactions(chicken_count, total_amount)')
      .order('created_at', { ascending: false })
    if (error) toast.error(t('market.loadFailed'))
    else setSellers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addSeller(data) {
    const { error } = await supabase.from('market_sellers').insert([data])
    if (error) { toast.error(error.message); return false }
    toast.success(t('market.sellerAdded'))
    await load()
    return true
  }

  async function updateSeller(id, data) {
    const { error } = await supabase.from('market_sellers').update(data).eq('id', id)
    if (error) { toast.error(error.message); return false }
    toast.success(t('market.sellerUpdated'))
    await load()
    return true
  }

  async function deleteSeller(id) {
    const { error } = await supabase.from('market_sellers').delete().eq('id', id)
    if (error) { toast.error(error.message); return false }
    toast.success(t('market.sellerDeleted'))
    await load()
    return true
  }

  async function getSellerById(id) {
    const { data } = await supabase.from('market_sellers').select('*').eq('id', id).single()
    return data
  }

  return { sellers, loading, addSeller, updateSeller, deleteSeller, getSellerById }
}

// Cash payments received from a market seller — independent of farm finances.
export function useMarketSellerPayments(sellerId) {
  const { t } = useLanguage()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!sellerId) { setPayments([]); setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('market_seller_payments')
      .select('*')
      .eq('seller_id', sellerId)
      .order('payment_date', { ascending: false })
    if (error) toast.error(error.message)
    else setPayments(data || [])
    setLoading(false)
  }, [sellerId])

  useEffect(() => { load() }, [load])

  async function addPayment(data) {
    const { data: inserted, error } = await supabase.from('market_seller_payments').insert([{
      seller_id: sellerId,
      amount: parseFloat(data.amount) || 0,
      payment_date: data.payment_date,
      notes: data.notes || null,
    }]).select().single()
    if (error) { toast.error(error.message); return false }
    toast.success(t('market.paymentRecorded'))
    await load()
    return inserted
  }

  async function updatePayment(id, data) {
    const { error } = await supabase.from('market_seller_payments').update({
      amount: parseFloat(data.amount) || 0,
      payment_date: data.payment_date,
      notes: data.notes || null,
    }).eq('id', id)
    if (error) { toast.error(error.message); return false }
    toast.success(t('market.paymentUpdated'))
    await load()
    return true
  }

  async function deletePayment(id) {
    const { error } = await supabase.from('market_seller_payments').delete().eq('id', id)
    if (error) { toast.error(error.message); return false }
    toast.success(t('market.paymentDeleted'))
    await load()
    return true
  }

  const totalPaid = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)

  return { payments, loading, totalPaid, addPayment, updatePayment, deletePayment, refetch: load }
}

// Per-transaction expenses tied to a seller's market transactions.
// Pass the list of the seller's transaction ids so the hook reloads as the seller's transactions change.
export function useMarketTransactionExpenses(transactionIds = []) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const idsKey = transactionIds.join(',')

  const load = useCallback(async () => {
    if (!transactionIds || transactionIds.length === 0) { setExpenses([]); setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('market_transaction_expenses')
      .select('*')
      .in('transaction_id', transactionIds)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    else setExpenses(data || [])
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  useEffect(() => { load() }, [load])

  async function addExpense(data) {
    const { data: inserted, error } = await supabase.from('market_transaction_expenses').insert([{
      transaction_id: data.transaction_id,
      description: data.description?.trim() || '—',
      amount: parseFloat(data.amount) || 0,
      expense_date: data.expense_date,
    }]).select().single()
    if (error) { toast.error(error.message); return null }
    await load()
    return inserted
  }

  async function deleteExpense(id) {
    const { error } = await supabase.from('market_transaction_expenses').delete().eq('id', id)
    if (error) { toast.error(error.message); return false }
    await load()
    return true
  }

  const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)

  return { expenses, loading, totalExpenses, addExpense, deleteExpense, refetch: load }
}
