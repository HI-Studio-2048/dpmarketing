"use client";

import { useEffect, useRef, useState } from "react";

interface Progress {
  counts: { pending: number; sending: number; sent: number; failed: number };
  total: number;
  broadcast: { status: string };
}

export default function ComposerPage() {
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Lead");
  const [loading, setLoading] = useState(false);
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!broadcastId) return;
    async function poll() {
      const res = await fetch(`/api/admin/broadcasts/${broadcastId}`);
      if (res.ok) {
        const data = (await res.json()) as Progress;
        setProgress(data);
        if (data.broadcast.status === "sent" && timer.current) {
          clearInterval(timer.current);
          timer.current = null;
        }
      }
    }
    poll();
    timer.current = setInterval(poll, 3000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [broadcastId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !htmlBody) {
      alert("Subject and body are required");
      return;
    }
    setLoading(true);
    setProgress(null);
    setBroadcastId(null);
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
      if (response.ok) {
        setBroadcastId(data.broadcast_id);
        setSubject("");
        setHtmlBody("");
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to queue broadcast:", error);
      alert("Failed to queue broadcast");
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
            <label className="block text-sm font-medium text-slate-700">Send to (Status)</label>
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
            <label className="block text-sm font-medium text-slate-700">Subject</label>
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
            <label className="block text-sm font-medium text-slate-700">HTML Body</label>
            <textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              placeholder="Use {{first_name}}, {{email}}, {{unsubscribe_url}} for personalization."
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
            {loading ? "Queuing..." : "Queue Broadcast"}
          </button>
        </form>

        {progress && (
          <div className="mt-6 rounded bg-slate-50 p-4">
            <p className="text-sm font-medium">
              Status: {progress.broadcast.status} — {progress.counts.sent}/{progress.total} sent
              {progress.counts.failed > 0 ? `, ${progress.counts.failed} failed` : ""}
            </p>
            <div className="mt-2 h-2 w-full rounded bg-slate-200">
              <div
                className="h-2 rounded bg-green-600"
                style={{
                  width: `${progress.total ? ((progress.counts.sent + progress.counts.failed) / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Sending ramps per the warmup schedule; large lists send over several days.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
