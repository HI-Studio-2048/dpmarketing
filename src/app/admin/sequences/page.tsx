"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Zap,
  Mail,
  Clock,
  Users,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

interface Sequence {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  sequence_steps: Array<{ id: string }>;
  lead_sequence_enrollments: Array<{ id: string }>;
  created_at: string;
}

interface SequencesResponse {
  sequences: Sequence[];
  isMock?: boolean;
}

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    fetchSequences();
  }, []);

  async function fetchSequences() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/sequences");
      const data = (await response.json()) as SequencesResponse;
      setSequences(data.sequences || []);
      setIsMock(data.isMock || false);
    } catch (error) {
      console.error("Failed to fetch sequences:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
        }),
      });

      if (response.ok) {
        setNewName("");
        setNewDescription("");
        setShowCreate(false);
        await fetchSequences();
      } else {
        alert("Cannot create sequences in demo mode. Set up Supabase first.");
      }
    } catch (error) {
      console.error("Failed to create sequence:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this sequence and all its steps?")) return;

    try {
      const response = await fetch(`/api/admin/sequences/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchSequences();
      }
    } catch (error) {
      console.error("Failed to delete sequence:", error);
    }
  }

  const inputClasses =
    "w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]/30";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Email Flows
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Build automated email marketing sequences
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isMock && (
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
              Mock Data
            </span>
          )}
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 rounded-2xl bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--accent-blue)]/90 hover:shadow-lg hover:shadow-[var(--accent-blue)]/20 disabled:opacity-30"
            disabled={isMock}
          >
            <Plus size={16} />
            New Flow
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="animate-fade-up rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-5 text-base font-semibold text-[var(--text-primary)]">
            Create New Flow
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Flow Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Welcome Series"
                className={inputClasses}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Description (optional)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What is this flow for?"
                className={inputClasses}
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-[var(--accent-blue)] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--accent-blue)]/90"
              >
                Create Flow
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-2xl border border-[var(--border-color)] px-6 py-2.5 text-sm text-[var(--text-secondary)] transition-all hover:bg-[var(--hover-bg)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sequences List */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] py-16">
          <p className="text-sm text-[var(--text-muted)]">Loading flows...</p>
        </div>
      ) : sequences.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-blue)]/10">
            <Zap size={24} className="text-[var(--accent-blue)]" />
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            No flows yet
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Create your first automated email flow to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sequences.map((seq, i) => {
            const stepCount = seq.sequence_steps?.length || 0;
            const enrolled = seq.lead_sequence_enrollments?.length || 0;
            return (
              <div
                key={seq.id}
                className="animate-fade-up rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:border-[var(--border-color-strong)] hover:shadow-lg hover:shadow-black/10"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        seq.is_active
                          ? "bg-emerald-500/12 text-emerald-400"
                          : "bg-gray-500/10 text-gray-400"
                      }`}
                    >
                      <Zap size={18} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                        {seq.name}
                      </h3>
                      {seq.description && (
                        <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                          {seq.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            seq.is_active
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-gray-500/10 text-gray-400"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              seq.is_active ? "bg-emerald-400" : "bg-gray-400"
                            }`}
                          />
                          {seq.is_active ? "Active" : "Inactive"}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <Mail size={12} />
                          {stepCount} steps
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <Users size={12} />
                          {enrolled} enrolled
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(seq.id)}
                      className="rounded-xl p-2 text-[var(--text-muted)] transition-all hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Visual Flow */}
                <div className="mt-5 rounded-xl bg-white/[0.02] px-4 py-4">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {/* Trigger */}
                    <div className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-blue-500/10 px-3 py-2 ring-1 ring-blue-500/20">
                      <Users size={13} className="text-blue-400" />
                      <span className="text-[11px] font-medium text-blue-300">
                        Lead Signs Up
                      </span>
                    </div>

                    {stepCount > 0 ? (
                      <>
                        {Array.from({ length: Math.min(stepCount, 5) }).map((_, idx) => (
                          <div key={idx} className="flex flex-shrink-0 items-center gap-2">
                            <div className="flex items-center text-[var(--text-muted)]">
                              <div className="h-[1px] w-4 bg-[var(--border-color-strong)]" />
                              <ArrowRight size={10} />
                            </div>
                            {idx === 0 ? (
                              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 ring-1 ring-emerald-500/20">
                                <Mail size={13} className="text-emerald-400" />
                                <span className="text-[11px] font-medium text-emerald-300">
                                  Welcome
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 rounded-xl bg-purple-500/10 px-3 py-2 ring-1 ring-purple-500/20">
                                <div className="flex items-center gap-1">
                                  <Clock size={11} className="text-purple-400" />
                                  <Mail size={13} className="text-purple-400" />
                                </div>
                                <span className="text-[11px] font-medium text-purple-300">
                                  Email {idx + 1}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                        {stepCount > 5 && (
                          <div className="flex flex-shrink-0 items-center gap-2">
                            <div className="flex items-center text-[var(--text-muted)]">
                              <div className="h-[1px] w-4 bg-[var(--border-color-strong)]" />
                              <ArrowRight size={10} />
                            </div>
                            <span className="text-[11px] text-[var(--text-muted)]">
                              +{stepCount - 5} more
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <div className="flex items-center text-[var(--text-muted)]">
                          <div className="h-[1px] w-4 bg-[var(--border-color)]" />
                          <ArrowRight size={10} />
                        </div>
                        <span className="text-[11px] italic text-[var(--text-muted)]">
                          No steps yet
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Link to edit */}
                <Link
                  href={`/admin/sequences/${seq.id}`}
                  className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[var(--accent-blue)] transition-colors hover:text-blue-300"
                >
                  Edit flow
                  <ChevronRight size={13} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
