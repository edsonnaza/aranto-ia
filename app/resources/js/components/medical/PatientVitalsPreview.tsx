import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { formatSystemDateTime } from '@/utils/date-utils';
import { Activity, HeartPulse, Thermometer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface VitalPoint {
    id: number;
    recorded_at: string;
    temperature?: number | null;
    pulse?: number | null;
    spo2?: number | null;
    blood_pressure?: string | null;
}

interface PatientVitalsPreviewProps {
    patientId: number;
}

const formatChartLabel = (value: string) => {
    const date = new Date(value.replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return value;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}`;
};

const renderMetricChart = (
    title: string,
    dataKey: 'temperature' | 'pulse' | 'spo2',
    color: string,
    data: Array<VitalPoint & { recorded_at_label: string }>,
    height = 120,
) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-900">{title}</h4>
            <span className="text-xs text-slate-500">
                {data.length} registro{data.length === 1 ? '' : 's'}
            </span>
        </div>
        <div className="h-28 rounded-lg border border-slate-200 bg-white p-2">
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        dataKey="recorded_at_label"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                        labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.recorded_at
                                ? formatSystemDateTime(
                                      payload[0].payload.recorded_at,
                                  )
                                : ''
                        }
                    />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export default function PatientVitalsPreview({
    patientId,
}: PatientVitalsPreviewProps) {
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [series, setSeries] = useState<VitalPoint[]>([]);

    useEffect(() => {
        let active = true;

        const fetchVitals = async () => {
            setLoading(true);

            try {
                const params = new URLSearchParams({
                    per_page: '30',
                    page: '1',
                    order: 'desc',
                });

                const response = await fetch(
                    `/medical/patients/${patientId}/vitals/data?${params.toString()}`,
                    { credentials: 'same-origin' },
                );

                if (!response.ok) throw new Error('Error fetching vitals');

                const json = await response.json();
                if (!active) return;

                setSeries(json.data || []);
            } catch (error) {
                console.error(error);
                if (active) setSeries([]);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchVitals();

        return () => {
            active = false;
        };
    }, [patientId]);

    const latestVital = series[0] || null;

    const chartData = useMemo(
        () =>
            [...series].reverse().map((item) => ({
                ...item,
                recorded_at_label: formatChartLabel(item.recorded_at),
            })),
        [series],
    );

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <HeartPulse className="h-4 w-4 text-rose-500" />
                                Historial de signos
                            </CardTitle>
                            <p className="mt-1 text-sm text-slate-500">
                                Referencia rápida del paciente sin salir de la
                                consulta.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen(true)}
                        >
                            Ver tendencia
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                            Cargando signos vitales...
                        </div>
                    ) : latestVital ? (
                        <>
                            <div className="grid grid-cols-2 gap-0.5 md:grid-cols-4">
                                <div className="min-h-[88px] rounded-lg border border-slate-200 bg-slate-50 p-2 mr-1">
                                    <div className="mb-1.5 flex items-center  text-[10px] text-slate-500">
                                        <Thermometer className="h-3.5 w-3.5 shrink-0" />
                                        Temperatura
                                    </div>
                                    <div className="text-base leading-tight font-semibold text-slate-900 xl:text-base">
                                        {latestVital.temperature ?? '-'}
                                        {latestVital.temperature != null
                                            ? ' °C'
                                            : ''}
                                    </div>
                                </div>
                                <div className="min-h-[88px] rounded-lg border border-slate-200 bg-slate-50 p-2 mr-1">
                                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                                        <HeartPulse className="h-3.5 w-3.5 shrink-0" />
                                        Pulso
                                    </div>
                                    <div className="text-base leading-tight font-semibold text-slate-900 xl:text-base">
                                        {latestVital.pulse ?? '-'}
                                        {latestVital.pulse != null
                                            ? ' bpm'
                                            : ''}
                                    </div>
                                </div>
                                <div className="min-h-[88px] rounded-lg border border-slate-200 bg-slate-50 p-2 mr-1">
                                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                                        <Activity className="h-3.5 w-3.5 shrink-0" />
                                        SpO2
                                    </div>
                                    <div className="text-lg leading-tight font-semibold text-slate-900 xl:text-base">
                                        {latestVital.spo2 ?? '-'}
                                        {latestVital.spo2 != null ? ' %' : ''}
                                    </div>
                                </div>
                                <div className="min-h-[88px] rounded-lg border border-slate-200 bg-slate-50 p-2 mr-1">
                                    <div className="mb-1.5 text-[10px] text-slate-500">
                                        Presion arterial
                                    </div>
                                    <div className="text-lg leading-tight font-semibold text-slate-900 xl:text-base">
                                        {latestVital.blood_pressure || '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-900">
                                            Mini tendencia reciente
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            Último registro:{' '}
                                            {formatSystemDateTime(
                                                latestVital.recorded_at,
                                            )}
                                        </p>
                                    </div>
                                </div>
                                {renderMetricChart(
                                    'Pulso reciente',
                                    'pulse',
                                    '#06b6d4',
                                    chartData,
                                    96,
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                            <p className="text-sm font-medium text-slate-700">
                                Aún no hay signos vitales registrados.
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Cuando existan consultas previas con signos,
                                aparecerán aquí como apoyo para la nueva carga.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="right"
                    className="w-full overflow-y-auto sm:max-w-3xl"
                >
                    <SheetHeader>
                        <SheetTitle>Tendencia de signos vitales</SheetTitle>
                        <SheetDescription>
                            Vista resumida de los últimos registros del paciente
                            durante esta nueva consulta.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 px-4 pb-6">
                        {loading ? (
                            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                                Cargando signos vitales...
                            </div>
                        ) : chartData.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                                No hay signos vitales para mostrar.
                            </div>
                        ) : (
                            <>
                                {renderMetricChart(
                                    'Temperatura (°C)',
                                    'temperature',
                                    '#f97316',
                                    chartData,
                                )}
                                {renderMetricChart(
                                    'Pulso (bpm)',
                                    'pulse',
                                    '#06b6d4',
                                    chartData,
                                )}
                                {renderMetricChart(
                                    'Saturación (SpO2 %)',
                                    'spo2',
                                    '#10b981',
                                    chartData,
                                )}
                            </>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
