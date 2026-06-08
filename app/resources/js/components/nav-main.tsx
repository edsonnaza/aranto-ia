import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarMenuAction,
    useSidebar,
} from '@/components/ui/sidebar';
import { resolveUrl } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const { isMobile } = useSidebar();
    const [openItems, setOpenItems] = useState<Set<string>>(new Set());

    const toggleItem = (title: string) => {
        const newOpen = new Set(openItems);
        if (newOpen.has(title)) {
            newOpen.delete(title);
        } else {
            newOpen.add(title);
        }
        setOpenItems(newOpen);
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const hasSubItems = item.items && item.items.length > 0;
                    const isActive = item.href 
                        ? page.url.startsWith(resolveUrl(item.href))
                        : item.items?.some(subitem => 
                            subitem.href && page.url.startsWith(resolveUrl(subitem.href))
                          );

                    if (hasSubItems) {
                        return (
                            <Collapsible
                                key={item.title}
                                asChild
                                defaultOpen={isActive || openItems.has(item.title)}
                                onOpenChange={() => toggleItem(item.title)}
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={{ children: item.title }}
                                            isActive={isActive}
                                        >
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.items.map((subitem) => {
                                                const hasNestedItems = subitem.items && subitem.items.length > 0;
                                                
                                                if (hasNestedItems) {
                                                    return (
                                                        <Collapsible
                                                            key={subitem.title}
                                                            asChild
                                                            defaultOpen={openItems.has(subitem.title)}
                                                            onOpenChange={() => toggleItem(subitem.title)}
                                                        >
                                                            <SidebarMenuSubItem>
                                                                <CollapsibleTrigger asChild>
                                                                    <SidebarMenuSubButton>
                                                                        <span>{subitem.title}</span>
                                                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                                    </SidebarMenuSubButton>
                                                                </CollapsibleTrigger>
                                                                <CollapsibleContent>
                                                                    <SidebarMenuSub>
                                                                        {subitem.items.map((nestedItem) => (
                                                                            <SidebarMenuSubItem key={nestedItem.title}>
                                                                                <SidebarMenuSubButton asChild>
                                                                                    <Link href={resolveUrl(nestedItem.href!)}>
                                                                                        <span>{nestedItem.title}</span>
                                                                                    </Link>
                                                                                </SidebarMenuSubButton>
                                                                            </SidebarMenuSubItem>
                                                                        ))}
                                                                    </SidebarMenuSub>
                                                                </CollapsibleContent>
                                                            </SidebarMenuSubItem>
                                                        </Collapsible>
                                                    );
                                                }

                                                return (
                                                    <SidebarMenuSubItem key={subitem.title}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={
                                                                subitem.href
                                                                    ? page.url.startsWith(
                                                                          resolveUrl(subitem.href),
                                                                      )
                                                                    : false
                                                            }
                                                        >
                                                            <Link href={resolveUrl(subitem.href!)}>
                                                                <span>{subitem.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                );
                                            })}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        );
                    }

                    // Item sin subitems
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={page.url.startsWith(
                                    resolveUrl(item.href!),
                                )}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={resolveUrl(item.href!)} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
