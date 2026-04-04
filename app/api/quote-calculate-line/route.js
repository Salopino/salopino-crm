import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();

    const service_name = body.service_name;
    const quantity = Number(body.quantity ?? 1);
    const manual_unit_price =
      body.manual_unit_price === null ||
      body.manual_unit_price === undefined ||
      body.manual_unit_price === ""
        ? null
        : Number(body.manual_unit_price);

    if (!service_name) {
      return NextResponse.json(
        { success: false, error: "service_name puuttuu" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("calculate_quote_line", {
      p_service_name: service_name,
      p_quantity: quantity,
      p_manual_unit_price: manual_unit_price,
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data?.[0] || null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Rivilaskenta epäonnistui",
      },
      { status: 500 }
    );
  }
}
