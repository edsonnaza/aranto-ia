import { useCallback } from 'react';

import {
    type ExportTarget,
    type PdfExportOptions,
    type PrintOptions,
    exportElementToPdf,
    printElement,
} from '@/services/document-export';

type UseDocumentExportReturn = {
    print: (target: ExportTarget, options?: PrintOptions) => void;
    downloadPdf: (target: ExportTarget, options?: PdfExportOptions) => Promise<void>;
};

/**
 * Global reusable document export hook for print and PDF generation.
 */
export function useDocumentExport(): UseDocumentExportReturn {
    const print = useCallback((target: ExportTarget, options?: PrintOptions) => {
        printElement(target, options);
    }, []);

    const downloadPdf = useCallback(async (target: ExportTarget, options?: PdfExportOptions) => {
        await exportElementToPdf(target, options);
    }, []);

    return {
        print,
        downloadPdf,
    };
}
