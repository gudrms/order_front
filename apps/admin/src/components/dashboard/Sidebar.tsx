'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminRole, getVisibleAdminNavItems } from '@/lib/adminPermissions';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut, user, profile } = useAuth();
  const menuItems = getVisibleAdminNavItems(profile);
  const role = getAdminRole(profile);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <Store className="w-6 h-6" />
          Order Admin
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-4">
        <div className="px-4 py-2">
          <p className="text-xs text-gray-400 uppercase tracking-wider">계정</p>
          <p className="text-sm font-medium text-gray-700 truncate mt-1">
            {user?.email}
          </p>
          {role && (
            <p className="mt-1 text-xs font-medium text-gray-400">
              {role === 'ADMIN' ? '전체관리자' : '매장관리자'}
            </p>
          )}
        </div>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
