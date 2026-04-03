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
const INVOICE_STATUSES = ["Ei laskutettu", "Laskutettu", "Maksettu"];
const VALIDITY_PRESETS = ["7", "10", "14", "21", "30", "oma"];
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

const VAT_DEFAULT = 0;
const MONTHLY_TARGET_DEFAULT = 5000;

const emptyClient = {
  id: null,
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
  id: null,
  client_id: "",
  quote_number: "",
  title: "",
  status: "Luonnos",
  issue_date: "",
  valid_until: "",
  quote_valid_days: 14,
  validityPreset: "14",
  vat_rate: VAT_DEFAULT,
  is_b2b: true,
  vat_included: false,
  payment_terms_days: 14,
  invoice_status: "Ei laskutettu",
  invoice_number: "",
  invoice_date: "",
  expected_payment_date: "",
  shoot_date: "",
  delivery_date: "",
  auto_create_calendar: false,
  auto_create_cashflow: true,
  calendar_event_id: "",
  internal_note: "",
  notes: "",
};

const emptyFinance = {
  id: null,
  month: "",
  revenue: "",
  expenses: "",
  profit: "",
  target: MONTHLY_TARGET_DEFAULT,
  notes: "",
};

const emptyCashflow = {
  id: null,
  event_date: "",
  amount: "",
  type: "Tulo",
  description: "",
  notes: "",
  quote_id: "",
  client_id: "",
  calendar_event_id: "",
  source_system: "CRM",
  is_realized: false,
};

const emptyTemplate = {
  id: null,
  name: "",
  service_name: "",
  category: "",
  unit: "kpl",
  unit_price: "",
  vat_rate: VAT_DEFAULT,
  is_active: true,
  description: "",
};

const emptyCalendarEvent = {
  id: null,
  client_id: "",
  quote_id: "",
  title: "",
  event_type: "Kuvaus",
  status: "Suunniteltu",
  start_at: "",
  end_at: "",
  location: "",
  notes: "",
  source_system: "CRM",
  is_billable: false,
  amount_estimate: "",
};

const emptyAccountingDocument = {
  id: null,
  month: "",
  document_type: "Tuloslaskelma",
  source_system: "Netvisor",
  file_name: "",
  file_url: "",
  storage_path: "",
  notes: "",
};

const emptyAccountingMonthly = {
  id: null,
  month: "",
  source_system: "Netvisor",
  revenue: "",
  other_income: "",
  materials_and_services: "",
  personnel_expenses: "",
  other_operating_expenses: "",
  depreciation: "",
  operating_profit: "",
  financial_items: "",
  profit_before_appropriations: "",
  balance_assets: "",
  balance_liabilities: "",
  equity: "",
  cash_and_bank: "",
  receivables: "",
  payables: "",
  notes: "",
};

const eur = (v) =>
  new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(v || 0));

const num = (v) => Number(v || 0);
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("fi-FI") : "-");
const fmtDateTime = (v) => (v ? new Date(v).toLocaleString("fi-FI") : "-");
const today = () => new Date().toISOString().slice(0, 10);

const nowLocalInput = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const addDays = (dateLike, days) => {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
};

const pct = (value) => `${Math.round(value)}%`;

const normClientStatus = (s) =>
  CLIENT_STATUSES.find((x) => x.toLowerCase() === String(s || "").toLowerCase()) || "Liidi";

const normQuoteStatus = (s) =>
  QUOTE_STATUSES.find((x) => x.toLowerCase() === String(s || "").toLowerCase()) || "Luonnos";

const normInvoiceStatus = (s) =>
  INVOICE_STATUSES.find((x) => x.toLowerCase() === String(s || "").toLowerCase()) ||
  "Ei laskutettu";

const traffic = (value, target) => {
  if (!target || target <= 0) return { label: "Ei tavoitetta", color: "#c8c8c8" };
  const ratio = value / target;
  if (ratio >= 1) return { label: "Vihreä", color: "#ccffe0" };
  if (ratio >= 0.7) return { label: "Keltainen", color: "#fff1c7" };
  return { label: "Punainen", color: "#ffd7df" };
};

function safeDiv(a, b) {
  if (!b || Number(b) === 0) return 0;
  return Number(a || 0) / Number(b || 0);
}

function round2(v) {
  return Math.round(Number(v || 0) * 100) / 100;
}

const sx = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(90,49,132,.24), transparent 28%), radial-gradient(circle at top right, rgba(180,143,72,.08), transparent 22%), linear-gradient(180deg,#08070d 0%,#0c0a12 100%)",
    color: "#f4f1e9",
    fontFamily: 'Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif',
  },
  wrap: { maxWidth: 1680, margin: "0 auto", padding: "28px 20px 80px" },
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
  hero: {
    background: "linear-gradient(135deg, rgba(29,22,43,.96), rgba(14,12,22,.98))",
    border: "1px solid rgba(231,223,178,.12)",
    borderRadius: 26,
    padding: 26,
    boxShadow: "0 28px 70px rgba(0,0,0,.26)",
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
  btnDanger: {
    background: "rgba(120,31,49,.20)",
    color: "#ffd7df",
    border: "1px solid rgba(255,93,129,.22)",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
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
  pill: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: 999,
    border: "1px solid rgba(231,223,178,.12)",
    fontSize: 12,
    fontWeight: 700,
  },
};

function Btn({ children, variant = "primary", style = {}, ...props }) {
  const v =
    variant === "ghost"
      ? sx.btnGhost
      : variant === "danger"
      ? sx.btnDanger
      : sx.btnPrimary;
  return (
    <button {...props} style={{ ...sx.btn, ...v, ...style }}>
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

function StatPill({ label, good, warn, danger }) {
  const style = danger
    ? {
        color: "#ffd7df",
        background: "rgba(120,31,49,.18)",
        border: "1px solid rgba(255,93,129,.18)",
      }
    : warn
    ? {
        color: "#fff1c7",
        background: "rgba(217,201,138,.16)",
        border: "1px solid rgba(217,201,138,.18)",
      }
    : {
        color: "#ccffe0",
        background: "rgba(71,137,94,.18)",
        border: "1px solid rgba(125,212,156,.18)",
      };

  return <span style={{ ...sx.pill, ...style }}>{label}</span>;
}

function LinkChip({ href, label }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        ...sx.pill,
        background: "rgba(231,223,178,.08)",
        color: "#f4f1e9",
        textDecoration: "none",
      }}
    >
      {label}
    </a>
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
    valid_until: addDays(today(), 14),
  });
  const [quoteDraftLines, setQuoteDraftLines] = useState([
    { id: "d1", description: "", quantity: 1, unit_price: 0, sort_order: 1 },
  ]);
  const [financeForm, setFinanceForm] = useState({
    ...emptyFinance,
    target: MONTHLY_TARGET_DEFAULT,
  });
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
  const [accountingDocumentForm, setAccountingDocumentForm] = useState(emptyAccountingDocument);
  const [accountingMonthlyForm, setAccountingMonthlyForm] = useState(emptyAccountingMonthly);

  const [crmSearch, setCrmSearch] = useState("");
  const [crmStatusFilter, setCrmStatusFilter] = useState("Kaikki");
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quoteStatusFilter, setQuoteStatusFilter] = useState("Kaikki");
  const [calendarFilter, setCalendarFilter] = useState("");
  const [accountingFilter, setAccountingFilter] = useState("");

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
    accountingDocument: false,
    accountingMonthly: false,
    generatingQuoteNumber: false,
    invoicingQuoteId: null,
    quoteCalendarId: null,
    quoteCashflowId: null,
    aiImport: false,
  });

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [a, c, d, e, f, g, h, i, j, k, l] = await Promise.all([
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("finance_monthly").select("*").order("month", { ascending: false }),
        supabase.from("cashflow_events").select("*").order("event_date", { ascending: false }),
        supabase.from("quotes").select("*").order("created_at", { ascending: false }),
        supabase.from("quote_lines").select("*").order("sort_order", { ascending: true }),
        supabase.from("pricing_templates").select("*").order("created_at", { ascending: false }),
        supabase.from("import_logs").select("*").order("imported_at", { ascending: false }),
        supabase.from("calendar_events").select("*").order("start_at", { ascending: true }),
        supabase.from("accounting_documents").select("*").order("uploaded_at", { ascending: false }),
        supabase.from("accounting_monthly").select("*").order("month", { ascending: false }),
      ]);

      for (const r of [a, c, d, e, f, g, h, i, j, k, l]) {
        if (r.error) throw r.error;
      }

      setClients((a.data || []).map((x) => ({ ...x, status: normClientStatus(x.status) })));
      setTasks(c.data || []);
      setFinanceMonthly(d.data || []);
      setCashflowEvents(e.data || []);
      setQuotes(
        (f.data || []).map((x) => ({
          ...x,
          status: normQuoteStatus(x.status),
          invoice_status: normInvoiceStatus(x.invoice_status),
        }))
      );
      setQuoteLines(g.data || []);
      setPricingTemplates(h.data || []);
      setImportLogs(i.data || []);
      setCalendarEvents(j.data || []);
      setAccountingDocuments(k.data || []);
      setAccountingMonthly(l.data || []);
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
    const t = setTimeout(() => setSuccess(""), 2600);
    return () => clearTimeout(t);
  }, [success]);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const quotesEnriched = useMemo(() => {
    return quotes.map((q) => ({
      ...q,
      client: clientMap.get(q.client_id) || null,
      lines: quoteLines
        .filter((l) => l.quote_id === q.id)
        .sort((a, b) => num(a.sort_order) - num(b.sort_order)),
    }));
  }, [quotes, quoteLines, clientMap]);

  const latestAccounting = useMemo(() => accountingMonthly[0] || null, [accountingMonthly]);

  const accountingMetrics = useMemo(() => {
    const a = latestAccounting || {};
    const monthlyBurn =
      Math.abs(num(a.materials_and_services)) +
      Math.abs(num(a.personnel_expenses)) +
      Math.abs(num(a.other_operating_expenses));

    const equityRatio = safeDiv(num(a.equity), num(a.balance_assets)) * 100;
    const currentRatio = safeDiv(num(a.cash_and_bank) + num(a.receivables), num(a.payables));
    const cashRunwayMonths = safeDiv(num(a.cash_and_bank), monthlyBurn);
    const debtRatio = safeDiv(Math.abs(num(a.balance_liabilities)), num(a.balance_assets)) * 100;
    const operatingMargin = safeDiv(num(a.operating_profit), num(a.revenue)) * 100;

    return {
      equityRatio,
      currentRatio,
      cashRunwayMonths,
      debtRatio,
      monthlyBurn,
      operatingMargin,
    };
  }, [latestAccounting]);

  const dashboard = useMemo(() => {
    const openTasks = tasks.filter(
      (t) => !["done", "completed", "valmis"].includes(String(t.status || "").toLowerCase())
    ).length;

    const overdueTasks = tasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) < new Date() &&
        !["done", "completed", "valmis"].includes(String(t.status || "").toLowerCase())
    ).length;

    const quotePipeline = quotesEnriched
      .filter((q) => ["luonnos", "lähetetty"].includes(String(q.status || "").toLowerCase()))
      .reduce((s, q) => s + num(q.total), 0);

    const quoteWon = quotesEnriched
      .filter((q) => String(q.status || "").toLowerCase() === "hyväksytty")
      .reduce((s, q) => s + num(q.total), 0);

    const quoteLost = quotesEnriched
      .filter((q) => ["hylätty", "vanhentunut"].includes(String(q.status || "").toLowerCase()))
      .reduce((s, q) => s + num(q.total), 0);

    const cashflowForecast = cashflowEvents
      .filter((r) => String(r.type || "") === "Ennuste")
      .reduce((s, r) => s + num(r.amount), 0);

    const cashflowRealized = cashflowEvents
      .filter((r) => r.is_realized === true || String(r.type || "") === "Tulo" || String(r.type || "") === "Meno")
      .reduce((s, r) => s + num(r.amount), 0);

    const latestMonth = financeMonthly[0] || null;
    const monthRevenue = num(latestMonth?.revenue);
    const monthTarget = num(latestMonth?.target || MONTHLY_TARGET_DEFAULT);
    const monthTraffic = traffic(monthRevenue, monthTarget);

    return {
      totalClients: clients.length,
      openTasks,
      overdueTasks,
      quotePipeline,
      quoteWon,
      quoteLost,
      cashflowForecast,
      cashflowRealized,
      monthRevenue,
      monthTarget,
      monthTraffic,
      accountingLatest: latestAccounting,
    };
  }, [clients, tasks, quotesEnriched, cashflowEvents, financeMonthly, latestAccounting]);

  const quoteTotals = useMemo(() => {
    const subtotal = quoteDraftLines.reduce((s, l) => s + num(l.quantity) * num(l.unit_price), 0);
    const vatAmount = subtotal * (num(quoteForm.vat_rate) / 100);
    return { subtotal, vatAmount, total: subtotal + vatAmount };
  }, [quoteDraftLines, quoteForm.vat_rate]);

  const filteredClients = useMemo(() => {
    const q = crmSearch.trim().toLowerCase();
    return clients.filter((c) => {
      const okSearch =
        !q ||
        [c.name, c.company_name, c.email, c.phone, c.city, c.business_id, c.notes]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      const okStatus = crmStatusFilter === "Kaikki" || normClientStatus(c.status) === crmStatusFilter;
      return okSearch && okStatus;
    });
  }, [clients, crmSearch, crmStatusFilter]);

  const filteredQuotes = useMemo(() => {
    const q = quoteSearch.trim().toLowerCase();
    return quotesEnriched.filter((x) => {
      const okSearch =
        !q ||
        [x.quote_number, x.title, x.client?.name, x.client?.company_name, x.invoice_number]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      const okStatus = quoteStatusFilter === "Kaikki" || normQuoteStatus(x.status) === quoteStatusFilter;
      return okSearch && okStatus;
    });
  }, [quotesEnriched, quoteSearch, quoteStatusFilter]);

  const financeSummary = useMemo(
    () => ({
      revenue: financeMonthly.reduce((s, r) => s + num(r.revenue), 0),
      expenses: financeMonthly.reduce((s, r) => s + num(r.expenses), 0),
      profit: financeMonthly.reduce(
        (s, r) => s + num(r.profit !== null && r.profit !== undefined ? r.profit : num(r.revenue) - num(r.expenses)),
        0
      ),
      target: financeMonthly.reduce((s, r) => s + num(r.target), 0),
      cashflow: cashflowEvents.reduce((s, r) => s + num(r.amount), 0),
    }),
    [financeMonthly, cashflowEvents]
  );

  function resetClient() {
    setClientForm(emptyClient);
  }

  function resetQuote() {
    const base = today();
    setQuoteForm({
      ...emptyQuote,
      issue_date: base,
      valid_until: addDays(base, 14),
    });
    setQuoteDraftLines([{ id: `d-${Date.now()}`, description: "", quantity: 1, unit_price: 0, sort_order: 1 }]);
  }

  function resetFinance() {
    setFinanceForm({ ...emptyFinance, target: MONTHLY_TARGET_DEFAULT });
  }

  function resetCashflow() {
    setCashflowForm({ ...emptyCashflow, event_date: today() });
  }

  function resetTemplate() {
    setTemplateForm(emptyTemplate);
  }

  function resetCalendar() {
    setCalendarForm({ ...emptyCalendarEvent, start_at: nowLocalInput(), end_at: nowLocalInput() });
  }

  function resetAccountingDocument() {
    setAccountingDocumentForm(emptyAccountingDocument);
  }

  function resetAccountingMonthly() {
    setAccountingMonthlyForm(emptyAccountingMonthly);
  }

  async function generateQuoteNumber() {
    setBusy((b) => ({ ...b, generatingQuoteNumber: true }));
    try {
      const { data, error } = await supabase.rpc("get_next_quote_number");
      if (error) throw error;
      setQuoteForm((prev) => ({ ...prev, quote_number: data || "" }));
    } catch (err) {
      setError(err.message || "Tarjousnumeron haku epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, generatingQuoteNumber: false }));
    }
  }

  function applyValidityPreset(preset) {
    if (preset === "oma") {
      setQuoteForm((prev) => ({ ...prev, validityPreset: "oma" }));
      return;
    }
    const days = Number(preset);
    setQuoteForm((prev) => ({
      ...prev,
      validityPreset: String(preset),
      quote_valid_days: days,
      valid_until: prev.issue_date ? addDays(prev.issue_date, days) : "",
    }));
  }

  const addDraftLine = () =>
    setQuoteDraftLines((prev) => [
      ...prev,
      { id: `d-${Date.now()}-${prev.length + 1}`, description: "", quantity: 1, unit_price: 0, sort_order: prev.length + 1 },
    ]);

  const updateDraftLine = (id, key, value) =>
    setQuoteDraftLines((prev) => prev.map((l) => (l.id === id ? { ...l, [key]: value } : l)));

  const removeDraftLine = (id) =>
    setQuoteDraftLines((prev) =>
      prev.filter((l) => l.id !== id).map((l, i) => ({ ...l, sort_order: i + 1 }))
    );

  const addTemplateToQuote = (tpl) =>
    setQuoteDraftLines((prev) => [
      ...prev,
      {
        id: `tpl-${tpl.id}-${Date.now()}`,
        description: tpl.name || tpl.service_name || "Palvelu",
        quantity: 1,
        unit_price: num(tpl.unit_price),
        sort_order: prev.length + 1,
      },
    ]);

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

  async function saveClient(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, client: true }));
    try {
      if (!clientForm.name?.trim()) throw new Error("Asiakkaan nimi on pakollinen.");
      const payload = { ...clientForm, updated_at: new Date().toISOString() };

      const q = clientForm.id
        ? await supabase.from("clients").update(payload).eq("id", clientForm.id)
        : await supabase.from("clients").insert({ ...payload, created_at: new Date().toISOString() });

      if (q.error) throw q.error;
      setSuccess(clientForm.id ? "Asiakas päivitetty." : "Asiakas lisätty.");
      resetClient();
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
    try {
      if (!quoteForm.client_id) throw new Error("Valitse asiakas.");
      if (!quoteForm.title?.trim()) throw new Error("Tarjouksen otsikko on pakollinen.");

      const lines = quoteDraftLines
        .map((l, i) => ({
          description: String(l.description || "").trim(),
          quantity: num(l.quantity),
          unit_price: num(l.unit_price),
          sort_order: i + 1,
          line_total: num(l.quantity) * num(l.unit_price),
        }))
        .filter((l) => l.description);

      if (!lines.length) throw new Error("Tarjouksella täytyy olla vähintään yksi tarjousrivi.");

      const payload = {
        ...quoteForm,
        quote_valid_days: num(quoteForm.quote_valid_days),
        vat_rate: num(quoteForm.vat_rate),
        payment_terms_days: num(quoteForm.payment_terms_days),
        subtotal: quoteTotals.subtotal,
        vat_amount: quoteTotals.vatAmount,
        total: quoteTotals.total,
        updated_at: new Date().toISOString(),
      };

      let quoteId = quoteForm.id;

      if (quoteId) {
        const u = await supabase.from("quotes").update(payload).eq("id", quoteId);
        if (u.error) throw u.error;

        const d = await supabase.from("quote_lines").delete().eq("quote_id", quoteId);
        if (d.error) throw d.error;
      } else {
        const i = await supabase
          .from("quotes")
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select()
          .single();

        if (i.error) throw i.error;
        quoteId = i.data.id;
      }

      const ins = await supabase.from("quote_lines").insert(
        lines.map((l) => ({
          ...l,
          quote_id: quoteId,
          created_at: new Date().toISOString(),
        }))
      );
      if (ins.error) throw ins.error;

      setSuccess(quoteForm.id ? "Tarjous päivitetty." : "Tarjous lisätty.");
      resetQuote();
      await loadData();
    } catch (err) {
      setError(err.message || "Tarjouksen tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, quote: false }));
    }
  }

  async function createCalendarFromQuote(quoteId) {
    setBusy((b) => ({ ...b, quoteCalendarId: quoteId }));
    try {
      const { error } = await supabase.rpc("create_calendar_event_from_quote", {
        p_quote_id: quoteId,
        p_event_type: "Kuvaus",
      });
      if (error) throw error;
      setSuccess("Kalenterivaraus luotu tarjoukselta.");
      await loadData();
    } catch (err) {
      setError(err.message || "Kalenterivarauksen luonti epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, quoteCalendarId: null }));
    }
  }

  async function createCashflowFromQuote(quoteId) {
    setBusy((b) => ({ ...b, quoteCashflowId: quoteId }));
    try {
      const { error } = await supabase.rpc("create_cashflow_from_quote", {
        p_quote_id: quoteId,
      });
      if (error) throw error;
      setSuccess("Kassavirtaennuste luotu tarjoukselta.");
      await loadData();
    } catch (err) {
      setError(err.message || "Kassavirtaennusteen luonti epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, quoteCashflowId: null }));
    }
  }

  async function invoiceQuote(id) {
    setBusy((b) => ({ ...b, invoicingQuoteId: id }));
    try {
      const { error } = await supabase.rpc("invoice_quote", { p_quote_id: id });
      if (error) throw error;
      setSuccess("Tarjous laskutettu.");
      await loadData();
    } catch (err) {
      setError(err.message || "Laskutus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, invoicingQuoteId: null }));
    }
  }

  async function saveFinance(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, finance: true }));
    try {
      const payload = {
        ...financeForm,
        revenue: num(financeForm.revenue),
        expenses: num(financeForm.expenses),
        profit:
          financeForm.profit !== ""
            ? num(financeForm.profit)
            : num(financeForm.revenue) - num(financeForm.expenses),
        target: num(financeForm.target),
      };

      const q = financeForm.id
        ? await supabase.from("finance_monthly").update(payload).eq("id", financeForm.id)
        : await supabase.from("finance_monthly").insert({ ...payload, created_at: new Date().toISOString() });

      if (q.error) throw q.error;
      setSuccess(financeForm.id ? "Kuukausirivi päivitetty." : "Kuukausirivi lisätty.");
      resetFinance();
      await loadData();
    } catch (err) {
      setError(err.message || "Kuukausirivin tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, finance: false }));
    }
  }

  async function saveCashflow(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, cashflow: true }));
    try {
      const payload = {
        ...cashflowForm,
        amount: num(cashflowForm.amount),
      };

      const q = cashflowForm.id
        ? await supabase.from("cashflow_events").update(payload).eq("id", cashflowForm.id)
        : await supabase.from("cashflow_events").insert({ ...payload, created_at: new Date().toISOString() });

      if (q.error) throw q.error;
      setSuccess(cashflowForm.id ? "Kassavirtarivi päivitetty." : "Kassavirtarivi lisätty.");
      resetCashflow();
      await loadData();
    } catch (err) {
      setError(err.message || "Kassavirran tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, cashflow: false }));
    }
  }

  async function saveCalendarEvent(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, calendar: true }));
    try {
      if (!calendarForm.title?.trim()) throw new Error("Otsikko on pakollinen.");
      const payload = {
        ...calendarForm,
        start_at: new Date(calendarForm.start_at).toISOString(),
        end_at: new Date(calendarForm.end_at).toISOString(),
        amount_estimate: num(calendarForm.amount_estimate),
      };

      const q = calendarForm.id
        ? await supabase.from("calendar_events").update(payload).eq("id", calendarForm.id)
        : await supabase.from("calendar_events").insert({
            ...payload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

      if (q.error) throw q.error;
      setSuccess(calendarForm.id ? "Kalenteritapahtuma päivitetty." : "Kalenteritapahtuma lisätty.");
      resetCalendar();
      await loadData();
    } catch (err) {
      setError(err.message || "Kalenterin tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, calendar: false }));
    }
  }

  async function saveTemplate(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, template: true }));
    try {
      const payload = {
        ...templateForm,
        name: templateForm.name || templateForm.service_name,
        service_name: templateForm.service_name || templateForm.name,
        unit_price: num(templateForm.unit_price),
        vat_rate: num(templateForm.vat_rate),
      };

      const q = templateForm.id
        ? await supabase.from("pricing_templates").update(payload).eq("id", templateForm.id)
        : await supabase.from("pricing_templates").insert({ ...payload, created_at: new Date().toISOString() });

      if (q.error) throw q.error;
      setSuccess(templateForm.id ? "Hinnoittelupohja päivitetty." : "Hinnoittelupohja lisätty.");
      resetTemplate();
      await loadData();
    } catch (err) {
      setError(err.message || "Hinnoittelupohjan tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, template: false }));
    }
  }

  async function saveAccountingDocument(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, accountingDocument: true }));
    try {
      const q = accountingDocumentForm.id
        ? await supabase.from("accounting_documents").update(accountingDocumentForm).eq("id", accountingDocumentForm.id)
        : await supabase.from("accounting_documents").insert({
            ...accountingDocumentForm,
            uploaded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });

      if (q.error) throw q.error;

      await supabase.from("import_logs").insert({
        import_type: accountingDocumentForm.document_type,
        source_name: accountingDocumentForm.file_url || accountingDocumentForm.file_name || "Kirjanpidon aineisto",
        status: "Tallennettu",
        row_count: 1,
        message: `Kirjanpidon aineisto tallennettu (${accountingDocumentForm.source_system})`,
        source_system: accountingDocumentForm.source_system,
        file_name: accountingDocumentForm.file_name || null,
        month: accountingDocumentForm.month || null,
        imported_at: new Date().toISOString(),
      });

      setSuccess("Kirjanpidon aineisto tallennettu.");
      resetAccountingDocument();
      await loadData();
    } catch (err) {
      setError(err.message || "Kirjanpidon aineiston tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, accountingDocument: false }));
    }
  }

  async function saveAccountingMonthly(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, accountingMonthly: true }));
    try {
      const numericFields = [
        "revenue",
        "other_income",
        "materials_and_services",
        "personnel_expenses",
        "other_operating_expenses",
        "depreciation",
        "operating_profit",
        "financial_items",
        "profit_before_appropriations",
        "balance_assets",
        "balance_liabilities",
        "equity",
        "cash_and_bank",
        "receivables",
        "payables",
      ];

      const payload = Object.fromEntries(
        Object.entries(accountingMonthlyForm).map(([k, v]) => [k, numericFields.includes(k) ? num(v) : v])
      );

      const q = accountingMonthlyForm.id
        ? await supabase.from("accounting_monthly").update(payload).eq("id", accountingMonthlyForm.id)
        : await supabase.from("accounting_monthly").insert({
            ...payload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

      if (q.error) throw q.error;
      setSuccess("Kirjanpidon kuukausitarkennus tallennettu.");
      resetAccountingMonthly();
      await loadData();
    } catch (err) {
      setError(err.message || "Kirjanpidon kuukausitarkennuksen tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, accountingMonthly: false }));
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
              SALOPINO CRM / TALOUSOHJAUS V6.6
            </div>
            <h1 style={{ margin: "0 0 10px", fontSize: 42, lineHeight: 1.05, fontWeight: 900 }}>
              Tarjous → kalenteri → kassavirta → AI talousanalyysi
            </h1>
            <p style={{ margin: 0, color: "rgba(244,241,233,.74)", fontSize: 16, lineHeight: 1.7 }}>
              Yksi premium-ohjauspaneeli, jossa tarjoukset, aikataulut, kassavirta ja PDF:stä
              luettu kirjanpidon AI-analyysi yhdistyvät operatiiviseksi päätöksenteoksi.
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
                <Title
                  eyebrow="Tilannekuva"
                  title="Dashboard"
                  right={<Btn variant="ghost" onClick={loadData}>Päivitä</Btn>}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6,minmax(0,1fr))",
                    gap: 14,
                    marginBottom: 18,
                  }}
                >
                  <Metric title="Asiakkaita" value={clients.length} sub="clients" accent />
                  <Metric title="Tarjouskanta" value={eur(dashboard.quotePipeline)} sub="Luonnos + Lähetetty" />
                  <Metric title="Voitetut" value={eur(dashboard.quoteWon)} sub="Hyväksytyt tarjoukset" />
                  <Metric title="Hävityt" value={eur(dashboard.quoteLost)} sub="Hylätyt + vanhentuneet" />
                  <Metric title="Ennustettu kassavirta" value={eur(dashboard.cashflowForecast)} sub="cashflow_events / Ennuste" />
                  <Metric title="Toteutunut kassavirta" value={eur(dashboard.cashflowRealized)} sub="realized / tulot-menot" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 18 }}>
                  <div style={sx.card}>
                    <Title eyebrow="Kuukausiohjaus" title="CRM-talous" />
                    <div style={{ display: "grid", gap: 10 }}>
                      <div><strong>Kuukauden liikevaihto:</strong> {eur(dashboard.monthRevenue)}</div>
                      <div><strong>Tavoite:</strong> {eur(dashboard.monthTarget)}</div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <StatPill
                          label={dashboard.monthTraffic.label}
                          good={dashboard.monthTraffic.label === "Vihreä"}
                          warn={dashboard.monthTraffic.label === "Keltainen"}
                          danger={dashboard.monthTraffic.label === "Punainen"}
                        />
                        <span>{pct(dashboard.monthTarget ? (dashboard.monthRevenue / dashboard.monthTarget) * 100 : 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={sx.card}>
                    <Title eyebrow="Likviditeetti" title="Kassa" />
                    <div style={{ display: "grid", gap: 10 }}>
                      <div><strong>Pankki ja rahat:</strong> {eur(latestAccounting?.cash_and_bank)}</div>
                      <div><strong>Current ratio:</strong> {round2(accountingMetrics.currentRatio)}</div>
                      <div><strong>Kassapuskuri:</strong> {round2(accountingMetrics.cashRunwayMonths)} kk</div>
                    </div>
                  </div>

                  <div style={sx.card}>
                    <Title eyebrow="Vakavaraisuus" title="Tase" />
                    <div style={{ display: "grid", gap: 10 }}>
                      <div><strong>Oma pääoma:</strong> {eur(latestAccounting?.equity)}</div>
                      <div><strong>Omavaraisuusaste:</strong> {round2(accountingMetrics.equityRatio)} %</div>
                      <div><strong>Velkaisuusaste:</strong> {round2(accountingMetrics.debtRatio)} %</div>
                    </div>
                  </div>

                  <div style={sx.card}>
                    <Title eyebrow="Kannattavuus" title="Liiketulos" />
                    <div style={{ display: "grid", gap: 10 }}>
                      <div><strong>Liikevaihto:</strong> {eur(latestAccounting?.revenue)}</div>
                      <div><strong>Liiketulos:</strong> {eur(latestAccounting?.operating_profit)}</div>
                      <div><strong>Marginaali:</strong> {round2(accountingMetrics.operatingMargin)} %</div>
                    </div>
                  </div>
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
                        <Field label="Nimi *">
                          <Input value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} />
                        </Field>
                        <Field label="Yritys">
                          <Input value={clientForm.company_name} onChange={(e) => setClientForm({ ...clientForm, company_name: e.target.value })} />
                        </Field>
                        <Field label="Sähköposti">
                          <Input value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} />
                        </Field>
                        <Field label="Puhelin">
                          <Input value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} />
                        </Field>
                        <Field label="Kaupunki">
                          <Input value={clientForm.city} onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })} />
                        </Field>
                        <Field label="Y-tunnus">
                          <Input value={clientForm.business_id} onChange={(e) => setClientForm({ ...clientForm, business_id: e.target.value })} />
                        </Field>
                        <Field label="Status">
                          <Select value={clientForm.status} onChange={(e) => setClientForm({ ...clientForm, status: e.target.value })}>
                            {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        </Field>
                        <Field label="Finder-linkki">
                          <Input value={clientForm.finder_url} onChange={(e) => setClientForm({ ...clientForm, finder_url: e.target.value })} />
                        </Field>
                        <Field label="Asiakastieto-linkki">
                          <Input value={clientForm.asiakastieto_url} onChange={(e) => setClientForm({ ...clientForm, asiakastieto_url: e.target.value })} />
                        </Field>
                        <Field label="LinkedIn-linkki">
                          <Input value={clientForm.linkedin_url} onChange={(e) => setClientForm({ ...clientForm, linkedin_url: e.target.value })} />
                        </Field>
                        <Field label="Muistiinpanot">
                          <TextArea value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} />
                        </Field>
                        <div style={{ display: "flex", gap: 10 }}>
                          <Btn type="submit">{busy.client ? "Tallennetaan..." : "Tallenna"}</Btn>
                          <Btn type="button" variant="ghost" onClick={resetClient}>Tyhjennä</Btn>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div style={sx.card}>
                    <Title eyebrow="Asiakaslista" title="Asiakkaat" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, marginBottom: 14 }}>
                      <Field label="Hae">
                        <Input value={crmSearch} onChange={(e) => setCrmSearch(e.target.value)} />
                      </Field>
                      <Field label="Status">
                        <Select value={crmStatusFilter} onChange={(e) => setCrmStatusFilter(e.target.value)}>
                          <option value="Kaikki">Kaikki</option>
                          {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </Select>
                      </Field>
                    </div>

                    <table style={sx.table}>
                      <thead>
                        <tr>
                          {["Nimi", "Yritys", "Status", "Yhteystiedot", "Linkit"].map((h) => (
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
                            <td style={sx.td}>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <LinkChip href={c.finder_url} label="Finder" />
                                <LinkChip href={c.asiakastieto_url} label="Asiakastieto" />
                                <LinkChip href={c.linkedin_url} label="LinkedIn" />
                              </div>
                            </td>
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
                <Title
                  eyebrow="Tarjoukset"
                  title="Tarjousten hallinta"
                  right={
                    <div style={{ display: "flex", gap: 10 }}>
                      <Btn variant="ghost" onClick={generateQuoteNumber}>
                        {busy.generatingQuoteNumber ? "Haetaan..." : "Generoi nro"}
                      </Btn>
                      <Btn variant="ghost" onClick={loadData}>Päivitä</Btn>
                    </div>
                  }
                />
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

                        <Field label="Tarjousnumero">
                          <Input value={quoteForm.quote_number} onChange={(e) => setQuoteForm({ ...quoteForm, quote_number: e.target.value })} />
                        </Field>

                        <Field label="Otsikko">
                          <Input value={quoteForm.title} onChange={(e) => setQuoteForm({ ...quoteForm, title: e.target.value })} />
                        </Field>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <Field label="Päiväys">
                            <Input type="date" value={quoteForm.issue_date} onChange={(e) => setQuoteForm({ ...quoteForm, issue_date: e.target.value })} />
                          </Field>
                          <Field label="Voimassa asti">
                            <Input
                              type="date"
                              value={quoteForm.valid_until}
                              onChange={(e) => setQuoteForm({ ...quoteForm, valid_until: e.target.value, validityPreset: "oma" })}
                            />
                          </Field>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                          <Field label="Voimassaolo">
                            <Select value={quoteForm.validityPreset} onChange={(e) => applyValidityPreset(e.target.value)}>
                              {VALIDITY_PRESETS.map((v) => (
                                <option key={v} value={v}>{v === "oma" ? "oma päivä" : `${v} pv`}</option>
                              ))}
                            </Select>
                          </Field>
                          <Field label="Maksuehto pv">
                            <Input type="number" value={quoteForm.payment_terms_days} onChange={(e) => setQuoteForm({ ...quoteForm, payment_terms_days: e.target.value })} />
                          </Field>
                          <Field label="ALV %">
                            <Input type="number" value={quoteForm.vat_rate} onChange={(e) => setQuoteForm({ ...quoteForm, vat_rate: e.target.value })} />
                          </Field>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <Field label="Kuvauspäivä">
                            <Input type="date" value={quoteForm.shoot_date} onChange={(e) => setQuoteForm({ ...quoteForm, shoot_date: e.target.value })} />
                          </Field>
                          <Field label="Toimituspäivä">
                            <Input type="date" value={quoteForm.delivery_date} onChange={(e) => setQuoteForm({ ...quoteForm, delivery_date: e.target.value })} />
                          </Field>
                        </div>

                        <Field label="Status">
                          <Select value={quoteForm.status} onChange={(e) => setQuoteForm({ ...quoteForm, status: e.target.value })}>
                            {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        </Field>

                        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input
                              type="checkbox"
                              checked={!!quoteForm.auto_create_calendar}
                              onChange={(e) => setQuoteForm({ ...quoteForm, auto_create_calendar: e.target.checked })}
                            />
                            <span>Luo kalenteri tarjoukselta</span>
                          </label>
                          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input
                              type="checkbox"
                              checked={!!quoteForm.auto_create_cashflow}
                              onChange={(e) => setQuoteForm({ ...quoteForm, auto_create_cashflow: e.target.checked })}
                            />
                            <span>Luo kassavirtaennuste tarjoukselta</span>
                          </label>
                        </div>

                        <div
                          style={{
                            padding: 14,
                            borderRadius: 16,
                            background: "rgba(10,10,16,.58)",
                            border: "1px solid rgba(231,223,178,.12)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 10,
                            }}
                          >
                            <strong>Tarjousrivit</strong>
                            <Btn type="button" variant="ghost" onClick={addDraftLine}>Lisää rivi</Btn>
                          </div>

                          {pricingTemplates.length > 0 && (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                              {pricingTemplates.slice(0, 6).map((tpl) => (
                                <Btn
                                  key={tpl.id}
                                  type="button"
                                  variant="ghost"
                                  onClick={() => addTemplateToQuote(tpl)}
                                  style={{ padding: "8px 10px", fontSize: 12 }}
                                >
                                  + {tpl.name || tpl.service_name}
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
                                  <Input value={l.description} onChange={(e) => updateDraftLine(l.id, "description", e.target.value)} />
                                </Field>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginTop: 10 }}>
                                  <Field label="Määrä">
                                    <Input type="number" value={l.quantity} onChange={(e) => updateDraftLine(l.id, "quantity", e.target.value)} />
                                  </Field>
                                  <Field label="Yksikköhinta ALV 0">
                                    <Input type="number" value={l.unit_price} onChange={(e) => updateDraftLine(l.id, "unit_price", e.target.value)} />
                                  </Field>
                                  <div style={{ display: "flex", alignItems: "end" }}>
                                    <Btn type="button" variant="danger" onClick={() => removeDraftLine(l.id)}>Poista</Btn>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                            <Metric title="Veroton" value={eur(quoteTotals.subtotal)} sub="ALV 0 oletus" />
                            <Metric title="ALV" value={eur(quoteTotals.vatAmount)} sub={`${quoteForm.vat_rate}%`} />
                            <Metric title="Yhteensä" value={eur(quoteTotals.total)} sub="Tarjoussumma" accent />
                          </div>
                        </div>

                        <Field label="Sisäinen huomio">
                          <TextArea value={quoteForm.internal_note} onChange={(e) => setQuoteForm({ ...quoteForm, internal_note: e.target.value })} />
                        </Field>
                        <Field label="Muistiinpanot">
                          <TextArea value={quoteForm.notes} onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })} />
                        </Field>

                        <div style={{ display: "flex", gap: 10 }}>
                          <Btn type="submit">{busy.quote ? "Tallennetaan..." : "Tallenna tarjous"}</Btn>
                          <Btn type="button" variant="ghost" onClick={resetQuote}>Tyhjennä</Btn>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div style={sx.card}>
                    <Title eyebrow="Tarjouslista" title="Tallennetut tarjoukset" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, marginBottom: 14 }}>
                      <Field label="Hae">
                        <Input value={quoteSearch} onChange={(e) => setQuoteSearch(e.target.value)} />
                      </Field>
                      <Field label="Status">
                        <Select value={quoteStatusFilter} onChange={(e) => setQuoteStatusFilter(e.target.value)}>
                          <option value="Kaikki">Kaikki</option>
                          {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </Select>
                      </Field>
                    </div>

                    <table style={sx.table}>
                      <thead>
                        <tr>
                          {["Nro", "Otsikko", "Status", "Kuvauspäivä", "Laskutus", "Summa", "Toiminnot"].map((h) => (
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
                            <td style={sx.td}>{q.invoice_status || "-"}</td>
                            <td style={sx.td}>{eur(q.total)}</td>
                            <td style={sx.td}>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <Btn variant="ghost" onClick={() => invoiceQuote(q.id)}>
                                  {busy.invoicingQuoteId === q.id ? "..." : "Laskuta"}
                                </Btn>
                                <Btn variant="ghost" onClick={() => createCalendarFromQuote(q.id)}>
                                  {busy.quoteCalendarId === q.id ? "..." : "Kalenteri"}
                                </Btn>
                                <Btn variant="ghost" onClick={() => createCashflowFromQuote(q.id)}>
                                  {busy.quoteCashflowId === q.id ? "..." : "Kassavirta"}
                                </Btn>
                              </div>
                            </td>
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
                <Title eyebrow="Talous" title="Kirjanpito + CRM-talous + AI-analyysi" />
                <div style={{ display: "grid", gridTemplateColumns: "430px 1fr", gap: 18 }}>
                  <div style={sx.cardDark}>
                    <form onSubmit={(e) => e.preventDefault()} style={{ marginBottom: 22 }}>
                      <Title eyebrow="V6.6 AI import" title="PDF → AI → kirjanpito" />
                      <div style={{ display: "grid", gap: 12 }}>
                        <Field label="Kuukausi">
                          <Input
                            value={aiImportMonth}
                            onChange={(e) => setAiImportMonth(e.target.value)}
                            placeholder="2026-04"
                          />
                        </Field>

                        <Field label="Lähdejärjestelmä">
                          <Select
                            value={aiImportSourceSystem}
                            onChange={(e) => setAiImportSourceSystem(e.target.value)}
                          >
                            {SOURCE_SYSTEMS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </Select>
                        </Field>

                        <Field label="Dokumenttityyppi">
                          <Select
                            value={aiImportDocumentType}
                            onChange={(e) => setAiImportDocumentType(e.target.value)}
                          >
                            {ACCOUNTING_DOC_TYPES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
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

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Btn type="button" onClick={uploadAccountingPdfToAi}>
                            {busy.aiImport ? "Tuodaan..." : "AI tuo PDF"}
                          </Btn>
                          <Btn
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setAiImportFile(null);
                              setAiAnalysisResult(null);
                              setAiImportMonth(today().slice(0, 7));
                              setAiImportSourceSystem("Netvisor");
                              setAiImportDocumentType("Tuloslaskelma");
                            }}
                          >
                            Tyhjennä
                          </Btn>
                        </div>
                      </div>
                    </form>

                    <form onSubmit={saveFinance} style={{ marginBottom: 22 }}>
                      <Title eyebrow="finance_monthly" title="CRM-kuukausi" />
                      <div style={{ display: "grid", gap: 12 }}>
                        <Field label="Kuukausi">
                          <Input value={financeForm.month} onChange={(e) => setFinanceForm({ ...financeForm, month: e.target.value })} placeholder="2026-04" />
                        </Field>
                        <Field label="Liikevaihto">
                          <Input type="number" value={financeForm.revenue} onChange={(e) => setFinanceForm({ ...financeForm, revenue: e.target.value })} />
                        </Field>
                        <Field label="Kulut">
                          <Input type="number" value={financeForm.expenses} onChange={(e) => setFinanceForm({ ...financeForm, expenses: e.target.value })} />
                        </Field>
                        <Field label="Tulos">
                          <Input type="number" value={financeForm.profit} onChange={(e) => setFinanceForm({ ...financeForm, profit: e.target.value })} />
                        </Field>
                        <Field label="Tavoite">
                          <Input type="number" value={financeForm.target} onChange={(e) => setFinanceForm({ ...financeForm, target: e.target.value })} />
                        </Field>
                        <div style={{ display: "flex", gap: 10 }}>
                          <Btn type="submit">{busy.finance ? "Tallennetaan..." : "Tallenna kuukausi"}</Btn>
                          <Btn type="button" variant="ghost" onClick={resetFinance}>Tyhjennä</Btn>
                        </div>
                      </div>
                    </form>

                    <form onSubmit={saveCashflow}>
                      <Title eyebrow="cashflow_events" title="Kassavirta" />
                      <div style={{ display: "grid", gap: 12 }}>
                        <Field label="Päivä">
                          <Input type="date" value={cashflowForm.event_date} onChange={(e) => setCashflowForm({ ...cashflowForm, event_date: e.target.value })} />
                        </Field>
                        <Field label="Summa">
                          <Input type="number" value={cashflowForm.amount} onChange={(e) => setCashflowForm({ ...cashflowForm, amount: e.target.value })} />
                        </Field>
                        <Field label="Tyyppi">
                          <Select value={cashflowForm.type} onChange={(e) => setCashflowForm({ ...cashflowForm, type: e.target.value })}>
                            {CASHFLOW_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        </Field>
                        <Field label="Kuvaus">
                          <Input value={cashflowForm.description} onChange={(e) => setCashflowForm({ ...cashflowForm, description: e.target.value })} />
                        </Field>
                        <div style={{ display: "flex", gap: 10 }}>
                          <Btn type="submit">{busy.cashflow ? "Tallennetaan..." : "Tallenna kassavirta"}</Btn>
                          <Btn type="button" variant="ghost" onClick={resetCashflow}>Tyhjennä</Btn>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div style={sx.card}>
                    <Title eyebrow="Talousnäkymä" title="CRM + kirjanpito + mittarit" />

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
                      <Metric title="CRM-liikevaihto" value={eur(financeSummary.revenue)} sub="finance_monthly" accent />
                      <Metric title="CRM-kulut" value={eur(financeSummary.expenses)} sub="finance_monthly" />
                      <Metric title="CRM-tulos" value={eur(financeSummary.profit)} sub="finance_monthly" />
                      <Metric title="Kassavirta yhteensä" value={eur(financeSummary.cashflow)} sub="cashflow_events" />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
                      <Metric title="Pankki ja rahat" value={eur(latestAccounting?.cash_and_bank)} sub="kirjanpito" />
                      <Metric title="Omavaraisuusaste" value={`${round2(accountingMetrics.equityRatio)} %`} sub="equity / assets" />
                      <Metric title="Current ratio" value={round2(accountingMetrics.currentRatio)} sub="cash + receivables / payables" />
                      <Metric title="Kassapuskuri" value={`${round2(accountingMetrics.cashRunwayMonths)} kk`} sub="cash / monthly burn" />
                      <Metric title="Liikevoittomarginaali" value={`${round2(accountingMetrics.operatingMargin)} %`} sub="operating profit / revenue" />
                    </div>

                    {aiAnalysisResult?.analysis && (
                      <div
                        style={{
                          ...sx.cardDark,
                          marginBottom: 18,
                          background: "linear-gradient(180deg, rgba(32,23,44,.98), rgba(14,12,22,.98))",
                        }}
                      >
                        <Title eyebrow="AI analyysi" title={`Kuukausi ${aiAnalysisResult.data?.month || "-"}`} />

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginBottom: 12 }}>
                          <Metric title="Liikevaihto" value={eur(aiAnalysisResult.data?.revenue)} sub="AI tulkittu" />
                          <Metric title="Liiketulos" value={eur(aiAnalysisResult.data?.operating_profit)} sub="AI tulkittu" />
                          <Metric title="Pankki" value={eur(aiAnalysisResult.data?.cash_and_bank)} sub="AI tulkittu" />
                          <Metric title="Oma pääoma" value={eur(aiAnalysisResult.data?.equity)} sub="AI tulkittu" />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginBottom: 16 }}>
                          <Metric title="Omavaraisuusaste" value={`${aiAnalysisResult.analysis.equity_ratio_pct} %`} sub="AI analyysi" />
                          <Metric title="Current ratio" value={aiAnalysisResult.analysis.current_ratio} sub="AI analyysi" />
                          <Metric title="Kassapuskuri" value={`${aiAnalysisResult.analysis.cash_runway_months} kk`} sub="AI analyysi" />
                          <Metric title="Liikevoittomarginaali" value={`${aiAnalysisResult.analysis.operating_margin_pct} %`} sub="AI analyysi" />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                          <div style={sx.card}>
                            <div style={{ fontWeight: 800, marginBottom: 10 }}>Vahvuudet</div>
                            <div style={{ display: "grid", gap: 8 }}>
                              {(aiAnalysisResult.analysis.strengths || []).length ? (
                                aiAnalysisResult.analysis.strengths.map((item, i) => (
                                  <div key={i} style={{ color: "#ccffe0" }}>• {item}</div>
                                ))
                              ) : (
                                <div style={{ color: "rgba(244,241,233,.65)" }}>Ei tunnistettuja vahvuuksia.</div>
                              )}
                            </div>
                          </div>

                          <div style={sx.card}>
                            <div style={{ fontWeight: 800, marginBottom: 10 }}>Varoitukset</div>
                            <div style={{ display: "grid", gap: 8 }}>
                              {(aiAnalysisResult.analysis.warnings || []).length ? (
                                aiAnalysisResult.analysis.warnings.map((item, i) => (
                                  <div key={i} style={{ color: "#ffd7df" }}>• {item}</div>
                                ))
                              ) : (
                                <div style={{ color: "#ccffe0" }}>Ei kriittisiä varoituksia.</div>
                              )}
                            </div>
                          </div>

                          <div style={sx.card}>
                            <div style={{ fontWeight: 800, marginBottom: 10 }}>Suositukset</div>
                            <div style={{ display: "grid", gap: 8 }}>
                              {(aiAnalysisResult.analysis.recommendations || []).map((item, i) => (
                                <div key={i} style={{ color: "#fff1c7" }}>• {item}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                      <div>
                        <h3 style={{ marginTop: 0 }}>Kirjanpidon aineistot</h3>
                        <Field label="Suodata kuukautta">
                          <Input value={accountingFilter} onChange={(e) => setAccountingFilter(e.target.value)} placeholder="2026-04" />
                        </Field>
                        <table style={sx.table}>
                          <thead>
                            <tr>
                              {["Kuukausi", "Tyyppi", "Lähde", "Tiedosto / linkki"].map((h) => (
                                <th key={h} style={sx.th}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {accountingDocuments
                              .filter((r) => !accountingFilter || String(r.month || "").includes(accountingFilter))
                              .map((r) => (
                                <tr key={r.id}>
                                  <td style={sx.td}>{r.month || "-"}</td>
                                  <td style={sx.td}>{r.document_type || "-"}</td>
                                  <td style={sx.td}>{r.source_system || "-"}</td>
                                  <td style={sx.td}>
                                    {r.file_url ? (
                                      <a href={r.file_url} target="_blank" rel="noreferrer" style={{ color: "#d9c98a" }}>
                                        {r.file_name || r.file_url}
                                      </a>
                                    ) : (
                                      r.file_name || "-"
                                    )}
                                  </td>
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
                        <Field label="Otsikko">
                          <Input value={calendarForm.title} onChange={(e) => setCalendarForm({ ...calendarForm, title: e.target.value })} />
                        </Field>
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
                        <Field label="Alkaa">
                          <Input type="datetime-local" value={calendarForm.start_at} onChange={(e) => setCalendarForm({ ...calendarForm, start_at: e.target.value })} />
                        </Field>
                        <Field label="Päättyy">
                          <Input type="datetime-local" value={calendarForm.end_at} onChange={(e) => setCalendarForm({ ...calendarForm, end_at: e.target.value })} />
                        </Field>
                        <Field label="Sijainti">
                          <Input value={calendarForm.location} onChange={(e) => setCalendarForm({ ...calendarForm, location: e.target.value })} />
                        </Field>
                        <div style={{ display: "flex", gap: 10 }}>
                          <Btn type="submit">{busy.calendar ? "Tallennetaan..." : "Tallenna tapahtuma"}</Btn>
                          <Btn type="button" variant="ghost" onClick={resetCalendar}>Tyhjennä</Btn>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div style={sx.card}>
                    <Title eyebrow="Lista" title="Kalenteritapahtumat" />
                    <Field label="Hae tapahtumia">
                      <Input value={calendarFilter} onChange={(e) => setCalendarFilter(e.target.value)} />
                    </Field>
                    <table style={sx.table}>
                      <thead>
                        <tr>
                          {["Aika", "Otsikko", "Tyyppi", "Status", "Asiakas"].map((h) => (
                            <th key={h} style={sx.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {calendarEvents
                          .filter((e) =>
                            !calendarFilter
                              ? true
                              : [e.title, e.event_type, e.status, e.location]
                                  .filter(Boolean)
                                  .some((v) => String(v).toLowerCase().includes(calendarFilter.toLowerCase()))
                          )
                          .map((e) => (
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
                        <Field label="Nimi">
                          <Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value, service_name: e.target.value })} />
                        </Field>
                        <Field label="Kategoria">
                          <Input value={templateForm.category} onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })} />
                        </Field>
                        <Field label="Yksikkö">
                          <Input value={templateForm.unit} onChange={(e) => setTemplateForm({ ...templateForm, unit: e.target.value })} />
                        </Field>
                        <Field label="Yksikköhinta ALV 0">
                          <Input type="number" value={templateForm.unit_price} onChange={(e) => setTemplateForm({ ...templateForm, unit_price: e.target.value })} />
                        </Field>
                        <Field label="ALV %">
                          <Input type="number" value={templateForm.vat_rate} onChange={(e) => setTemplateForm({ ...templateForm, vat_rate: e.target.value })} />
                        </Field>
                        <Field label="Kuvaus">
                          <TextArea value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} />
                        </Field>
                        <div style={{ display: "flex", gap: 10 }}>
                          <Btn type="submit">{busy.template ? "Tallennetaan..." : "Tallenna pohja"}</Btn>
                          <Btn type="button" variant="ghost" onClick={resetTemplate}>Tyhjennä</Btn>
                        </div>
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
                            <td style={sx.td}>{r.name || r.service_name}</td>
                            <td style={sx.td}>{r.category || "-"}</td>
                            <td style={sx.td}>{r.unit || "-"}</td>
                            <td style={sx.td}>{eur(r.unit_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ marginTop: 22 }}>
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
