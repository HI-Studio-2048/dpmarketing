"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Users,
  Upload,
  Mail,
  PenTool,
  BarChart3,
  Zap,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin-login");
  }

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Leads", href: "/admin/leads", icon: Users },
    { label: "Import", href: "/admin/import", icon: Upload },
    { label: "Sequences", href: "/admin/sequences", icon: Zap },
    { label: "Composer", href: "/admin/composer", icon: PenTool },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ];

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href);
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 flex h-screen w-[240px] flex-col bg-[var(--bg-sidebar)] transition-transform md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-[var(--border-color)] px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)]">
            <Mail size={16} className="text-white" />
          </div>
          <Link href="/" className="text-base font-semibold text-white">
            Daniel Philip
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Menu
          </p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${
                    active
                      ? "bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] text-white shadow-lg shadow-[var(--accent-blue)]/20"
                      : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-[var(--border-color)] p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[var(--text-muted)] transition-all hover:bg-[var(--hover-bg)] hover:text-[var(--accent-red)]"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top header bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-primary)]/80 px-6 backdrop-blur-md">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[var(--text-secondary)] md:hidden"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)]" />
          </div>
        </header>

        {/* Page content */}
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
