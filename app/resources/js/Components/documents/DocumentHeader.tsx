import React from 'react';

import { usePage } from '@inertiajs/react';

import type { SharedData } from '@/types';

type DocumentHeaderProps = {
    title: string;
    numberLabel?: string;
    numberValue?: string | number;
};

export default function DocumentHeader({ title, numberLabel = 'N°', numberValue }: DocumentHeaderProps) {
    const { company } = usePage<SharedData>().props;
    const logoUrl = company?.logo_data_url ?? null;

    return (
        <header className="mb-4 border-b pb-3">
            <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={company?.name ?? 'Logo de la empresa'}
                                className="h-full w-full object-contain p-1.5"
                            />
                        ) : (
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                                Logo
                            </span>
                        )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                        <h2 className="truncate text-sm font-bold uppercase text-gray-900 dark:text-gray-100">
                            {company?.name ?? 'Empresa'}
                        </h2>
                        <p className="text-[10px] text-gray-600 dark:text-gray-400">
                            {company?.ruc ? `RUC: ${company.ruc}` : 'RUC no informado'}
                        </p>
                        <p className="text-[10px] text-gray-600 dark:text-gray-400">
                            {company?.legal_representative ? `Rep. legal: ${company.legal_representative}` : '-'}
                        </p>
                        <p className="text-[10px] text-gray-600 dark:text-gray-400">
                            {[company?.phone, company?.email].filter(Boolean).join(' • ') || '-'}
                        </p>
                    </div>
                </div>

                {numberValue !== undefined ? (
                    <div className="whitespace-nowrap text-right">
                        <div className="text-xs font-semibold uppercase text-gray-500">{numberLabel}</div>
                        <div className="text-base font-bold text-gray-700">{numberValue}</div>
                    </div>
                ) : null}
            </div>

            <div className="mb-2 flex items-baseline justify-between gap-4">
                <h1 className="whitespace-nowrap text-lg font-bold">{title}</h1>
            </div>
        </header>
    );
}