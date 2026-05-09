import { toJpeg, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export type PrintOptions = {
    title?: string;
};

export type PdfExportOptions = {
    fileName?: string;
    marginMm?: number;
    imageType?: 'JPEG' | 'PNG';
    imageQuality?: number;
};

export type ExportTarget = HTMLElement | null;

/**
 * Print an HTML element using a separate print window.
 */
export function printElement(target: ExportTarget, options: PrintOptions = {}): void {
    if (!target) {
        throw new Error('No se encontro el elemento para imprimir.');
    }

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');
    if (!printWindow) {
        throw new Error('No se pudo abrir la ventana de impresion.');
    }

    const doc = printWindow.document;
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((node) => node.outerHTML)
        .join('\n');

    const title = options.title ?? document.title;

    doc.open();
    doc.write(`
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>${escapeHtml(title)}</title>
                ${styleTags}
                <style>
                    @page { size: auto; margin: 10mm; }
                    body { margin: 0; padding: 0; }
                    .print-root { padding: 8mm; }
                </style>
            </head>
            <body>
                <div class="print-root">${target.outerHTML}</div>
            </body>
        </html>
    `);
    doc.close();

    printWindow.focus();
    printWindow.addEventListener('load', () => {
        printWindow.print();
        printWindow.close();
    });
}

/**
 * Export an HTML element as PDF.
 */
export async function exportElementToPdf(target: ExportTarget, options: PdfExportOptions = {}): Promise<void> {
    if (!target) {
        throw new Error('No se encontro el elemento para exportar.');
    }

    const {
        fileName = 'documento.pdf',
        marginMm = 10,
        imageType = 'JPEG',
        imageQuality = 0.92,
    } = options;

    const pixelRatio = Math.max(window.devicePixelRatio || 1, 2);

    const imageDataUrl =
        imageType === 'PNG'
            ? await toPng(target, {
                  cacheBust: true,
                  pixelRatio,
                  fontEmbedCSS: '',
                  backgroundColor: '#ffffff',
              })
            : await toJpeg(target, {
                  cacheBust: true,
                  pixelRatio,
                  fontEmbedCSS: '',
                  quality: imageQuality,
                  backgroundColor: '#ffffff',
              });

    const image = await loadImage(imageDataUrl);

    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const usableWidth = pageWidth - marginMm * 2;
    const usableHeight = pageHeight - marginMm * 2;

    const imageWidth = usableWidth;
    const imageHeight = (image.height * imageWidth) / image.width;

    if (imageHeight <= usableHeight) {
        pdf.addImage(imageDataUrl, imageType, marginMm, marginMm, imageWidth, imageHeight, undefined, 'FAST');
        pdf.save(fileName);
        return;
    }

    let remainingHeight = imageHeight;
    let offsetY = 0;

    while (remainingHeight > 0) {
        if (offsetY > 0) {
            pdf.addPage();
        }

        pdf.addImage(
            imageDataUrl,
            imageType,
            marginMm,
            marginMm - offsetY,
            imageWidth,
            imageHeight,
            undefined,
            'FAST',
        );

        remainingHeight -= usableHeight;
        offsetY += usableHeight;
    }

    pdf.save(fileName);
}

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('No se pudo procesar la imagen para el PDF.'));
        image.src = dataUrl;
    });
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
