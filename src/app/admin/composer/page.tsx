"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Send,
  FlaskConical,
  Eye,
  EyeOff,
  X,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Users,
  Globe,
  Filter,
  Calendar,
  Tag,
  Layers,
  Monitor,
  Loader2,
  Paperclip,
  FileIcon,
  Trash2,
} from "lucide-react";

const RichEditor = dynamic(() => import("@/components/rich-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] text-sm text-[var(--text-muted)]">
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

const COUNTRIES = [
  "India",
  "Philippines",
  "Indonesia",
  "Japan",
  "US/Canada",
  "UK",
  "Australia",
  "Ireland",
  "Portugal",
  "Spain",
  "Finland",
  "Italy",
  "Malta",
  "Greece",
  "Croatia",
  "Germany",
  "France",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Poland",
  "Austria",
  "Switzerland",
  "Hungary",
  "Romania",
  "Slovakia",
  "Ukraine",
  "Russia",
  "China",
  "South Korea",
  "Thailand",
  "Malaysia",
  "Singapore",
  "Vietnam",
  "Bangladesh",
  "Pakistan",
  "Sri Lanka",
  "Nepal",
  "UAE",
  "Saudi Arabia",
  "Egypt",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Brazil",
  "Mexico",
  "Colombia",
  "Argentina",
];

export default function ComposerPage() {
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Segmentation
  const [segStatus, setSegStatus] = useState("");
  const [segSource, setSegSource] = useState("");
  const [segPlatform, setSegPlatform] = useState("");
  const [segTags, setSegTags] = useState("");
  const [segDateFrom, setSegDateFrom] = useState("");
  const [segDateTo, setSegDateTo] = useState("");
  const [segCountry, setSegCountry] = useState("");
  const [segExcludeBounced, setSegExcludeBounced] = useState(false);

  // Audience count
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const countTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preview
  const [showPreview, setShowPreview] = useState(false);

  // Test email
  const [showTest, setShowTest] = useState(false);
  const [testEmails, setTestEmails] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);

  // Attachments
  const [attachments, setAttachments] = useState<
    { filename: string; content: string; type: string; size: number }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Direct send
  const [showDirect, setShowDirect] = useState(false);
  const [directEmails, setDirectEmails] = useState("");
  const [directLoading, setDirectLoading] = useState(false);
  const [directResults, setDirectResults] = useState<TestResult[] | null>(null);

  const buildSegment = useCallback(() => {
    const segment: Record<string, string | boolean> = {};
    if (segStatus) segment.status = segStatus;
    if (segSource) segment.source = segSource;
    if (segPlatform) segment.platform = segPlatform;
    if (segTags) segment.tags = segTags;
    if (segDateFrom) segment.date_from = segDateFrom;
    if (segDateTo) segment.date_to = segDateTo;
    if (segCountry) segment.country = segCountry;
    if (segExcludeBounced) segment.exclude_bounced = true;
    return segment;
  }, [segStatus, segSource, segPlatform, segTags, segDateFrom, segDateTo, segCountry, segExcludeBounced]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large (max 10MB)`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setAttachments((prev) => [
          ...prev,
          { filename: file.name, content: base64, type: file.type, size: file.size },
        ]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Debounced audience count
  useEffect(() => {
    if (countTimer.current) clearTimeout(countTimer.current);
    countTimer.current = setTimeout(async () => {
      setAudienceLoading(true);
      try {
        const res = await fetch("/api/admin/audience-count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildSegment()),
        });
        if (res.ok) {
          const data = await res.json();
          setAudienceCount(data.count);
        }
      } catch {
        // ignore
      } finally {
        setAudienceLoading(false);
      }
    }, 400);
    return () => {
      if (countTimer.current) clearTimeout(countTimer.current);
    };
  }, [buildSegment]);

  // Broadcast progress polling
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
    if (!confirm(`Send broadcast to ${audienceCount ?? "?"} leads?`)) return;
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
          attachments: attachments.length > 0 ? attachments : undefined,
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
          attachments: attachments.length > 0 ? attachments : undefined,
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

  async function handleDirectSend() {
    if (!subject || !htmlBody) {
      alert("Subject and body are required");
      return;
    }
    const emails = directEmails
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));
    if (emails.length === 0) {
      alert("Enter at least one valid email address");
      return;
    }
    if (
      !confirm(
        `Send this email to ${emails.length} address(es)? This is NOT a test.`
      )
    )
      return;

    setDirectLoading(true);
    setDirectResults(null);
    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emails,
          subject,
          html_body: htmlBody,
          test: false,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      });
      const data = await response.json();
      setDirectResults(data.results || []);
    } catch {
      alert("Failed to send email");
    } finally {
      setDirectLoading(false);
    }
  }

  const activeFilters = [
    segStatus,
    segSource,
    segPlatform,
    segTags,
    segDateFrom,
    segDateTo,
    segCountry,
  ].filter(Boolean).length + (segExcludeBounced ? 1 : 0);

  const inputClasses =
    "w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]/30 transition-colors";

  function ResultList({ results }: { results: TestResult[] }) {
    return (
      <div className="mt-3 space-y-1.5">
        {results.map((r) => (
          <div
            key={r.email}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
              r.success
                ? "bg-emerald-500/5 text-emerald-400"
                : "bg-rose-500/5 text-rose-400"
            }`}
          >
            {r.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            <span className="truncate">{r.email}</span>
            {r.error && (
              <span className="text-xs opacity-60">&mdash; {r.error}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Email Composer
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Compose and send broadcast emails
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-all hover:bg-[var(--hover-bg)]"
        >
          {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
          {showPreview ? "Hide Preview" : "Preview"}
        </button>
      </div>

      <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-2" : ""}`}>
        {/* Composer column */}
        <div className="space-y-5">
          {/* Audience Segmentation */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10">
                  <Filter size={15} className="text-blue-400" />
                </div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Audience
                </h2>
                {activeFilters > 0 && (
                  <span className="rounded-full bg-[var(--accent-blue)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--accent-blue)]">
                    {activeFilters} filter{activeFilters > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {/* Live audience count */}
              <div className="flex items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-1.5 ring-1 ring-[var(--border-color)]">
                {audienceLoading ? (
                  <Loader2 size={13} className="animate-spin text-[var(--text-muted)]" />
                ) : (
                  <Users size={13} className="text-[var(--accent-blue)]" />
                )}
                <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">
                  {audienceCount !== null ? audienceCount.toLocaleString() : "..."}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">recipients</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Status */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  <Layers size={11} />
                  Status
                </label>
                <select
                  value={segStatus}
                  onChange={(e) => setSegStatus(e.target.value)}
                  className={inputClasses}
                >
                  <option value="">All Statuses</option>
                  <option value="Lead">Lead</option>
                  <option value="Checkout Started">Checkout Started</option>
                  <option value="Buyer">Buyer</option>
                  <option value="Abandoned">Abandoned</option>
                </select>
              </div>

              {/* Country */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  <Globe size={11} />
                  Country
                </label>
                <select
                  value={segCountry}
                  onChange={(e) => setSegCountry(e.target.value)}
                  className={inputClasses}
                >
                  <option value="">All Countries</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Platform */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  <Monitor size={11} />
                  Platform
                </label>
                <select
                  value={segPlatform}
                  onChange={(e) => setSegPlatform(e.target.value)}
                  className={inputClasses}
                >
                  <option value="">All Platforms</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="web">Web</option>
                  <option value="mobile">Mobile</option>
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  <Layers size={11} />
                  Source
                </label>
                <input
                  type="text"
                  value={segSource}
                  onChange={(e) => setSegSource(e.target.value)}
                  placeholder="e.g. fb-lead-ad, quiz"
                  className={inputClasses}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  <Tag size={11} />
                  Tags
                </label>
                <input
                  type="text"
                  value={segTags}
                  onChange={(e) => setSegTags(e.target.value)}
                  placeholder="comma-separated"
                  className={inputClasses}
                />
              </div>

              {/* Date range */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  <Calendar size={11} />
                  Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={segDateFrom}
                    onChange={(e) => setSegDateFrom(e.target.value)}
                    className={`${inputClasses} flex-1 text-xs`}
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={segDateTo}
                    onChange={(e) => setSegDateTo(e.target.value)}
                    className={`${inputClasses} flex-1 text-xs`}
                    placeholder="To"
                  />
                </div>
              </div>
            </div>

            {/* Options row */}
            <div className="mt-4 flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={segExcludeBounced}
                  onChange={(e) => setSegExcludeBounced(e.target.checked)}
                  className="rounded border-[var(--border-color)] bg-[var(--bg-input)]"
                />
                Exclude previously bounced
              </label>
              {activeFilters > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSegStatus("");
                    setSegSource("");
                    setSegPlatform("");
                    setSegTags("");
                    setSegDateFrom("");
                    setSegDateTo("");
                    setSegCountry("");
                    setSegExcludeBounced(false);
                  }}
                  className="text-xs text-[var(--accent-red)] transition-colors hover:text-rose-300"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              className={inputClasses}
            />
          </div>

          {/* Editor */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Email Body
              </label>
              <div className="flex gap-1 text-[10px] text-[var(--text-muted)]">
                {["{{first_name}}", "{{email}}", "{{unsubscribe_url}}"].map(
                  (v) => (
                    <span
                      key={v}
                      className="rounded-lg bg-white/[0.04] px-1.5 py-0.5 ring-1 ring-[var(--border-color)]"
                    >
                      {v}
                    </span>
                  )
                )}
              </div>
            </div>
            <RichEditor content={htmlBody} onChange={setHtmlBody} />
          </div>

          {/* Attachments */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Attachments
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] ring-1 ring-[var(--border-color)] transition-all hover:bg-white/[0.08] hover:text-[var(--text-primary)]"
              >
                <Paperclip size={13} />
                Add File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            {attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map((file, idx) => (
                  <div
                    key={`${file.filename}-${idx}`}
                    className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-[var(--border-color)]"
                  >
                    <FileIcon size={16} className="shrink-0 text-[var(--accent-blue)]" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {file.filename}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <p className="text-[11px] text-[var(--text-muted)]">
                  {attachments.length} file{attachments.length > 1 ? "s" : ""} &middot;{" "}
                  {formatFileSize(attachments.reduce((s, f) => s + f.size, 0))} total
                </p>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">
                No attachments. Max 10MB per file.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !subject || !htmlBody}
              className="flex items-center gap-2 rounded-2xl bg-[var(--accent-blue)] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--accent-blue)]/90 hover:shadow-lg hover:shadow-[var(--accent-blue)]/20 disabled:opacity-30"
            >
              <Send size={16} />
              {loading
                ? "Queuing..."
                : `Send to ${audienceCount !== null ? audienceCount.toLocaleString() : "..."} leads`}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowTest(!showTest);
                setShowDirect(false);
              }}
              className="flex items-center gap-2 rounded-2xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--hover-bg)]"
            >
              <FlaskConical size={16} />
              Test Send
            </button>

            <button
              type="button"
              onClick={() => {
                setShowDirect(!showDirect);
                setShowTest(false);
              }}
              className="flex items-center gap-2 rounded-2xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--hover-bg)]"
            >
              <UserPlus size={16} />
              Direct Send
            </button>
          </div>

          {/* Test Email Panel */}
          {showTest && (
            <div className="animate-fade-up rounded-2xl border border-blue-500/20 bg-[var(--bg-card)] p-5">
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
                  className="rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-bg)]"
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
                  className="flex items-center gap-2 rounded-xl bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-30"
                >
                  <FlaskConical size={14} />
                  {testLoading ? "Sending..." : "Send"}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                Subject prefixed with [TEST]. Template variables use test values.
              </p>
              {testResults && <ResultList results={testResults} />}
            </div>
          )}

          {/* Direct Send Panel */}
          {showDirect && (
            <div className="animate-fade-up rounded-2xl border border-amber-500/20 bg-[var(--bg-card)] p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Direct Send
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowDirect(false);
                    setDirectResults(null);
                  }}
                  className="rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-bg)]"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={directEmails}
                  onChange={(e) => setDirectEmails(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className={`${inputClasses} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleDirectSend}
                  disabled={directLoading}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-30"
                >
                  <Send size={14} />
                  {directLoading ? "Sending..." : "Send"}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                Sends the real email (no [TEST] prefix) directly. Bypasses
                broadcast queue.
              </p>
              {directResults && <ResultList results={directResults} />}
            </div>
          )}

          {/* Broadcast Progress */}
          {progress && (
            <div className="animate-fade-up rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Broadcast:{" "}
                  <span
                    className={
                      progress.broadcast.status === "sent"
                        ? "text-emerald-400"
                        : "text-[var(--accent-blue)]"
                    }
                  >
                    {progress.broadcast.status}
                  </span>
                </p>
                <p className="text-xs tabular-nums text-[var(--text-muted)]">
                  {progress.counts.sent}/{progress.total} sent
                  {progress.counts.failed > 0 &&
                    ` \u00B7 ${progress.counts.failed} failed`}
                </p>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent-blue)] to-emerald-400 transition-all duration-500"
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
            </div>
          )}
        </div>

        {/* Preview column */}
        {showPreview && (
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Email Preview
            </h3>
            {subject && (
              <div className="mb-4 rounded-xl bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] text-[var(--text-muted)]">Subject</p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                  {subject}
                </p>
              </div>
            )}
            <div className="overflow-hidden rounded-xl bg-white">
              <div className="p-6">
                {htmlBody ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-800"
                    dangerouslySetInnerHTML={{
                      __html: htmlBody
                        .replace(/\{\{first_name\}\}/g, "Daniel")
                        .replace(/\{\{email\}\}/g, "daniel@example.com")
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
