"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CLIENT_STATUSES = ["Liidi", "Kontaktoitu", "Tarjous", "Neuvottelu", "Voitettu", "Hävitty"];
const QUOTE_STATUSES = ["Luonnos", "Lähetetty", "Hyväksytty", "Hylätty", "Vanhentunut"];
const CASHFLOW_TYPES = ["Tulo", "Meno", "Ennuste"];
const CALENDAR_EVENT_TYPES = ["Kuvaus", "Palaveri", "Toimitus", "Seurantakäynti", "Muu"];
const CALENDAR_EVENT_STATUSES = ["Suunniteltu", "Vahvistettu", "Valmis", "Peruttu"];
const ACCOUNTING_DOC_TYPES = [
  "Tuloslaskelma",
  "Tase",
  "Pääkirja",
  "Päiväkirja",
  "Myyntiraportti",
  "Ostoraportti",
  "Muu",
];
const SOURCE_SYSTEMS = ["Netvisor", "CRM", "Muu"];
const MONTHLY_TARGET_DEFAULT = 5000;

const emptyClient = {
  name: "",
  company_name: "",
  email: "",
  phone: "",
  city: "",
  business_id: "",
  status: "Liidi",
  notes: "",
  finder_url: "",
  asiakastieto_url: "",
  linkedin_url: "",
};

const emptyQuote = {
  client_id: "",
  quote_number: "",
  title: "",
  status: "Luonnos",
  issue_date: "",
  valid_until: "",
  vat_rate: 25.5,
  payment_terms_days: 14,
  shoot_date: "",
  delivery_date: "",
  internal_note: "",
  notes: "",
};

const emptyFinance = {
  month: "",
  revenue: "",
  expenses: "",
  profit: "",
  target: MONTHLY_TARGET_DEFAULT,
};

const emptyCashflow = {
  event_date: "",
  amount: "",
  type: "Tulo",
  description: "",
};

const emptyTemplate = {
  name: "",
  category: "",
  unit: "kpl",
  unit_price: "",
  vat_rate: 25.5,
  description: "",
};

const emptyCalendarEvent = {
  client_id: "",
  quote_id: "",
  title: "",
  event_type: "Kuvaus",
  status: "Suunniteltu",
  start_at: "",
  end_at: "",
  location: "",
};

const eur = (v) =>
  new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(v || 0));

const num = (v) => Number(v || 0);

const today = () => new Date().toISOString().slice(0, 10);

const nowLocalInput = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("fi-FI") : "-");
const fmtDateTime = (v) => (v ? new Date(v).toLocaleString("fi-FI") : "-");

function safeDiv(a, b) {
  if (!b || Number(b) === 0) return 0;
  return Number(a || 0) / Number(b || 0);
}

function round2(v) {
  return Math.round(Number(v || 0) * 100) / 100;
}

function traffic(value, target) {
  if (!target || target <= 0) return { label: "Ei tavoitetta", color: "#a3a3a3" };
  const ratio = value / target;
  if (ratio >= 1) return { label: "Vihreä", color: "#86efac" };
  if (ratio >= 0.7) return { label: "Keltainen", color: "#fde68a" };
  return { label: "Punainen", color: "#fca5a5" };
}

const sx = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(90,49,132,.22), transparent 28%), radial-gradient(circle at top right, rgba(180,143,72,.08), transparent 22%), linear-gradient(180deg,#08070d 0%,#0c0a12 100%)",
    color: "#f4f1e9",
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  wrap: {
    maxWidth: 1600,
    margin: "0 auto",
    padding: "28px 20px 80px",
  },
  hero: {
    background: "linear-gradient(135deg, rgba(29,22,43,.96), rgba(14,12,22,.98))",
    border: "1px solid rgba(231,223,178,.12)",
    borderRadius: 26,
    padding: 26,
    boxShadow: "0 28px 70px rgba(0,0,0,.26)",
  },
  card: {
    background: "rgba(18,18,28,.92)",
    border: "1px solid rgba(231,223,178,.10)",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 24px 60px rgba(0,0,0,.18)",
  },
  cardDark: {
    background: "linear-gradient(180deg, rgba(23,20,34,.98), rgba(14,12,22,.98))",
    border: "1px solid rgba(231,223,178,.12)",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 24px 60px rgba(0,0,0,.24)",
  },
  input: {
    width: "100%",
    background: "rgba(11,11,18,.92)",
    color: "#f4f1e9",
    border: "1px solid rgba(231,223,178,.14)",
    borderRadius: 12,
    padding: "11px 13px",
    fontSize: 14,
    outline: "none",
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(244,241,233,.78)",
    marginBottom: 7,
  },
  btn: {
    padding: "11px 15px",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    transition: "all .18s ease",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, rgba(217,201,138,1), rgba(162,126,56,1))",
    color: "#17120d",
    border: "1px solid rgba(231,223,178,.18)",
  },
  btnGhost: {
    background: "transparent",
    color: "#f4f1e9",
    border: "1px solid rgba(231,223,178,.14)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "12px 10px",
    color: "rgba(244,241,233,.66)",
    fontWeight: 700,
    borderBottom: "1px solid rgba(231,223,178,.10)",
  },
  td: {
    padding: "13px 10px",
    borderBottom: "1px solid rgba(231,223,178,.08)",
    verticalAlign: "top",
  },
};

function Btn({ children, variant = "primary", style = {}, ...props }) {
  const merged =
    variant === "ghost"
      ? { ...sx.btn, ...sx.btnGhost, ...style }
      : { ...sx.btn, ...sx.btnPrimary, ...style };
  return (
    <button {...props} style={merged}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <div style={sx.label}>{label}</div>
      {children}
    </label>
  );
}

function Input(props) {
  return <input {...props} style={{ ...sx.input, ...(props.style || {}) }} />;
}

function Select(props) {
  return <select {...props} style={{ ...sx.input, ...(props.style || {}) }} />;
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      style={{ ...sx.input, minHeight: 96, resize: "vertical", ...(props.style || {}) }}
    />
  );
}

function Title({ eyebrow, title, right }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "end",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 16,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            color: "#d9c98a",
            marginBottom: 6,
          }}
        >
          {eyebrow}
        </div>
        <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.1 }}>{title}</h2>
      </div>
      {right || null}
    </div>
  );
}

function Metric({ title, value, sub, accent = false }) {
  return (
    <div
      style={{
        ...sx.card,
        background: accent
          ? "linear-gradient(135deg, rgba(82,49,122,.95), rgba(28,18,49,.98))"
          : sx.card.background,
      }}
    >
      <div
        style={{
          fontSize: 12,
          textTransform: "uppercase",
          color: "rgba(244,241,233,.72)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 13, color: "rgba(244,241,233,.64)" }}>{sub}</div>
    </div>
  );
}

export default function Page() {
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [financeMonthly, setFinanceMonthly] = useState([]);
  const [cashflowEvents, setCashflowEvents] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [quoteLines, setQuoteLines] = useState([]);
  const [pricingTemplates, setPricingTemplates] = useState([]);
  const [importLogs, setImportLogs] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [accountingDocuments, setAccountingDocuments] = useState([]);
  const [accountingMonthly, setAccountingMonthly] = useState([]);

  const [clientForm, setClientForm] = useState(emptyClient);
  const [quoteForm, setQuoteForm] = useState({
    ...emptyQuote,
    issue_date: today(),
  });
  const [quoteDraftLines, setQuoteDraftLines] = useState([
    { id: "d1", description: "", quantity: 1, unit_price: 0 },
  ]);
  const [financeForm, setFinanceForm] = useState(emptyFinance);
  const [cashflowForm, setCashflowForm] = useState({
    ...emptyCashflow,
    event_date: today(),
  });
  const [templateForm, setTemplateForm] = useState(emptyTemplate);
  const [calendarForm, setCalendarForm] = useState({
    ...emptyCalendarEvent,
    start_at: nowLocalInput(),
    end_at: nowLocalInput(),
  });

  const [crmSearch, setCrmSearch] = useState("");
  const [quoteSearch, setQuoteSearch] = useState("");
  const [aiImportFile, setAiImportFile] = useState(null);
  const [aiImportMonth, setAiImportMonth] = useState(today().slice(0, 7));
  const [aiImportSourceSystem, setAiImportSourceSystem] = useState("Netvisor");
  const [aiImportDocumentType, setAiImportDocumentType] = useState("Tuloslaskelma");
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);

  const [busy, setBusy] = useState({
    client: false,
    quote: false,
    finance: false,
    cashflow: false,
    template: false,
    calendar: false,
    aiImport: false,
  });

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [a, b, c, d, e, f, g, h, i, j] = await Promise.all([
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("finance_monthly").select("*").order("month", { ascending: false }),
        supabase.from("cashflow_events").select("*").order("event_date", { ascending: false }),
        supabase.from("quotes").select("*").order("created_at", { ascending: false }),
        supabase.from("quote_lines").select("*").order("sort_order", { ascending: true }),
        supabase.from("pricing_templates").select("*").order("created_at", { ascending: false }),
        supabase.from("import_logs").select("*").order("imported_at", { ascending: false }),
        supabase.from("calendar_events").select("*").order("start_at", { ascending: true }),
        supabase.from("accounting_monthly").select("*").order("month", { ascending: false }),
      ]);

      for (const r of [a, b, c, d, e, f, g, h, i, j]) {
        if (r.error) throw r.error;
      }

      setClients(a.data || []);
      setTasks(b.data || []);
      setFinanceMonthly(c.data || []);
      setCashflowEvents(d.data || []);
      setQuotes(e.data || []);
      setQuoteLines(f.data || []);
      setPricingTemplates(g.data || []);
      setImportLogs(h.data || []);
      setCalendarEvents(i.data || []);
      setAccountingMonthly(j.data || []);

      const docsRes = await supabase
        .from("accounting_documents")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (!docsRes.error) {
        setAccountingDocuments(docsRes.data || []);
      }
    } catch (err) {
      setError(err.message || "Datan haku epäonnistui.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 2500);
    return () => clearTimeout(t);
  }, [success]);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const quotesEnriched = useMemo(() => {
    return quotes.map((q) => ({
      ...q,
      client: clientMap.get(q.client_id) || null,
      lines: quoteLines.filter((l) => l.quote_id === q.id),
    }));
  }, [quotes, quoteLines, clientMap]);

  const latestAccounting = useMemo(() => accountingMonthly[0] || null, [accountingMonthly]);

  const accountingMetrics = useMemo(() => {
    const a = latestAccounting || {};
    const monthlyBurn =
      Math.abs(num(a.materials_and_services)) +
      Math.abs(num(a.personnel_expenses)) +
      Math.abs(num(a.other_operating_expenses));

    return {
      equityRatio: safeDiv(num(a.equity), num(a.balance_assets)) * 100,
      currentRatio: safeDiv(num(a.cash_and_bank) + num(a.receivables), num(a.payables)),
      cashRunwayMonths: safeDiv(num(a.cash_and_bank), monthlyBurn),
      operatingMargin: safeDiv(num(a.operating_profit), num(a.revenue)) * 100,
    };
  }, [latestAccounting]);

  const dashboard = useMemo(() => {
    const quotePipeline = quotesEnriched
      .filter((q) => ["Luonnos", "Lähetetty"].includes(q.status))
      .reduce((s, q) => s + num(q.total), 0);

    const quoteWon = quotesEnriched
      .filter((q) => q.status === "Hyväksytty")
      .reduce((s, q) => s + num(q.total), 0);

    const quoteLost = quotesEnriched
      .filter((q) => ["Hylätty", "Vanhentunut"].includes(q.status))
      .reduce((s, q) => s + num(q.total), 0);

    const cashflowForecast = cashflowEvents
      .filter((r) => r.type === "Ennuste")
      .reduce((s, r) => s + num(r.amount), 0);

    const cashflowRealized = cashflowEvents.reduce((s, r) => s + num(r.amount), 0);

    const latestMonth = financeMonthly[0] || null;
    const monthRevenue = num(latestMonth?.revenue);
    const monthTarget = num(latestMonth?.target || MONTHLY_TARGET_DEFAULT);
    const monthTraffic = traffic(monthRevenue, monthTarget);

    return {
      quotePipeline,
      quoteWon,
      quoteLost,
      cashflowForecast,
      cashflowRealized,
      monthRevenue,
      monthTarget,
      monthTraffic,
    };
  }, [quotesEnriched, cashflowEvents, financeMonthly]);

  const filteredClients = useMemo(() => {
    const q = crmSearch.trim().toLowerCase();
    return clients.filter((c) =>
      !q
        ? true
        : [c.name, c.company_name, c.email, c.phone, c.city, c.notes]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [clients, crmSearch]);

  const filteredQuotes = useMemo(() => {
    const q = quoteSearch.trim().toLowerCase();
    return quotesEnriched.filter((x) =>
      !q
        ? true
        : [x.quote_number, x.title, x.client?.name, x.client?.company_name]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [quotesEnriched, quoteSearch]);

  const quoteTotals = useMemo(() => {
    const subtotal = quoteDraftLines.reduce((s, l) => s + num(l.quantity) * num(l.unit_price), 0);
    const vatAmount = subtotal * (num(quoteForm.vat_rate) / 100);
    return { subtotal, vatAmount, total: subtotal + vatAmount };
  }, [quoteDraftLines, quoteForm.vat_rate]);

  async function saveClient(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, client: true }));
    setError("");
    try {
      if (!clientForm.name.trim()) throw new Error("Asiakkaan nimi on pakollinen.");

      const { error } = await supabase.from("clients").insert({
        ...clientForm,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSuccess("Asiakas lisätty.");
      setClientForm(emptyClient);
      await loadData();
    } catch (err) {
      setError(err.message || "Asiakkaan tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, client: false }));
    }
  }

  async function saveQuote(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, quote: true }));
    setError("");
    try {
      if (!quoteForm.client_id) throw new Error("Valitse asiakas.");
      if (!quoteForm.title.trim()) throw new Error("Tarjouksen otsikko on pakollinen.");

      const { data, error } = await supabase
        .from("quotes")
        .insert({
          ...quoteForm,
          subtotal: quoteTotals.subtotal,
          vat_amount: quoteTotals.vatAmount,
          total: quoteTotals.total,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const linePayload = quoteDraftLines
        .filter((l) => String(l.description || "").trim())
        .map((l, i) => ({
          quote_id: data.id,
          description: l.description,
          quantity: num(l.quantity),
          unit_price: num(l.unit_price),
          line_total: num(l.quantity) * num(l.unit_price),
          sort_order: i + 1,
          created_at: new Date().toISOString(),
        }));

      if (linePayload.length) {
        const linesRes = await supabase.from("quote_lines").insert(linePayload);
        if (linesRes.error) throw linesRes.error;
      }

      setSuccess("Tarjous tallennettu.");
      setQuoteForm({
        ...emptyQuote,
        issue_date: today(),
      });
      setQuoteDraftLines([{ id: `d-${Date.now()}`, description: "", quantity: 1, unit_price: 0 }]);
      await loadData();
    } catch (err) {
      setError(err.message || "Tarjouksen tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, quote: false }));
    }
  }

  async function saveFinance(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, finance: true }));
    setError("");
    try {
      const { error } = await supabase.from("finance_monthly").insert({
        month: financeForm.month,
        revenue: num(financeForm.revenue),
        expenses: num(financeForm.expenses),
        profit:
          financeForm.profit !== ""
            ? num(financeForm.profit)
            : num(financeForm.revenue) - num(financeForm.expenses),
        target: num(financeForm.target),
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSuccess("Kuukausirivi tallennettu.");
      setFinanceForm(emptyFinance);
      await loadData();
    } catch (err) {
      setError(err.message || "Finance-rivin tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, finance: false }));
    }
  }

  async function saveCashflow(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, cashflow: true }));
    setError("");
    try {
      const { error } = await supabase.from("cashflow_events").insert({
        event_date: cashflowForm.event_date,
        amount: num(cashflowForm.amount),
        type: cashflowForm.type,
        description: cashflowForm.description,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSuccess("Kassavirtarivi tallennettu.");
      setCashflowForm({ ...emptyCashflow, event_date: today() });
      await loadData();
    } catch (err) {
      setError(err.message || "Kassavirtarivin tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, cashflow: false }));
    }
  }

  async function saveTemplate(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, template: true }));
    setError("");
    try {
      const { error } = await supabase.from("pricing_templates").insert({
        ...templateForm,
        unit_price: num(templateForm.unit_price),
        vat_rate: num(templateForm.vat_rate),
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSuccess("Hinnoittelupohja tallennettu.");
      setTemplateForm(emptyTemplate);
      await loadData();
    } catch (err) {
      setError(err.message || "Hinnoittelupohjan tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, template: false }));
    }
  }

  async function saveCalendarEvent(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, calendar: true }));
    setError("");
    try {
      const { error } = await supabase.from("calendar_events").insert({
        ...calendarForm,
        start_at: new Date(calendarForm.start_at).toISOString(),
        end_at: new Date(calendarForm.end_at).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSuccess("Kalenteritapahtuma tallennettu.");
      setCalendarForm({
        ...emptyCalendarEvent,
        start_at: nowLocalInput(),
        end_at: nowLocalInput(),
      });
      await loadData();
    } catch (err) {
      setError(err.message || "Kalenterin tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, calendar: false }));
    }
  }

  async function uploadAccountingPdfToAi() {
    setBusy((b) => ({ ...b, aiImport: true }));
    setError("");
    setSuccess("");
    try {
      if (!aiImportFile) throw new Error("Valitse PDF-tiedosto.");
      if (!aiImportMonth) throw new Error("Anna kuukausi muodossa YYYY-MM.");

      const formData = new FormData();
      formData.append("file", aiImportFile);
      formData.append("month", aiImportMonth);
      formData.append("source_system", aiImportSourceSystem);
      formData.append("document_type", aiImportDocumentType);

      const res = await fetch("/api/accounting-import", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "AI-import epäonnistui.");
      }

      setAiAnalysisResult(result);
      setSuccess("AI-import valmis ja kirjanpidon tiedot tallennettu.");
      await loadData();
    } catch (err) {
      setError(err.message || "PDF-import epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, aiImport: false }));
    }
  }

  const nav = [
    ["dashboard", "Dashboard"],
    ["crm", "CRM"],
    ["quotes", "Tarjoukset"],
    ["finance", "Talous"],
    ["calendar", "Kalenteri"],
    ["settings", "Asetukset"],
  ];

  return (
    <div style={sx.page}>
      <div style={sx.wrap}>
        <header
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr .85fr",
            gap: 18,
            marginBottom: 22,
          }}
        >
          <div style={sx.hero}>
            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(231,223,178,.10)",
                border: "1px solid rgba(231,223,178,.12)",
                fontSize: 12,
                color: "#d9c98a",
                fontWeight: 700,
                marginBottom: 14,
              }}
            >
              SALOPINO CRM V6.6
            </div>
            <h1 style={{ margin: "0 0 10px", fontSize: 42, lineHeight: 1.05, fontWeight: 900 }}>
              CRM + talous + AI analyysi
            </h1>
            <p style={{ margin: 0, color: "rgba(244,241,233,.74)", fontSize: 16, lineHeight: 1.7 }}>
              Yksi näkymä myynnille, kassavirralle, kalenterille ja kirjanpidon AI-tulkinnalle.
            </p>
          </div>

          <div style={sx.card}>
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: "#d9c98a",
                marginBottom: 12,
                fontWeight: 700,
              }}
            >
              Navigaatio
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
              {nav.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  style={{
                    padding: "14px 12px",
                    borderRadius: 14,
                    color: "#f4f1e9",
                    fontWeight: 700,
                    cursor: "pointer",
                    border:
                      view === k
                        ? "1px solid rgba(231,223,178,.34)"
                        : "1px solid rgba(231,223,178,.10)",
                    background:
                      view === k
                        ? "linear-gradient(135deg, rgba(217,201,138,.22), rgba(120,92,35,.18))"
                        : "rgba(10,10,16,.84)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {(error || success) && (
          <div
            style={{
              marginBottom: 16,
              padding: "14px 16px",
              borderRadius: 14,
              border: error ? "1px solid rgba(255,120,120,.24)" : "1px solid rgba(144,220,167,.22)",
              background: error ? "rgba(120,31,49,.16)" : "rgba(37,92,54,.18)",
              color: error ? "#ffd7df" : "#d5ffe0",
              fontWeight: 600,
            }}
          >
            {error || success}
          </div>
        )}

        {loading ? (
          <div style={sx.card}>Haetaan dataa Supabasesta...</div>
        ) : (
          <>
            {view === "dashboard" && (
              <section>
                <Title eyebrow="Tilannekuva" title="Dashboard" right={<Btn variant="ghost" onClick={loadData}>Päivitä</Btn>} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
                  <Metric title="Asiakkaita" value={clients.length} sub="clients" accent />
                  <Metric title="Tarjouskanta" value={eur(dashboard.quotePipeline)} sub="Luonnos + Lähetetty" />
                  <Metric title="Voitetut" value={eur(dashboard.quoteWon)} sub="Hyväksytyt tarjoukset" />
                  <Metric title="Hävityt" value={eur(dashboard.quoteLost)} sub="Hylätyt + vanhentuneet" />
                  <Metric title="Ennustettu kassavirta" value={eur(dashboard.cashflowForecast)} sub="cashflow_events / Ennuste" />
                  <Metric title="Toteutunut kassavirta" value={eur(dashboard.cashflowRealized)} sub="Kaikki rivit" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 18 }}>
                  <Metric title="Pankki ja rahat" value={eur(latestAccounting?.cash_and_bank)} sub="kirjanpito" />
                  <Metric title="Omavaraisuusaste" value={`${round2(accountingMetrics.equityRatio)} %`} sub="equity / assets" />
                  <Metric title="Current ratio" value={round2(accountingMetrics.currentRatio)} sub="maksuvalmius" />
                  <Metric title="Kassapuskuri" value={`${round2(accountingMetrics.cashRunwayMonths)} kk`} sub="cash / burn" />
                </div>
              </section>
            )}

            {view === "crm" && (
              <section>
                <Title eyebrow="Asiakkuudet" title="CRM" />
                <div style={{ display: "grid", gridTemplateColumns: "430px 1fr", gap: 18 }}>
                  <div style={sx.cardDark}>
                    <Title eyebrow="Uusi asiakas" title="Lisää asiakas" />
                    <form onSubmit={saveClient}>
                      <div style={{ display: "grid", gap: 12 }}>
                        <Field label="Nimi *"><Input value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} /></Field>
                        <Field label="Yritys"><Input value={clientForm.company_name} onChange={(e) => setClientForm({ ...clientForm, company_name: e.target.value })} /></Field>
                        <Field label="Sähköposti"><Input value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} /></Field>
                        <Field label="Puhelin"><Input value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} /></Field>
                        <Field label="Kaupunki"><Input value={clientForm.city} onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })} /></Field>
                        <Field label="Y-tunnus"><Input value={clientForm.business_id} onChange={(e) => setClientForm({ ...clientForm, business_id: e.target.value })} /></Field>
                        <Field label="Status">
                          <Select value={clientForm.status} onChange={(e) => setClientForm({ ...clientForm, status: e.target.value })}>
                            {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        </Field>
                        <Field label="Muistiinpanot"><TextArea value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} /></Field>
                        <Btn type="submit">{busy.client ? "Tallennetaan..." : "Tallenna asiakas"}</Btn>
                      </div>
                    </form>
                  </div>

                  <div style={sx.card}>
                    <Title eyebrow="Asiakaslista" title="Asiakkaat" />
                    <Field label="Hae">
                      <Input value={crmSearch} onChange={(e) => setCrmSearch(e.target.value)} />
                    </Field>

                    <table style={{ ...sx.table, marginTop: 14 }}>
                      <thead>
                        <tr>
                          {["Nimi", "Yritys", "Status", "Yhteystiedot"].map((h) => (
                            <th key={h} style={sx.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClients.map((c) => (
                          <tr key={c.id}>
                            <td style={sx.td}>{c.name}</td>
                            <td style={sx.td}>{c.company_name || "-"}</td>
                            <td style={sx.td}>{c.status || "-"}</td>
                            <td style={sx.td}>{c.email || "-"}<br />{c.phone || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {view === "quotes" && (
              <section>
                <Title eyebrow="Tarjoukset" title="Tarjousten hallinta" />
                <div style={{ display: "grid", gridTemplateColumns: "560px 1fr", gap: 18 }}>
                  <div style={sx.cardDark}>
                    <form onSubmit={saveQuote}>
                      <div style={{ display: "grid", gap: 12 }}>
                        <Field label="Asiakas">
                          <Select value={quoteForm.client_id} onChange={(e) => setQuoteForm({ ...quoteForm, client_id: e.target.value })}>
                            <option value="">Valitse asiakas</option>
                            {clients.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}{c.company_name ? ` – ${c.company_name}` : ""}
                              </option>
                            ))}
                          </Select>
                        </Field>

                        <Field label="Tarjousnumero"><Input value={quoteForm.quote_number} onChange={(e) => setQuoteForm({ ...quoteForm, quote_number: e.target.value })} /></Field>
                        <Field label="Otsikko"><Input value={quoteForm.title} onChange={(e) => setQuoteForm({ ...quoteForm, title: e.target.value })} /></Field>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <Field label="Päiväys"><Input type="date" value={quoteForm.issue_date} onChange={(e) => setQuoteForm({ ...quoteForm, issue_date: e.target.value })} /></Field>
                          <Field label="Voimassa asti"><Input type="date" value={quoteForm.valid_until} onChange={(e) => setQuoteForm({ ...quoteForm, valid_until: e.target.value })} /></Field>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                          <Field label="ALV %"><Input type="number" value={quoteForm.vat_rate} onChange={(e) => setQuoteForm({ ...quoteForm, vat_rate: e.target.value })} /></Field>
                          <Field label="Maksuehto pv"><Input type="number" value={quoteForm.payment_terms_days} onChange={(e) => setQuoteForm({ ...quoteForm, payment_terms_days: e.target.value })} /></Field>
                          <Field label="Status">
                            <Select value={quoteForm.status} onChange={(e) => setQuoteForm({ ...quoteForm, status: e.target.value })}>
                              {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </Select>
                          </Field>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <Field label="Kuvauspäivä"><Input type="date" value={quoteForm.shoot_date} onChange={(e) => setQuoteForm({ ...quoteForm, shoot_date: e.target.value })} /></Field>
                          <Field label="Toimituspäivä"><Input type="date" value={quoteForm.delivery_date} onChange={(e) => setQuoteForm({ ...quoteForm, delivery_date: e.target.value })} /></Field>
                        </div>

                        <div style={{ padding: 14, borderRadius: 16, background: "rgba(10,10,16,.58)", border: "1px solid rgba(231,223,178,.12)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <strong>Tarjousrivit</strong>
                            <Btn
                              type="button"
                              variant="ghost"
                              onClick={() =>
                                setQuoteDraftLines((prev) => [
                                  ...prev,
                                  { id: `d-${Date.now()}`, description: "", quantity: 1, unit_price: 0 },
                                ])
                              }
                            >
                              Lisää rivi
                            </Btn>
                          </div>

                          {pricingTemplates.length > 0 && (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                              {pricingTemplates.slice(0, 6).map((tpl) => (
                                <Btn
                                  key={tpl.id}
                                  type="button"
                                  variant="ghost"
                                  onClick={() =>
                                    setQuoteDraftLines((prev) => [
                                      ...prev,
                                      {
                                        id: `tpl-${tpl.id}-${Date.now()}`,
                                        description: tpl.name || "Palvelu",
                                        quantity: 1,
                                        unit_price: num(tpl.unit_price),
                                      },
                                    ])
                                  }
                                  style={{ padding: "8px 10px", fontSize: 12 }}
                                >
                                  + {tpl.name}
                                </Btn>
                              ))}
                            </div>
                          )}

                          <div style={{ display: "grid", gap: 10 }}>
                            {quoteDraftLines.map((l) => (
                              <div
                                key={l.id}
                                style={{
                                  padding: 12,
                                  borderRadius: 14,
                                  background: "rgba(8,8,13,.68)",
                                  border: "1px solid rgba(231,223,178,.08)",
                                }}
                              >
                                <Field label="Kuvaus">
                                  <Input
                                    value={l.description}
                                    onChange={(e) =>
                                      setQuoteDraftLines((prev) =>
                                        prev.map((x) => (x.id === l.id ? { ...x, description: e.target.value } : x))
                                      )
                                    }
                                  />
                                </Field>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                                  <Field label="Määrä">
                                    <Input
                                      type="number"
                                      value={l.quantity}
                                      onChange={(e) =>
                                        setQuoteDraftLines((prev) =>
                                          prev.map((x) => (x.id === l.id ? { ...x, quantity: e.target.value } : x))
                                        )
                                      }
                                    />
                                  </Field>
                                  <Field label="Yksikköhinta ALV 0">
                                    <Input
                                      type="number"
                                      value={l.unit_price}
                                      onChange={(e) =>
                                        setQuoteDraftLines((prev) =>
                                          prev.map((x) => (x.id === l.id ? { ...x, unit_price: e.target.value } : x))
                                        )
                                      }
                                    />
                                  </Field>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                            <Metric title="Veroton" value={eur(quoteTotals.subtotal)} sub="ALV 0 %" />
                            <Metric title="ALV" value={eur(quoteTotals.vatAmount)} sub={`${quoteForm.vat_rate}%`} />
                            <Metric title="Yhteensä" value={eur(quoteTotals.total)} sub="Tarjoussumma" accent />
                          </div>
                        </div>

                        <Field label="Muistiinpanot">
                          <TextArea value={quoteForm.notes} onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })} />
                        </Field>

                        <Btn type="submit">{busy.quote ? "Tallennetaan..." : "Tallenna tarjous"}</Btn>
                      </div>
                    </form>
                  </div>

                  <div style={sx.card}>
                    <Title eyebrow="Tarjouslista" title="Tallennetut tarjoukset" />
                    <Field label="Hae">
                      <Input value={quoteSearch} onChange={(e) => setQuoteSearch(e.target.value)} />
                    </Field>

                    <table style={{ ...sx.table, marginTop: 14 }}>
                      <thead>
                        <tr>
                          {["Nro", "Otsikko", "Status", "Kuvauspäivä", "Summa"].map((h) => (
                            <th key={h} style={sx.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQuotes.map((q) => (
                          <tr key={q.id}>
                            <td style={sx.td}>{q.quote_number || "-"}</td>
                            <td style={sx.td}>{q.title || "-"}</td>
                            <td style={sx.td}>{q.status || "-"}</td>
                            <td style={sx.td}>{fmtDate(q.shoot_date)}</td>
                            <td style={sx.td}>{eur(q.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {view === "finance" && (
              <section>
                <Title eyebrow="Talous" title="Kirjanpito + AI-analyysi" />
                <div style={{ display: "grid", gridTemplateColumns: "430px 1fr", gap: 18 }}>
                  <div style={sx.cardDark}>
                    <Title eyebrow="V6.6 AI import" title="PDF → AI → kirjanpito" />
                    <div style={{ display: "grid", gap: 12 }}>
                      <Field label="Kuukausi">
                        <Input value={aiImportMonth} onChange={(e) => setAiImportMonth(e.target.value)} placeholder="2026-04" />
                      </Field>
                      <Field label="Lähdejärjestelmä">
                        <Select value={aiImportSourceSystem} onChange={(e) => setAiImportSourceSystem(e.target.value)}>
                          {SOURCE_SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </Select>
                      </Field>
                      <Field label="Dokumenttityyppi">
                        <Select value={aiImportDocumentType} onChange={(e) => setAiImportDocumentType(e.target.value)}>
                          {ACCOUNTING_DOC_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </Select>
                      </Field>
                      <Field label="PDF-tiedosto">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => setAiImportFile(e.target.files?.[0] || null)}
                          style={{ ...sx.input, padding: "10px 12px" }}
                        />
                      </Field>
                      <Btn type="button" onClick={uploadAccountingPdfToAi}>
                        {busy.aiImport ? "Tuodaan..." : "AI tuo PDF"}
                      </Btn>
                    </div>

                    <div style={{ marginTop: 28 }}>
                      <Title eyebrow="CRM talous" title="Kuukausirivi" />
                      <form onSubmit={saveFinance}>
                        <div style={{ display: "grid", gap: 12 }}>
                          <Field label="Kuukausi"><Input value={financeForm.month} onChange={(e) => setFinanceForm({ ...financeForm, month: e.target.value })} placeholder="2026-04" /></Field>
                          <Field label="Liikevaihto"><Input type="number" value={financeForm.revenue} onChange={(e) => setFinanceForm({ ...financeForm, revenue: e.target.value })} /></Field>
                          <Field label="Kulut"><Input type="number" value={financeForm.expenses} onChange={(e) => setFinanceForm({ ...financeForm, expenses: e.target.value })} /></Field>
                          <Field label="Tulos"><Input type="number" value={financeForm.profit} onChange={(e) => setFinanceForm({ ...financeForm, profit: e.target.value })} /></Field>
                          <Field label="Tavoite"><Input type="number" value={financeForm.target} onChange={(e) => setFinanceForm({ ...financeForm, target: e.target.value })} /></Field>
                          <Btn type="submit">{busy.finance ? "Tallennetaan..." : "Tallenna kuukausi"}</Btn>
                        </div>
                      </form>
                    </div>
                  </div>

                  <div style={sx.card}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
                      <Metric title="Pankki ja rahat" value={eur(latestAccounting?.cash_and_bank)} sub="kirjanpito" />
                      <Metric title="Omavaraisuusaste" value={`${round2(accountingMetrics.equityRatio)} %`} sub="equity / assets" />
                      <Metric title="Current ratio" value={round2(accountingMetrics.currentRatio)} sub="maksuvalmius" />
                      <Metric title="Kassapuskuri" value={`${round2(accountingMetrics.cashRunwayMonths)} kk`} sub="cash / burn" />
                      <Metric title="Liikevoittomarginaali" value={`${round2(accountingMetrics.operatingMargin)} %`} sub="operating profit / revenue" />
                    </div>

                    {aiAnalysisResult?.analysis && (
                      <div style={{ ...sx.cardDark, marginBottom: 18 }}>
                        <Title eyebrow="AI analyysi" title={`Kuukausi ${aiAnalysisResult.data?.month || "-"}`} />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginBottom: 12 }}>
                          <Metric title="Liikevaihto" value={eur(aiAnalysisResult.data?.revenue)} sub="AI tulkittu" />
                          <Metric title="Liiketulos" value={eur(aiAnalysisResult.data?.operating_profit)} sub="AI tulkittu" />
                          <Metric title="Pankki" value={eur(aiAnalysisResult.data?.cash_and_bank)} sub="AI tulkittu" />
                          <Metric title="Oma pääoma" value={eur(aiAnalysisResult.data?.equity)} sub="AI tulkittu" />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                          <div style={sx.card}>
                            <div style={{ fontWeight: 800, marginBottom: 10 }}>Vahvuudet</div>
                            {(aiAnalysisResult.analysis.strengths || []).map((item, i) => (
                              <div key={i} style={{ color: "#ccffe0", marginBottom: 6 }}>• {item}</div>
                            ))}
                          </div>

                          <div style={sx.card}>
                            <div style={{ fontWeight: 800, marginBottom: 10 }}>Varoitukset</div>
                            {(aiAnalysisResult.analysis.warnings || []).map((item, i) => (
                              <div key={i} style={{ color: "#ffd7df", marginBottom: 6 }}>• {item}</div>
                            ))}
                          </div>

                          <div style={sx.card}>
                            <div style={{ fontWeight: 800, marginBottom: 10 }}>Suositukset</div>
                            {(aiAnalysisResult.analysis.recommendations || []).map((item, i) => (
                              <div key={i} style={{ color: "#fff1c7", marginBottom: 6 }}>• {item}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                      <div>
                        <h3 style={{ marginTop: 0 }}>Kirjanpidon aineistot</h3>
                        <table style={sx.table}>
                          <thead>
                            <tr>
                              {["Kuukausi", "Tyyppi", "Lähde", "Tiedosto"].map((h) => (
                                <th key={h} style={sx.th}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {accountingDocuments.map((r) => (
                              <tr key={r.id}>
                                <td style={sx.td}>{r.month || "-"}</td>
                                <td style={sx.td}>{r.document_type || "-"}</td>
                                <td style={sx.td}>{r.source_system || "-"}</td>
                                <td style={sx.td}>{r.file_name || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <h3 style={{ marginTop: 0 }}>Kirjanpidon kuukausitarkennukset</h3>
                        <table style={sx.table}>
                          <thead>
                            <tr>
                              {["Kuukausi", "Liikevaihto", "Liiketulos", "Pankki", "Oma pääoma"].map((h) => (
                                <th key={h} style={sx.th}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {accountingMonthly.map((r) => (
                              <tr key={r.id}>
                                <td style={sx.td}>{r.month || "-"}</td>
                                <td style={sx.td}>{eur(r.revenue)}</td>
                                <td style={sx.td}>{eur(r.operating_profit)}</td>
                                <td style={sx.td}>{eur(r.cash_and_bank)}</td>
                                <td style={sx.td}>{eur(r.equity)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {view === "calendar" && (
              <section>
                <Title eyebrow="Kalenteri" title="Tapahtumien hallinta" />
                <div style={{ display: "grid", gridTemplateColumns: "430px 1fr", gap: 18 }}>
                  <div style={sx.cardDark}>
                    <form onSubmit={saveCalendarEvent}>
                      <div style={{ display: "grid", gap: 12 }}>
                        <Field label="Otsikko"><Input value={calendarForm.title} onChange={(e) => setCalendarForm({ ...calendarForm, title: e.target.value })} /></Field>
                        <Field label="Asiakas">
                          <Select value={calendarForm.client_id} onChange={(e) => setCalendarForm({ ...calendarForm, client_id: e.target.value })}>
                            <option value="">Ei asiakasta</option>
                            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </Select>
                        </Field>
                        <Field label="Tarjous">
                          <Select value={calendarForm.quote_id} onChange={(e) => setCalendarForm({ ...calendarForm, quote_id: e.target.value })}>
                            <option value="">Ei tarjousta</option>
                            {quotes.map((q) => <option key={q.id} value={q.id}>{q.quote_number || q.title}</option>)}
                          </Select>
                        </Field>
                        <Field label="Tyyppi">
                          <Select value={calendarForm.event_type} onChange={(e) => setCalendarForm({ ...calendarForm, event_type: e.target.value })}>
                            {CALENDAR_EVENT_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        </Field>
                        <Field label="Status">
                          <Select value={calendarForm.status} onChange={(e) => setCalendarForm({ ...calendarForm, status: e.target.value })}>
                            {CALENDAR_EVENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        </Field>
                        <Field label="Alkaa"><Input type="datetime-local" value={calendarForm.start_at} onChange={(e) => setCalendarForm({ ...calendarForm, start_at: e.target.value })} /></Field>
                        <Field label="Päättyy"><Input type="datetime-local" value={calendarForm.end_at} onChange={(e) => setCalendarForm({ ...calendarForm, end_at: e.target.value })} /></Field>
                        <Field label="Sijainti"><Input value={calendarForm.location} onChange={(e) => setCalendarForm({ ...calendarForm, location: e.target.value })} /></Field>
                        <Btn type="submit">{busy.calendar ? "Tallennetaan..." : "Tallenna tapahtuma"}</Btn>
                      </div>
                    </form>
                  </div>

                  <div style={sx.card}>
                    <Title eyebrow="Lista" title="Kalenteritapahtumat" />
                    <table style={sx.table}>
                      <thead>
                        <tr>
                          {["Aika", "Otsikko", "Tyyppi", "Status", "Asiakas"].map((h) => (
                            <th key={h} style={sx.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {calendarEvents.map((e) => (
                          <tr key={e.id}>
                            <td style={sx.td}>{fmtDateTime(e.start_at)}</td>
                            <td style={sx.td}>{e.title || "-"}</td>
                            <td style={sx.td}>{e.event_type || "-"}</td>
                            <td style={sx.td}>{e.status || "-"}</td>
                            <td style={sx.td}>{clientMap.get(e.client_id)?.name || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {view === "settings" && (
              <section>
                <Title eyebrow="Asetukset" title="Hinnoittelupohjat ja importit" />
                <div style={{ display: "grid", gridTemplateColumns: "430px 1fr", gap: 18 }}>
                  <div style={sx.cardDark}>
                    <form onSubmit={saveTemplate}>
                      <div style={{ display: "grid", gap: 12 }}>
                        <Field label="Nimi"><Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} /></Field>
                        <Field label="Kategoria"><Input value={templateForm.category} onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })} /></Field>
                        <Field label="Yksikkö"><Input value={templateForm.unit} onChange={(e) => setTemplateForm({ ...templateForm, unit: e.target.value })} /></Field>
                        <Field label="Yksikköhinta ALV 0"><Input type="number" value={templateForm.unit_price} onChange={(e) => setTemplateForm({ ...templateForm, unit_price: e.target.value })} /></Field>
                        <Field label="ALV %"><Input type="number" value={templateForm.vat_rate} onChange={(e) => setTemplateForm({ ...templateForm, vat_rate: e.target.value })} /></Field>
                        <Field label="Kuvaus"><TextArea value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} /></Field>
                        <Btn type="submit">{busy.template ? "Tallennetaan..." : "Tallenna pohja"}</Btn>
                      </div>
                    </form>
                  </div>

                  <div style={sx.card}>
                    <Title eyebrow="Hinnoittelupohjat" title="pricing_templates + import_logs" />
                    <table style={sx.table}>
                      <thead>
                        <tr>
                          {["Nimi", "Kategoria", "Yksikkö", "Hinta"].map((h) => (
                            <th key={h} style={sx.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pricingTemplates.map((r) => (
                          <tr key={r.id}>
                            <td style={sx.td}>{r.name || "-"}</td>
                            <td style={sx.td}>{r.category || "-"}</td>
                            <td style={sx.td}>{r.unit || "-"}</td>
                            <td style={sx.td}>{eur(r.unit_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ marginTop: 24 }}>
                      <h3 style={{ marginTop: 0 }}>Import-lokit</h3>
                      <table style={sx.table}>
                        <thead>
                          <tr>
                            {["Aika", "Tyyppi", "Lähde", "Status", "Rivejä"].map((h) => (
                              <th key={h} style={sx.th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importLogs.map((r) => (
                            <tr key={r.id}>
                              <td style={sx.td}>{fmtDateTime(r.imported_at)}</td>
                              <td style={sx.td}>{r.import_type || "-"}</td>
                              <td style={sx.td}>{r.source_system || r.source_name || "-"}</td>
                              <td style={sx.td}>{r.status || "-"}</td>
                              <td style={sx.td}>{r.row_count ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
