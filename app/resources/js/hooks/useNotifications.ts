import { useCashRegisterPendingServiceNotifications } from '@/hooks/useCashRegisterPendingServiceNotifications';
import { useReceptionPaymentNotifications } from '@/hooks/medical';
import { type AppNotification, type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const MAX_NOTIFICATIONS = 20;

function buildRealtimeNotification(
    notification: Omit<AppNotification, 'read' | 'readAt'>,
): AppNotification {
    return {
        ...notification,
        read: false,
        readAt: null,
    };
}

export function useNotifications() {
    const page = usePage<SharedData>();
    const { auth, notifications: sharedNotifications } = page.props;
    const [notifications, setNotifications] = useState<AppNotification[]>(
        sharedNotifications?.items ?? [],
    );

    const canSeeCashNotifications =
        auth.user.permissions?.includes('cash_register.view') ?? false;
    const canSeeReceptionNotifications =
        auth.user.permissions?.includes('access-medical-system') ?? false;

    useEffect(() => {
        setNotifications(sharedNotifications?.items ?? []);
    }, [sharedNotifications?.items]);

    useCashRegisterPendingServiceNotifications(
        (event) => {
            if (!canSeeCashNotifications) {
                return;
            }

            const patientName = event.service_request.patient_name;
            const message = patientName
                ? `${event.message} · ${patientName}`
                : event.message;

            setNotifications((previous) => [
                buildRealtimeNotification({
                    id: `realtime-cash-created-${event.service_request.request_number}-${Date.now()}`,
                    message,
                    createdAt: new Date().toISOString(),
                    href: '/cash-register/pending-services',
                    source: 'cash',
                    type: 'pending-service-created',
                    serviceRequest: {
                        id: event.service_request.id,
                        requestNumber: event.service_request.request_number,
                        patientName: event.service_request.patient_name ?? null,
                    },
                }),
                ...previous,
            ].slice(0, MAX_NOTIFICATIONS));
        },
        (event) => {
            if (!canSeeCashNotifications) {
                return;
            }

            const patientName = event.service_request.patient_name;
            const message = patientName
                ? `${event.message} · ${patientName}`
                : event.message;

            setNotifications((previous) => [
                buildRealtimeNotification({
                    id: `realtime-cash-cancelled-${event.service_request.request_number}-${Date.now()}`,
                    message,
                    createdAt: new Date().toISOString(),
                    href: '/cash-register/pending-services',
                    source: 'cash',
                    type: 'pending-service-cancelled',
                    serviceRequest: {
                        id: event.service_request.id,
                        requestNumber: event.service_request.request_number,
                        patientName: event.service_request.patient_name ?? null,
                    },
                }),
                ...previous,
            ].slice(0, MAX_NOTIFICATIONS));
        },
    );

    useReceptionPaymentNotifications((event) => {
        if (!canSeeReceptionNotifications) {
            return;
        }

        const patientName = event.service_request.patient_name;
        const message = patientName
            ? `${event.message} · ${patientName}`
            : event.message;

        setNotifications((previous) => [
            buildRealtimeNotification({
                id: `realtime-reception-payment-${event.service_request.id}-${Date.now()}`,
                message,
                createdAt: new Date().toISOString(),
                href: '/medical/reception',
                source: 'reception',
                type: 'payment-updated',
                serviceRequest: {
                    id: event.service_request.id,
                    requestNumber: event.service_request.request_number,
                    patientName: event.service_request.patient_name ?? null,
                },
            }),
            ...previous,
        ].slice(0, MAX_NOTIFICATIONS));
    });

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.read).length,
        [notifications],
    );

    const openNotification = (notification: AppNotification) => {
        if (!notification.read && !notification.id.startsWith('realtime-')) {
            setNotifications((previous) =>
                previous.map((item) =>
                    item.id === notification.id
                        ? { ...item, read: true, readAt: new Date().toISOString() }
                        : item,
                ),
            );

            router.post(
                `/notifications/${notification.id}/read`,
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['notifications'],
                    onFinish: () => router.visit(notification.href),
                },
            );

            return;
        }

        router.visit(notification.href);
    };

    const markAllAsRead = () => {
        const now = new Date().toISOString();

        setNotifications((previous) =>
            previous.map((notification) => ({
                ...notification,
                read: true,
                readAt: notification.readAt ?? now,
            })),
        );

        router.post(
            '/notifications/read-all',
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: ['notifications'],
            },
        );
    };

    return {
        notifications,
        unreadCount,
        openNotification,
        markAllAsRead,
    };
}
