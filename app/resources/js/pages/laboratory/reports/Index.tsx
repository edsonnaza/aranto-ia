import { Head, router } from '@inertiajs/react';
import { Check, ChevronDown, Download, FileText, Loader2, Search } from 'lucide-react';
import { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { DataTableSummary } from '@/components/ui/data-table-summary';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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
    const today = new Date().toISOString().slice(0, 10);
    const [search, setSearch] = useState(filters.search || '');
    const [profileId, setProfileId] = useState(filters.profile_id || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || today);
    const [dateTo, setDateTo] = useState(filters.date_to || today);
    const [isLoading, setIsLoading] = useState(false);
    const [studyOpen, setStudyOpen] = useState(false);
    const selectedProfile = profiles.find((profile) => String(profile.id) === profileId) ?? null;

    const breadcrumbs = [
        { href: '/medical', title: 'Sistema Médico' },
        { href: '/medical/laboratory', title: 'Laboratorio' },
        { href: '/medical/laboratory/reports', title: 'Informes PDF', current: true },
    ];

    const navigateWithFilters = (overrides: Record<string, string | number | undefined> = {}) => {
        router.get(
            '/medical/laboratory/reports',
            {
                search: search || undefined,
                profile_id: profileId === 'all' ? undefined : profileId,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                per_page: reports.per_page,
                ...overrides,
            },
            {
                preserveState: true,
                replace: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const applyFilters = () => {
        navigateWithFilters({ page: 1 });
    };

    const clearFilters = () => {
        setSearch('');
        setProfileId('all');
        setDateFrom(today);
        setDateTo(today);
        router.get('/medical/laboratory/reports', {
            date_from: today,
            date_to: today,
            per_page: reports.per_page,
            page: 1,
        }, {
            preserveState: true,
            replace: true,
            onStart: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        });
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
                            <Popover open={studyOpen} onOpenChange={setStudyOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={studyOpen}
                                        className="w-full justify-between"
                                        disabled={isLoading}
                                    >
                                        <span className={cn('truncate text-left', !selectedProfile && 'text-muted-foreground')}>
                                            {selectedProfile ? selectedProfile.name : 'Todos'}
                                        </span>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar estudio..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontraron estudios.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="Todos"
                                                    onSelect={() => {
                                                        setProfileId('all');
                                                        setStudyOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            'mr-2 h-4 w-4',
                                                            profileId === 'all' ? 'opacity-100' : 'opacity-0',
                                                        )}
                                                    />
                                                    Todos
                                                </CommandItem>
                                                {profiles.map((profile) => (
                                                    <CommandItem
                                                        key={profile.id}
                                                        value={profile.name}
                                                        onSelect={() => {
                                                            setProfileId(String(profile.id));
                                                            setStudyOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                'mr-2 h-4 w-4',
                                                                profileId === String(profile.id) ? 'opacity-100' : 'opacity-0',
                                                            )}
                                                        />
                                                        <span className="truncate">{profile.name}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
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
                        <Button onClick={applyFilters} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Aplicar filtros
                        </Button>
                        <Button variant="outline" onClick={clearFilters} disabled={isLoading}>Limpiar</Button>
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
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={`/medical/laboratory/reports/${report.id}/download`} download>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Descargar
                                                        </a>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between px-2">
                    <div className="flex-1" />
                    <DataTablePagination
                        currentPage={reports.current_page}
                        lastPage={reports.last_page}
                        perPage={reports.per_page}
                        pageSizes={[10, 20, 30, 50, 100]}
                        onPageChange={(page) => navigateWithFilters({ page })}
                        onPageSizeChange={(size) => navigateWithFilters({ per_page: Number(size), page: 1 })}
                        loading={isLoading}
                    />
                </div>

                {reports.total > 0 && (
                    <DataTableSummary from={reports.from} to={reports.to} total={reports.total} />
                )}
            </div>
        </AppLayout>
    );
}
