import { Link } from '@inertiajs/react';
import { LayoutGrid, Ticket, FileText, Users, DollarSign, Heart, ShieldCheck } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { id_cards } from '@/lib/routes-helpers';
import type { NavItem } from '@/types';
import { useCurrentUrl } from '@/hooks/use-current-url';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'All ID Cards',
        href: id_cards.index(),
        icon: FileText,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Create Ticket',
        href: 'http://172.16.1.5:8000/helpdesk/ticket-view/',
        icon: Ticket,
    },
];

const deptItems = [
    { title: 'Admin',   href: `${id_cards.index()}?department=admin`,   icon: ShieldCheck },
    { title: 'HR',      href: `${id_cards.index()}?department=hr`,      icon: Users       },
    { title: 'Finance', href: `${id_cards.index()}?department=finance`, icon: DollarSign  },
    { title: 'Nurse',   href: `${id_cards.index()}?department=nurse`,   icon: Heart       },
];

export function AppSidebar() {
    const { isCurrentUrl } = useCurrentUrl();

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

                {/* Department shortcuts */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Departments</SidebarGroupLabel>
                    <SidebarMenu>
                        {deptItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(item.href)}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
