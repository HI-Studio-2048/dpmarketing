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
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Leads</h1>
        {isMock && (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
            📋 Mock Data
          </span>
        )}
      </div>

      {loading ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-slate-600">Loading leads...</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg bg-white shadow">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-slate-600">No leads yet</p>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {lead.email}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {lead.first_name || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {lead.source || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Page {page} of {pages} ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded bg-slate-200 px-4 py-2 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(pages, page + 1))}
                  disabled={page === pages}
                  className="rounded bg-slate-200 px-4 py-2 text-sm disabled:opacity-50"
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
