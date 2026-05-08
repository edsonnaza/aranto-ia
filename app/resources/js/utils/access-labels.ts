const ROLE_LABELS: Record<string, string> = {
    'super-admin': 'Super Administrador',
    super_admin: 'Super Administrador',
    admin: 'Administrador',
    cashier: 'Cajero',
    cajero: 'Cajero',
    'medical-staff': 'Personal Medico',
    receptionist: 'Recepcionista',
    Recepcionista: 'Recepcionista',
    viewer: 'Visualizador',
    accountant: 'Contador',
    auditor: 'Auditor',
    supervisor: 'Supervisor',
};

const PERMISSION_LABELS: Record<string, string> = {
    'access-treasury': 'Acceso a Tesoreria',
    'access-commissions': 'Acceso a Comisiones',
    'access-financial': 'Acceso al modulo Financiero',
    'access-medical-system': 'Acceso al Sistema Medico',
    'access-reports': 'Acceso a Reportes',
    'access-settings': 'Acceso a Configuracion',
    'access-catalogs': 'Acceso a Catalogos',
    'access-user-management': 'Acceso a Gestion de Usuarios',
    'access-audit-logs': 'Acceso a Auditoria',
    'cash_register.view': 'Ver modulo de Caja',
    'cash_register.open': 'Abrir Caja',
    'cash_register.close': 'Cerrar Caja',
    'cash_register.process_payments': 'Procesar pagos en Caja',
    'cash_register.register_income': 'Registrar ingresos en Caja',
    'cash_register.register_expense': 'Registrar egresos en Caja',
    'cash_register.view_history': 'Ver historial de Caja',
    'cash_register.manage_sessions': 'Gestionar sesiones de Caja',
    'services.view': 'Ver servicios',
    'services.create': 'Crear servicios',
    'services.edit': 'Editar servicios',
    'services.delete': 'Eliminar servicios',
    'services.manage': 'Gestionar servicios',
    'reports.cash_register': 'Ver reportes de Caja',
    'reports.transactions': 'Ver reportes de transacciones',
    'reports.daily_summary': 'Ver resumen diario',
    'reports.monthly_summary': 'Ver resumen mensual',
    'audit.view': 'Ver auditoria',
    'audit.cash_register': 'Ver auditoria de Caja',
    'admin.cash_register': 'Administrar Caja',
    'admin.override_sessions': 'Anular restricciones de sesion',
};

const PERMISSION_GROUP_LABELS: Record<string, string> = {
    access: 'Accesos',
    cash_register: 'Caja',
    reports: 'Reportes',
    services: 'Servicios',
    audit: 'Auditoria',
    admin: 'Administracion',
};

function humanizeIdentifier(value: string): string {
    if (!value) return '';

    return value
        .replace(/[._-]+/g, ' ')
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export function getRoleLabel(roleName: string): string {
    return ROLE_LABELS[roleName] ?? humanizeIdentifier(roleName);
}

export function getPermissionLabel(permissionName: string): string {
    return PERMISSION_LABELS[permissionName] ?? humanizeIdentifier(permissionName);
}

export function getPermissionGroupLabel(groupName: string): string {
    return PERMISSION_GROUP_LABELS[groupName] ?? humanizeIdentifier(groupName);
}
