"use client";

import { useState, useEffect } from "react";
import { Users, Zap, Mail, TrendingUp, Globe, BarChart3 } from "lucide-react";

interface DashboardStats {
  totalLeads: number;
  activeSequences: number;
  totalEmails: number;
  openRate: number;
  deliveryRate: number;
  bounceRate: number;
  unsubscribed: number;
  countryBreakdown: Record<string, number>;
  platformBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  dailyStats: Record<string, { sent: number; opened: number; clicked: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalLeads: data.totalLeads || 0,
            activeSequences: data.activeSequences || 0,
            totalEmails: data.totalEmails || 0,
            openRate: data.openRate || 0,
            deliveryRate: data.deliveryRate || 0,
            bounceRate: data.bounceRate || 0,
            unsubscribed: data.unsubscribed || 0,
            countryBreakdown: data.countryBreakdown || {},
            platformBreakdown: data.platformBreakdown || {},
            sourceBreakdown: data.sourceBreakdown || {},
            dailyStats: data.dailyStats || {},
          });
        }
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
      value: loading ? "..." : (stats?.totalLeads ?? 0).toLocaleString(),
      icon: Users,
      color: "from-blue-500 to-blue-600",
      shadowColor: "shadow-blue-500/20",
    },
    {
      label: "Emails Sent",
      value: loading ? "..." : (stats?.totalEmails ?? 0).toLocaleString(),
      icon: Mail,
      color: "from-green-500 to-emerald-600",
      shadowColor: "shadow-green-500/20",
    },
    {
      label: "Open Rate",
      value: loading ? "..." : `${stats?.openRate ?? 0}%`,
      icon: TrendingUp,
      color: "from-orange-400 to-orange-500",
      shadowColor: "shadow-orange-500/20",
    },
    {
      label: "Delivery Rate",
      value: loading ? "..." : `${stats?.deliveryRate ?? 0}%`,
      icon: Zap,
      color: "from-purple-500 to-violet-600",
      shadowColor: "shadow-purple-500/20",
    },
    {
      label: "Unsubscribed",
      value: loading ? "..." : (stats?.unsubscribed ?? 0).toString(),
      icon: Users,
      color: "from-red-500 to-rose-600",
      shadowColor: "shadow-red-500/20",
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
          </div>
        ))}
      </div>

      {/* Country & Platform Analytics */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Globe size={16} className="text-[var(--accent-blue)]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Leads by Country
            </h2>
          </div>
          <div className="space-y-2.5">
            {loading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading...</p>
            ) : (
              (() => {
                const countries = Object.entries(stats?.countryBreakdown || {})
                  .filter(([k]) => k !== "Unknown" && k !== "Other")
                  .sort((a, b) => b[1] - a[1]);
                const unknown =
                  (stats?.countryBreakdown?.["Unknown"] || 0) +
                  (stats?.countryBreakdown?.["Other"] || 0);
                const total = stats?.totalLeads || 1;
                const topCountries = countries.slice(0, 8);
                return (
                  <>
                    {topCountries.map(([country, count]) => (
                      <div key={country}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm text-[var(--text-primary)]">
                            {country}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {count} ({Math.round((count / total) * 100)}%)
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-primary)]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)]"
                            style={{ width: `${Math.max(2, (count / total) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {unknown > 0 && (
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm text-[var(--text-secondary)]">
                            Other / Unknown
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {unknown} ({Math.round((unknown / total) * 100)}%)
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-primary)]">
                          <div
                            className="h-full rounded-full bg-gray-500/50"
                            style={{ width: `${Math.max(2, (unknown / total) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-[var(--accent-purple)]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Platform & Emails
            </h2>
          </div>

          {/* Platform breakdown */}
          <h3 className="mb-2 text-xs font-medium text-[var(--text-muted)]">
            LEAD SOURCE PLATFORM
          </h3>
          <div className="mb-5 space-y-2">
            {!loading &&
              Object.entries(stats?.platformBreakdown || {})
                .sort((a, b) => b[1] - a[1])
                .map(([platform, count]) => {
                  const total = stats?.totalLeads || 1;
                  const colors: Record<string, string> = {
                    instagram: "from-pink-500 to-purple-500",
                    facebook: "from-blue-500 to-blue-600",
                  };
                  return (
                    <div key={platform}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm capitalize text-[var(--text-primary)]">
                          {platform}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {count} ({Math.round((count / total) * 100)}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-primary)]">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${colors[platform] || "from-gray-500 to-gray-600"}`}
                          style={{ width: `${Math.max(2, (count / total) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* Daily email stats */}
          <h3 className="mb-2 text-xs font-medium text-[var(--text-muted)]">
            RECENT EMAIL ACTIVITY
          </h3>
          <div className="space-y-2">
            {!loading &&
              Object.entries(stats?.dailyStats || {})
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, 5)
                .map(([date, data]) => (
                  <div
                    key={date}
                    className="flex items-center justify-between rounded-lg bg-[var(--bg-primary)] px-3 py-2.5"
                  >
                    <span className="text-sm text-[var(--text-secondary)]">
                      {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-[var(--text-muted)]">
                        <span className="font-medium text-[var(--accent-green)]">{data.sent}</span> sent
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        <span className="font-medium text-[var(--accent-blue)]">{data.opened}</span> opened
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "New Broadcast", href: "/admin/composer" },
            { label: "View Leads", href: "/admin/leads" },
            { label: "Sequences", href: "/admin/sequences" },
            { label: "Analytics", href: "/admin/analytics" },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-all hover:border-[var(--accent-blue)]/30 hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
            >
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
