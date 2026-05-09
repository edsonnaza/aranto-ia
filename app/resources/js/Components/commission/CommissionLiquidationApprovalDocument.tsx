import React from 'react';

import type { CommissionLiquidation, CommissionLiquidationDetail } from '@/types/commission';

type CommissionLiquidationApprovalDocumentProps = {
    liquidation: CommissionLiquidation;
    services: CommissionLiquidationDetail[];
};

const currencyFormatter = new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

function formatCurrency(amount: number): string {
    return currencyFormatter.format(amount);
}

function formatDate(value?: string | null): string {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';

    return parsed.toLocaleDateString('es-PY');
}

function getStatusLabel(status?: string): string {
    switch (status) {
        case 'approved':
            return 'Aprobada';
        case 'paid':
            return 'Pagada';
        case 'cancelled':
            return 'Cancelada';
        case 'pending':
            return 'Pendiente';
        case 'draft':
            return 'Borrador';
        default:
            return status ?? '-';
    }
}

export default function CommissionLiquidationApprovalDocument({
    liquidation,
    services,
}: CommissionLiquidationApprovalDocumentProps) {
    const totalProduction = Number(liquidation.gross_amount ?? liquidation.total_amount ?? 0);
    const totalCommission = Number(liquidation.commission_amount ?? 0);
    const printedAt = new Date();

    return (
        <div className="bg-white p-8 text-black" style={{ width: '210mm', minHeight: '297mm' }}>
            <header className="mb-4 border-b pb-3">
                <div className="mb-2 flex items-baseline justify-between gap-4">
                    <h1 className="whitespace-nowrap text-lg font-bold">Liquidacion de Comisiones</h1>
                    <span className="whitespace-nowrap text-sm font-semibold text-gray-500">Nº {liquidation.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p>
                            <span className="font-semibold">Profesional: </span>
                            {liquidation.professional_name ?? '-'}
                        </p>
                        <p>
                            <span className="font-semibold">Periodo: </span>
                            {formatDate(liquidation.period_start)} - {formatDate(liquidation.period_end)}
                        </p>
                        <p>
                            <span className="font-semibold">Estado: </span>
                            {getStatusLabel(liquidation.status)}
                        </p>
                    </div>
                    <div>
                        <p>
                            <span className="font-semibold">Total produccion: </span>
                            {formatCurrency(totalProduction)}
                        </p>
                        <p>
                            <span className="font-semibold">Total comision a cobrar: </span>
                            {formatCurrency(totalCommission)}
                        </p>
                        <p>
                            <span className="font-semibold">Fecha impresion: </span>
                            {printedAt.toLocaleDateString('es-PY')} {printedAt.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </p>
                    </div>
                </div>
            </header>

            <main>
                <table className="w-full border-collapse text-[9px] leading-tight">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border px-1 py-1 text-center">#</th>
                            <th className="border px-1 py-1 text-left">Paciente</th>
                            <th className="border px-1 py-1 text-left">Fecha</th>
                            <th className="border px-1 py-1 text-left">Seguro</th>
                            <th className="border px-1 py-1 text-left">Servicio / Profesional</th>
                            <th className="border px-1 py-1 text-right">Precio</th>
                            <th className="border px-1 py-1 text-right">% Com.</th>
                            <th className="border px-1 py-1 text-right">Monto com.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map((service, index) => (
                            <tr key={service.id ?? `${service.service_request_id}-${service.service_id}-${index}`}>
                                <td className="border px-1 py-1 text-center text-gray-500">{index + 1}</td>
                                <td className="border px-1 py-1">{service.patient_name ?? '-'}</td>
                                <td className="border px-1 py-1 whitespace-nowrap">{formatDate(service.service_request_date ?? service.service_date)}</td>
                                <td className="border px-1 py-1">{service.insurance_type_name ?? 'Sin seguro'}</td>
                                <td className="border px-1 py-1">
                                    <span className="block font-medium">{service.service_name ?? '-'}</span>
                                    <span className="block text-[8px] text-gray-500">{service.professional_name ?? '-'}</span>
                                </td>
                                <td className="border px-1 py-1 text-right whitespace-nowrap">{formatCurrency(service.service_amount ?? 0)}</td>
                                <td className="border px-1 py-1 text-right">{service.commission_percentage}%</td>
                                <td className="border px-1 py-1 text-right whitespace-nowrap">{formatCurrency(service.commission_amount ?? 0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>

            <footer className="mt-16 grid grid-cols-2 gap-12 text-center text-sm">
                <div>
                    <div className="mb-2 h-px w-full bg-black" />
                    <p>Firma quien genero el documento</p>
                    <p className="mt-1 font-semibold">{liquidation.generated_by_name ?? '____________________'}</p>
                </div>
                <div>
                    <div className="mb-2 h-px w-full bg-black" />
                    <p>Firma profesional que recibe</p>
                    <p className="mt-1 font-semibold">{liquidation.professional_name ?? '____________________'}</p>
                </div>
            </footer>
        </div>
    );
}
