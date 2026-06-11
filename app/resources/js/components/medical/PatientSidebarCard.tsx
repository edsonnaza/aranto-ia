import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { SharedData } from '@/types';
import type { Patient } from '@/types/medical';
import { formatBirthDate } from '@/utils/date-utils';
import { Link, usePage } from '@inertiajs/react';
import { Calendar, Heart, Mail, Phone, Shield } from 'lucide-react';

interface PatientSidebarCardProps {
    patient: Patient;
}

type RoleLike = { name?: string } | string;

export default function PatientSidebarCard({
    patient,
}: PatientSidebarCardProps) {
    const page = usePage<SharedData>();
    const user = page.props?.auth?.user;
    const roles = (user?.roles ?? []) as RoleLike[];
    const permissions = (user?.permissions ?? []) as string[];
    const isDoctor =
        roles.some((r) =>
            typeof r === 'string' ? r === 'doctor' : r?.name === 'doctor',
        ) || permissions.includes('medical.record.create');

    const insuranceLabel = patient.insurance_type?.name || 'Sin seguro';

    return (
        <div className="w-[340px]">
            <div className="sticky top-4 space-y-4">
                <Card>
                    <CardContent className="space-y-5 p-5">
                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
                            <Badge
                                className={
                                    patient.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-100'
                                }
                            >
                                {patient.status === 'active'
                                    ? 'Activo'
                                    : 'Inactivo'}
                            </Badge>
                            <Badge
                                variant="outline"
                                className="border-slate-200 bg-slate-50 text-slate-700"
                            >
                                <Shield className="mr-1 h-3 w-3" />
                                {insuranceLabel}
                            </Badge>
                        </div>

                        <div className="grid gap-4 text-sm">
                            <div>
                                <div className="mb-1 text-xs font-medium tracking-wide text-slate-500 uppercase">
                                    Datos del paciente
                                </div>
                                <div className="space-y-2 text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <span>
                                            {formatBirthDate(
                                                patient.birth_date,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <span>
                                            {patient.phone ||
                                                'Teléfono no registrado'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <span>
                                            {patient.email ||
                                                'Email no registrado'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="mb-1 text-xs font-medium tracking-wide text-slate-500 uppercase">
                                    Emergencia
                                </div>
                                {patient.emergency_contact_name ||
                                patient.emergency_contact_phone ? (
                                    <div className="space-y-1 text-slate-700">
                                        <div className="flex items-center gap-2">
                                            <Heart className="h-4 w-4 text-slate-400" />
                                            <span>
                                                {patient.emergency_contact_name ||
                                                    'Sin nombre registrado'}
                                            </span>
                                        </div>
                                        <div className="text-sm">
                                            {patient.emergency_contact_phone ||
                                                'Sin teléfono registrado'}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-600">
                                        Sin contacto de emergencia.{' '}
                                        <Link
                                            href={`/medical/patients/${patient.id}/edit`}
                                            className="font-medium text-emerald-700 hover:text-emerald-800"
                                        >
                                            Agregar
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2 border-t border-slate-200 pt-4">
                                <Link
                                    href={`/medical/patients/${patient.id}/vitals`}
                                    className="block"
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Ver historial de signos
                                    </Button>
                                </Link>
                                {isDoctor && (
                                    <p className="text-xs text-slate-500">
                                        La nueva consulta se inicia desde la
                                        cabecera principal del paciente.
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
