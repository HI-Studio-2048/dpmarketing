"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { type Lead } from "@/lib/supabase-server";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LeadsResponse {
  leads: Lead[];
  total: number;
  pages: number;
  isMock?: boolean;
}

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  Lead: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  "Checkout Started": { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  Buyer: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  Abandoned: { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-400" },
  Unsubscribed: { bg: "bg-gray-500/10", text: "text-gray-400", dot: "bg-gray-400" },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [isMock, setIsMock] = useState(false);

  const limit = 20;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchLeads();
  }, [page]);

  async function fetchLeads() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/leads?page=${page}&limit=${limit}`
      );
      const data = (await response.json()) as LeadsResponse;
      setLeads(data.leads);
      setTotal(data.total);
      setPages(data.pages);
      setIsMock(data.isMock || false);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Leads
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {total > 0 ? `${total} total leads` : "Manage your leads"}
          </p>
        </div>
        {isMock && (
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
            Mock Data
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] py-16">
          <p className="text-sm text-[var(--text-muted)]">Loading leads...</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Email
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Name
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Status
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Source
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-16 text-center text-sm text-[var(--text-muted)]"
                      >
                        No leads yet
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => {
                      const style = statusStyles[lead.status] || statusStyles.Lead;
                      return (
                        <tr
                          key={lead.id}
                          className="border-b border-[var(--border-color)] transition-colors hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-3.5 text-sm">
                            <Link
                              href={`/admin/leads/${lead.id}`}
                              className="font-medium text-[var(--accent-blue)] transition-colors hover:text-blue-300"
                            >
                              {lead.email}
                            </Link>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-[var(--text-primary)]">
                            {lead.first_name || "\u2014"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${style.bg} ${style.text}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-[var(--text-muted)]">
                            {lead.source || "\u2014"}
                          </td>
                          <td className="px-5 py-3.5 text-sm tabular-nums text-[var(--text-muted)]">
                            {new Date(lead.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs tabular-nums text-[var(--text-muted)]">
                Page {page} of {pages} &middot; {total} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-card-hover)] disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(Math.min(pages, page + 1))}
                  disabled={page === pages}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-card-hover)] disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
