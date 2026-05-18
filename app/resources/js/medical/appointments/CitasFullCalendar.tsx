import React, { useRef, useEffect, useState } from "react"
import FullCalendar from '@fullcalendar/react'
import type { DatesSetArg, EventClickArg, DateSelectArg, CalendarApi, EventInput, EventContentArg } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Edit, ArrowUpRight, BadgeCheck, RotateCcw } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

// Local (narrow) type for dateClick callback; FullCalendar's DateClickArg may not be exported
type LocalDateClickArg = {
  date: Date
  dateStr?: string
}



// Recibe las props necesarias para eventos, filtros, callbacks, etc.
type CitasFullCalendarProps = {
  events?: EventInput[];
  initialView?: string;
  onDateChange?: (info: DatesSetArg) => void;
  onEventClick?: (arg: EventClickArg) => void;
  onSlotSelect?: (arg: DateSelectArg) => void;
  onEventAction?: (action: 'edit' | 'release' | 'reception' | 'info', arg: EventContentArg) => void;
  filters?: { selected_date?: string; [key: string]: unknown } | null;
  selectedDate?: string;
  slotMinTime?: string;
  slotMaxTime?: string;
  slotDuration?: string;
  slotHeight?: number; // height in pixels per slot row
  slotLabelInterval?: string;
  // Optional content height for FullCalendar (px or 'auto') to control rendered timeline height
  contentHeight?: number | string;
  // Indica si existen slots para el profesional en la fecha seleccionada
  hasSlots?: boolean;
  // Last minute of the last slot visible in the day (in minutes since 00:00). Used to clamp dateClick end.
  dayLastSlotEndMinutes?: number;
  // Callback to expose calendar API to parent sin mutar props
  onApiReady?: (api: CalendarApi | null) => void;
}

export default function CitasFullCalendar({ events = [], initialView = 'timeGridDay', onDateChange, onEventClick, onSlotSelect, onEventAction, filters = null, selectedDate = undefined, slotMinTime = '07:00:00', slotMaxTime = '21:00:00', slotDuration = '00:30:00', slotHeight = 36, slotLabelInterval = undefined, dayLastSlotEndMinutes = undefined, onApiReady = undefined, contentHeight = undefined, hasSlots = true }: CitasFullCalendarProps) {
  const calendarRef = useRef<CalendarApi | null>(null)
  // Mirror instance for parent + syncing flag
  const [apiInstance, setApiInstance] = useState<CalendarApi | null>(null)
  const isSyncingFromParent = useRef(false)

  // Don't force the wrapper height; let FullCalendar control overall height
  // but provide a calculated `height` prop (content + header approx).
  const estimatedHeaderHeight = 80 // px, safe approximation for toolbar/title
  const fcHeight = contentHeight ? (typeof contentHeight === 'number' ? contentHeight + estimatedHeaderHeight : contentHeight) : undefined

  // Wrapper limpio, sin padding extra
  const wrapperStyle: React.CSSProperties = {
    flex: 'none',
    overflow: 'hidden',
    position: 'relative',
    ...(fcHeight ? (typeof fcHeight === 'number' ? { minHeight: `${fcHeight}px` } : { minHeight: String(fcHeight) }) : {}),
  }

  // Mirror internal apiInstance to parent via callback (avoids mutating props during render)
  useEffect(() => {
    if (typeof onApiReady === 'function') onApiReady(apiInstance)
    return () => { if (typeof onApiReady === 'function') onApiReady(null) }
  }, [apiInstance, onApiReady])

  // Asegura que TODOS los botones dentro del calendario tengan type="button"
  // para evitar que, si hay un <form> montado en la página, un click en
  // controles del calendario provoque un submit indeseado y recarga completa.
  useEffect(() => {
    const container = document.querySelector('.aranto-fullcalendar')
    if (!container) return

    const setButtonTypes = () => {
      const buttons = container.querySelectorAll('button')
      buttons.forEach((btn) => {
        if (!btn.getAttribute('type')) btn.setAttribute('type', 'button')
      })
    }

    // Inicial
    setButtonTypes()

    // Observer para futuros cambios dinámicos (FullCalendar re-renderiza controles)
    const observer = new MutationObserver(() => setButtonTypes())
    observer.observe(container, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  function hasGetApi(x: unknown): x is { getApi: () => CalendarApi } {
    return typeof x === 'object' && x !== null && 'getApi' in x && typeof ((x as { getApi?: unknown }).getApi) === 'function'
  }

  // Sincronización simple: la prop del padre es la fuente de verdad
  useEffect(() => {
    const d = selectedDate ?? filters?.selected_date
    if (calendarRef.current && d) {
      const calendarApi = calendarRef.current
      // Siempre compara con la fecha actual del calendario
      const currentCalendarDate = calendarApi.getDate().toISOString().slice(0, 10)
      if (currentCalendarDate !== d) {
        isSyncingFromParent.current = true
        // Diferir el gotoDate al siguiente ciclo para evitar flushSync warning
        setTimeout(() => {
          calendarApi.gotoDate(d)
        }, 0)
      }
    }
  }, [selectedDate, filters?.selected_date])
  //const wrapperStyle: React.CSSProperties | undefined = contentHeight ? { height: typeof contentHeight === 'number' ? `${contentHeight}px` : String(contentHeight) } : undefined

  // Si no hay slots, mostrar mensaje informativo en vez del calendario
  const noAgenda = !hasSlots
  // Extraer nombres de profesionales si están en los filtros (puede requerir ajuste según props reales)
  let names = ''
  if (filters && typeof filters.professional_name === 'string') {
    names = filters.professional_name
  } else if (filters && typeof filters.professional_id !== 'undefined') {
    // Buscar el nombre del profesional por id si solo tenemos el id
    if (Array.isArray(filters.professionals) && filters.professionals.length > 0) {
      interface Professional { id: string | number; full_name?: string }
      const prof = (filters.professionals as Professional[]).find((p) => String(p.id) === String(filters.professional_id))
      names = prof?.full_name || 'el profesional'
    } else {
      names = 'el profesional'
    }
  } else {
    names = 'el profesional'
  }

  // Fecha en formato dd-mm-yyyy
  let fecha = selectedDate || (filters && filters.selected_date) || ''
  if (fecha && fecha.length === 10 && fecha.includes('-')) {
    const [yyyy, mm, dd] = fecha.split('-')
    fecha = `${dd}-${mm}-${yyyy}`
  }

  // Renderiza siempre FullCalendar para mantener el header prev/next visible
  // Si no hay agenda, muestra el mensaje como overlay dentro del área de contenido
  return (
    <div className="w-full aranto-fullcalendar" style={wrapperStyle}>
      <style>{`
        .aranto-fullcalendar .fc .fc-timegrid-slot,
        .aranto-fullcalendar .fc .fc-timegrid-slot-lane > div {
          height: ${slotHeight}px !important;
          min-height: ${slotHeight}px !important;
        }
        .aranto-fullcalendar .fc .fc-timegrid-slot-label {
          line-height: ${slotHeight}px !important;
          font-size: 13px !important;
          color: #64748b !important; /* slate-500 */
          font-weight: 500 !important;
          padding-left: 8px !important;
          padding-right: 8px !important;
          border-right: 1px solid #e2e8f0 !important; /* slate-200 */
          background: #f8fafc !important; /* slate-50 */
          letter-spacing: 0.01em !important;
        }
      `}</style>
      <div style={{position: 'relative'}}>
        <FullCalendar
            headerToolbar={{ left: 'prev,today,next', center: 'title', right: '' }}
          buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' }}

          // ref must receive the component instance; map to calendar API
          ref={(instance: unknown) => {
            if (hasGetApi(instance)) {
              calendarRef.current = instance.getApi()
              setApiInstance(instance.getApi())
            }
          }}
          plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
          initialView={initialView}
          events={events}
          height={fcHeight}
          contentHeight={contentHeight}
          selectable
          selectMirror
          slotMinTime={slotMinTime}
          slotMaxTime={slotMaxTime}
          slotDuration={slotDuration}
          allDaySlot={false}
          nowIndicator
          locale="es"
          weekends={true}
          // Solo editable si hay agenda creada para la fecha/profesional
         // editable={!noAgenda}
         editable={false}
          slotLabelInterval={slotLabelInterval ?? slotDuration}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          datesSet={(info) => {
          // Si el cambio fue provocado por el padre, no notificar
          if (isSyncingFromParent.current) {
            isSyncingFromParent.current = false
            return
          }
          // Extrae la fecha actual del calendario en formato seguro
          const newDate = info.view.currentStart.toLocaleDateString('en-CA')
          // Notifica al padre (AppointmentsPage) para que navegue y sincronice
          onDateChange?.({ ...info, startStr: newDate })
        }}
        eventClick={onEventClick}
        // single-click on empty slot should behave like a select (use slotDuration to compute end)
        dateClick={(arg: LocalDateClickArg) => {
          try {
            if (!arg || !arg.date) return
            const start = arg.date
            // Buscar si existe un evento bloqueado en ese horario
            const clickedISO = start.toISOString().slice(0, 16) // Precisión a minutos
            const blocked = events.some(ev => {
              // FullCalendar puede tener start/end como string o Date
              const evStart = typeof ev.start === 'string' ? ev.start.slice(0, 16) : (ev.start instanceof Date ? ev.start.toISOString().slice(0, 16) : '')
       
              return evStart === clickedISO && ev.extendedProps && ev.extendedProps.slot_status === 'blocked'
            })
            if (blocked) {
              // Opcional: mostrar toast o mensaje
              return
            }
            // parse slotDuration like '00:30:00' into milliseconds
            const parts = (slotDuration || '00:30:00').split(':').map(Number)
            const slotMinutes = ((parts[0] || 0) * 60) + (parts[1] || 0)

            // compute proposed end minutes and clamp to dayLastSlotEndMinutes if provided
            const startMinutes = start.getHours() * 60 + start.getMinutes()
            const proposedEndMinutes = startMinutes + slotMinutes
            const finalEndMinutes = typeof dayLastSlotEndMinutes === 'number' ? Math.min(proposedEndMinutes, dayLastSlotEndMinutes) : proposedEndMinutes
            const end = new Date(start)
            end.setHours(Math.floor(finalEndMinutes / 60), finalEndMinutes % 60, 0, 0)
            const selection: Partial<DateSelectArg> = {
              start,
              end,
              startStr: start.toISOString(),
              endStr: end.toISOString(),
              allDay: false,
            }
            onSlotSelect?.(selection as DateSelectArg)
          } catch (e) {
            console.error('Error processing date click:', e)
          }
        }}
        eventContent={(arg: EventContentArg) => {
          // Mostrar mensaje solo si no hay agenda (noAgenda)
          if (noAgenda) {
            return (
              <div className="w-full flex flex-col items-center justify-center py-12">
                <div className="rounded-sm   bg-white p-6 text-center text-sm text-slate-600 shadow-lg">
                  <div className="font-medium text-slate-800 mb-1">Sin agenda para la fecha</div>
                  <div>
                    No hay slots definidos para {names} en {fecha}.
                    {typeof filters?.patient_name === 'string' && filters.patient_name && (
                      <span className="block mt-1 text-xs text-slate-500">Paciente: {filters.patient_name}</span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Creá la agenda para el profesional en la fecha seleccionada para poder asignar turnos.</div>
                </div>
              </div>
            )
          }

          // Si el slot está bloqueado, mostrar fondo gris oscuro y motivo
            if (arg.event.extendedProps?.slot_status === 'blocked') {
              // Mapeo de tipos de bloqueo a español
              const tipoRaw = arg.event.extendedProps?.block_type || ''
              const tipoMap: Record<string, string> = {
                'vacation': 'Vacaciones',
                'conference': 'Congreso',
                'travel': 'Viaje',
                'other': 'Otro',
                // Agrega aquí más tipos según existan en tu sistema
              }
              const tipo = tipoMap[tipoRaw.toLowerCase()] || tipoRaw
              return (
                <div className="flex items-center justify-center h-full w-full rounded-md bg-orange-100" >
                  <div className="flex flex-col items-center w-full pt-2">
                     <Badge variant="destructive">Agenda bloqueada</Badge>
                    {tipo && (
                         <Badge className="text-black bg-transparent">Motivo: {tipo}</Badge>
                    )}
                  </div>
                </div>
              )
          }

          // Si hay agenda, mostrar el contenido normal
          const professional = arg.event.extendedProps?.professional_name ?? arg.event.title
          const patient = arg.event.extendedProps?.patient_name ?? arg.event.extendedProps?.patient ?? ''
          const service = arg.event.extendedProps?.service_name ?? ''
          // Replicar lógica de negocio de habilitación de botones
          const status = arg.event.extendedProps?.status
          const service_request_id = arg.event.extendedProps?.service_request_id
          const service_request_status = arg.event.extendedProps?.service_request_status
          // Solo mostrar acciones si es una cita real (tiene id o service_request_id)
          const isRealAppointment = !!arg.event.extendedProps?.id || !!service_request_id
          // isAppointmentLocked
          const appointmentLocked = Boolean(
            service_request_id &&
            service_request_status &&
            service_request_status !== 'pending_confirmation'
          )
          // appointmentCanGoToReception
          const appointmentCanGoToReception =
            status === 'scheduled' &&
            !appointmentLocked &&
            !service_request_id &&
            service_request_status !== 'checked_in' &&
            service_request_status !== 'completed' &&
            service_request_status !== 'cancelled' &&
            service_request_status !== 'no_show'

          // Estados para deshabilitar
          const isDisabled = appointmentLocked || ['checked_in', 'completed', 'cancelled', 'no_show'].includes(status)
          const enviadoRecepcion = service_request_status === 'checked_in' || service_request_status === 'completed'

          return (
            <div
              className={`flex items-stretch w-full h-full rounded-md ${enviadoRecepcion ? 'bg-emerald-100 border border-emerald-400' : ''}`}
              style={enviadoRecepcion ? { boxShadow: '0 0 0 2px #34d399 inset' } : {}}
            >
              <div className="flex-1 flex flex-col justify-center min-w-0 pl-2 py-1">
                <div className="truncate text-sm font-semibold text-shadow-stone-200 text-stone-50">
                  {professional}
                </div>
                {patient && (
                  <span className="block text-xs font-semibold text-slate-800 truncate">
                    {patient}{service && ` - [ ${service} ]`}
                  </span>
                )}
              </div>
              {/* Solo mostrar badges y botones si es una cita real */}
              {isRealAppointment && (
                <>
                  {/* ...bloqueo y acciones normales... */}
                  {!appointmentCanGoToReception && arg.event.extendedProps?.slot_status !== 'blocked' && (
                    <div className="flex flex-col justify-center items-end gap-1 pr-2 pl-1 ">
                      <div className="flex w-full flex-wrap justify-center gap-2">
                        <Badge variant="outline" className="text-red-900">
                          <BadgeCheck data-icon="inline-start" />
                          Enviado a recepcion
                        </Badge>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col justify-center items-end gap-1 pr-2 pl-1">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className={`rounded-md bg-white border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 p-1.5 transition text-slate-700 cursor-pointer ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-100'}`}
                        style={{ width: 32, height: 32 }}
                        onClick={e => { if (!isDisabled) { e.stopPropagation(); onEventAction?.('edit', arg) } }}
                        title={isDisabled ? 'No editable' : 'Editar'}
                        disabled={isDisabled}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className={`rounded-md bg-white border border-rose-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400 p-1.5 transition text-rose-600 cursor-pointer ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-rose-50'}`}
                        style={{ width: 32, height: 32 }}
                        onClick={e => { if (!isDisabled) { e.stopPropagation(); onEventAction?.('release', arg) } }}
                        title={isDisabled ? 'No editable' : 'Liberar turno'}
                        disabled={isDisabled}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className={`rounded-md bg-white border border-sky-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 p-1.5 transition text-sky-600 cursor-pointer ${!appointmentCanGoToReception ? 'opacity-60 cursor-not-allowed' : 'hover:bg-sky-50'}`}
                        style={{ width: 32, height: 32 }}
                        onClick={e => { if (appointmentCanGoToReception) { e.stopPropagation(); onEventAction?.('reception', arg) } }}
                        title={!appointmentCanGoToReception ? 'No disponible para recepción' : 'Ir a recepción'}
                        disabled={!appointmentCanGoToReception}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                      {/* Botón de información del paciente */}
                      {patient && (
                        <button
                          type="button"
                          className={`rounded-md bg-white border border-sky-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 p-1.5 transition text-sky-600 hover:bg-sky-50 cursor-pointer`}
                          style={{ width: 32, height: 32 }}
                          title="Ver información del paciente"
                          onClick={e => {
                            e.stopPropagation();
                            if (typeof onEventAction === 'function') {
                              onEventAction('info', arg)
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.25v-1.5A2.75 2.75 0 017.25 15h9.5a2.75 2.75 0 012.75 2.75v1.5" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        }}
        />
       
      </div>
    </div>
  )
}
