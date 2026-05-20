import React, { useMemo, useState, useEffect } from 'react'
import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, parseISO } from 'date-fns'

export default function VitalsHistory({ patient, vitalSeries }: any) {
  const [windowDays, setWindowDays] = useState<number | null>(30)
  const [startDate, setStartDate] = useState<string | null>(null) // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string | null>(null) // YYYY-MM-DD
  const [page, setPage] = useState<number>(1)
  const [perPage] = useState<number>(500)
  const [series, setSeries] = useState<any[]>(vitalSeries || [])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [order] = useState<'asc'|'desc'>('asc')

  // Build ISO date (YYYY-MM-DD) from a JS Date
  const isoDate = (d: Date) => d.toISOString().slice(0, 10)

  // Fetch a page from the JSON API
  const fetchPage = async (pageToFetch = 1, append = false, s?: string | null, e?: string | null) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('per_page', String(perPage))
      params.set('page', String(pageToFetch))
      params.set('order', order)
      if (s) params.set('start', s)
      if (e) params.set('end', e)

      const res = await fetch(`/medical/patients/${patient.id}/vitals/data?${params.toString()}`, { credentials: 'same-origin' })
      if (!res.ok) throw new Error('Error fetching vitals')
      const json = await res.json()

      const items = (json.data || []).map((v: any) => ({
        ...v,
        recorded_at_iso: v.recorded_at,
        recorded_at_label: v.recorded_at ? format(parseISO(v.recorded_at), 'yyyy-MM-dd') : null,
      }))

      if (append) {
        setSeries(prev => [...prev, ...items])
      } else {
        setSeries(items)
      }

      // detect if there are more pages
      if (!json.next_page_url || (json.data || []).length < perPage) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Recompute start/end when windowDays changes and fetch page 1
  useEffect(() => {
    if (windowDays === null) {
      setStartDate(null)
      setEndDate(null)
      setPage(1)
      fetchPage(1, false, null, null)
      return
    }

    const now = new Date()
    const to = isoDate(now)
    const from = new Date()
    from.setDate(now.getDate() - windowDays)
    const fromIso = isoDate(from)

    setStartDate(fromIso)
    setEndDate(to)
    setPage(1)
    fetchPage(1, false, fromIso, to)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowDays])

  // Initial load: replace the slice with paginated API results
  useEffect(() => {
    setPage(1)
    fetchPage(1, false, startDate || undefined, endDate || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMore = async () => {
    const next = page + 1
    await fetchPage(next, true, startDate || undefined, endDate || undefined)
    setPage(next)
  }

  const data = useMemo(() => series, [series])

  return (
    <AppLayout breadcrumbs={[{ title: 'Pacientes', href: '/medical/patients' }, { title: `${patient.first_name} ${patient.last_name}`, href:`/medical/patients/${patient.id}` }, { title: 'Signos Vitales', href: '' }]}> 
      <Head title={`Signos Vitales - ${patient.first_name} ${patient.last_name}`} />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Últimos signos y tendencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Button variant={windowDays === 7 ? 'default' : 'ghost'} onClick={() => setWindowDays(7)}>7d</Button>
              <Button variant={windowDays === 30 ? 'default' : 'ghost'} onClick={() => setWindowDays(30)}>30d</Button>
              <Button variant={windowDays === 90 ? 'default' : 'ghost'} onClick={() => setWindowDays(90)}>90d</Button>
              <Button variant={windowDays === null ? 'default' : 'ghost'} onClick={() => setWindowDays(null)}>Todo</Button>

              <div className="ml-4 flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Desde</label>
                <input type="date" className="border rounded px-2 py-1" value={startDate || ''} onChange={e => setStartDate(e.target.value || null)} />
                <label className="text-sm text-muted-foreground">Hasta</label>
                <input type="date" className="border rounded px-2 py-1" value={endDate || ''} onChange={e => setEndDate(e.target.value || null)} />
                <Button variant="outline" onClick={() => { setWindowDays(null); setPage(1); fetchPage(1, false, startDate || undefined, endDate || undefined) }}>Aplicar</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="h-72">
                <h3 className="mb-2 font-medium">Temperatura (°C)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="recorded_at_label" />
                    <YAxis />
                    <Tooltip labelFormatter={(v) => v} />
                    <Line type="monotone" dataKey="temperature" stroke="#f97316" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="h-72">
                <h3 className="mb-2 font-medium">Pulso (bpm)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="recorded_at_label" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="pulse" stroke="#06b6d4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="h-72">
                <h3 className="mb-2 font-medium">Saturación (SpO2 %)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="recorded_at_label" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="spo2" stroke="#10b981" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center">
              {loading && <div className="text-sm text-muted-foreground">Cargando...</div>}
              {!loading && hasMore && (
                <Button onClick={loadMore}>Cargar más</Button>
              )}
              {!loading && !hasMore && (
                <div className="text-sm text-muted-foreground">No hay más datos</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
