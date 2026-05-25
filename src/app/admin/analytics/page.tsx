"use client";

import { useState, useEffect } from "react";
import { Mail, Eye, MousePointerClick, UserMinus, TrendingUp, ShieldCheck } from "lucide-react";

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
