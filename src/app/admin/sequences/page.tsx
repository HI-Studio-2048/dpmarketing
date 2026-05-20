"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Zap } from "lucide-react";

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              Email Sequences
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Manage your drip campaigns
            </p>
          </div>
          {isMock && (
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
              Mock Data
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[var(--accent-blue)]/20 transition-all hover:shadow-xl hover:shadow-[var(--accent-blue)]/30 disabled:opacity-30"
          disabled={isMock}
        >
          <Plus size={16} />
          New Sequence
        </button>
      </div>

      {showCreate && (
        <div className="mb-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
            Create New Sequence
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Sequence Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Welcome Series"
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Description (optional)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What is this sequence for?"
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] px-5 py-2.5 text-sm font-medium text-white"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-[var(--border-color)] px-5 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8">
          <p className="text-sm text-[var(--text-secondary)]">
            Loading sequences...
          </p>
        </div>
      ) : sequences.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--bg-primary)]">
            <Zap size={24} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            No sequences yet. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {sequences.map((seq) => (
            <Link
              key={seq.id}
              href={`/admin/sequences/${seq.id}`}
              className="group rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 transition-all hover:border-[var(--accent-blue)]/30 hover:shadow-lg hover:shadow-[var(--accent-blue)]/5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    {seq.name}
                  </h3>
                  {seq.description && (
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {seq.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(seq.id);
                  }}
                  className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-[var(--accent-red)]"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-4 flex gap-4 text-sm text-[var(--text-secondary)]">
                <div className="rounded-lg bg-[var(--bg-primary)] px-3 py-1.5">
                  <span className="font-medium text-[var(--text-primary)]">
                    {seq.sequence_steps?.length || 0}
                  </span>{" "}
                  steps
                </div>
                <div className="rounded-lg bg-[var(--bg-primary)] px-3 py-1.5">
                  <span className="font-medium text-[var(--text-primary)]">
                    {seq.lead_sequence_enrollments?.length || 0}
                  </span>{" "}
                  enrolled
                </div>
              </div>
              <div className="mt-4">
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                    seq.is_active
                      ? "bg-green-500/10 text-green-400"
                      : "bg-gray-500/10 text-gray-400"
                  }`}
                >
                  {seq.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
