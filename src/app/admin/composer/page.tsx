"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

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

  const inputClasses =
    "w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]";
  const labelClasses =
    "mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Email Composer
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Send a broadcast email to your leads
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
        <form onSubmit={handleSend} className="space-y-6">
          <div>
            <label className={labelClasses}>Send to (Status)</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`${inputClasses} md:w-56`}
            >
              <option value="Lead">All Leads</option>
              <option value="Checkout Started">Checkout Started</option>
              <option value="Buyer">Buyers</option>
              <option value="Abandoned">Abandoned</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              className={inputClasses}
              required
            />
          </div>

          <div>
            <label className={labelClasses}>HTML Body</label>
            <textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              placeholder="Enter HTML email body. Use {{first_name}}, {{email}}, {{unsubscribe_url}} for personalization."
              className={`${inputClasses} font-mono`}
              rows={12}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-[var(--accent-blue)]/20 transition-all hover:shadow-xl hover:shadow-[var(--accent-blue)]/30 disabled:opacity-30"
          >
            <Send size={16} />
            {loading ? "Queuing..." : "Queue Broadcast"}
          </button>
        </form>

        {progress && (
          <div className="mt-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Status: <span className="text-[var(--accent-blue)]">{progress.broadcast.status}</span> — {progress.counts.sent}/{progress.total} sent
              {progress.counts.failed > 0 ? `, ${progress.counts.failed} failed` : ""}
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-input)]">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-green)] transition-all"
                style={{
                  width: `${progress.total ? ((progress.counts.sent + progress.counts.failed) / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Sending ramps per the warmup schedule; large lists send over several days.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
