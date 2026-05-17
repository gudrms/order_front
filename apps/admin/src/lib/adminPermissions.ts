import {
  Activity,
  Bell,
  BookOpen,
  FileText,
  LayoutDashboard,
  Menu as MenuIcon,
  MessageSquareText,
  ShoppingBag,
  Store,
  type LucideIcon,
} from 'lucide-react';

export type AdminRole = 'ADMIN' | 'OWNER' | string;

export type AdminProfile = {
  id?: string;
  role?: AdminRole | null;
} | null | undefined;

export type AdminNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: AdminRole[];
};

export const adminNavItems: AdminNavItem[] = [
  { name: '대시보드', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'OWNER'] },
  { name: '주문 관리', href: '/orders', icon: ShoppingBag, roles: ['ADMIN', 'OWNER'] },
  { name: '직원 호출', href: '/calls', icon: Bell, roles: ['ADMIN', 'OWNER'] },
  { name: '메뉴 관리', href: '/menu', icon: MenuIcon, roles: ['ADMIN', 'OWNER'] },
  { name: '브랜드 메뉴', href: '/brand-menu', icon: BookOpen, roles: ['ADMIN'] },
  { name: '매장 관리', href: '/store', icon: Store, roles: ['ADMIN', 'OWNER'] },
  { name: '가맹 문의', href: '/franchise-inquiries', icon: MessageSquareText, roles: ['ADMIN'] },
  { name: '운영 관리', href: '/operations', icon: Activity, roles: ['ADMIN', 'OWNER'] },
  { name: '창업 문의', href: '/franchise-inquiries', icon: FileText, roles: ['ADMIN'] },
];

export function getAdminRole(profile: AdminProfile): AdminRole | null {
  return profile?.role || null;
}

export function isPlatformAdmin(profile: AdminProfile) {
  return getAdminRole(profile) === 'ADMIN';
}

export function isStoreOwner(profile: AdminProfile) {
  return getAdminRole(profile) === 'OWNER';
}

export function canAccessAdmin(profile: AdminProfile) {
  const role = getAdminRole(profile);
  return role === 'ADMIN' || role === 'OWNER';
}

export function canCreateStore(profile: AdminProfile) {
  return isPlatformAdmin(profile);
}

export function isPendingUser(profile: AdminProfile) {
  return getAdminRole(profile) === 'USER';
}

export function canAccessPath(profile: AdminProfile, pathname: string) {
  if (pathname === '/setup') return true;
  if (pathname === '/pending') return true;
  if (!canAccessAdmin(profile)) return false;

  const navItem = adminNavItems
    .slice()
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  if (!navItem) return false;
  const role = getAdminRole(profile);
  return !!role && navItem.roles.includes(role);
}

export function getVisibleAdminNavItems(profile: AdminProfile) {
  const role = getAdminRole(profile);
  if (!role) return [];
  return adminNavItems.filter((item) => item.roles.includes(role));
}
