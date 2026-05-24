import { useState } from 'react'
import { Wallet, ArrowDownCircle, ArrowUpCircle, Settings2, Trash2, Lock } from 'lucide-react'
import { useStoreCash } from '../contexts/StoreCashContext'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate, todayStr } from '../utils/dateHelpers'
import { useLanguage } from '../contexts/LanguageContext'

export default function StoreCash() {
  const { t } = useLanguage()
  const { balance, movements, loading, recordIn, recordOut, setOpeningBalance, deleteMovement } = useStoreCash()
  const [modal, setModal] = useState(null) // 'in' | 'out' | 'opening'
  const [form, setForm] = useState({ amount: '', note: '', date: todayStr() })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  function open(mode) {
    setForm({ amount: '', note: '', date: todayStr() })
    setModal(mode)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (!amt) return
    setSaving(true)
    if (modal === 'in') await recordIn({ amount: amt, source: 'manual', note: form.note || null, date: form.date })
    else if (modal === 'out') await recordOut({ amount: amt, source: 'manual', note: form.note || null, date: form.date })
    else if (modal === 'opening') await setOpeningBalance(amt)
    setSaving(false)
    setModal(null)
  }

  const sourceLabel = (s) => t(`storeCash.src.${s}`) !== `storeCash.src.${s}` ? t(`storeCash.src.${s}`) : (s || '—')

  return (
    <div className="space-y-4">
      {/* Balance */}
      <div className={`rounded-2xl p-6 text-white ${balance < 0 ? 'bg-red-700' : 'bg-emerald-700'}`}>
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <Wallet size={18} /> {t('storeCash.title')}
        </div>
        <div className="text-4xl font-bold mt-2" dir="ltr">{formatCurrency(balance)}</div>
        <p className="text-white/70 text-xs mt-1">{t('storeCash.subtitle')}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => open('in')} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700">
          <ArrowDownCircle size={16} /> {t('storeCash.cashIn')}
        </button>
        <button onClick={() => open('out')} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">
          <ArrowUpCircle size={16} /> {t('storeCash.cashOut')}
        </button>
        <button onClick={() => open('opening')} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200">
          <Settings2 size={16} /> {t('storeCash.setOpening')}
        </button>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <h3 className="font-semibold text-slate-700 mb-3">{t('storeCash.history')}</h3>
        {loading ? (
          <div className="py-8 text-center text-slate-400">{t('common.loading')}</div>
        ) : movements.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">{t('storeCash.noMovements')}</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {movements.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.direction === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {m.direction === 'in' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700">{sourceLabel(m.source)}</div>
                  <div className="text-xs text-slate-400">{formatDate(m.movement_date)}{m.note ? ` — ${m.note}` : ''}</div>
                </div>
                <div className={`text-sm font-bold ${m.direction === 'in' ? 'text-emerald-600' : 'text-red-600'}`} dir="ltr">
                  {m.direction === 'in' ? '+' : '−'}{formatCurrency(m.amount)}
                </div>
                {(m.source === 'manual' || m.source === 'opening') ? (
                  <button onClick={() => setDeleteTarget(m)} className="p-1.5 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <span title="Linked to a transaction — delete it from Roznamcha to undo this cash entry" className="p-1.5 text-slate-200">
                    <Lock size={14} />
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'in' ? t('storeCash.cashIn') : modal === 'out' ? t('storeCash.cashOut') : t('storeCash.setOpening')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t('payments.amountAFN')} *</label>
            <input
              required type="number" min="0" step="0.01" autoFocus
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/30"
            />
          </div>
          {modal !== 'opening' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('common.notes')}</label>
                <input
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('common.date')}</label>
                <input
                  type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/30"
                />
              </div>
            </>
          )}
          {modal === 'opening' && (
            <p className="text-xs text-slate-400">{t('storeCash.openingHint')}</p>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium bg-[#1B3A5C] text-white rounded-lg hover:bg-[#2E86AB] disabled:opacity-60">
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteMovement(deleteTarget?.id); setDeleteTarget(null) }}
        title={t('storeCash.deleteTitle')}
        message={t('storeCash.deleteMsg')}
      />
    </div>
  )
}
