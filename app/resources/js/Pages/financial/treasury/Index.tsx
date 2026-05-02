import React, { useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Archive, CheckCircle2, ArrowUpCircle, ArrowDownCircle, History, Lock, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AppLayout from '@/layouts/app-layout'
import { Head } from '@inertiajs/react'

interface TreasuryStats {
  total_open_balance: number
  global_treasury_balance: number
  today_income: number
  today_expense: number
  all_time_income: number
  all_time_expense: number
  open_sessions_count: number
  closed_today_count: number
  last_closing_balance: number | null
  last_closing_date: string | null
  last_closing_user: string | null
}

interface OpenSession {
  id: number
  user_name: string
  opening_date: string
  initial_amount: number
  current_balance: number
  total_income: number
  total_expenses: number
  transaction_count: number
}

interface ClosingEntry {
  id: number
  user_name: string
  opening_date: string
  closing_date: string
  initial_amount: number
  calculated_balance: number
  total_income: number
  total_expenses: number
  by_payment_method: Record<string, { income: number; expense: number; net: number }>
}

interface RecentTransaction {
  id: number
  type: 'INCOME' | 'EXPENSE'
  amount: number
  concept: string
  payment_method: string | null
  created_at: string
  user_name: string
  service_request_id: number | null
}

interface Props {
  stats: TreasuryStats
  open_sessions: OpenSession[]
  recent_transactions: RecentTransaction[]
  closing_history: ClosingEntry[]
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(amount)

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}-${month}-${year} ${hours}:${minutes}`
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const formatRelativeDate = (dateStr: string) => {
  const d = new Date(dateStr)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dateStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayDiff = Math.round((todayStart.getTime() - dateStart.getTime()) / (1000 * 60 * 60 * 24))
  if (dayDiff === 0) return 'Hoy'
  if (dayDiff === 1) return 'Ayer'
  if (dayDiff === 2) return 'Hace 2 días'
  if (dayDiff < 7) return `Hace ${dayDiff} días`
  return formatDate(dateStr)
}

// Reemplaza fechas ISO (yyyy-mm-dd o yyyy-mm-dd hh:mm:ss) dentro de strings por dd-mm-yyyy
const formatConceptDates = (concept: string) =>
  concept.replace(/(\d{4})-(\d{2})-(\d{2})(?:\s\d{2}:\d{2}:\d{2})?/g, (_match, y, m, d) => `${d}-${m}-${y}`)

const breadcrumbs = [
  { href: '/dashboard', title: 'Dashboard' },
  { href: '/treasury', title: 'Tesorería' },
]

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  CREDIT: 'Tarjeta de Crédito',
  CREDIT_CARD: 'Tarjeta de Crédito',
  DEBIT: 'Tarjeta de Débito',
  DEBIT_CARD: 'Tarjeta de Débito',
  TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
  DIGITAL: 'Pago Digital / QR',
  OTHER: 'Otro',
}
const methodLabel = (key: string) => METHOD_LABELS[key?.toUpperCase()] ?? key ?? 'Sin método'

// Grupo de transacciones agrupadas por servicio o individuales
interface TxGroup {
  key: string
  type: 'INCOME' | 'EXPENSE'
  totalAmount: number
  concept: string
  user_name: string
  created_at: string
  splits: RecentTransaction[]
}

function groupTransactions(txs: RecentTransaction[]): TxGroup[] {
  const groups: TxGroup[] = []
  const byServiceRequest: Record<number, RecentTransaction[]> = {}

  for (const tx of txs) {
    if (tx.service_request_id) {
      if (!byServiceRequest[tx.service_request_id]) byServiceRequest[tx.service_request_id] = []
      byServiceRequest[tx.service_request_id].push(tx)
    } else {
      groups.push({
        key: `tx-${tx.id}`,
        type: tx.type,
        totalAmount: tx.amount,
        concept: tx.concept,
        user_name: tx.user_name,
        created_at: tx.created_at,
        splits: [tx],
      })
    }
  }

  for (const [srId, srTxs] of Object.entries(byServiceRequest)) {
    const first = srTxs[0]
    groups.push({
      key: `sr-${srId}`,
      type: first.type,
      totalAmount: srTxs.reduce((sum, t) => sum + t.amount, 0),
      concept: first.concept,
      user_name: first.user_name,
      created_at: first.created_at,
      splits: srTxs,
    })
  }

  // Ordenar por fecha desc
  return groups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export default function TreasuryIndex({ stats, open_sessions, recent_transactions, closing_history }: Props) {
  const [detailEntry, setDetailEntry] = useState<ClosingEntry | null>(null)
  const [detailGroup, setDetailGroup] = useState<TxGroup | null>(null)
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Tesorería" />

      <div className="space-y-6 p-4 md:p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Tesorería</h1>
          <p className="text-sm text-gray-500">Resumen de cajas y movimientos del día.</p>
        </div>

        {/* Stats - Fila 1: balances principales */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Saldo global — hero card */}
          <Card className="border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50 lg:col-span-1">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-emerald-700">Saldo global de tesorería</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight text-emerald-800">{formatCurrency(stats.global_treasury_balance)}</p>
              <p className="mt-1 text-[11px] text-emerald-600">Suma de saldo final del último cierre de cajas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-gray-500">Saldo en cajas abiertas</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-sky-700">{formatCurrency(stats.total_open_balance)}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{stats.open_sessions_count} caja(s) abiertas</p>
              </div>
              <DollarSign className="h-8 w-8 text-sky-400 opacity-60" />
            </CardContent>
          </Card>

          <Card className={stats.last_closing_balance !== null ? 'border-violet-200 bg-violet-50/40' : ''}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-gray-500">Último cierre de caja</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-violet-700">
                  {stats.last_closing_balance !== null ? formatCurrency(stats.last_closing_balance) : '—'}
                </p>
                {stats.last_closing_date && (
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {formatRelativeDate(stats.last_closing_date)} · {formatDateTime(stats.last_closing_date)} · {stats.last_closing_user}
                  </p>
                )}
              </div>
              <Lock className="h-8 w-8 text-violet-400 opacity-60" />
            </CardContent>
          </Card>
        </div>

        {/* Stats - Fila 2: movimientos */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-gray-500">Ingresos hoy</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.today_income)}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Acum. total: {formatCurrency(stats.all_time_income)}</p>
              </div>
              <TrendingUp className="h-7 w-7 text-green-400 opacity-60" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-gray-500">Egresos hoy</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-red-600">{formatCurrency(stats.today_expense)}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Acum. total: {formatCurrency(stats.all_time_expense)}</p>
              </div>
              <TrendingDown className="h-7 w-7 text-red-400 opacity-60" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-gray-500">Balance del día</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className={`text-xl font-bold ${stats.today_income - stats.today_expense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.today_income - stats.today_expense >= 0 ? '+' : ''}{formatCurrency(stats.today_income - stats.today_expense)}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Ingresos − Egresos hoy</p>
              </div>
              <DollarSign className="h-7 w-7 text-slate-300 opacity-60" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-gray-500">Cajas abiertas / cerradas hoy</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-2xl font-bold text-gray-900">
                <span className="text-sky-600">{stats.open_sessions_count}</span>
                <span className="mx-1 text-gray-300">/</span>
                <span className="text-slate-500">{stats.closed_today_count}</span>
              </p>
              <Archive className="h-7 w-7 text-slate-400 opacity-60" />
            </CardContent>
          </Card>
        </div>

        {/* Cajas abiertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Cajas abiertas ahora
              <Badge variant="secondary">{open_sessions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {open_sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">No hay cajas abiertas en este momento.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <th className="pb-2 pr-4">Usuario</th>
                      <th className="pb-2 pr-4">Apertura</th>
                      <th className="pb-2 pr-4 text-right">Monto inicial</th>
                      <th className="pb-2 pr-4 text-right">Ingresos</th>
                      <th className="pb-2 pr-4 text-right">Egresos</th>
                      <th className="pb-2 pr-4 text-right">Saldo actual</th>
                      <th className="pb-2 text-right">Cobros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {open_sessions.map((session) => (
                      <tr key={session.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="py-3 pr-4 font-medium text-gray-900">{session.user_name}</td>
                        <td className="py-3 pr-4 text-gray-500">{formatDateTime(session.opening_date)}</td>
                        <td className="py-3 pr-4 text-right text-gray-700">{formatCurrency(session.initial_amount)}</td>
                        <td className="py-3 pr-4 text-right text-green-600">{formatCurrency(session.total_income)}</td>
                        <td className="py-3 pr-4 text-right text-red-500">{formatCurrency(session.total_expenses)}</td>
                        <td className="py-3 pr-4 text-right font-semibold text-gray-900">{formatCurrency(session.current_balance)}</td>
                        <td className="py-3 text-right">
                          <Badge variant="outline">{session.transaction_count}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial de cierres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-slate-500" />
              Historial de cierres de caja
              <Badge variant="secondary">{closing_history.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {closing_history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <History className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">Aún no hay cierres registrados.</p>
              </div>
            ) : (
              <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <th className="pb-2 pr-4">Usuario</th>
                      <th className="pb-2 pr-4">Apertura</th>
                      <th className="pb-2 pr-4">Cierre</th>
                      <th className="pb-2 pr-4 text-right">Monto inicial</th>
                      <th className="pb-2 pr-4 text-right">Ingresos</th>
                      <th className="pb-2 pr-4 text-right">Egresos</th>
                      <th className="pb-2 pr-4 text-right">Saldo calculado</th>
                      <th className="pb-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {closing_history.map((entry) => (
                      <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="py-3 pr-4 font-medium text-gray-900">{entry.user_name}</td>
                        <td className="py-3 pr-4 text-[11px] text-gray-500">{formatDateTime(entry.opening_date)}</td>
                        <td className="py-3 pr-4 text-[11px] text-gray-500">{formatDateTime(entry.closing_date)}</td>
                        <td className="py-3 pr-4 text-right text-gray-700">{formatCurrency(entry.initial_amount)}</td>
                        <td className="py-3 pr-4 text-right text-green-600">{formatCurrency(entry.total_income)}</td>
                        <td className="py-3 pr-4 text-right text-red-500">{formatCurrency(entry.total_expenses)}</td>
                        <td className="py-3 pr-4 text-right font-semibold text-violet-700">{formatCurrency(entry.calculated_balance)}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => setDetailEntry(entry)}
                            className="cursor-pointer rounded px-2 py-1 text-[11px] font-medium text-violet-600 hover:bg-violet-50 transition-colors"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal detalle por medio de pago */}
              {detailEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailEntry(null)}>
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">Detalle del cierre</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{detailEntry.user_name} · {formatDateTime(detailEntry.closing_date)}</p>
                      </div>
                      <button onClick={() => setDetailEntry(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">{'×'}</button>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 pb-1 border-b">
                        <span>Medio de pago</span>
                        <span className="text-right">Ingresos</span>
                        <span className="text-right">Egresos</span>
                      </div>
                      {Object.keys(detailEntry.by_payment_method).length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-3">Sin transacciones registradas</p>
                      ) : (
                        Object.entries(detailEntry.by_payment_method).map(([method, data]) => (
                          <div key={method} className="grid grid-cols-3 text-sm">
                            <span className="font-medium text-gray-700">{methodLabel(method)}</span>
                            <span className="text-right text-green-600">{data.income > 0 ? formatCurrency(data.income) : '—'}</span>
                            <span className="text-right text-red-500">{data.expense > 0 ? formatCurrency(data.expense) : '—'}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t pt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-[11px] text-slate-400 uppercase tracking-wide">Monto inicial</p>
                        <p className="font-semibold text-gray-800 mt-0.5">{formatCurrency(detailEntry.initial_amount)}</p>
                      </div>
                      <div className="bg-violet-50 rounded-lg p-3">
                        <p className="text-[11px] text-violet-400 uppercase tracking-wide">Saldo al cierre</p>
                        <p className="font-semibold text-violet-700 mt-0.5">{formatCurrency(detailEntry.calculated_balance)}</p>
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-4 flex justify-end">
                      <button
                        onClick={() => setDetailEntry(null)}
                        className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Actividad reciente del día */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas transacciones del día</CardTitle>
          </CardHeader>
          <CardContent>
            {recent_transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <DollarSign className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">No hay transacciones hoy.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {groupTransactions(recent_transactions).map((group) => (
                  <div key={group.key} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      {group.type === 'INCOME'
                        ? <ArrowUpCircle className="h-5 w-5 shrink-0 text-green-500" />
                        : <ArrowDownCircle className="h-5 w-5 shrink-0 text-red-400" />
                      }
                      <div>
                        <p className="text-sm font-medium text-gray-800">{formatConceptDates(group.concept)}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-500">{group.user_name}</span>
                          {group.splits.length > 1 ? (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                              {group.splits.length} métodos
                            </span>
                          ) : group.splits[0].payment_method ? (
                            <span className="text-[11px] text-slate-500">· {methodLabel(group.splits[0].payment_method)}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${group.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                          {group.type === 'INCOME' ? '+' : '-'}{formatCurrency(group.totalAmount)}
                        </p>
                        <p className="text-[11px] text-slate-400">{formatRelativeDate(group.created_at)} {formatTime(group.created_at)}</p>
                      </div>
                      {group.splits.length > 1 && (
                        <button
                          onClick={() => setDetailGroup(group)}
                          className="ml-1 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal detalle de cobro con múltiples métodos */}
        {detailGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailGroup(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Detalle del cobro</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{formatConceptDates(detailGroup.concept)}</p>
                </div>
                <button onClick={() => setDetailGroup(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">{'×'}</button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 pb-1 border-b">
                  <span>Método</span>
                  <span className="text-right">Monto</span>
                  <span className="text-right">Hora</span>
                </div>
                {detailGroup.splits.map((tx) => (
                  <div key={tx.id} className="grid grid-cols-3 text-sm items-center">
                    <span className="font-medium text-gray-700">{tx.payment_method ? methodLabel(tx.payment_method) : 'Sin método'}</span>
                    <span className={`text-right font-semibold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <span className="text-right text-[11px] text-slate-400">{formatTime(tx.created_at)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t pt-3 flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wide">Total cobrado</span>
                  <p className="text-base font-bold text-green-600">{formatCurrency(detailGroup.totalAmount)}</p>
                </div>
                <button
                  onClick={() => setDetailGroup(null)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

