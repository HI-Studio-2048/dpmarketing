/**
 * One-time script to import Facebook/Instagram lead ad CSV into Supabase.
 *
 * Usage:
 *   npx tsx scripts/import-fb-leads.ts "/path/to/csv-file.csv"
 *
 * The CSV is exported from Facebook Ads Manager (UTF-16 LE encoded, tab-separated).
 * It upserts on email so it's safe to run multiple times.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load env from .env.local
import { config } from "dotenv";
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === "https://placeholder.supabase.co") {
  console.error("ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseCSV(filePath: string) {
  const raw = readFileSync(filePath);

  // Detect UTF-16 LE BOM (0xFF 0xFE)
  let content: string;
  if (raw[0] === 0xff && raw[1] === 0xfe) {
    content = raw.toString("utf16le");
  } else {
    content = raw.toString("utf8");
  }

  // Remove BOM if present
  content = content.replace(/^\uFEFF/, "");

  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    console.error("CSV has no data rows");
    process.exit(1);
  }

  const headers = lines[0].split("\t").map((h) => h.trim());
  const emailIdx = headers.indexOf("email");
  const nameIdx = headers.indexOf("full_name");
  const phoneIdx = headers.indexOf("phone_number");
  const platformIdx = headers.indexOf("platform");
  const createdIdx = headers.indexOf("created_time");
  const campaignIdx = headers.indexOf("campaign_name");

  if (emailIdx === -1) {
    console.error("CSV missing 'email' column. Headers found:", headers);
    process.exit(1);
  }

  const leads: Array<{
    email: string;
    first_name: string;
    phone: string;
    platform: string;
    source: string;
    created_at: string;
    tags: string[];
    status: string;
    unsubscribed: boolean;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t").map((c) => c.trim().replace(/^"|"$/g, ""));
    const email = cols[emailIdx]?.toLowerCase().trim();
    if (!email || !email.includes("@")) continue;

    const fullName = cols[nameIdx] || "";
    // Extract first name from full_name
    const firstName = fullName.split(/\s+/)[0] || fullName;

    // Phone: strip "p:" prefix from Facebook export format
    let phone = cols[phoneIdx] || "";
    phone = phone.replace(/^p:/, "").trim();

    const platform = cols[platformIdx] || "";
    const createdTime = cols[createdIdx] || new Date().toISOString();
    const campaignName = cols[campaignIdx]?.replace(/^"|"$/g, "") || "fb-lead-ad";

    leads.push({
      email,
      first_name: firstName,
      phone,
      platform: platform === "ig" ? "instagram" : platform === "fb" ? "facebook" : platform,
      source: `fb-lead-ad:${campaignName}`,
      created_at: createdTime,
      tags: ["fb-lead-ad", platform],
      status: "Lead",
      unsubscribed: false,
    });
  }

  return leads;
}

async function importLeads(filePath: string) {
  console.log(`Parsing CSV: ${filePath}`);
  const leads = parseCSV(filePath);
  console.log(`Found ${leads.length} leads to import`);

  if (leads.length === 0) {
    console.log("No leads to import.");
    return;
  }

  // Upsert in batches of 50
  const BATCH_SIZE = 50;
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from("leads")
      .upsert(batch, { onConflict: "email", ignoreDuplicates: false })
      .select("id");

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      skipped += batch.length;
    } else {
      imported += data?.length || batch.length;
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} leads upserted`);
    }
  }

  console.log(`\nDone! Imported: ${imported}, Errors: ${skipped}`);
}

// Run
const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: npx tsx scripts/import-fb-leads.ts <path-to-csv>");
  process.exit(1);
}

importLeads(resolve(csvPath));
