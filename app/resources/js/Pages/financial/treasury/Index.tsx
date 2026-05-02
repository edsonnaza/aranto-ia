import React from 'react'
import { DollarSign, TrendingUp, TrendingDown, Archive, CheckCircle2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AppLayout from '@/layouts/app-layout'
import { Head } from '@inertiajs/react'

interface TreasuryStats {
  total_open_balance: number
  today_income: number
  today_expense: number
  open_sessions_count: number
  closed_today_count: number
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

interface RecentTransaction {
  id: number
  type: 'INCOME' | 'EXPENSE'
  amount: number
  concept: string
  payment_method: string | null
  created_at: string
  user_name: string
}

interface Props {
  stats: TreasuryStats
  open_sessions: OpenSession[]
  recent_transactions: RecentTransaction[]
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(amount)

const formatTime = (dateStr: string) =>
  new Intl.DateTimeFormat('es-PY', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr))

const breadcrumbs = [
  { href: '/dashboard', title: 'Dashboard' },
  { href: '/treasury', title: 'Tesorería' },
]

export default function TreasuryIndex({ stats, open_sessions, recent_transactions }: Props) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Tesorería" />

      <div className="space-y-6 p-4 md:p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Tesorería</h1>
          <p className="text-sm text-gray-500">Resumen de cajas y movimientos del día.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Saldo en cajas abiertas</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_open_balance)}</p>
              <DollarSign className="h-8 w-8 text-blue-400 opacity-60" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Ingresos hoy</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.today_income)}</p>
              <TrendingUp className="h-8 w-8 text-green-400 opacity-60" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Egresos hoy</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.today_expense)}</p>
              <TrendingDown className="h-8 w-8 text-red-400 opacity-60" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Cajas abiertas / cerradas hoy</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-2xl font-bold text-gray-900">
                <span className="text-sky-600">{stats.open_sessions_count}</span>
                <span className="mx-1 text-gray-300">/</span>
                <span className="text-slate-500">{stats.closed_today_count}</span>
              </p>
              <Archive className="h-8 w-8 text-slate-400 opacity-60" />
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
                      <th className="pb-2 text-right">Transacciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {open_sessions.map((session) => (
                      <tr key={session.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="py-3 pr-4 font-medium text-gray-900">{session.user_name}</td>
                        <td className="py-3 pr-4 text-gray-500">
                          {new Intl.DateTimeFormat('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(session.opening_date))}
                        </td>
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
                {recent_transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      {tx.type === 'INCOME'
                        ? <ArrowUpCircle className="h-5 w-5 shrink-0 text-green-500" />
                        : <ArrowDownCircle className="h-5 w-5 shrink-0 text-red-400" />
                      }
                      <div>
                        <p className="text-sm font-medium text-gray-800">{tx.concept}</p>
                        <p className="text-[11px] text-slate-500">{tx.user_name}{tx.payment_method ? ` · ${tx.payment_method}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatTime(tx.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
