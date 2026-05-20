"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

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
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Email Sequences</h1>
          {isMock && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              📋 Mock Data
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-slate-400"
          disabled={isMock}
        >
          <Plus size={18} />
          New Sequence
        </button>
      </div>

      {showCreate && (
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-bold">Create New Sequence</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Sequence Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Welcome Series"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Description (optional)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What is this sequence for?"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded bg-slate-200 px-4 py-2 hover:bg-slate-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-slate-600">Loading sequences...</p>
        </div>
      ) : sequences.length === 0 ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-slate-600">No sequences yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {sequences.map((seq) => (
            <Link
              key={seq.id}
              href={`/admin/sequences/${seq.id}`}
              className="rounded-lg bg-white p-6 shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{seq.name}</h3>
                  {seq.description && (
                    <p className="mt-1 text-sm text-slate-600">
                      {seq.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(seq.id);
                  }}
                  className="text-slate-400 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="mt-4 flex gap-4 text-sm text-slate-600">
                <div>
                  <span className="font-medium">
                    {seq.sequence_steps?.length || 0}
                  </span>{" "}
                  steps
                </div>
                <div>
                  <span className="font-medium">
                    {seq.lead_sequence_enrollments?.length || 0}
                  </span>{" "}
                  enrolled
                </div>
              </div>
              <div className="mt-4">
                <span
                  className={`inline-block rounded px-2 py-1 text-xs font-medium ${seq.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}`}
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
