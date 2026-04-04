import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("pricing_templates_active")
      .select("*")
      .order("service_name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Hinnoittelupohjien haku epäonnistui",
      },
      { status: 500 }
    );
  }
}
