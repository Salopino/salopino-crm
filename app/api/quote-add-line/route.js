import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();

    const quote_id = body.quote_id;
    const service_name = body.service_name;
    const quantity = Number(body.quantity ?? 1);
    const manual_unit_price =
      body.manual_unit_price === null ||
      body.manual_unit_price === undefined ||
      body.manual_unit_price === ""
        ? null
        : Number(body.manual_unit_price);
    const description = body.description ?? null;

    if (!quote_id) {
      return NextResponse.json(
        { success: false, error: "quote_id puuttuu" },
        { status: 400 }
      );
    }

    if (!service_name) {
      return NextResponse.json(
        { success: false, error: "service_name puuttuu" },
        { status: 400 }
      );
    }

    const { error } = await supabase.rpc("add_quote_line_from_template", {
      p_quote_id: quote_id,
      p_service_name: service_name,
      p_quantity: quantity,
      p_manual_unit_price: manual_unit_price,
      p_description: description,
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Tarjousrivin lisäys epäonnistui",
      },
      { status: 500 }
    );
  }
}
