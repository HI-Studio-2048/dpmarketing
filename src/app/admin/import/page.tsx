// src/app/admin/import/page.tsx
"use client";

import { useState } from "react";

interface Row {
  email: string;
  first_name?: string;
  phone?: string;
  status?: string;
}

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name);
  const ei = idx("email");
  const fi = idx("first_name");
  const pi = idx("phone");
  const si = idx("status");
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const email = (cols[ei] || "").trim();
    if (!email) continue;
    rows.push({
      email,
      first_name: fi >= 0 ? (cols[fi] || "").trim() : undefined,
      phone: pi >= 0 ? (cols[pi] || "").trim() : undefined,
      status: si >= 0 ? (cols[si] || "").trim() : undefined,
    });
  }
  return rows;
}

export default function ImportPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRows(parseCsv(String(reader.result || "")));
    reader.readAsText(file);
  }

  async function upload() {
    setBusy(true);
    setLog([]);
    let done = 0;
    const size = 1000;
    for (let i = 0; i < rows.length; i += size) {
      const slice = rows.slice(i, i + size);
      const res = await fetch("/api/admin/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: slice }),
      });
      const data = await res.json();
      done += slice.length;
      setLog((l) => [...l, res.ok ? `Imported ${done}/${rows.length}` : `Error: ${data.error}`]);
      if (!res.ok) break;
    }
    setBusy(false);
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Import Leads (CSV)</h1>
      <div className="space-y-4 rounded-lg bg-white p-6 shadow">
        <p className="text-sm text-slate-600">
          CSV with a header row. Recognized columns: <code>email</code> (required),{" "}
          <code>first_name</code>, <code>phone</code>, <code>status</code>. Existing emails are
          updated, not duplicated.
        </p>
        <input type="file" accept=".csv,text/csv" onChange={onFile} />
        {rows.length > 0 && (
          <p className="text-sm font-medium">{rows.length} rows parsed.</p>
        )}
        <button
          onClick={upload}
          disabled={busy || rows.length === 0}
          className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-slate-400"
        >
          {busy ? "Importing..." : "Import"}
        </button>
        {log.length > 0 && (
          <div className="rounded bg-slate-50 p-4 font-mono text-xs">
            {log.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
