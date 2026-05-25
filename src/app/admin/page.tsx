"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Zap,
  Mail,
  TrendingUp,
  Globe,
  BarChart3,
  Send,
  ArrowUpRight,
  UserMinus,
  PenTool,
} from "lucide-react";

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

const COUNTRY_FLAGS: Record<string, string> = {
  India: "\u{1F1EE}\u{1F1F3}",
  Philippines: "\u{1F1F5}\u{1F1ED}",
  Indonesia: "\u{1F1EE}\u{1F1E9}",
  Japan: "\u{1F1EF}\u{1F1F5}",
  "US/Canada": "\u{1F1FA}\u{1F1F8}",
  UK: "\u{1F1EC}\u{1F1E7}",
  Australia: "\u{1F1E6}\u{1F1FA}",
  Ireland: "\u{1F1EE}\u{1F1EA}",
  Portugal: "\u{1F1F5}\u{1F1F9}",
  Spain: "\u{1F1EA}\u{1F1F8}",
  Finland: "\u{1F1EB}\u{1F1EE}",
  Italy: "\u{1F1EE}\u{1F1F9}",
  Malta: "\u{1F1F2}\u{1F1F9}",
  Greece: "\u{1F1EC}\u{1F1F7}",
  Croatia: "\u{1F1ED}\u{1F1F7}",
  Germany: "\u{1F1E9}\u{1F1EA}",
  France: "\u{1F1EB}\u{1F1F7}",
  "Saudi Arabia": "\u{1F1F8}\u{1F1E6}",
  UAE: "\u{1F1E6}\u{1F1EA}",
  "South Korea": "\u{1F1F0}\u{1F1F7}",
  Thailand: "\u{1F1F9}\u{1F1ED}",
  Malaysia: "\u{1F1F2}\u{1F1FE}",
  Singapore: "\u{1F1F8}\u{1F1EC}",
  Vietnam: "\u{1F1FB}\u{1F1F3}",
  Bangladesh: "\u{1F1E7}\u{1F1E9}",
  Pakistan: "\u{1F1F5}\u{1F1F0}",
  Nigeria: "\u{1F1F3}\u{1F1EC}",
  Brazil: "\u{1F1E7}\u{1F1F7}",
  Mexico: "\u{1F1F2}\u{1F1FD}",
};

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
      gradient: "from-blue-500/20 to-blue-600/5",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400",
      valueColor: "text-blue-300",
    },
    {
      label: "Emails Sent",
      value: loading ? "..." : (stats?.totalEmails ?? 0).toLocaleString(),
      icon: Send,
      gradient: "from-emerald-500/20 to-emerald-600/5",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      valueColor: "text-emerald-300",
    },
    {
      label: "Open Rate",
      value: loading ? "..." : `${stats?.openRate ?? 0}%`,
      icon: TrendingUp,
      gradient: "from-amber-500/20 to-amber-600/5",
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-400",
      valueColor: "text-amber-300",
    },
    {
      label: "Delivery Rate",
      value: loading ? "..." : `${stats?.deliveryRate ?? 0}%`,
      icon: Zap,
      gradient: "from-purple-500/20 to-purple-600/5",
      iconBg: "bg-purple-500/15",
      iconColor: "text-purple-400",
      valueColor: "text-purple-300",
    },
    {
      label: "Unsubscribed",
      value: loading ? "..." : (stats?.unsubscribed ?? 0).toString(),
      icon: UserMinus,
      gradient: "from-rose-500/20 to-rose-600/5",
      iconBg: "bg-rose-500/15",
      iconColor: "text-rose-400",
      valueColor: "text-rose-300",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-7 md:p-9">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-[var(--accent-blue)]/8 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[var(--accent-purple)]/8 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white md:text-3xl">
              Welcome back, Daniel
            </h1>
            <p className="mt-2 text-sm text-white/50">
              Here&apos;s your campaign overview for today.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 backdrop-blur-sm">
              <Mail className="h-7 w-7 text-white/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="animate-fade-up rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 transition-all duration-300 hover:border-[var(--border-color-strong)] hover:shadow-lg hover:shadow-black/10"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">
                  {card.label}
                </p>
                <h3 className={`mt-3 text-2xl font-bold ${card.valueColor}`}>
                  {card.value}
                </h3>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconBg}`}>
                <card.icon size={18} className={card.iconColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Country Breakdown */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10">
              <Globe size={15} className="text-blue-400" />
            </div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Leads by Country
            </h2>
          </div>
          <div className="space-y-3">
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
                const maxCount = countries[0]?.[1] || 1;
                const topCountries = countries.slice(0, 8);
                return (
                  <>
                    {topCountries.map(([country, count]) => (
                      <div
                        key={country}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                      >
                        <span className="text-lg leading-none">
                          {COUNTRY_FLAGS[country] || "\u{1F30D}"}
                        </span>
                        <div className="flex-1">
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {country}
                            </span>
                            <span className="text-xs tabular-nums text-[var(--text-muted)]">
                              {count}
                              <span className="ml-1 text-[var(--text-muted)]/60">
                                ({Math.round((count / total) * 100)}%)
                              </span>
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                              style={{ width: `${Math.max(4, (count / maxCount) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {unknown > 0 && (
                      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                        <span className="text-lg leading-none">{"\u{1F30D}"}</span>
                        <div className="flex-1">
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-sm text-[var(--text-muted)]">Other</span>
                            <span className="text-xs tabular-nums text-[var(--text-muted)]">
                              {unknown}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                            <div
                              className="h-full rounded-full bg-white/10"
                              style={{ width: `${Math.max(4, (unknown / maxCount) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Platform Breakdown */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10">
                <BarChart3 size={15} className="text-purple-400" />
              </div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Lead Platforms
              </h2>
            </div>
            <div className="flex gap-3">
              {!loading &&
                Object.entries(stats?.platformBreakdown || {})
                  .sort((a, b) => b[1] - a[1])
                  .map(([platform, count]) => {
                    const total = stats?.totalLeads || 1;
                    const pct = Math.round((count / total) * 100);
                    const config: Record<string, { bg: string; text: string; ring: string }> = {
                      instagram: { bg: "bg-pink-500/10", text: "text-pink-400", ring: "ring-pink-500/20" },
                      facebook: { bg: "bg-blue-500/10", text: "text-blue-400", ring: "ring-blue-500/20" },
                    };
                    const style = config[platform] || { bg: "bg-gray-500/10", text: "text-gray-400", ring: "ring-gray-500/20" };
                    return (
                      <div
                        key={platform}
                        className={`flex-1 rounded-2xl ${style.bg} ring-1 ${style.ring} p-4 text-center`}
                      >
                        <p className={`text-2xl font-bold ${style.text}`}>{pct}%</p>
                        <p className="mt-1 text-xs capitalize text-[var(--text-muted)]">
                          {platform}
                        </p>
                        <p className="mt-0.5 text-[10px] tabular-nums text-[var(--text-muted)]/60">
                          {count} leads
                        </p>
                      </div>
                    );
                  })}
            </div>
          </div>

          {/* Recent Email Activity */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
                <Mail size={15} className="text-emerald-400" />
              </div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Recent Activity
              </h2>
            </div>
            <div className="space-y-2">
              {!loading &&
                Object.entries(stats?.dailyStats || {})
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .slice(0, 5)
                  .map(([date, data]) => (
                    <div
                      key={date}
                      className="flex items-center justify-between rounded-xl bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]"
                    >
                      <span className="text-sm font-medium text-[var(--text-secondary)]">
                        {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <div className="flex items-center gap-5">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span className="text-xs tabular-nums text-[var(--text-muted)]">
                            <span className="font-semibold text-emerald-400">{data.sent}</span> sent
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                          <span className="text-xs tabular-nums text-[var(--text-muted)]">
                            <span className="font-semibold text-blue-400">{data.opened}</span> opened
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "New Broadcast", href: "/admin/composer", icon: PenTool, color: "text-blue-400" },
          { label: "View Leads", href: "/admin/leads", icon: Users, color: "text-emerald-400" },
          { label: "Sequences", href: "/admin/sequences", icon: Zap, color: "text-amber-400" },
          { label: "Analytics", href: "/admin/analytics", icon: BarChart3, color: "text-purple-400" },
        ].map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="group flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-5 py-4 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--border-color-strong)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
          >
            <div className="flex items-center gap-3">
              <action.icon size={16} className={action.color} />
              {action.label}
            </div>
            <ArrowUpRight size={14} className="text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100" />
          </a>
        ))}
      </div>
    </div>
  );
}
