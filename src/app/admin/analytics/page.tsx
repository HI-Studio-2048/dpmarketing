"use client";

import { useState, useEffect } from "react";

interface Analytics {
  totalEmails: number;
  openedEmails: number;
  clickedEmails: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  isMock?: boolean;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalEmails: 0,
    openedEmails: 0,
    clickedEmails: 0,
    unsubscribed: 0,
    openRate: 0,
    clickRate: 0,
    isMock: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const hasSupabase =
        !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !!process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!hasSupabase) {
        // Mock data
        setAnalytics({
          totalEmails: 1250,
          openedEmails: 425,
          clickedEmails: 187,
          unsubscribed: 12,
          openRate: 34,
          clickRate: 15,
          isMock: true,
        });
      } else {
        // Real data would be fetched here
        const response = await fetch("/api/admin/analytics");
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-slate-600">Loading analytics...</div>;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        {analytics.isMock && (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
            📋 Mock Data
          </span>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm text-slate-600">Total Sent</div>
          <div className="mt-2 text-3xl font-bold">
            {analytics.totalEmails.toLocaleString()}
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm text-slate-600">Open Rate</div>
          <div className="mt-2 text-3xl font-bold">{analytics.openRate}%</div>
          <div className="mt-1 text-xs text-slate-600">
            {analytics.openedEmails.toLocaleString()} opens
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm text-slate-600">Click Rate</div>
          <div className="mt-2 text-3xl font-bold">{analytics.clickRate}%</div>
          <div className="mt-1 text-xs text-slate-600">
            {analytics.clickedEmails.toLocaleString()} clicks
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm text-slate-600">Unsubscribed</div>
          <div className="mt-2 text-3xl font-bold">
            {analytics.unsubscribed}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-blue-50 border border-blue-200 p-6">
        <h2 className="font-bold text-blue-900">💡 Demo Mode</h2>
        <p className="mt-2 text-sm text-blue-800">
          You're viewing mock analytics data. Real data will appear once you set up
          Supabase and start sending emails.
        </p>
      </div>
    </div>
  );
}
