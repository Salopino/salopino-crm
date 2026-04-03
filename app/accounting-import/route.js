import { NextResponse } from "next/server";
import OpenAI from "openai";
import pdfParse from "pdf-parse";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const month = formData.get("month");

    if (!file) {
      return NextResponse.json({ error: "Tiedosto puuttuu" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Puretaan PDF tekstiksi
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    // 2. AI-tulkinta
    const response = await openai.chat.completions.create({
      model: "gpt-5.3",
      messages: [
        {
          role: "system",
          content: `
Olet kirjanpidon analysoija. Poimi suomalaisesta tuloslaskelmasta ja taseesta seuraavat:

- liikevaihto
- liiketulos
- materiaalit ja palvelut
- henkilöstökulut
- muut kulut
- poistot
- oma pääoma
- rahat ja pankkisaamiset
- myyntisaamiset
- ostovelat
- taseen loppusumma

Palauta vain JSON muodossa:
{
  revenue: number,
  operating_profit: number,
  materials: number,
  personnel: number,
  other: number,
  depreciation: number,
  equity: number,
  cash: number,
  receivables: number,
  payables: number,
  assets: number
}
          `,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    return NextResponse.json({
      success: true,
      data: {
        month,
        revenue: parsed.revenue,
        operating_profit: parsed.operating_profit,
        materials_and_services: parsed.materials,
        personnel_expenses: parsed.personnel,
        other_operating_expenses: parsed.other,
        depreciation: parsed.depreciation,
        equity: parsed.equity,
        cash_and_bank: parsed.cash,
        receivables: parsed.receivables,
        payables: parsed.payables,
        balance_assets: parsed.assets,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Import epäonnistui" },
      { status: 500 }
    );
  }
}
