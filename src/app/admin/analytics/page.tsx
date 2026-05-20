"use client";

import { useState, useEffect } from "react";
import { Mail, Eye, MousePointerClick, UserMinus } from "lucide-react";

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
      <div className="text-sm text-[var(--text-secondary)]">
        Loading analytics...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center">
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
      color: "from-blue-500 to-blue-600",
      shadowColor: "shadow-blue-500/20",
    },
    {
      label: "Open Rate",
      value: `${analytics.openRate}%`,
      sub: `${analytics.openedEmails.toLocaleString()} opens`,
      icon: Eye,
      color: "from-green-500 to-emerald-600",
      shadowColor: "shadow-green-500/20",
    },
    {
      label: "Click Rate",
      value: `${analytics.clickRate}%`,
      sub: `${analytics.clickedEmails.toLocaleString()} clicks`,
      icon: MousePointerClick,
      color: "from-orange-400 to-orange-500",
      shadowColor: "shadow-orange-500/20",
    },
    {
      label: "Unsubscribed",
      value: analytics.unsubscribed.toString(),
      sub: `of ${analytics.totalLeads} leads`,
      icon: UserMinus,
      color: "from-red-400 to-red-500",
      shadowColor: "shadow-red-500/20",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Email campaign performance
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
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
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {card.sub}
                </p>
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

      {/* Progress bars section */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Delivery Breakdown
          </h2>
          <div className="space-y-4">
            {[
              {
                label: "Delivered",
                pct: analytics.deliveryRate,
                color: "bg-green-500",
              },
              {
                label: "Opened",
                pct: analytics.openRate,
                color: "bg-blue-500",
              },
              {
                label: "Clicked",
                pct: analytics.clickRate,
                color: "bg-orange-500",
              },
              {
                label: "Bounced",
                pct: analytics.bounceRate,
                color: "bg-red-500",
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {item.label}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {item.pct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-primary)]">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Key Metrics
          </h2>
          <div className="space-y-3">
            {[
              {
                label: "Emails Sent",
                value: analytics.totalEmails.toLocaleString(),
              },
              {
                label: "Emails Opened",
                value: analytics.openedEmails.toLocaleString(),
              },
              {
                label: "Links Clicked",
                value: analytics.clickedEmails.toLocaleString(),
              },
              {
                label: "Bounced",
                value: analytics.bouncedEmails.toLocaleString(),
              },
              {
                label: "Failed",
                value: analytics.failedEmails.toLocaleString(),
              },
              {
                label: "Spam Complaints",
                value: analytics.complainedEmails.toLocaleString(),
              },
              {
                label: "Unsubscribes",
                value: analytics.unsubscribed.toString(),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg bg-[var(--bg-primary)] px-4 py-3"
              >
                <span className="text-sm text-[var(--text-secondary)]">
                  {item.label}
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
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
