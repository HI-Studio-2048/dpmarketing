export default function AdminDashboard() {
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  return (
    <div>
      <h1 className="mb-8 text-2xl font-light text-[#121212]">Dashboard</h1>

      {!hasSupabase ? (
        <div className="border border-[#121212]/10 bg-white p-8">
          <h2 className="mb-4 text-sm tracking-wider uppercase text-[#121212]">
            Setup Required
          </h2>
          <ol className="space-y-4 text-sm text-[#121212]/60">
            <li>
              <strong className="text-[#121212]">1. Create Supabase Tables</strong>
              <p className="mt-1">
                Run the SQL schema from README.md in your Supabase dashboard
              </p>
            </li>
            <li>
              <strong className="text-[#121212]">2. Set Environment Variables</strong>
              <p className="mt-1">
                Fill in <code className="bg-[#f3f3f3] px-2 py-0.5 text-xs">.env.local</code> with
                your Supabase, Resend, and admin credentials.
              </p>
            </li>
            <li>
              <strong className="text-[#121212]">3. Restart Dev Server</strong>
              <p className="mt-1">
                Stop and run <code className="bg-[#f3f3f3] px-2 py-0.5 text-xs">npm run dev</code> again
              </p>
            </li>
          </ol>
        </div>
      ) : (
        <>
          <div className="grid gap-px border border-[#121212]/10 bg-[#121212]/10 md:grid-cols-3">
            <div className="bg-white p-6">
              <div className="text-xs tracking-wider uppercase text-[#121212]/40">Total Leads</div>
              <div className="mt-2 text-3xl font-light text-[#121212]">&mdash;</div>
            </div>

            <div className="bg-white p-6">
              <div className="text-xs tracking-wider uppercase text-[#121212]/40">Active Sequences</div>
              <div className="mt-2 text-3xl font-light text-[#121212]">&mdash;</div>
            </div>

            <div className="bg-white p-6">
              <div className="text-xs tracking-wider uppercase text-[#121212]/40">Emails Opened</div>
              <div className="mt-2 text-3xl font-light text-[#121212]">&mdash;</div>
            </div>
          </div>

          <div className="mt-8 border border-[#121212]/10 bg-white p-6">
            <h2 className="mb-4 text-sm tracking-wider uppercase text-[#121212]">Status</h2>
            <ul className="space-y-2 text-sm text-[#121212]/60">
              <li>Dashboard loaded</li>
              <li>Admin authentication working</li>
              <li>Ready to create sequences and collect leads</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
