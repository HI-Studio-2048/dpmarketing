export default function AdminDashboard() {
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>

      {!hasSupabase ? (
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-6">
          <h2 className="mb-3 text-lg font-bold text-amber-900">
            ⚠️ Setup Required
          </h2>
          <ol className="space-y-3 text-amber-800">
            <li>
              <strong>1. Create Supabase Tables</strong>
              <p className="mt-1 text-sm">
                Run the SQL schema from the README.md in your Supabase dashboard
              </p>
            </li>
            <li>
              <strong>2. Set Environment Variables</strong>
              <p className="mt-1 text-sm">
                Fill in <code className="rounded bg-amber-100 px-2 py-1">.env.local</code> with:
              </p>
              <ul className="ml-4 mt-1 space-y-1 text-xs">
                <li>
                  <code>NEXT_PUBLIC_SUPABASE_URL</code>
                </li>
                <li>
                  <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                </li>
                <li>
                  <code>SUPABASE_SERVICE_ROLE_KEY</code>
                </li>
                <li>
                  <code>RESEND_API_KEY</code>
                </li>
                <li>
                  <code>RESEND_WEBHOOK_SECRET</code>
                </li>
                <li>
                  <code>ADMIN_SECRET</code> (your login password)
                </li>
              </ul>
            </li>
            <li>
              <strong>3. Restart Dev Server</strong>
              <p className="mt-1 text-sm">
                Stop and run <code className="rounded bg-amber-100 px-2 py-1">npm run dev</code> again
              </p>
            </li>
          </ol>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-sm text-slate-600">Total Leads</div>
              <div className="mt-2 text-3xl font-bold">—</div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-sm text-slate-600">Active Sequences</div>
              <div className="mt-2 text-3xl font-bold">—</div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-sm text-slate-600">Emails Opened</div>
              <div className="mt-2 text-3xl font-bold">—</div>
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold">Ready to Go!</h2>
            <ul className="space-y-2 text-slate-700">
              <li>✓ Dashboard loaded</li>
              <li>✓ Admin authentication working</li>
              <li>→ Start creating sequences and collecting leads</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
