import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

const PHONE_COUNTRY_MAP: Record<string, string> = {
  "+91": "India",
  "+63": "Philippines",
  "+62": "Indonesia",
  "+81": "Japan",
  "+1": "US/Canada",
  "+44": "UK",
  "+61": "Australia",
  "+353": "Ireland",
  "+351": "Portugal",
  "+34": "Spain",
  "+358": "Finland",
  "+39": "Italy",
  "+356": "Malta",
  "+30": "Greece",
  "+385": "Croatia",
  "+389": "North Macedonia",
  "+355": "Albania",
  "+383": "Kosovo",
  "+421": "Slovakia",
  "+40": "Romania",
  "+49": "Germany",
  "+33": "France",
  "+31": "Netherlands",
  "+46": "Sweden",
  "+47": "Norway",
  "+45": "Denmark",
  "+48": "Poland",
  "+43": "Austria",
  "+41": "Switzerland",
  "+36": "Hungary",
  "+380": "Ukraine",
  "+7": "Russia",
  "+86": "China",
  "+82": "South Korea",
  "+66": "Thailand",
  "+60": "Malaysia",
  "+65": "Singapore",
  "+84": "Vietnam",
  "+880": "Bangladesh",
  "+92": "Pakistan",
  "+94": "Sri Lanka",
  "+977": "Nepal",
  "+971": "UAE",
  "+966": "Saudi Arabia",
  "+20": "Egypt",
  "+27": "South Africa",
  "+234": "Nigeria",
  "+254": "Kenya",
  "+55": "Brazil",
  "+52": "Mexico",
  "+57": "Colombia",
  "+54": "Argentina",
};

function detectCountry(phone: string): string {
  const cleaned = phone.replace(/^p:/, "").trim();
  if (!cleaned || !cleaned.startsWith("+")) return "Unknown";
  // Try longest prefix first (4, 3, 2 digits after +)
  for (const len of [4, 3, 2]) {
    const prefix = cleaned.slice(0, len + 1);
    if (PHONE_COUNTRY_MAP[prefix]) return PHONE_COUNTRY_MAP[prefix];
  }
  return "Other";
}

export async function GET() {
  try {
    // Total emails sent
    const { count: totalEmails } = await supabase
      .from("email_logs")
      .select("*", { count: "exact", head: true });

    // Opened emails
    const { count: openedEmails } = await supabase
      .from("email_logs")
      .select("*", { count: "exact", head: true })
      .not("opened_at", "is", null);

    // Clicked emails
    const { count: clickedEmails } = await supabase
      .from("email_logs")
      .select("*", { count: "exact", head: true })
      .not("clicked_at", "is", null);

    // Bounced emails
    const { count: bouncedEmails } = await supabase
      .from("email_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "bounced");

    // Failed emails
    const { count: failedEmails } = await supabase
      .from("email_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed");

    // Complained (spam)
    const { count: complainedEmails } = await supabase
      .from("email_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "complained");

    // Unsubscribed leads
    const { count: unsubscribed } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("unsubscribed", true);

    // Total leads
    const { count: totalLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true });

    // Active sequences
    const { count: activeSequences } = await supabase
      .from("sequences")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Recent emails (last 30 days) for trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentEmails } = await supabase
      .from("email_logs")
      .select("status, opened_at, clicked_at, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    const total = totalEmails || 0;
    const opened = openedEmails || 0;
    const clicked = clickedEmails || 0;
    const bounced = bouncedEmails || 0;
    const failed = failedEmails || 0;
    const complained = complainedEmails || 0;

    const openRate = total > 0 ? Math.round((opened / total) * 100) : 0;
    const clickRate = total > 0 ? Math.round((clicked / total) * 100) : 0;
    const bounceRate = total > 0 ? Math.round((bounced / total) * 100) : 0;
    const deliveryRate = total > 0 ? Math.round(((total - bounced - failed) / total) * 100) : 0;

    // Group recent emails by date for chart-like data
    const dailyStats: Record<string, { sent: number; opened: number; clicked: number }> = {};
    if (recentEmails) {
      for (const email of recentEmails) {
        const date = email.created_at.split("T")[0];
        if (!dailyStats[date]) {
          dailyStats[date] = { sent: 0, opened: 0, clicked: 0 };
        }
        dailyStats[date].sent++;
        if (email.opened_at) dailyStats[date].opened++;
        if (email.clicked_at) dailyStats[date].clicked++;
      }
    }

    // Country breakdown from phone numbers
    const countryBreakdown: Record<string, number> = {};
    const platformBreakdown: Record<string, number> = {};
    const sourceBreakdown: Record<string, number> = {};
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data: leadsPage } = await supabase
        .from("leads")
        .select("phone, platform, source")
        .range(from, from + pageSize - 1);
      if (!leadsPage?.length) break;
      for (const lead of leadsPage) {
        const country = detectCountry(lead.phone || "");
        countryBreakdown[country] = (countryBreakdown[country] || 0) + 1;
        const plat = lead.platform || "unknown";
        platformBreakdown[plat] = (platformBreakdown[plat] || 0) + 1;
        const src = lead.source ? lead.source.split(":")[0] : "unknown";
        sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
      }
      if (leadsPage.length < pageSize) break;
    }

    return NextResponse.json({
      totalEmails: total,
      openedEmails: opened,
      clickedEmails: clicked,
      bouncedEmails: bounced,
      failedEmails: failed,
      complainedEmails: complained,
      unsubscribed: unsubscribed || 0,
      totalLeads: totalLeads || 0,
      activeSequences: activeSequences || 0,
      openRate,
      clickRate,
      bounceRate,
      deliveryRate,
      dailyStats,
      countryBreakdown,
      platformBreakdown,
      sourceBreakdown,
    });
  } catch (error) {
    console.error("[Analytics] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
