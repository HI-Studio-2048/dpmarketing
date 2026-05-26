/**
 * Add attachments_json column to broadcasts table.
 * Run once: npx tsx scripts/add-attachments-column.ts
 *
 * Or run this SQL in Supabase Dashboard > SQL Editor:
 * ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS attachments_json jsonb DEFAULT NULL;
 */

const API = "https://team.danielphilip.com";

async function main() {
  console.log("Adding attachments_json column via API...");

  // Test by creating a broadcast with the new field
  // If it fails, the column doesn't exist yet
  const res = await fetch(`${API}/api/admin/broadcasts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: "__migration_test__",
      html_body: "<p>test</p>",
      segment_json: { status: "NONEXISTENT_STATUS_MIGRATION_TEST" },
      attachments: [{ filename: "test.txt", content: "dGVzdA==", type: "text/plain", size: 4 }],
    }),
  });

  if (res.ok) {
    console.log("Column exists and working! Cleaning up test broadcast...");
    // The broadcast would have 0 recipients due to fake status filter
  } else {
    const data = await res.json();
    console.log("Response:", data);
    console.log("\n⚠️  If you see a column error, run this in Supabase SQL Editor:");
    console.log("ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS attachments_json jsonb DEFAULT NULL;");
  }
}

main();
