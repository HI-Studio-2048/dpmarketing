import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

const MOCK_SEQUENCES = [
  {
    id: "seq-1",
    name: "Welcome Series",
    description: "New lead onboarding sequence",
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    sequence_steps: [{ id: "1" }, { id: "2" }, { id: "3" }],
    lead_sequence_enrollments: [
      { id: "1" },
      { id: "2" },
      { id: "3" },
      { id: "4" },
      { id: "5" },
    ],
  },
  {
    id: "seq-2",
    name: "Sales Funnel",
    description: "Convert interested leads to customers",
    is_active: true,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    sequence_steps: [{ id: "4" }, { id: "5" }, { id: "6" }],
    lead_sequence_enrollments: [{ id: "6" }, { id: "7" }],
  },
  {
    id: "seq-3",
    name: "Re-engagement",
    description: "Win back inactive leads",
    is_active: false,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    sequence_steps: [{ id: "7" }, { id: "8" }],
    lead_sequence_enrollments: [],
  },
];

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const hasSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasSupabase) {
      return NextResponse.json({
        sequences: MOCK_SEQUENCES,
        isMock: true,
      });
    }

    // Real database query
    const { data, error } = await supabase
      .from("sequences")
      .select(
        `
        *,
        sequence_steps(count),
        lead_sequence_enrollments(count)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch sequences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sequences: data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    const hasSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasSupabase) {
      return NextResponse.json(
        { error: "Supabase not configured. Cannot create sequences in demo mode." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("sequences")
      .insert({
        name,
        description,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create sequence" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sequence: data }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
