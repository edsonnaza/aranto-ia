import { useEffect, useState } from 'react'
import { router } from '@inertiajs/react'
import { Phone, Mail, MapPin, Shield, User, Heart, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type PatientSummary = {
  id: number
  full_name: string
  document_type: string
  document_number: string
  status: 'active' | 'inactive'
  birth_date: string | null
  birth_date_formatted: string | null
  age: number | null
  gender: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  primary_insurance: {
    name: string | null
    coverage_percentage: number | null
    number: string | null
  } | null
  created_at: string
}

interface PatientSummaryModalProps {
  patientId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PatientSummaryModal({ patientId, open, onOpenChange }: PatientSummaryModalProps) {
  const [patient, setPatient] = useState<PatientSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !patientId) {
      setPatient(null)
      return
    }

    setLoading(true)
    fetch(`/medical/patients/${patientId}/summary`, {
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then((res) => res.json())
      .then((data: PatientSummary) => setPatient(data))
      .catch(() => setPatient(null))
      .finally(() => setLoading(false))
  }, [open, patientId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-sky-500" />
            {loading ? 'Cargando...' : (patient?.full_name ?? 'Paciente')}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8 text-sm text-gray-400">
            Cargando datos...
          </div>
        )}

        {!loading && patient && (
          <div className="space-y-4">
            {/* Estado y documento */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={patient.status === 'active' ? 'default' : 'secondary'} className={patient.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}>
                {patient.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
              <span className="text-sm text-gray-500">{patient.document_type} {patient.document_number}</span>
            </div>

            {/* Información personal */}
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Información personal</span>
              </div>
              {patient.birth_date_formatted && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Nacimiento</span>
                  <span className="font-medium text-gray-800">{patient.birth_date_formatted}</span>
                </div>
              )}
              {patient.age !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Edad</span>
                  <span className="font-medium text-gray-800">{patient.age} años</span>
                </div>
              )}
              {patient.gender && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Género</span>
                  <span className="font-medium text-gray-800">{patient.gender}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Registrado</span>
                <span className="font-medium text-gray-800">{patient.created_at}</span>
              </div>
            </div>

            {/* Contacto */}
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Contacto</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className={patient.phone ? 'text-gray-800' : 'text-gray-400 italic'}>{patient.phone ?? 'No registrado'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className={patient.email ? 'text-gray-800' : 'text-gray-400 italic'}>{patient.email ?? 'No registrado'}</span>
              </div>
              {(patient.address || patient.city) && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-gray-800">{[patient.address, patient.city].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>

            {/* Emergencia */}
            {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
              <div className="rounded-lg border border-orange-100 bg-orange-50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Heart className="h-3.5 w-3.5 text-orange-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-orange-400">Emergencia</span>
                </div>
                {patient.emergency_contact_name && (
                  <div className="text-sm text-gray-800">{patient.emergency_contact_name}</div>
                )}
                {patient.emergency_contact_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-gray-800">{patient.emergency_contact_phone}</span>
                  </div>
                )}
              </div>
            )}

            {/* Seguro */}
            <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 space-y-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Shield className="h-3.5 w-3.5 text-sky-400" />
                <span className="text-xs font-semibold uppercase tracking-wide text-sky-400">Seguro primario</span>
              </div>
              {patient.primary_insurance ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tipo</span>
                    <span className="font-medium text-gray-800">{patient.primary_insurance.name}</span>
                  </div>
                  {patient.primary_insurance.coverage_percentage !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Cobertura</span>
                      <span className="font-medium text-gray-800">{patient.primary_insurance.coverage_percentage}%</span>
                    </div>
                  )}
                  {patient.primary_insurance.number && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">N° Póliza</span>
                      <span className="font-medium text-gray-800">{patient.primary_insurance.number}</span>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-sm italic text-gray-400">Sin seguro registrado</span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cerrar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  onOpenChange(false)
                  router.get(`/medical/patients/${patient.id}`)
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver ficha completa
              </Button>
            </div>
          </div>
        )}

        {!loading && !patient && (
          <div className="py-6 text-center text-sm text-gray-400">No se pudo cargar la información.</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
