"use client";

import { useState, useEffect } from "react";
import { Users, Zap, Mail, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface DashboardStats {
  totalLeads: number;
  activeSequences: number;
  emailsSent: number;
  openRate: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    activeSequences: 0,
    emailsSent: 0,
    openRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [leadsRes, analyticsRes] = await Promise.all([
          fetch("/api/admin/leads?limit=1"),
          fetch("/api/admin/analytics"),
        ]);
        const leadsData = await leadsRes.json();
        const analyticsData = await analyticsRes.json();

        setStats({
          totalLeads: leadsData.total || 0,
          activeSequences: 1,
          emailsSent: analyticsData.totalEmails || 0,
          openRate: analyticsData.openRate || 0,
        });
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Total Leads",
      value: loading ? "..." : stats.totalLeads.toLocaleString(),
      change: "+24%",
      trend: "up" as const,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      shadowColor: "shadow-blue-500/20",
    },
    {
      label: "Emails Sent",
      value: loading ? "..." : stats.emailsSent.toLocaleString(),
      change: "+14%",
      trend: "up" as const,
      icon: Mail,
      color: "from-green-500 to-emerald-600",
      shadowColor: "shadow-green-500/20",
    },
    {
      label: "Open Rate",
      value: loading ? "..." : `${stats.openRate}%`,
      change: "-2%",
      trend: "down" as const,
      icon: TrendingUp,
      color: "from-orange-400 to-orange-500",
      shadowColor: "shadow-orange-500/20",
    },
    {
      label: "Active Sequences",
      value: loading ? "..." : stats.activeSequences.toString(),
      change: "+18%",
      trend: "up" as const,
      icon: Zap,
      color: "from-purple-500 to-violet-600",
      shadowColor: "shadow-purple-500/20",
    },
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white md:text-2xl">
              Welcome Back, Daniel
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Here&apos;s what&apos;s happening with your email campaigns today.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="h-20 w-20 rounded-full bg-white/10 p-4">
              <Mail className="h-full w-full text-white/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[var(--text-secondary)]">
                  {card.label}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                  {card.value}
                </h3>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-lg ${card.shadowColor}`}
              >
                <card.icon size={22} className="text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              {card.trend === "up" ? (
                <ArrowUpRight size={14} className="text-[var(--accent-green)]" />
              ) : (
                <ArrowDownRight size={14} className="text-[var(--accent-red)]" />
              )}
              <span
                className={`text-xs font-medium ${
                  card.trend === "up"
                    ? "text-[var(--accent-green)]"
                    : "text-[var(--accent-red)]"
                }`}
              >
                {card.change}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                vs last month
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Status */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            System Status
          </h2>
          <div className="space-y-3">
            {[
              { label: "Dashboard", status: "Online" },
              { label: "Email Engine", status: "Active" },
              { label: "Lead Collection", status: "Running" },
              { label: "Webhook Tracking", status: "Active" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg bg-[var(--bg-primary)] px-4 py-3"
              >
                <span className="text-sm text-[var(--text-secondary)]">
                  {item.label}
                </span>
                <span className="flex items-center gap-2 text-xs font-medium text-[var(--accent-green)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-green)]" />
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "New Broadcast", href: "/admin/composer", color: "from-blue-500 to-blue-600" },
              { label: "View Leads", href: "/admin/leads", color: "from-green-500 to-emerald-600" },
              { label: "Sequences", href: "/admin/sequences", color: "from-orange-400 to-orange-500" },
              { label: "Analytics", href: "/admin/analytics", color: "from-purple-500 to-violet-600" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center justify-center rounded-lg bg-[var(--bg-primary)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
              >
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
