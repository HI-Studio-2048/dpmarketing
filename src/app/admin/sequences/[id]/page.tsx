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

      // Auto-increment step number
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
        // Reset form
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
    return <div className="text-slate-600">Loading...</div>;
  }

  if (!sequence) {
    return <div className="text-slate-600">Sequence not found</div>;
  }

  return (
    <div>
      <Link
        href="/admin/sequences"
        className="mb-6 flex items-center gap-2 text-blue-600 hover:underline"
      >
        <ChevronLeft size={18} />
        Back to Sequences
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">{sequence.name}</h1>
        {sequence.description && (
          <p className="mt-2 text-slate-600">{sequence.description}</p>
        )}
        <div className="mt-2">
          <span
            className={`inline-block rounded px-2 py-1 text-xs font-medium ${sequence.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}`}
          >
            {sequence.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Email Steps</h2>
          <button
            onClick={() => setShowStepForm(!showStepForm)}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Step
          </button>
        </div>

        {showStepForm && (
          <form
            onSubmit={handleAddStep}
            className="mt-6 rounded-lg bg-white p-6 shadow"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Step Number
                </label>
                <input
                  type="number"
                  value={stepForm.step_number}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, step_number: e.target.value })
                  }
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Days After Enrollment
                </label>
                <input
                  type="number"
                  value={stepForm.day_offset}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, day_offset: e.target.value })
                  }
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={stepForm.subject}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, subject: e.target.value })
                  }
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Step Key
                </label>
                <input
                  type="text"
                  value={stepForm.step_key}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, step_key: e.target.value })
                  }
                  placeholder="e.g., welcome, offer_1"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email Type
                </label>
                <select
                  value={stepForm.email_type}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, email_type: e.target.value })
                  }
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
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
                <label className="block text-sm font-medium text-slate-700">
                  HTML Body
                </label>
                <textarea
                  value={stepForm.html_body}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, html_body: e.target.value })
                  }
                  placeholder="Enter HTML email body. Use {{first_name}}, {{email}}, {{unsubscribe_url}} for personalization."
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm"
                  rows={8}
                  required
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Add Step
              </button>
              <button
                type="button"
                onClick={() => setShowStepForm(false)}
                className="rounded bg-slate-200 px-4 py-2 hover:bg-slate-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {sequence.sequence_steps && sequence.sequence_steps.length > 0 ? (
          <div className="mt-6 space-y-4">
            {sequence.sequence_steps
              .sort((a, b) => a.day_offset - b.day_offset)
              .map((step) => (
                <div
                  key={step.id}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Step {step.step_number}: {step.subject}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Day {step.day_offset} •{" "}
                        <span className="inline-block rounded bg-slate-100 px-2 py-1 text-xs">
                          {step.email_type}
                        </span>
                      </p>
                      {step.step_key && (
                        <p className="mt-1 text-xs text-slate-500">
                          Key: {step.step_key}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="mt-6 rounded-lg bg-slate-50 p-6 text-center">
            <p className="text-slate-600">
              No steps yet. Add the first step to begin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
