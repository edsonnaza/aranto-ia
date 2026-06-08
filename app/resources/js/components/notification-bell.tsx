import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { Bell } from 'lucide-react';

export function NotificationBell() {
    const { notifications, unreadCount, openNotification, markAllAsRead } =
        useNotifications();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="relative h-9 w-9 border-border bg-background text-foreground"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Notificaciones</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                {notifications.length > 0 && (
                    <>
                        <DropdownMenuItem
                            onSelect={(event) => {
                                event.preventDefault();
                                markAllAsRead();
                            }}
                            className="cursor-pointer text-xs text-muted-foreground"
                        >
                            Marcar todas como leidas
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                    <DropdownMenuItem disabled>
                        Sin notificaciones nuevas
                    </DropdownMenuItem>
                ) : (
                    notifications.map((notification) => (
                        <DropdownMenuItem
                            key={notification.id}
                            onSelect={(event) => {
                                event.preventDefault();
                                openNotification(notification);
                            }}
                            className="cursor-pointer"
                        >
                            <div className="flex w-full flex-col gap-1">
                                <span className="text-sm leading-tight">
                                    {notification.message}
                                </span>
                                <span
                                    className={cn(
                                        'text-xs',
                                        notification.read
                                            ? 'text-muted-foreground'
                                            : 'font-semibold text-foreground',
                                    )}
                                >
                                    {new Date(notification.createdAt).toLocaleTimeString(
                                        'es-PY',
                                        {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        },
                                    )}
                                </span>
                            </div>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
