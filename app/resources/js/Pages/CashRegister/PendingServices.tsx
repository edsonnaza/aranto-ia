import { Head, router } from '@inertiajs/react';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, PaginatedData } from '@/components/ui/data-table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { PaymentModal } from '@/components/cash-register/payment-modal';
import ServiceRequestDetailsModal from '@/components/cash-register/service-request-details-modal';
import { useCurrencyFormatter } from '@/stores/currency';
import { type BreadcrumbItem } from '@/types';
import { getReceptionTypeConfig } from '@/hooks/medical/useReceptionTypeLabel';
import {  CreditCard, Eye } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Tesorería',
        href: '/cash-register',
    },
    {
        title: 'Cobro de Servicios',
        href: '/cash-register/pending-services',
    },
];

interface ServiceRequest {
  id: number;
  request_number: string;
  patient_name: string;
  patient_document: string;
  patient_id: number;
  request_date: string;
  request_time: string;
  status: string;
  payment_status: string;
  reception_type: string;
  priority: string;
  total_amount: number;
  paid_amount?: number;
  remaining_amount?: number;
  services: Array<{
    id: number;
    service_name: string;
    service_code: string;
    professional_name: string;
    insurance_type: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  created_at: string;
}

interface Professional {
  id: number;
  first_name: string;
  last_name: string;
}

interface PendingServicesProps {
  serviceRequests: PaginatedData<ServiceRequest>;
  professionals: Professional[];
  insuranceTypes: { id: number; name: string }[];
  filters: {
    status?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    professional_id?: string;
    insurance_type?: string;
    payment_status?: string;
  };
  summary: {
    pending_count: number;
    pending_total: number;
    paid_total: number;
  };
}

export default function PendingServices({
  serviceRequests,
  insuranceTypes,
  filters,
  summary,
}: PendingServicesProps) {
  const { toFrontend } = useDateFormat();
  const { toBackend } = useDateFormat();
  const { format: formatCurrency } = useCurrencyFormatter();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceRequest | null>(null);

  const getPaymentStatusBadge = (paymentStatus: string) => {
    type StatusKey = 'pending' | 'partial' | 'paid' | 'cancelled';
    const statusConfig: Record<StatusKey, { label: string; variant: 'pending' | 'secondary' | 'paid' | 'cancelled' }> = {
      pending: { label: 'Pendiente', variant: 'pending' },
      partial: { label: 'Parcial', variant: 'secondary' },
      paid: { label: 'Pagado', variant: 'paid' },
      cancelled: { label: 'Cancelado', variant: 'cancelled' },
    };
    const key: StatusKey = (['pending','partial','paid','cancelled'].includes(paymentStatus) ? paymentStatus : 'partial') as StatusKey;
    const config = statusConfig[key];
    return <Badge variant={config.variant}>{config.label}</Badge>;
    // Si tu Badge no soporta 'info', 'success', 'muted', adapta a tus variantes de Tailwind:
    // destructive: rojo, secondary: celeste, default: verde, outline: gris
    // Si Badge solo soporta los originales, usa:
    // paid: 'default', cancelled: 'outline', pending: 'destructive', partial: 'secondary'
  };

  const getReceptionTypeBadge = (type: string) => {
    const { label, variant } = getReceptionTypeConfig(type);
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleProcessPayment = (serviceRequest: ServiceRequest) => {
    setSelectedService(serviceRequest);
    setIsPaymentModalOpen(true);
  };

  const handleViewDetails = (serviceRequest: ServiceRequest) => {
    setSelectedService(serviceRequest);
    setIsDetailsModalOpen(true);
  };

  const handlePaymentProcessed = () => {
    // Refresca solo los datos necesarios usando Inertia
    router.reload({ only: ['serviceRequests', 'summary'] });
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedService(null);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedService(null);
  };

  // Adapter function to transform ServiceRequest to the format expected by PaymentModal
  // Adaptador para el tipo que espera PaymentModal
  type ModalServiceRequest = {
    id: string;
    service_number: string;
    patient_name: string;
    professional_name: string;
    service_name: string;
    total_cost: number;
    reception_type: string;
    status: string;
    created_at: string;
    paid_amount?: number;
    remaining_amount?: number;
    payment_status?: 'pending' | 'partial' | 'paid';
    services: Array<{
      id: string;
      service_name: string;
      professional_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      paid_amount?: number;
      payment_status?: 'pending' | 'partial' | 'paid';
    }>;
  };

  const getServiceForPayment = (request: ServiceRequest | null): ModalServiceRequest | null => {
    if (!request) return null;
    // Tomar el primer servicio para los campos principales
    const firstService = request.services[0] || {};
    return {
      id: String(request.id),
      service_number: request.request_number,
      patient_name: request.patient_name,
      professional_name: firstService.professional_name || '',
      service_name: firstService.service_name || '',
      total_cost: request.total_amount,
      reception_type: request.reception_type,
      status: request.status,
      created_at: request.created_at,
      paid_amount: request.paid_amount,
      remaining_amount: request.remaining_amount,
      payment_status: (['pending', 'partial', 'paid'].includes(request.payment_status) ? request.payment_status as 'pending' | 'partial' | 'paid' : undefined),
      services: request.services.map(s => ({
        id: String(s.id),
        service_name: s.service_name,
        professional_name: s.professional_name,
        quantity: s.quantity,
        unit_price: s.unit_price,
        total_price: s.total_price,
        paid_amount: undefined, // Por ahora no tenemos pago por servicio individual
        payment_status: undefined, // Por ahora no tenemos estado por servicio individual
      })),
    };
  };

  // Define columns for DataTable
  const columns = useMemo<ColumnDef<ServiceRequest>[]>(() => [
    {
      accessorKey: "request_number",
      header: "N° Solicitud",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("request_number")}</div>
      ),
    },
    {
      accessorKey: "patient_name",
      header: "Paciente",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.getValue("patient_name")}</div>
          <div className="text-xs text-muted-foreground">{row.original.patient_document}</div>
        </div>
      ),
    },
    {
      accessorKey: "services",
      header: "Servicios",
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.services.map((service, index) => (
            <div key={service.id} className="text-sm">
              <div className="font-medium">{service.service_name}</div>
              <div className="text-xs text-muted-foreground">{service.professional_name}</div>
              {index < row.original.services.length - 1 && <hr className="my-1" />}
            </div>
          ))}
        </div>
      ),
    },
      {
        accessorKey: "insurance_type",
        header: "Seguro",
        cell: ({ row }) => (
          <div className="space-y-1">
            {row.original.services.map((service, index) => (
              <div key={service.id} className="text-xs text-muted-foreground">
                {service.insurance_type || 'Sin seguro'}
                {index < row.original.services.length - 1 && <hr className="my-1" />}
              </div>
            ))}
          </div>
        ),
      },
    {
      accessorKey: "total_amount",
      header: "Monto",
      cell: ({ row }) => {
        const total = row.getValue("total_amount") as number;
        const paid = row.original.paid_amount || 0;
        const remaining = row.original.remaining_amount ?? (total - paid);
        
        return (
          <div className="text-right">
            {paid > 0 ? (
              <div className="space-y-1">
                <div className="font-medium text-green-600">
                  Pagado: {formatCurrency(paid)}
                </div>
                <div className="text-sm font-medium text-orange-600">
                  Pendiente: {formatCurrency(remaining)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total: {formatCurrency(total)}
                </div>
              </div>
            ) : (
              <div className="font-medium">
                {formatCurrency(total)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "request_date",
      header: "Fecha",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{toFrontend(row.getValue("request_date"))}</div>
          <div className="text-xs text-muted-foreground">{row.original.request_time}</div>
        </div>
      ),
    },
    {
      accessorKey: "payment_status",
      header: "Estado Pago",
      cell: ({ row }) => getPaymentStatusBadge(row.getValue("payment_status")),
    },
    {
      accessorKey: "reception_type",
      header: "Tipo",
      cell: ({ row }) => getReceptionTypeBadge(row.getValue("reception_type")),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex space-x-2">
            {(row.original.payment_status === 'pending' || row.original.payment_status === 'partial') && (
              <Button
                size="sm"
                onClick={() => handleProcessPayment(row.original)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                {row.original.payment_status === 'partial' ? 'COMPLETAR PAGO' : 'COBRAR'}
              </Button>
            )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewDetails(row.original)}
          >
            <Eye className="h-3 w-3 mr-1" />
            VER
          </Button>
        </div>
      ),
    },
  ], [formatCurrency, toFrontend]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Cobro de Servicios - Tesorería" />

      <div className="space-y-6">
        <HeadingSmall
          title="Cobro de Servicios"
          description="Gestión de cobros de servicios médicos solicitados en recepción"
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios Pendientes</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pending_count}</div>
              <p className="text-xs text-muted-foreground">
                Servicios por cobrar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monto Total Pendiente</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.pending_total)}</div>
              <p className="text-xs text-muted-foreground">
                En guaraníes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cobrado</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.paid_total)}
              </div>
              <p className="text-xs text-muted-foreground">
                Montos pagados en caja
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Services Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Servicios</CardTitle>
            <CardDescription>
              {serviceRequests.total} servicios encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={serviceRequests}
              initialInsuranceType={filters.insurance_type || ""}
              initialPaymentStatus={filters.payment_status || ""}
              searchPlaceholder="Buscar por número, paciente o documento..."
              emptyMessage="No se encontraron servicios con los filtros aplicados"
              dateRangeFilterable={true}
              insuranceFilterable={true}
              paymentStatusFilterable={true}
              insuranceTypeOptions={insuranceTypes}
              onDateRangeChange={({ from, to }) => {
                const params = new URLSearchParams(window.location.search);
                if (from) params.set('date_from', toBackend(from));
                else params.delete('date_from');
                if (to) params.set('date_to', toBackend(to));
                else params.delete('date_to');
                params.set('page', '1');
                const url = window.location.pathname + '?' + params.toString();
                router.get(url, {}, { preserveState: true, replace: true });
              }}
              initialDateFrom={filters.date_from || ""}
              initialDateTo={filters.date_to || ""}
            />
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        serviceRequest={getServiceForPayment(selectedService)}
        onPaymentProcessed={handlePaymentProcessed}
        companyName="Hospital Central"
      />     
      {/* Details Modal */}
      <ServiceRequestDetailsModal
        key={selectedService?.id ?? 'service-details'}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        serviceRequest={selectedService}
        onRefunded={() => window.location.reload()}
      />
    </AppLayout>
  );
}