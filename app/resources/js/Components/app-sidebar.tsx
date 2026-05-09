import type { NavItem } from '@/types';
import type { NavigationItem } from '@/utils/navigation';
// Helper para convertir NavigationItem[] a NavItem[]
function navigationToNavItems(items: NavigationItem[]): NavItem[] {
    return items.map((item) => ({
        title: item.title,
        href: typeof item.href === 'object' && item.href?.url ? item.href.url : item.href ?? '',
        icon: item.icon ?? null,
        isActive: item.isActive,
        items: item.items ? navigationToNavItems(item.items) : undefined,
    }))
}
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { Link, usePage } from '@inertiajs/react';
import { getNavigationForUser } from '@/utils/navigation';
import AppLogo from './app-logo';

interface AuthUser {
    id: number;
    name: string;
    email: string;
    permissions?: string[];
    roles?: string[];
    [key: string]: unknown;
}


export function AppSidebar() {
    const page = usePage<{ auth: { user: AuthUser | null } }>();
    const userPermissions = page.props.auth.user?.permissions || [];
    const mainNavItems = navigationToNavItems(getNavigationForUser(userPermissions));

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
