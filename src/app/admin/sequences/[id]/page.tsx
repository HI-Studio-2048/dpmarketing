"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
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
  Pencil,
  Trash2,
  Save,
  X,
  Eye,
  Code,
  Check,
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

const inputClasses =
  "w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]/30";

export default function SequenceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sequence header editing
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({ name: "", description: "" });

  // Step editing
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [stepForm, setStepForm] = useState<Partial<SequenceStep>>({});
  const [previewMode, setPreviewMode] = useState<"code" | "preview">("preview");
  const [stepSaving, setStepSaving] = useState(false);

  // Add step
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStepForm, setNewStepForm] = useState({
    step_number: "",
    day_offset: "",
    subject: "",
    html_body: "",
    step_key: "",
    email_type: "value",
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchSequence = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/sequences/${id}`);
      const data = await response.json();
      setSequence(data.sequence);
    } catch (error) {
      console.error("Failed to fetch sequence:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchSequence();
  }, [id, fetchSequence]);

  // Toggle active/inactive
  async function toggleActive() {
    if (!sequence) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sequences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !sequence.is_active }),
      });
      if (res.ok) {
        setSequence({ ...sequence, is_active: !sequence.is_active });
      }
    } finally {
      setSaving(false);
    }
  }

  // Save sequence header
  async function saveHeader() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sequences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: headerForm.name, description: headerForm.description }),
      });
      if (res.ok) {
        setSequence((prev) =>
          prev ? { ...prev, name: headerForm.name, description: headerForm.description } : prev
        );
        setEditingHeader(false);
      }
    } finally {
      setSaving(false);
    }
  }

  // Start editing a step
  function startEditStep(step: SequenceStep) {
    setEditingStep(step.id);
    setStepForm({
      subject: step.subject,
      day_offset: step.day_offset,
      email_type: step.email_type,
      step_key: step.step_key,
      html_body: step.html_body,
    });
    setExpandedStep(step.id);
    setPreviewMode("preview");
  }

  // Save step edits
  async function saveStep(stepId: string) {
    setStepSaving(true);
    try {
      const res = await fetch(`/api/admin/sequences/${id}/steps/${stepId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stepForm),
      });
      if (res.ok) {
        await fetchSequence();
        setEditingStep(null);
      }
    } finally {
      setStepSaving(false);
    }
  }

  // Delete a step
  async function deleteStep(stepId: string) {
    try {
      const res = await fetch(`/api/admin/sequences/${id}/steps/${stepId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirm(null);
        setExpandedStep(null);
        setEditingStep(null);
        await fetchSequence();
      }
    } catch (error) {
      console.error("Failed to delete step:", error);
    }
  }

  // Add new step
  async function handleAddStep(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/sequences/${id}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step_number: parseInt(newStepForm.step_number),
          day_offset: parseInt(newStepForm.day_offset),
          subject: newStepForm.subject,
          html_body: newStepForm.html_body,
          step_key: newStepForm.step_key,
          email_type: newStepForm.email_type,
        }),
      });
      if (res.ok) {
        setShowAddStep(false);
        setNewStepForm({
          step_number: "",
          day_offset: "",
          subject: "",
          html_body: "",
          step_key: "",
          email_type: "value",
        });
        await fetchSequence();
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
      <div className="text-sm text-[var(--text-secondary)]">Sequence not found</div>
    );
  }

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
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                sequence.is_active
                  ? "bg-emerald-500/12 text-emerald-400"
                  : "bg-gray-500/10 text-gray-400"
              }`}
            >
              <Zap size={20} />
            </div>

            {editingHeader ? (
              <div className="flex-1 space-y-3">
                <input
                  value={headerForm.name}
                  onChange={(e) => setHeaderForm({ ...headerForm, name: e.target.value })}
                  className={inputClasses}
                  placeholder="Flow name"
                />
                <input
                  value={headerForm.description}
                  onChange={(e) => setHeaderForm({ ...headerForm, description: e.target.value })}
                  className={inputClasses}
                  placeholder="Description"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveHeader}
                    disabled={saving || !headerForm.name}
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-blue)] px-4 py-2 text-xs font-medium text-white transition-all hover:bg-[var(--accent-blue)]/90 disabled:opacity-40"
                  >
                    <Save size={14} />
                    Save
                  </button>
                  <button
                    onClick={() => setEditingHeader(false)}
                    className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-4 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                    {sequence.name}
                  </h1>
                  <button
                    onClick={() => {
                      setHeaderForm({
                        name: sequence.name,
                        description: sequence.description || "",
                      });
                      setEditingHeader(true);
                    }}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
                {sequence.description && (
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                    {sequence.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Active toggle */}
          <button
            onClick={toggleActive}
            disabled={saving}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all ${
              sequence.is_active
                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                sequence.is_active ? "bg-emerald-400" : "bg-gray-400"
              }`}
            />
            {sequence.is_active ? "Active" : "Inactive"}
          </button>
        </div>
      </div>

      {/* Flow Timeline */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Flow Timeline ({sortedSteps.length} {sortedSteps.length === 1 ? "step" : "steps"})
        </h2>
        <button
          onClick={() => {
            setNewStepForm((prev) => ({
              ...prev,
              step_number: String(sortedSteps.length + 1),
              day_offset: sortedSteps.length > 0 ? String(sortedSteps[sortedSteps.length - 1].day_offset + 2) : "0",
            }));
            setShowAddStep(!showAddStep);
          }}
          className="flex items-center gap-2 rounded-2xl bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--accent-blue)]/90 hover:shadow-lg hover:shadow-[var(--accent-blue)]/20"
        >
          <Plus size={16} />
          Add Step
        </button>
      </div>

      {/* Add Step Form */}
      {showAddStep && (
        <div className="animate-fade-up rounded-2xl border border-[var(--accent-blue)]/30 bg-[var(--bg-card)] p-6">
          <h3 className="mb-5 text-base font-semibold text-[var(--text-primary)]">
            Add Email Step
          </h3>
          <form onSubmit={handleAddStep} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Step Number
                </label>
                <input
                  type="number"
                  value={newStepForm.step_number}
                  onChange={(e) => setNewStepForm({ ...newStepForm, step_number: e.target.value })}
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
                  value={newStepForm.day_offset}
                  onChange={(e) => setNewStepForm({ ...newStepForm, day_offset: e.target.value })}
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
                  value={newStepForm.subject}
                  onChange={(e) => setNewStepForm({ ...newStepForm, subject: e.target.value })}
                  placeholder="e.g., Welcome {{first_name}} — Here's what to expect"
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
                  value={newStepForm.step_key}
                  onChange={(e) => setNewStepForm({ ...newStepForm, step_key: e.target.value })}
                  placeholder="e.g., welcome, offer_1"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Email Type
                </label>
                <select
                  value={newStepForm.email_type}
                  onChange={(e) => setNewStepForm({ ...newStepForm, email_type: e.target.value })}
                  className={inputClasses}
                >
                  {Object.entries(emailTypeConfig).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  HTML Body
                </label>
                <textarea
                  value={newStepForm.html_body}
                  onChange={(e) => setNewStepForm({ ...newStepForm, html_body: e.target.value })}
                  placeholder="Paste HTML email body. Use {{first_name}}, {{email}}, {{unsubscribe_url}} for personalization."
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
                onClick={() => setShowAddStep(false)}
                className="rounded-2xl border border-[var(--border-color)] px-6 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Steps */}
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

        {/* Step Cards */}
        {sortedSteps.length > 0 ? (
          sortedSteps.map((step, idx) => {
            const config = emailTypeConfig[step.email_type] || defaultConfig;
            const StepIcon = config.icon;
            const isLast = idx === sortedSteps.length - 1;
            const isExpanded = expandedStep === step.id;
            const isEditing = editingStep === step.id;

            return (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  {/* Wait indicator */}
                  {step.day_offset > 0 && (
                    <div className="flex items-center gap-2 py-2">
                      <div className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 ring-1 ring-[var(--border-color)]">
                        <Clock size={10} className="text-[var(--text-muted)]" />
                        <span className="text-[10px] font-medium tabular-nums text-[var(--text-muted)]">
                          {step.day_offset === 1 ? "1 day" : `${step.day_offset} days`}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex h-5 flex-col items-center">
                    <ArrowDown size={14} className="text-[var(--text-muted)]/50" />
                  </div>

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.bg} ring-2 ${config.ring}`}
                  >
                    <StepIcon size={20} className={config.text} />
                  </div>

                  {!isLast && (
                    <div className="flex h-4 flex-col items-center">
                      <div className="h-full w-[2px] bg-[var(--border-color)]" />
                    </div>
                  )}
                </div>

                {/* Step content */}
                <div
                  className="flex-1 pb-4"
                  style={{ paddingTop: step.day_offset > 0 ? "2.25rem" : "0" }}
                >
                  <div
                    className={`mt-[1.75rem] rounded-2xl border bg-[var(--bg-card)] transition-all ${
                      isExpanded
                        ? "border-[var(--accent-blue)]/30"
                        : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                    }`}
                  >
                    {/* Step header — always visible, clickable */}
                    <button
                      onClick={() => {
                        if (isExpanded && !isEditing) {
                          setExpandedStep(null);
                        } else {
                          setExpandedStep(step.id);
                        }
                      }}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
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
                          <span className="flex items-center gap-1 rounded-lg bg-white/[0.03] px-2 py-0.5">
                            <Clock size={10} className="text-[var(--text-muted)]" />
                            <span className="text-[10px] tabular-nums text-[var(--text-muted)]">
                              Day {step.day_offset}
                            </span>
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm font-medium text-[var(--text-primary)]">
                          {step.subject}
                        </p>
                      </div>
                      <div className="ml-3 text-[var(--text-muted)]">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t border-[var(--border-color)] p-4">
                        {/* Action buttons */}
                        <div className="mb-4 flex items-center gap-2">
                          {!isEditing ? (
                            <>
                              <button
                                onClick={() => startEditStep(step)}
                                className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-blue)]/10 px-3 py-2 text-xs font-medium text-[var(--accent-blue)] transition-all hover:bg-[var(--accent-blue)]/20"
                              >
                                <Pencil size={13} />
                                Edit Email
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(step.id)}
                                className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400 transition-all hover:bg-rose-500/20"
                              >
                                <Trash2 size={13} />
                                Delete
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => saveStep(step.id)}
                                disabled={stepSaving}
                                className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-40"
                              >
                                <Save size={13} />
                                {stepSaving ? "Saving..." : "Save Changes"}
                              </button>
                              <button
                                onClick={() => setEditingStep(null)}
                                className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                              >
                                <X size={13} />
                                Cancel
                              </button>
                            </>
                          )}
                        </div>

                        {/* Delete confirmation */}
                        {deleteConfirm === step.id && (
                          <div className="mb-4 flex items-center gap-3 rounded-xl bg-rose-500/10 px-4 py-3">
                            <p className="flex-1 text-xs text-rose-400">
                              Delete this step? This cannot be undone.
                            </p>
                            <button
                              onClick={() => deleteStep(step.id)}
                              className="flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-600"
                            >
                              <Check size={12} />
                              Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="rounded-lg px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Edit form or view */}
                        {isEditing ? (
                          <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                              <div>
                                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                                  Days After Enrollment
                                </label>
                                <input
                                  type="number"
                                  value={stepForm.day_offset ?? ""}
                                  onChange={(e) =>
                                    setStepForm({ ...stepForm, day_offset: parseInt(e.target.value) || 0 })
                                  }
                                  className={inputClasses}
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                                  Email Type
                                </label>
                                <select
                                  value={stepForm.email_type || "value"}
                                  onChange={(e) =>
                                    setStepForm({ ...stepForm, email_type: e.target.value })
                                  }
                                  className={inputClasses}
                                >
                                  {Object.entries(emailTypeConfig).map(([key, cfg]) => (
                                    <option key={key} value={key}>{cfg.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                                  Step Key
                                </label>
                                <input
                                  type="text"
                                  value={stepForm.step_key ?? ""}
                                  onChange={(e) =>
                                    setStepForm({ ...stepForm, step_key: e.target.value })
                                  }
                                  className={inputClasses}
                                  placeholder="e.g., welcome"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                                Subject Line
                              </label>
                              <input
                                type="text"
                                value={stepForm.subject ?? ""}
                                onChange={(e) =>
                                  setStepForm({ ...stepForm, subject: e.target.value })
                                }
                                className={inputClasses}
                              />
                            </div>

                            {/* HTML editor with preview toggle */}
                            <div>
                              <div className="mb-2 flex items-center justify-between">
                                <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                                  Email Body
                                </label>
                                <div className="flex rounded-xl border border-[var(--border-color)] overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewMode("code")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors ${
                                      previewMode === "code"
                                        ? "bg-[var(--accent-blue)]/12 text-[var(--accent-blue)]"
                                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    }`}
                                  >
                                    <Code size={12} />
                                    HTML
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewMode("preview")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors ${
                                      previewMode === "preview"
                                        ? "bg-[var(--accent-blue)]/12 text-[var(--accent-blue)]"
                                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    }`}
                                  >
                                    <Eye size={12} />
                                    Preview
                                  </button>
                                </div>
                              </div>

                              {previewMode === "code" ? (
                                <textarea
                                  value={stepForm.html_body ?? ""}
                                  onChange={(e) =>
                                    setStepForm({ ...stepForm, html_body: e.target.value })
                                  }
                                  className={`${inputClasses} font-mono text-xs`}
                                  rows={16}
                                />
                              ) : (
                                <div className="rounded-2xl border border-[var(--border-color)] bg-white overflow-hidden">
                                  <iframe
                                    srcDoc={stepForm.html_body || "<p>No content</p>"}
                                    className="h-[500px] w-full"
                                    sandbox="allow-same-origin"
                                    title="Email preview"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* View mode — just show preview */
                          <div>
                            {step.step_key && (
                              <p className="mb-3 text-[11px] text-[var(--text-muted)]">
                                Key: <code className="rounded bg-white/[0.04] px-1.5 py-0.5">{step.step_key}</code>
                              </p>
                            )}
                            <div className="rounded-2xl border border-[var(--border-color)] bg-white overflow-hidden">
                              <iframe
                                srcDoc={step.html_body || "<p>No content</p>"}
                                className="h-[400px] w-full"
                                sandbox="allow-same-origin"
                                title="Email preview"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
  );
}
