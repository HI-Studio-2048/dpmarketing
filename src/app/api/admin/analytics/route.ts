import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { detectCountry } from "@/lib/phone-country";

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
