"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { type Lead } from "@/lib/supabase-server";

interface LeadsResponse {
  leads: Lead[];
  total: number;
  pages: number;
  isMock?: boolean;
}

const statusColors: Record<string, string> = {
  Lead: "bg-blue-500/10 text-blue-400",
  "Checkout Started": "bg-orange-500/10 text-orange-400",
  Buyer: "bg-green-500/10 text-green-400",
  Abandoned: "bg-red-500/10 text-red-400",
  Unsubscribed: "bg-gray-500/10 text-gray-400",
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Leads
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {total > 0 ? `${total} total leads` : "Manage your leads"}
          </p>
        </div>
        {isMock && (
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
            Mock Data
          </span>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8">
          <p className="text-sm text-[var(--text-secondary)]">
            Loading leads...
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Source
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-sm text-[var(--text-secondary)]"
                      >
                        No leads yet
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-b border-[var(--border-color)] transition-colors hover:bg-[var(--hover-bg)]"
                      >
                        <td className="px-6 py-4 text-sm">
                          <Link
                            href={`/admin/leads/${lead.id}`}
                            className="text-[var(--accent-blue)] hover:underline"
                          >
                            {lead.email}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-primary)]">
                          {lead.first_name || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                              statusColors[lead.status] || statusColors.Lead
                            }`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                          {lead.source || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-[var(--text-secondary)]">
                Page {page} of {pages} ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(pages, page + 1))}
                  disabled={page === pages}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
