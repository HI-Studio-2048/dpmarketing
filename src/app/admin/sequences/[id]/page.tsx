"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Plus,
  Mail,
  Clock,
  Users,
  ArrowDown,
  Zap,
  Gift,
  BookOpen,
  AlertTriangle,
  Sparkles,
  Target,
} from "lucide-react";

interface SequenceStep {
  id: string;
  step_number: number;
  day_offset: number;
  subject: string;
  html_body: string;
  step_key: string;
  email_type: string;
  condition?: Record<string, unknown>;
}

interface Sequence {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  sequence_steps: SequenceStep[];
}

const emailTypeConfig: Record<
  string,
  { icon: typeof Mail; bg: string; ring: string; text: string; dot: string; label: string }
> = {
  welcome: {
    icon: Sparkles,
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    label: "Welcome",
  },
  education: {
    icon: BookOpen,
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/20",
    text: "text-blue-400",
    dot: "bg-blue-400",
    label: "Education",
  },
  offer: {
    icon: Gift,
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    text: "text-amber-400",
    dot: "bg-amber-400",
    label: "Offer",
  },
  value: {
    icon: Target,
    bg: "bg-purple-500/10",
    ring: "ring-purple-500/20",
    text: "text-purple-400",
    dot: "bg-purple-400",
    label: "Value",
  },
  urgency: {
    icon: AlertTriangle,
    bg: "bg-rose-500/10",
    ring: "ring-rose-500/20",
    text: "text-rose-400",
    dot: "bg-rose-400",
    label: "Urgency",
  },
  behavioral: {
    icon: Zap,
    bg: "bg-cyan-500/10",
    ring: "ring-cyan-500/20",
    text: "text-cyan-400",
    dot: "bg-cyan-400",
    label: "Behavioral",
  },
};

const defaultConfig = emailTypeConfig.value;

export default function SequenceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStepForm, setShowStepForm] = useState(false);
  const [stepForm, setStepForm] = useState({
    step_number: "",
    day_offset: "",
    subject: "",
    html_body: "",
    step_key: "",
    email_type: "value",
  });

  useEffect(() => {
    if (id) fetchSequence();
  }, [id]);

  async function fetchSequence() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/sequences/${id}`);
      const data = await response.json();
      setSequence(data.sequence);

      const nextStepNumber = (data.sequence.sequence_steps?.length || 0) + 1;
      setStepForm((prev) => ({
        ...prev,
        step_number: String(nextStepNumber),
      }));
    } catch (error) {
      console.error("Failed to fetch sequence:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStep(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/sequences/${id}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step_number: parseInt(stepForm.step_number),
          day_offset: parseInt(stepForm.day_offset),
          subject: stepForm.subject,
          html_body: stepForm.html_body,
          step_key: stepForm.step_key,
          email_type: stepForm.email_type,
        }),
      });

      if (response.ok) {
        setShowStepForm(false);
        await fetchSequence();
        setStepForm({
          step_number: String((sequence?.sequence_steps?.length || 0) + 2),
          day_offset: "",
          subject: "",
          html_body: "",
          step_key: "",
          email_type: "value",
        });
      }
    } catch (error) {
      console.error("Failed to add step:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="text-sm text-[var(--text-secondary)]">
        Sequence not found
      </div>
    );
  }

  const inputClasses =
    "w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]/30";

  const sortedSteps = [...(sequence.sequence_steps || [])].sort(
    (a, b) => a.day_offset - b.day_offset
  );

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/admin/sequences"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-blue)] transition-colors hover:text-blue-300"
      >
        <ChevronLeft size={16} />
        Back to Flows
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              sequence.is_active
                ? "bg-emerald-500/12 text-emerald-400"
                : "bg-gray-500/10 text-gray-400"
            }`}
          >
            <Zap size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {sequence.name}
            </h1>
            {sequence.description && (
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                {sequence.description}
              </p>
            )}
            <span
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                sequence.is_active
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-gray-500/10 text-gray-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  sequence.is_active ? "bg-emerald-400" : "bg-gray-400"
                }`}
              />
              {sequence.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowStepForm(!showStepForm)}
          className="flex items-center gap-2 rounded-2xl bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--accent-blue)]/90 hover:shadow-lg hover:shadow-[var(--accent-blue)]/20"
        >
          <Plus size={16} />
          Add Step
        </button>
      </div>

      {/* Add Step Form */}
      {showStepForm && (
        <div className="animate-fade-up rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-5 text-base font-semibold text-[var(--text-primary)]">
            Add Email Step
          </h2>
          <form onSubmit={handleAddStep} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Step Number
                </label>
                <input
                  type="number"
                  value={stepForm.step_number}
                  onChange={(e) => setStepForm({ ...stepForm, step_number: e.target.value })}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Days After Enrollment
                </label>
                <input
                  type="number"
                  value={stepForm.day_offset}
                  onChange={(e) => setStepForm({ ...stepForm, day_offset: e.target.value })}
                  className={inputClasses}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={stepForm.subject}
                  onChange={(e) => setStepForm({ ...stepForm, subject: e.target.value })}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Step Key
                </label>
                <input
                  type="text"
                  value={stepForm.step_key}
                  onChange={(e) => setStepForm({ ...stepForm, step_key: e.target.value })}
                  placeholder="e.g., welcome, offer_1"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Email Type
                </label>
                <select
                  value={stepForm.email_type}
                  onChange={(e) => setStepForm({ ...stepForm, email_type: e.target.value })}
                  className={inputClasses}
                >
                  <option value="welcome">Welcome</option>
                  <option value="education">Education</option>
                  <option value="offer">Offer</option>
                  <option value="value">Value</option>
                  <option value="urgency">Urgency</option>
                  <option value="behavioral">Behavioral</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  HTML Body
                </label>
                <textarea
                  value={stepForm.html_body}
                  onChange={(e) => setStepForm({ ...stepForm, html_body: e.target.value })}
                  placeholder="Enter HTML email body. Use {{first_name}}, {{email}}, {{unsubscribe_url}} for personalization."
                  className={`${inputClasses} font-mono text-xs`}
                  rows={8}
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-[var(--accent-blue)] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--accent-blue)]/90"
              >
                Add Step
              </button>
              <button
                type="button"
                onClick={() => setShowStepForm(false)}
                className="rounded-2xl border border-[var(--border-color)] px-6 py-2.5 text-sm text-[var(--text-secondary)] transition-all hover:bg-[var(--hover-bg)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Visual Flow */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
          Flow Timeline
        </h2>

        <div className="relative">
          {/* Trigger Node */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/12 ring-2 ring-blue-500/20">
                <Users size={20} className="text-blue-400" />
              </div>
              {sortedSteps.length > 0 && (
                <div className="flex h-8 flex-col items-center justify-center">
                  <div className="h-full w-[2px] bg-gradient-to-b from-blue-500/30 to-[var(--border-color)]" />
                </div>
              )}
            </div>
            <div className="pt-2.5">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Trigger: Lead Signs Up
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                New lead is enrolled into this flow
              </p>
            </div>
          </div>

          {/* Steps */}
          {sortedSteps.length > 0 ? (
            sortedSteps.map((step, idx) => {
              const config = emailTypeConfig[step.email_type] || defaultConfig;
              const StepIcon = config.icon;
              const isLast = idx === sortedSteps.length - 1;

              return (
                <div key={step.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    {/* Wait indicator */}
                    {step.day_offset > 0 && (
                      <div className="flex items-center gap-2 py-2">
                        <div className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 ring-1 ring-[var(--border-color)]">
                          <Clock size={10} className="text-[var(--text-muted)]" />
                          <span className="text-[10px] font-medium tabular-nums text-[var(--text-muted)]">
                            {step.day_offset === 0
                              ? "Immediately"
                              : step.day_offset === 1
                                ? "1 day"
                                : `${step.day_offset} days`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Arrow */}
                    <div className="flex h-5 flex-col items-center">
                      <ArrowDown size={14} className="text-[var(--text-muted)]/50" />
                    </div>

                    {/* Step node */}
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.bg} ring-2 ${config.ring}`}
                    >
                      <StepIcon size={20} className={config.text} />
                    </div>

                    {/* Connector line */}
                    {!isLast && (
                      <div className="flex h-4 flex-col items-center">
                        <div className="h-full w-[2px] bg-[var(--border-color)]" />
                      </div>
                    )}
                  </div>

                  {/* Step content card */}
                  <div className="flex-1 pb-4" style={{ paddingTop: step.day_offset > 0 ? "2.25rem" : "0" }}>
                    <div className="mt-[1.75rem] rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 transition-all hover:border-[var(--border-color-strong)]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold tabular-nums text-[var(--text-muted)]">
                              Step {step.step_number}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bg} ${config.text}`}
                            >
                              <span className={`h-1 w-1 rounded-full ${config.dot}`} />
                              {config.label}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm font-medium text-[var(--text-primary)]">
                            {step.subject}
                          </p>
                          {step.step_key && (
                            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                              Key: <code className="rounded bg-white/[0.04] px-1 py-0.5">{step.step_key}</code>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-2 py-1">
                          <Clock size={11} className="text-[var(--text-muted)]" />
                          <span className="text-[10px] tabular-nums text-[var(--text-muted)]">
                            Day {step.day_offset}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="ml-6 mt-4 border-l-2 border-dashed border-[var(--border-color)] py-6 pl-8">
              <p className="text-sm text-[var(--text-muted)]">
                No steps yet. Click &ldquo;Add Step&rdquo; to build your flow.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
