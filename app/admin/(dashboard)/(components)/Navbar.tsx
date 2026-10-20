'use client';

import { useState } from 'react';
import {
  ArrowLeftIcon,
  Blocks,
  ChartBar,
  Package,
  ReceiptText,
  Tag,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/app/lib/auth-client';
import AdminNotificationCenter from './AdminNotificationCenter';

interface NavbarProps {
  user?: {
    id: string;
    email: string;
    name?: string | null;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const links = [
    { href: "/admin", label: "Dashboard", icon: Blocks, exact: true },
    { href: "/admin/sales", label: "Monthly Sales", icon: ChartBar, exact: false },
    { href: "/admin/manageOrders", label: "Manage Orders", icon: ReceiptText, exact: false },
    { href: "/admin/manageProducts", label: "Manage Products", icon: Package, exact: false },
    { href: "/admin/pricing", label: "Pricing & Shipping", icon: Tag, exact: false },
  ];

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await authClient.signOut();
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Failed to sign out:", err);
      setIsSigningOut(false);
    }
  };

  return (
    <nav className="flex w-full shrink-0 flex-col border-b border-neutral-200 bg-white px-4 py-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:px-5 md:py-8 print:hidden">
      <div className="border-b border-neutral-100 pb-4 md:pb-6">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-bold font-[Gebuk] tracking-tight truncate">
              Bellaro Admin
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5 truncate">Store Operations Console</p>
          </div>
          <div className="shrink-0">
            <AdminNotificationCenter />
          </div>
        </div>
      </div>

      {/* Admin User Info Pill */}
      {user?.email && (
        <div className="mt-3 px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-neutral-900 truncate">
              {user.name || "Admin"}
            </p>
            <p className="text-[10px] text-neutral-500 truncate" title={user.email}>
              {user.email}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 md:mt-6">
        <ul className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-black text-white shadow-sm"
                      : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                  }`}
                >
                  <Icon className="size-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 border-t border-neutral-100 pt-4 md:mt-auto md:pt-6 space-y-1">
        {/* Sign Out Button */}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          {isSigningOut ? (
            <>
              <span className="w-4 h-4 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin shrink-0" />
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <LogOut className="size-4 shrink-0" />
              <span>Sign Out</span>
            </>
          )}
        </button>

        {/* Return to Store */}
        <Link
          className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-xl transition"
          href="/"
        >
          <ArrowLeftIcon className="size-4 shrink-0" />
          <span>Back to Store</span>
        </Link>
      </div>
    </nav>
  );
}
