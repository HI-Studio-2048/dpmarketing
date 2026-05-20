import { NextRequest, NextResponse } from "next/server";
import { supabase, type Lead } from "@/lib/supabase-server";

const MOCK_LEADS: Lead[] = [
  {
    id: "1",
    email: "john@example.com",
    first_name: "John",
    phone: "+1-555-0101",
    status: "Lead",
    source: "quiz-brain",
    tags: ["engaged", "high-interest"],
    quiz_score: 78,
    quiz_answers: { q1: "yes", q2: "no" },
    quiz_progress: "10/10",
    city: "San Francisco",
    country: "US",
    platform: "web",
    device: "desktop",
    unsubscribed: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    email: "sarah@example.com",
    first_name: "Sarah",
    phone: "+1-555-0102",
    status: "Checkout Started",
    source: "funnel-lp1",
    tags: ["warm"],
    quiz_score: 82,
    quiz_answers: { q1: "yes", q2: "yes" },
    quiz_progress: "10/10",
    city: "New York",
    country: "US",
    platform: "mobile",
    device: "iphone",
    unsubscribed: false,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    email: "mike@example.com",
    first_name: "Mike",
    phone: "+1-555-0103",
    status: "Buyer",
    source: "quiz-sleep",
    tags: ["customer", "vip"],
    quiz_score: 95,
    quiz_answers: { q1: "yes", q2: "yes" },
    quiz_progress: "10/10",
    city: "Los Angeles",
    country: "US",
    platform: "web",
    device: "desktop",
    unsubscribed: false,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    email: "emma@example.com",
    first_name: "Emma",
    phone: "+1-555-0104",
    status: "Abandoned",
    source: "funnel-lp2",
    tags: ["re-engage"],
    quiz_score: 45,
    quiz_answers: { q1: "no", q2: "maybe" },
    quiz_progress: "5/10",
    city: "Chicago",
    country: "US",
    platform: "mobile",
    device: "android",
    unsubscribed: false,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    email: "david@example.com",
    first_name: "David",
    phone: "+1-555-0105",
    status: "Lead",
    source: "quiz-brain",
    tags: ["new"],
    quiz_score: 61,
    quiz_answers: { q1: "yes", q2: "no" },
    quiz_progress: "10/10",
    city: "Austin",
    country: "US",
    platform: "web",
    device: "mobile",
    unsubscribed: false,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    // Check if Supabase is configured
    const hasSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasSupabase) {
      // Return mock data
      let filtered = [...MOCK_LEADS];

      if (status) {
        filtered = filtered.filter((l) => l.status === status);
      }

      const total = filtered.length;
      const offset = (page - 1) * limit;
      const leads = filtered.slice(offset, offset + limit);

      return NextResponse.json({
        leads,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        isMock: true,
      });
    }

    // Real database query
    const offset = (page - 1) * limit;

    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      leads: data as Lead[],
      total: count,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
