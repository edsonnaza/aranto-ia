import { Head, Link, router } from '@inertiajs/react';
import { Download, FileText, Search } from 'lucide-react';
import { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfileOption {
    id: number;
    name: string;
}

interface ReportItem {
    id: number;
    report_number: string;
    generated_at?: string | null;
    sample?: {
        id: number;
        sample_number?: string | null;
        patient?: {
            first_name?: string | null;
            last_name?: string | null;
        } | null;
        test_requests?: Array<{
            id: number;
            test_profile?: {
                id: number;
                name: string;
            } | null;
        }>;
    } | null;
    generated_by?: {
        id: number;
        name: string;
    } | null;
}

interface Props {
    reports: {
        data: ReportItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    profiles: ProfileOption[];
    filters: {
        search?: string;
        profile_id?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function LabReportsIndex({ reports, profiles, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [profileId, setProfileId] = useState(filters.profile_id || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const breadcrumbs = [
        { href: '/medical', title: 'Sistema Médico' },
        { href: '/medical/laboratory', title: 'Laboratorio' },
        { href: '/medical/laboratory/reports', title: 'Informes PDF', current: true },
    ];

    const applyFilters = () => {
        router.get(
            '/medical/laboratory/reports',
            {
                search: search || undefined,
                profile_id: profileId === 'all' ? undefined : profileId,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setProfileId('all');
        setDateFrom('');
        setDateTo('');
        router.get('/medical/laboratory/reports', {}, { preserveState: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Informes PDF - Laboratorio" />

            <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Informes PDF</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Listado de estudios publicados y listos para descargar.</p>
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-gray-700">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    className="pl-9"
                                    placeholder="Paciente, muestra o número de informe..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Estudio</label>
                            <Select value={profileId} onValueChange={setProfileId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {profiles.map((profile) => (
                                        <SelectItem key={profile.id} value={String(profile.id)}>
                                            {profile.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Desde</label>
                                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Hasta</label>
                                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                        <Button onClick={applyFilters}>Aplicar filtros</Button>
                        <Button variant="outline" onClick={clearFilters}>Limpiar</Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-semibold text-gray-800">Informes publicados</h2>
                    </div>

                    {reports.data.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <FileText className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                            <p className="text-sm text-gray-500">No se encontraron informes con esos filtros.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Informe</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Muestra</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Paciente</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Estudios</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Generado</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {reports.data.map((report) => {
                                        const patient = report.sample?.patient;
                                        const profileNames = Array.from(
                                            new Set(
                                                (report.sample?.test_requests || [])
                                                    .map((request) => request.test_profile?.name)
                                                    .filter(Boolean),
                                            ),
                                        );

                                        return (
                                            <tr key={report.id}>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.report_number}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{report.sample?.sample_number || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {profileNames.length ? profileNames.join(', ') : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    <div>{report.generated_at || '-'}</div>
                                                    <div className="text-xs text-gray-500">{report.generated_by?.name || 'Sistema'}</div>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <Link href={`/medical/laboratory/reports/${report.id}/download`}>
                                                        <Button variant="outline" size="sm">
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Descargar
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
