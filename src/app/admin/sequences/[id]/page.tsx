"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";

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

const emailTypeColors: Record<string, string> = {
  welcome: "bg-green-500/10 text-green-400",
  education: "bg-blue-500/10 text-blue-400",
  offer: "bg-orange-500/10 text-orange-400",
  value: "bg-purple-500/10 text-purple-400",
  urgency: "bg-red-500/10 text-red-400",
  behavioral: "bg-cyan-500/10 text-cyan-400",
};

export default function SequenceDetailPage() {
  const router = useRouter();
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
    if (id) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      fetchSequence();
    }
  }, [id]);

  async function fetchSequence() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/sequences/${id}`);
      const data = await response.json();
      setSequence(data.sequence);

      const nextStepNumber =
        (data.sequence.sequence_steps?.length || 0) + 1;
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
        const nextStepNumber =
          (sequence?.sequence_steps?.length || 0) + 1;
        setStepForm({
          step_number: String(nextStepNumber),
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
      <div className="text-sm text-[var(--text-secondary)]">Loading...</div>
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
    "w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]";
  const labelClasses =
    "mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]";

  return (
    <div>
      <Link
        href="/admin/sequences"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--accent-blue)] hover:underline"
      >
        <ChevronLeft size={16} />
        Back to Sequences
      </Link>

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          {sequence.name}
        </h1>
        {sequence.description && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {sequence.description}
          </p>
        )}
        <div className="mt-3">
          <span
            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
              sequence.is_active
                ? "bg-green-500/10 text-green-400"
                : "bg-gray-500/10 text-gray-400"
            }`}
          >
            {sequence.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Email Steps
          </h2>
          <button
            onClick={() => setShowStepForm(!showStepForm)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[var(--accent-blue)]/20"
          >
            <Plus size={16} />
            Add Step
          </button>
        </div>

        {showStepForm && (
          <form
            onSubmit={handleAddStep}
            className="mt-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClasses}>Step Number</label>
                <input
                  type="number"
                  value={stepForm.step_number}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, step_number: e.target.value })
                  }
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className={labelClasses}>Days After Enrollment</label>
                <input
                  type="number"
                  value={stepForm.day_offset}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, day_offset: e.target.value })
                  }
                  className={inputClasses}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClasses}>Email Subject</label>
                <input
                  type="text"
                  value={stepForm.subject}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, subject: e.target.value })
                  }
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className={labelClasses}>Step Key</label>
                <input
                  type="text"
                  value={stepForm.step_key}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, step_key: e.target.value })
                  }
                  placeholder="e.g., welcome, offer_1"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Email Type</label>
                <select
                  value={stepForm.email_type}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, email_type: e.target.value })
                  }
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
                <label className={labelClasses}>HTML Body</label>
                <textarea
                  value={stepForm.html_body}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, html_body: e.target.value })
                  }
                  placeholder="Enter HTML email body. Use {{first_name}}, {{email}}, {{unsubscribe_url}} for personalization."
                  className={`${inputClasses} font-mono`}
                  rows={8}
                  required
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] px-5 py-2.5 text-sm font-medium text-white"
              >
                Add Step
              </button>
              <button
                type="button"
                onClick={() => setShowStepForm(false)}
                className="rounded-lg border border-[var(--border-color)] px-5 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {sequence.sequence_steps && sequence.sequence_steps.length > 0 ? (
          <div className="mt-6 space-y-3">
            {sequence.sequence_steps
              .sort((a, b) => a.day_offset - b.day_offset)
              .map((step) => (
                <div
                  key={step.id}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 transition-all hover:border-[var(--accent-blue)]/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        Step {step.step_number}: {step.subject}
                      </h3>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-lg bg-[var(--bg-primary)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                          Day {step.day_offset}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            emailTypeColors[step.email_type] ||
                            "bg-gray-500/10 text-gray-400"
                          }`}
                        >
                          {step.email_type}
                        </span>
                      </div>
                      {step.step_key && (
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                          Key: {step.step_key}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              No steps yet. Add the first step to begin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
