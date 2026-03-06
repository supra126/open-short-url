'use client';

import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Link as LinkIcon,
  PlusCircle,
  Package,
  BarChart3,
  Key,
  User,
  Users,
  Webhook,
  Bot,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-auth';
import { useAIEnabled } from '@/hooks/use-ai-enabled';
import { t } from '@/lib/i18n';
import type { LucideIcon } from 'lucide-react';

// Navigation item type
interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

// Navigation group type
interface NavGroup {
  title: string;
  items: NavItem[];
  aiOnly?: boolean;
}

// Menu data
const data = {
  navMain: [
    {
      title: t('sidebar.overview'),
      items: [
        {
          title: t('sidebar.dashboard'),
          url: '/',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: t('sidebar.urlManagement'),
      items: [
        {
          title: t('sidebar.urlList'),
          url: '/urls',
          icon: LinkIcon,
        },
        {
          title: t('sidebar.createUrl'),
          url: '/urls/new',
          icon: PlusCircle,
        },
        {
          title: t('bundles.title'),
          url: '/bundles',
          icon: Package,
        },
      ],
    },
    {
      title: t('sidebar.analytics'),
      items: [
        {
          title: t('sidebar.statisticsAnalytics'),
          url: '/analytics',
          icon: BarChart3,
        },
      ],
    },
    {
      title: t('sidebar.system'),
      items: [
        {
          title: t('sidebar.apiKeys'),
          url: '/api-keys',
          icon: Key,
        },
        {
          title: t('webhooks.title'),
          url: '/webhooks',
          icon: Webhook,
        },
        {
          title: t('sidebar.auditLogs'),
          url: '/audit-logs',
          icon: ClipboardList,
          adminOnly: true,
        },
        {
          title: t('sidebar.users'),
          url: '/users',
          icon: Users,
          adminOnly: true,
        },
      ],
    },
    {
      title: t('sidebar.ai'),
      aiOnly: true,
      items: [
        {
          title: t('sidebar.aiAssistant'),
          url: '/ai-chat',
          icon: Bot,
        },
      ],
    },
  ],
};

// Avatar with initials
function UserAvatar({ name, email }: { name?: string | null; email: string }) {
  const displayName = name || email.split('@')[0];
  const initials = displayName
    .split(/[\s._-]/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
      {initials}
    </div>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data: user, isLoading } = useCurrentUser();
  const { isEnabled: isAIEnabled } = useAIEnabled();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          {process.env.NEXT_PUBLIC_BRAND_ICON_URL ? (
            <div className="min-w-5 min-h-5 h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={process.env.NEXT_PUBLIC_BRAND_ICON_URL}
                alt={t('sidebar.brandIconAlt')}
                className="h-full w-full object-contain brightness-0 dark:invert"
              />
            </div>
          ) : (
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <LinkIcon className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-display font-semibold">
              {process.env.NEXT_PUBLIC_BRAND_NAME || t('sidebar.appName')}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {process.env.NEXT_PUBLIC_BRAND_DESCRIPTION ||
                t('sidebar.appDescription')}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {data.navMain.filter((group: NavGroup) => !group.aiOnly || isAIEnabled).map((group: NavGroup, groupIndex: number) => (
          <React.Fragment key={group.title}>
            {groupIndex > 0 && <SidebarSeparator className="mx-3" />}
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items
                    .filter((item: NavItem) => {
                      if (item.adminOnly && user?.role !== 'ADMIN') {
                        return false;
                      }
                      return true;
                    })
                    .map((item: NavItem) => {
                      const isActive = pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.title}
                            className={isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-[3px] border-l-primary rounded-l-none' : ''}
                          >
                            <Link href={item.url}>
                              <item.icon className={isActive ? 'text-primary' : ''} />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </React.Fragment>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild={!!user}
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {user ? (
                <Link href="/profile">
                  <UserAvatar name={user.name} email={user.email} />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user.name || user.email.split('@')[0]}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </Link>
              ) : (
                <>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <User className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {isLoading ? t('common.loading') : t('common.user')}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {t('common.noValue')}
                    </span>
                  </div>
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
