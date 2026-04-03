import { NextResponse } from "next/server";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function safeNumber(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;

  if (typeof v === "string") {
    const cleaned = v
      .replace(/\u00A0/g, " ")
      .replace(/\s/g, "")
      .replace(/\(([^)]+)\)/, "-$1")
      .replace(/\.(?=\d{3}(?:[,.]|$))/g, "")
      .replace(",", ".");

    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  return 0;
}

function round2(v) {
  return Math.round(Number(v || 0) * 100) / 100;
}

function safeDiv(a, b) {
  if (!b || Number(b) === 0) return 0;
  return Number(a || 0) / Number(b || 0);
}

function cleanJsonText(raw) {
  return String(raw || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function buildAnalysis(data) {
  const revenue = safeNumber(data.revenue);
  const operatingProfit = safeNumber(data.operating_profit);
  const materials = Math.abs(safeNumber(data.materials));
  const personnel = Math.abs(safeNumber(data.personnel));
  const other = Math.abs(safeNumber(data.other));
  const depreciation = Math.abs(safeNumber(data.depreciation));
  const equity = safeNumber(data.equity);
  const cash = safeNumber(data.cash);
  const receivables = safeNumber(data.receivables);
  const payables = Math.abs(safeNumber(data.payables));
  const assets = safeNumber(data.assets);

  const monthlyBurn = materials + personnel + other;
  const operatingMarginPct = revenue > 0 ? round2((operatingProfit / revenue) * 100) : 0;
  const equityRatioPct = assets > 0 ? round2((equity / assets) * 100) : 0;
  const currentRatio = round2(safeDiv(cash + receivables, payables));
  const cashRunwayMonths = round2(safeDiv(cash, monthlyBurn));
  const debtRatioPct = assets > 0 ? round2((Math.abs(assets - equity) / assets) * 100) : 0;

  const warnings = [];
  const strengths = [];
  const recommendations = [];

  if (operatingProfit < 0) {
    warnings.push("Liiketulos on negatiivinen.");
    recommendations.push("Käy kulurakenne läpi ja priorisoi kannattavimmat palvelut.");
  } else {
    strengths.push("Liiketulos on positiivinen.");
  }

  if (cashRunwayMonths < 2) {
    warnings.push("Kassapuskuri on alle 2 kuukautta.");
    recommendations.push("Tiukenna laskutuksen rytmiä ja seuraa kassavirtaennustetta viikkotasolla.");
  } else if (cashRunwayMonths >= 4) {
    strengths.push("Kassapuskuri on kohtuullinen.");
  }

  if (equityRatioPct < 20) {
    warnings.push("Omavaraisuusaste on matala.");
    recommendations.push("Vahvista omaa pääomaa ja vältä heikosti kannattavia toimeksiantoja.");
  } else if (equityRatioPct >= 35) {
    strengths.push("Omavaraisuusaste on hyvällä tasolla.");
  }

  if (currentRatio < 1) {
    warnings.push("Current ratio on alle 1.");
    recommendations.push("Lyhyen aikavälin maksuvalmius vaatii tarkkaa kassanhallintaa.");
  } else if (currentRatio >= 1.5) {
    strengths.push("Lyhyen aikavälin maksuvalmius näyttää vakaalta.");
  }

  if (operatingMarginPct < 5 && revenue > 0) {
    warnings.push("Liikevoittomarginaali on matala.");
    recommendations.push("Tarkista hinnoittelu, projektivalinta ja lisämyynnin osuus.");
  } else if (operatingMarginPct >= 10) {
    strengths.push("Liikevoittomarginaali on terveellä tasolla.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Jatka kuukausitason seurantaa ja vertaa toteumaa tavoitteeseen sekä kassavirtaennusteeseen.");
  }

  return {
    monthly_burn: round2(monthlyBurn),
    operating_margin_pct: operatingMarginPct,
    equity_ratio_pct: equityRatioPct,
    current_ratio: currentRatio,
    cash_runway_months: cashRunwayMonths,
    debt_ratio_pct: debtRatioPct,
    warnings,
    strengths,
    recommendations,
  };
}

function buildAccountingRow({ month, sourceSystem, parsed, analysis }) {
  const revenue = safeNumber(parsed.revenue);
  const operatingProfit = safeNumber(parsed.operating_profit);
  const materials = safeNumber(parsed.materials);
  const personnel = safeNumber(parsed.personnel);
  const other = safeNumber(parsed.other);
  const depreciation = safeNumber(parsed.depreciation);
  const equity = safeNumber(parsed.equity);
  const cash = safeNumber(parsed.cash);
  const receivables = safeNumber(parsed.receivables);
  const payables = safeNumber(parsed.payables);
  const assets = safeNumber(parsed.assets);

  return {
    month,
    source_system: sourceSystem,
    revenue,
    other_income: 0,
    materials_and_services: materials,
    personnel_expenses: personnel,
    other_operating_expenses: other,
    depreciation,
    operating_profit: operatingProfit,
    financial_items: 0,
    profit_before_appropriations: operatingProfit,
    balance_assets: assets,
    balance_liabilities: assets - equity,
    equity,
    cash_and_bank: cash,
    receivables,
    payables,
    notes:
      "Tallennettu AI accounting importilla. " +
      `Warnings: ${analysis.warnings.join(" | ") || "-"}. ` +
      `Recommendations: ${analysis.recommendations.join(" | ") || "-"}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function parsePdfToText(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const pdfData = await pdfParse(buffer);
  return String(pdfData.text || "");
}

async function extractAccountingWithAI(text) {
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const response = await openai.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
Olet suomalaisen pk-yrityksen kirjanpidon analysoija.

Poimi tekstistä seuraavat kentät:
- revenue = liikevaihto
- operating_profit = liiketulos tai liikevoitto
- materials = materiaalit ja palvelut
- personnel = henkilöstökulut / palkkakulut
- other = muut liiketoiminnan kulut
- depreciation = poistot
- equity = oma pääoma
- cash = rahat ja pankkisaamiset
- receivables = myyntisaamiset tai saamiset
- payables = ostovelat tai lyhytaikaiset velat
- assets = taseen loppusumma / vastaavaa yhteensä / varat yhteensä

Tunnista luvut vaikka ne olisivat muodossa:
- 1 234 567,89
- -1234
- (1234)

Jos arvoa ei löydy, käytä 0.

Palauta VAIN validi JSON tässä muodossa:
{
  "revenue": 0,
  "operating_profit": 0,
  "materials": 0,
  "personnel": 0,
  "other": 0,
  "depreciation": 0,
  "equity": 0,
  "cash": 0,
  "receivables": 0,
  "payables": 0,
  "assets": 0
}
        `.trim(),
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  const raw = response.choices?.[0]?.message?.content || "";
  const clean = cleanJsonText(raw);
  const parsed = JSON.parse(clean);

  return {
    revenue: safeNumber(parsed.revenue),
    operating_profit: safeNumber(parsed.operating_profit),
    materials: safeNumber(parsed.materials),
    personnel: safeNumber(parsed.personnel),
    other: safeNumber(parsed.other),
    depreciation: safeNumber(parsed.depreciation),
    equity: safeNumber(parsed.equity),
    cash: safeNumber(parsed.cash),
    receivables: safeNumber(parsed.receivables),
    payables: safeNumber(parsed.payables),
    assets: safeNumber(parsed.assets),
  };
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const month = String(formData.get("month") || "").trim();
    const sourceSystem = String(formData.get("source_system") || "Netvisor").trim();
    const documentType = String(formData.get("document_type") || "Tuloslaskelma").trim();

    if (!file) {
      return NextResponse.json({ error: "Tiedosto puuttuu." }, { status: 400 });
    }

    if (!month) {
      return NextResponse.json({ error: "Kuukausi puuttuu." }, { status: 400 });
    }

    if (typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "Virheellinen tiedosto." }, { status: 400 });
    }

    const fullText = await parsePdfToText(file);
    const text = fullText.slice(0, 18000);

    if (!text.trim()) {
      return NextResponse.json({ error: "PDF:stä ei saatu luettua tekstiä." }, { status: 400 });
    }

    const parsed = await extractAccountingWithAI(text);
    const analysis = buildAnalysis(parsed);
    const accountingRow = buildAccountingRow({
      month,
      sourceSystem,
      parsed,
      analysis,
    });

    const accountingInsert = await supabase
      .from("accounting_monthly")
      .insert(accountingRow)
      .select()
      .single();

    if (accountingInsert.error) {
      throw accountingInsert.error;
    }

    const documentInsert = await supabase.from("accounting_documents").insert({
      month,
      document_type: documentType,
      source_system: sourceSystem,
      file_name: file.name || `AI-import-${month}.pdf`,
      file_url: "",
      storage_path: "",
      notes: "PDF käsitelty AI accounting import -reitillä.",
      uploaded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    if (documentInsert.error) {
      throw documentInsert.error;
    }

    const logInsert = await supabase.from("import_logs").insert({
      import_type: "AI Accounting",
      source_name: file.name || "PDF",
      status: "OK",
      row_count: 1,
      message: `AI parsing onnistui kuukaudelle ${month}`,
      source_system: sourceSystem,
      file_name: file.name || null,
      month,
      imported_at: new Date().toISOString(),
    });

    if (logInsert.error) {
      throw logInsert.error;
    }

    return NextResponse.json({
      success: true,
      data: accountingInsert.data,
      analysis,
      extracted_text_preview: text.slice(0, 1200),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Import epäonnistui." },
      { status: 500 }
    );
  }
}
