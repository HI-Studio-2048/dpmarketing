"use client";

import { useState } from "react";

export default function ComposerPage() {
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Lead");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent?: number; failed?: number } | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();

    if (!subject || !htmlBody) {
      alert("Subject and body are required");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          html_body: htmlBody,
          segment_json: { status: selectedStatus },
        }),
      });

      const data = await response.json();
      setResult(data);

      if (response.ok) {
        alert("Broadcast sent successfully!");
        setSubject("");
        setHtmlBody("");
      }
    } catch (error) {
      console.error("Failed to send broadcast:", error);
      alert("Failed to send broadcast");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Email Composer</h1>

      <div className="rounded-lg bg-white p-6 shadow">
        <form onSubmit={handleSend} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Send to (Status)
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 md:w-48"
            >
              <option value="Lead">All Leads</option>
              <option value="Checkout Started">Checkout Started</option>
              <option value="Buyer">Buyers</option>
              <option value="Abandoned">Abandoned</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              HTML Body
            </label>
            <textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              placeholder="Enter HTML email body. Use {{first_name}}, {{email}}, {{unsubscribe_url}} for personalization."
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm"
              rows={12}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-slate-400"
          >
            {loading ? "Sending..." : "Send Broadcast"}
          </button>

          {result && (
            <div className="rounded bg-green-50 p-4 text-green-800">
              <p>Sent: {result.sent} emails</p>
              {result.failed ? <p>Failed: {result.failed}</p> : null}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
