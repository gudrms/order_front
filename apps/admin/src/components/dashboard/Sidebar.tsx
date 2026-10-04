'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, LogOut, Menu, X } from 'lucide-react';
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const media = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => { if (media.matches) setOpen(false); };
    media.addEventListener('change', closeOnDesktop);
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      media.removeEventListener('change', closeOnDesktop);
      triggerRef.current?.focus();
    };
  }, [open]);

  const content = (
    <>
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <Store className="w-6 h-6" />
          Order Admin
        </h2>
      </div>

      <nav aria-label="관리자 메뉴" className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive ? 'page' : undefined}
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
    </>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">{content}</aside>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-label="메뉴 열기" aria-expanded={open} aria-controls="admin-mobile-menu" className="fixed left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm md:hidden">
        <Menu size={22} />
      </button>
      <dialog ref={dialogRef} id="admin-mobile-menu" aria-label="관리자 메뉴" onCancel={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }} className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/40">
        <div className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white">
          <button type="button" onClick={() => setOpen(false)} aria-label="메뉴 닫기" className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"><X size={20} /></button>
          {open && content}
        </div>
      </dialog>
    </>
  );
}
