"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Send,
  FlaskConical,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const RichEditor = dynamic(() => import("@/components/rich-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] p-4 text-sm text-[var(--text-muted)]">
      Loading editor...
    </div>
  ),
});

interface Progress {
  counts: { pending: number; sending: number; sent: number; failed: number };
  total: number;
  broadcast: { status: string };
}

interface TestResult {
  email: string;
  success: boolean;
  error: string | null;
}

export default function ComposerPage() {
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Segmentation
  const [showFilters, setShowFilters] = useState(false);
  const [segStatus, setSegStatus] = useState("Lead");
  const [segSource, setSegSource] = useState("");
  const [segPlatform, setSegPlatform] = useState("");
  const [segTags, setSegTags] = useState("");
  const [segDateFrom, setSegDateFrom] = useState("");
  const [segDateTo, setSegDateTo] = useState("");

  // Preview
  const [showPreview, setShowPreview] = useState(false);

  // Test email
  const [showTest, setShowTest] = useState(false);
  const [testEmails, setTestEmails] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);

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

  function buildSegment() {
    const segment: Record<string, string> = {};
    if (segStatus) segment.status = segStatus;
    if (segSource) segment.source = segSource;
    if (segPlatform) segment.platform = segPlatform;
    if (segTags) segment.tags = segTags;
    if (segDateFrom) segment.date_from = segDateFrom;
    if (segDateTo) segment.date_to = segDateTo;
    return segment;
  }

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
          segment_json: buildSegment(),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setBroadcastId(data.broadcast_id);
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

  async function handleTestSend() {
    if (!subject || !htmlBody) {
      alert("Subject and body are required");
      return;
    }
    const emails = testEmails
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));
    if (emails.length === 0) {
      alert("Enter at least one valid email address");
      return;
    }

    setTestLoading(true);
    setTestResults(null);
    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emails,
          subject,
          html_body: htmlBody,
        }),
      });
      const data = await response.json();
      setTestResults(data.results || []);
    } catch {
      alert("Failed to send test email");
    } finally {
      setTestLoading(false);
    }
  }

  const activeFilters = [segSource, segPlatform, segTags, segDateFrom, segDateTo].filter(Boolean).length;

  const inputClasses =
    "w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]";
  const labelClasses =
    "mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Email Composer
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Compose and send broadcast emails to your leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)]"
          >
            {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
            {showPreview ? "Hide Preview" : "Preview"}
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-2" : ""}`}>
        {/* Composer column */}
        <div className="space-y-6">
          {/* Segmentation */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Audience
                </span>
                {activeFilters > 0 && (
                  <span className="rounded-full bg-[var(--accent-blue)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent-blue)]">
                    +{activeFilters} filters
                  </span>
                )}
              </div>
              {showFilters ? (
                <ChevronUp size={16} className="text-[var(--text-muted)]" />
              ) : (
                <ChevronDown size={16} className="text-[var(--text-muted)]" />
              )}
            </button>

            <div className="mt-4">
              <label className={labelClasses}>Status</label>
              <select
                value={segStatus}
                onChange={(e) => setSegStatus(e.target.value)}
                className={`${inputClasses} md:w-56`}
              >
                <option value="">All Statuses</option>
                <option value="Lead">Lead</option>
                <option value="Checkout Started">Checkout Started</option>
                <option value="Buyer">Buyer</option>
                <option value="Abandoned">Abandoned</option>
              </select>
            </div>

            {showFilters && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClasses}>Source</label>
                  <input
                    type="text"
                    value={segSource}
                    onChange={(e) => setSegSource(e.target.value)}
                    placeholder="e.g. fb-lead-ad, quiz-brain"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Platform</label>
                  <select
                    value={segPlatform}
                    onChange={(e) => setSegPlatform(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">All Platforms</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={segTags}
                    onChange={(e) => setSegTags(e.target.value)}
                    placeholder="e.g. fb-lead-ad, quiz"
                    className={inputClasses}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className={labelClasses}>From Date</label>
                    <input
                      type="date"
                      value={segDateFrom}
                      onChange={(e) => setSegDateFrom(e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={labelClasses}>To Date</label>
                    <input
                      type="date"
                      value={segDateTo}
                      onChange={(e) => setSegDateTo(e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <label className={labelClasses}>Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              className={inputClasses}
            />
          </div>

          {/* Editor */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <label className={labelClasses + " mb-0"}>Email Body</label>
              <div className="flex gap-1 text-xs text-[var(--text-muted)]">
                <span className="rounded bg-[var(--bg-primary)] px-1.5 py-0.5">
                  {"{{first_name}}"}
                </span>
                <span className="rounded bg-[var(--bg-primary)] px-1.5 py-0.5">
                  {"{{email}}"}
                </span>
                <span className="rounded bg-[var(--bg-primary)] px-1.5 py-0.5">
                  {"{{unsubscribe_url}}"}
                </span>
              </div>
            </div>
            <RichEditor content={htmlBody} onChange={setHtmlBody} />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !subject || !htmlBody}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-[var(--accent-blue)]/20 transition-all hover:shadow-xl hover:shadow-[var(--accent-blue)]/30 disabled:opacity-30"
            >
              <Send size={16} />
              {loading ? "Queuing..." : "Queue Broadcast"}
            </button>

            <button
              type="button"
              onClick={() => setShowTest(!showTest)}
              className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)]"
            >
              <FlaskConical size={16} />
              Send Test
            </button>
          </div>

          {/* Test Email Panel */}
          {showTest && (
            <div className="rounded-xl border border-[var(--accent-blue)]/20 bg-[var(--bg-card)] p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Send Test Email
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowTest(false);
                    setTestResults(null);
                  }}
                  className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={testEmails}
                  onChange={(e) => setTestEmails(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className={`${inputClasses} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleTestSend}
                  disabled={testLoading}
                  className="flex items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-30"
                >
                  <FlaskConical size={14} />
                  {testLoading ? "Sending..." : "Send"}
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Subject will be prefixed with [TEST]. Template variables replaced
                with test values.
              </p>
              {testResults && (
                <div className="mt-3 space-y-2">
                  {testResults.map((r) => (
                    <div
                      key={r.email}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                        r.success
                          ? "bg-green-500/5 text-[var(--accent-green)]"
                          : "bg-red-500/5 text-[var(--accent-red)]"
                      }`}
                    >
                      {r.success ? (
                        <CheckCircle size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                      {r.email}
                      {r.error && (
                        <span className="text-xs opacity-70">
                          — {r.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Broadcast Progress */}
          {progress && (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Broadcast:{" "}
                  <span className="text-[var(--accent-blue)]">
                    {progress.broadcast.status}
                  </span>
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {progress.counts.sent}/{progress.total} sent
                  {progress.counts.failed > 0 &&
                    `, ${progress.counts.failed} failed`}
                </p>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-input)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-green)] transition-all"
                  style={{
                    width: `${
                      progress.total
                        ? ((progress.counts.sent + progress.counts.failed) /
                            progress.total) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Sending ramps per the warmup schedule; large lists send over
                several days.
              </p>
            </div>
          )}
        </div>

        {/* Preview column */}
        {showPreview && (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Email Preview
            </h3>
            {subject && (
              <div className="mb-4 rounded-lg bg-[var(--bg-primary)] px-4 py-3">
                <p className="text-xs text-[var(--text-muted)]">Subject</p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                  {subject}
                </p>
              </div>
            )}
            <div className="overflow-hidden rounded-lg bg-white">
              <div className="p-6">
                {htmlBody ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-800"
                    dangerouslySetInnerHTML={{
                      __html: htmlBody
                        .replace(/\{\{first_name\}\}/g, "Daniel")
                        .replace(
                          /\{\{email\}\}/g,
                          "daniel@example.com"
                        )
                        .replace(/\{\{unsubscribe_url\}\}/g, "#"),
                    }}
                  />
                ) : (
                  <p className="text-sm text-gray-400">
                    Start typing to see a preview...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
