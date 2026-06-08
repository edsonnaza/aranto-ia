
import React, { forwardRef } from 'react';

interface ReceiptPrintProps {
  companyName?: string;
  serviceNumber: string;
  patientName: string;
  professionalName: string;
  serviceName: string;
  amount: number;
  paymentMethod: string;
  posNumber?: string;
  cardType?: string;
  date: string;
  notes?: string;
}

// Componente reutilizable para impresión de ticket
export const ReceiptPrint = forwardRef<HTMLDivElement, ReceiptPrintProps>(({
  companyName,
  serviceNumber,
  patientName,
  professionalName,
  serviceName,
  amount,
  paymentMethod,
  posNumber,
  cardType,
  date,
  notes,
}, ref) => {
  const paymentMethodLabels: Record<string, string> = {
    cash: 'Efectivo',
    debit: 'Tarjeta de Débito',
    credit: 'Tarjeta de Crédito',
    transfer: 'Transferencia',
    digital: 'Pago Digital',
  };
  const paymentMethodLabel = paymentMethodLabels[paymentMethod] || paymentMethod;
  return (
    <div ref={ref} style={{ fontFamily: 'monospace', width: 320, padding: 16 }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>{companyName}</div>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>COMPROBANTE DE PAGO</div>
      <hr />
      <div>Fecha: {date}</div>
      <div>Servicio: {serviceNumber}</div>
      <div>Paciente: {patientName}</div>
      <div>Profesional: {professionalName}</div>
      <div>Detalle: {serviceName}</div>
      <div>Monto: {amount.toLocaleString('es-PY', { style: 'currency', currency: 'PYG' })}</div>
      <div>Método: {paymentMethodLabel}</div>
      {cardType && <div>Tipo Tarjeta: {cardType}</div>}
      {posNumber && <div>N° POS: {posNumber}</div>}
      {notes && <div>Notas: {notes}</div>}
      <hr />
      <div style={{ textAlign: 'center', fontSize: 12 }}>Gracias por su pago</div>
    </div>
  );
});

ReceiptPrint.displayName = 'ReceiptPrint';
