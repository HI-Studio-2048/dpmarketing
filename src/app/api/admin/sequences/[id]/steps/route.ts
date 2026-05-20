import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      step_number,
      day_offset,
      subject,
      html_body,
      step_key,
      email_type,
      condition,
    } = body;

    // Validate required fields
    if (
      !step_number ||
      day_offset === undefined ||
      !subject ||
      !html_body
    ) {
      return NextResponse.json(
        {
          error:
            "step_number, day_offset, subject, and html_body are required",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("sequence_steps")
      .insert({
        sequence_id: id,
        step_number,
        day_offset,
        subject,
        html_body,
        step_key,
        email_type,
        condition,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create step" },
        { status: 500 }
      );
    }

    return NextResponse.json({ step: data }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
