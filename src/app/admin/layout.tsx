"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin-login");
  }

  const navItems = [
    { label: "Dashboard", href: "/admin" },
    { label: "Leads", href: "/admin/leads" },
    { label: "Sequences", href: "/admin/sequences" },
    { label: "Composer", href: "/admin/composer" },
    { label: "Analytics", href: "/admin/analytics" },
  ];

  return (
    <div className="flex min-h-screen bg-[#f3f3f3]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 h-screen w-56 border-r border-[#121212]/10 bg-white transition-transform md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col px-4 py-6">
          <Link href="/" className="mb-10 px-3 text-sm tracking-[0.2em] uppercase text-[#121212]">
            Daniel Philip
          </Link>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="block px-3 py-2 text-sm text-[#121212]/60 hover:text-[#121212]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#121212]/40 hover:text-[#121212]"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {/* Mobile header */}
        <header className="border-b border-[#121212]/10 bg-white p-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[#121212]"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Page content */}
        <div className="p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}
