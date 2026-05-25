"use client";

import { useState, useEffect } from "react";
import { Mail, Eye, MousePointerClick, UserMinus, TrendingUp, ShieldCheck, BarChart3 } from "lucide-react";

interface DailyStats {
  [date: string]: { sent: number; opened: number; clicked: number };
}

interface Analytics {
  totalEmails: number;
  openedEmails: number;
  clickedEmails: number;
  bouncedEmails: number;
  failedEmails: number;
  complainedEmails: number;
  unsubscribed: number;
  totalLeads: number;
  activeSequences: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  deliveryRate: number;
  dailyStats: DailyStats;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch("/api/admin/analytics");
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-[var(--text-muted)]">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-10 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          Could not load analytics. Check your Supabase connection.
        </p>
      </div>
    );
  }

  const cards = [
    {
      label: "Total Sent",
      value: analytics.totalEmails.toLocaleString(),
      sub: "all time",
      icon: Mail,
      iconBg: "bg-blue-500/12",
      iconColor: "text-blue-400",
      valueColor: "text-blue-300",
    },
    {
      label: "Open Rate",
      value: `${analytics.openRate}%`,
      sub: `${analytics.openedEmails.toLocaleString()} opens`,
      icon: Eye,
      iconBg: "bg-emerald-500/12",
      iconColor: "text-emerald-400",
      valueColor: "text-emerald-300",
    },
    {
      label: "Click Rate",
      value: `${analytics.clickRate}%`,
      sub: `${analytics.clickedEmails.toLocaleString()} clicks`,
      icon: MousePointerClick,
      iconBg: "bg-amber-500/12",
      iconColor: "text-amber-400",
      valueColor: "text-amber-300",
    },
    {
      label: "Unsubscribed",
      value: analytics.unsubscribed.toString(),
      sub: `of ${analytics.totalLeads} leads`,
      icon: UserMinus,
      iconBg: "bg-rose-500/12",
      iconColor: "text-rose-400",
      valueColor: "text-rose-300",
    },
  ];

  const deliveryItems = [
    { label: "Delivered", pct: analytics.deliveryRate, color: "from-emerald-500 to-emerald-400", dot: "bg-emerald-400" },
    { label: "Opened", pct: analytics.openRate, color: "from-blue-500 to-blue-400", dot: "bg-blue-400" },
    { label: "Clicked", pct: analytics.clickRate, color: "from-amber-500 to-amber-400", dot: "bg-amber-400" },
    { label: "Bounced", pct: analytics.bounceRate, color: "from-rose-500 to-rose-400", dot: "bg-rose-400" },
  ];

  const metricItems = [
    { label: "Emails Sent", value: analytics.totalEmails.toLocaleString() },
    { label: "Emails Opened", value: analytics.openedEmails.toLocaleString() },
    { label: "Links Clicked", value: analytics.clickedEmails.toLocaleString() },
    { label: "Bounced", value: analytics.bouncedEmails.toLocaleString() },
    { label: "Failed", value: analytics.failedEmails.toLocaleString() },
    { label: "Spam Complaints", value: analytics.complainedEmails.toLocaleString() },
    { label: "Unsubscribes", value: analytics.unsubscribed.toString() },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Email campaign performance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, i) => (
          <div
            key={card.label}
            className="animate-fade-up rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 transition-all duration-300 hover:border-[var(--border-color-strong)] hover:shadow-lg hover:shadow-black/10"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  {card.label}
                </p>
                <h3 className={`mt-3 text-2xl font-bold ${card.valueColor}`}>
                  {card.value}
                </h3>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  {card.sub}
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconBg}`}>
                <card.icon size={18} className={card.iconColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Emails Sent & Open Rate */}
      <DailyChart dailyStats={analytics.dailyStats} />

      {/* Delivery & Metrics */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
              <TrendingUp size={15} className="text-emerald-400" />
            </div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Delivery Breakdown
            </h2>
          </div>
          <div className="space-y-4">
            {deliveryItems.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${item.dot}`} />
                    <span className="text-sm text-[var(--text-secondary)]">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                    {item.pct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-700`}
                    style={{ width: `${Math.max(1, item.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10">
              <ShieldCheck size={15} className="text-blue-400" />
            </div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Key Metrics
            </h2>
          </div>
          <div className="space-y-1.5">
            {metricItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
              >
                <span className="text-sm text-[var(--text-secondary)]">
                  {item.label}
                </span>
                <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Daily Sent & Open Rate Chart ── */

function DailyChart({ dailyStats }: { dailyStats: DailyStats }) {
  // Build last 30 days, filling gaps with zeros
  const days: { date: string; label: string; sent: number; opened: number; openRate: number }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const stats = dailyStats?.[iso];
    const sent = stats?.sent || 0;
    const opened = stats?.opened || 0;
    days.push({
      date: iso,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sent,
      opened,
      openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
    });
  }

  const maxSent = Math.max(...days.map((d) => d.sent), 1);
  const totalSent = days.reduce((s, d) => s + d.sent, 0);
  const totalOpened = days.reduce((s, d) => s + d.opened, 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const hovered = hoveredIdx !== null ? days[hoveredIdx] : null;

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10">
            <BarChart3 size={15} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Daily Activity
            </h2>
            <p className="text-[11px] text-[var(--text-muted)]">Last 30 days</p>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-[11px] font-medium text-blue-400">
              {totalSent} sent
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-emerald-400">
              {avgOpenRate}% open rate
            </span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <div className="mb-2 h-8 flex items-center">
        {hovered ? (
          <div className="flex items-center gap-4 animate-fade-up">
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {hovered.label}
            </span>
            <span className="text-xs text-blue-400">
              {hovered.sent} sent
            </span>
            <span className="text-xs text-emerald-400">
              {hovered.opened} opened
            </span>
            <span className="text-xs text-amber-400">
              {hovered.openRate}% open rate
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-[var(--text-muted)]">
            Hover over bars for details
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="flex items-end gap-[3px]" style={{ height: 160 }}>
        {days.map((day, idx) => {
          const barH = Math.max(4, (day.sent / maxSent) * 140);
          const openedH = day.sent > 0 ? (day.opened / day.sent) * barH : 0;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={day.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: 160 }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Open rate dot */}
              {day.sent > 0 && (
                <div
                  className={`absolute z-10 h-2 w-2 rounded-full transition-all duration-200 ${
                    isHovered ? "bg-emerald-400 scale-150" : "bg-emerald-400/60"
                  }`}
                  style={{ bottom: barH + 4 }}
                />
              )}

              {/* Sent bar (full) */}
              <div
                className={`relative w-full rounded-t-sm transition-all duration-200 ${
                  isHovered ? "bg-blue-400" : "bg-blue-500/40"
                }`}
                style={{ height: barH }}
              >
                {/* Opened overlay */}
                {openedH > 0 && (
                  <div
                    className={`absolute bottom-0 left-0 w-full rounded-t-sm transition-all duration-200 ${
                      isHovered ? "bg-emerald-400" : "bg-emerald-500/50"
                    }`}
                    style={{ height: openedH }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="mt-2 flex justify-between">
        <span className="text-[10px] text-[var(--text-muted)]">{days[0]?.label}</span>
        <span className="text-[10px] text-[var(--text-muted)]">{days[14]?.label}</span>
        <span className="text-[10px] text-[var(--text-muted)]">{days[29]?.label}</span>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-5 border-t border-[var(--border-color)] pt-4">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-blue-500/40" />
          <span className="text-[11px] text-[var(--text-muted)]">Sent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-emerald-500/50" />
          <span className="text-[11px] text-[var(--text-muted)]">Opened</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-400/60" />
          <span className="text-[11px] text-[var(--text-muted)]">Open rate</span>
        </div>
      </div>
    </div>
  );
}
