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
const VALIDITY_PRESETS = ["10", "14", "21", "30", "oma"];
const CALENDAR_EVENT_TYPES = ["Kuvaus", "Palaveri", "Toimitus", "Seurantakäynti", "Muu"];
const CALENDAR_EVENT_STATUSES = ["Suunniteltu", "Vahvistettu", "Valmis", "Peruttu"];

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

const emptyContact = {
  id: null,
  client_id: "",
  name: "",
  email: "",
  phone: "",
  role: "",
  notes: "",
};

const emptyTask = {
  id: null,
  client_id: "",
  title: "",
  status: "Avoin",
  due_date: "",
  notes: "",
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
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const addDays = (dateLike, days) => {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
};

const ymKey = (dateLike) => {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return String(dateLike).slice(0, 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const pct = (value) => `${Math.round(value)}%`;

const normClientStatus = (s) =>
  CLIENT_STATUSES.find((x) => x.toLowerCase() === String(s || "").toLowerCase()) || "Liidi";

const normQuoteStatus = (s) =>
  QUOTE_STATUSES.find((x) => x.toLowerCase() === String(s || "").toLowerCase()) || "Luonnos";

const normInvoiceStatus = (s) =>
  INVOICE_STATUSES.find((x) => x.toLowerCase() === String(s || "").toLowerCase()) || "Ei laskutettu";

const traffic = (value, target) => {
  if (!target || target <= 0) return { label: "Ei tavoitetta", color: "#c8c8c8" };
  const ratio = value / target;
  if (ratio >= 1) return { label: "Vihreä", color: "#ccffe0" };
  if (ratio >= 0.7) return { label: "Keltainen", color: "#fff1c7" };
  return { label: "Punainen", color: "#ffd7df" };
};

const sx = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(90,49,132,.24), transparent 28%), radial-gradient(circle at top right, rgba(180,143,72,.08), transparent 22%), linear-gradient(180deg,#08070d 0%,#0c0a12 100%)",
    color: "#f4f1e9",
    fontFamily: 'Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif',
  },
  wrap: { maxWidth: 1700, margin: "0 auto", padding: "28px 20px 80px" },
  card: {
    background: "rgba(18,18,28,.92)",
    border: "1px solid rgba(231,223,178,.10)",
    borderRadius: 22,
    padding: 20,
  },
  cardDark: {
    background: "linear-gradient(180deg, rgba(23,20,34,.98), rgba(14,12,22,.98))",
    border: "1px solid rgba(231,223,178,.12)",
    borderRadius: 22,
    padding: 20,
  },
  hero: {
    background: "linear-gradient(135deg, rgba(29,22,43,.96), rgba(14,12,22,.98))",
    border: "1px solid rgba(231,223,178,.12)",
    borderRadius: 26,
    padding: 26,
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
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "rgba(244,241,233,.78)", marginBottom: 7 },
  btn: { padding: "11px 15px", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" },
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
      <div style={{ fontSize: 12, textTransform: "uppercase", color: "rgba(244,241,233,.72)", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 13, color: "rgba(244,241,233,.64)" }}>{sub}</div>
    </div>
  );
}

function StatPill({ label, good, warn, danger }) {
  const style = danger
    ? { color: "#ffd7df", background: "rgba(120,31,49,.18)", border: "1px solid rgba(255,93,129,.18)" }
    : warn
    ? { color: "#fff1c7", background: "rgba(217,201,138,.16)", border: "1px solid rgba(217,201,138,.18)" }
    : { color: "#ccffe0", background: "rgba(71,137,94,.18)", border: "1px solid rgba(125,212,156,.18)" };
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
  const [contacts, setContacts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [financeMonthly, setFinanceMonthly] = useState([]);
  const [cashflowEvents, setCashflowEvents] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [quoteLines, setQuoteLines] = useState([]);
  const [pricingTemplates, setPricingTemplates] = useState([]);
  const [importLogs, setImportLogs] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  const [clientForm, setClientForm] = useState(emptyClient);
  const [contactForm, setContactForm] = useState(emptyContact);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [quoteForm, setQuoteForm] = useState({
    ...emptyQuote,
    issue_date: today(),
    valid_until: addDays(today(), 14),
  });
  const [quoteDraftLines, setQuoteDraftLines] = useState([
    { id: "d1", description: "", quantity: 1, unit_price: 0, sort_order: 1 },
  ]);
  const [financeForm, setFinanceForm] = useState({ ...emptyFinance, target: MONTHLY_TARGET_DEFAULT });
  const [cashflowForm, setCashflowForm] = useState({ ...emptyCashflow, event_date: today() });
  const [templateForm, setTemplateForm] = useState(emptyTemplate);
  const [calendarForm, setCalendarForm] = useState({
    ...emptyCalendarEvent,
    start_at: nowLocalInput(),
    end_at: nowLocalInput(),
  });

  const [crmSearch, setCrmSearch] = useState("");
  const [crmStatusFilter, setCrmStatusFilter] = useState("Kaikki");
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quoteStatusFilter, setQuoteStatusFilter] = useState("Kaikki");
  const [financeFilter, setFinanceFilter] = useState("");
  const [cashflowFilter, setCashflowFilter] = useState("Kaikki");
  const [templateFilter, setTemplateFilter] = useState("");
  const [importFilter, setImportFilter] = useState("");
  const [calendarFilter, setCalendarFilter] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(null);

  const [busy, setBusy] = useState({
    client: false,
    contact: false,
    task: false,
    quote: false,
    finance: false,
    cashflow: false,
    template: false,
    calendar: false,
    generatingQuoteNumber: false,
    invoicingQuoteId: null,
    deletingClientId: null,
    deletingContactId: null,
    deletingTaskId: null,
    deletingQuoteId: null,
    deletingFinanceId: null,
    deletingCashflowId: null,
    deletingTemplateId: null,
    deletingCalendarId: null,
    kanbanId: null,
  });
	    async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [a, b, c, d, e, f, g, h, i, j] = await Promise.all([
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
        supabase.from("contacts").select("*").order("created_at", { ascending: false }),
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("finance_monthly").select("*").order("month", { ascending: false }),
        supabase.from("cashflow_events").select("*").order("event_date", { ascending: false }),
        supabase.from("quotes").select("*").order("created_at", { ascending: false }),
        supabase.from("quote_lines").select("*").order("sort_order", { ascending: true }),
        supabase.from("pricing_templates").select("*").order("created_at", { ascending: false }),
        supabase.from("import_logs").select("*").order("imported_at", { ascending: false }),
        supabase.from("calendar_events").select("*").order("start_at", { ascending: true }),
      ]);

      for (const r of [a, b, c, d, e, f, g, h, i, j]) {
        if (r.error) throw r.error;
      }

      setClients((a.data || []).map((x) => ({ ...x, status: normClientStatus(x.status) })));
      setContacts(b.data || []);
      setTasks(c.data || []);
      setFinanceMonthly(d.data || []);
      setCashflowEvents(e.data || []);
      setQuotes((f.data || []).map((x) => ({
        ...x,
        status: normQuoteStatus(x.status),
        invoice_status: normInvoiceStatus(x.invoice_status),
      })));
      setQuoteLines(g.data || []);
      setPricingTemplates(h.data || []);
      setImportLogs(i.data || []);
      setCalendarEvents(j.data || []);

      if (!selectedQuoteId && f.data?.length) setSelectedQuoteId(f.data[0].id);
      if (!selectedClientId && a.data?.length) setSelectedClientId(a.data[0].id);
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

  const quotesEnriched = useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c]));
    return quotes.map((q) => ({
      ...q,
      client: clientMap.get(q.client_id) || null,
      lines: quoteLines
        .filter((l) => l.quote_id === q.id)
        .sort((a, b) => num(a.sort_order) - num(b.sort_order)),
    }));
  }, [quotes, quoteLines, clients]);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const quoteMap = useMemo(() => new Map(quotes.map((q) => [q.id, q])), [quotes]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const selectedClientContacts = useMemo(
    () => contacts.filter((x) => x.client_id === selectedClientId),
    [contacts, selectedClientId]
  );

  const selectedClientTasks = useMemo(
    () => tasks.filter((x) => x.client_id === selectedClientId),
    [tasks, selectedClientId]
  );

  const selectedClientQuotes = useMemo(
    () => quotesEnriched.filter((x) => x.client_id === selectedClientId),
    [quotesEnriched, selectedClientId]
  );

  const selectedQuote = useMemo(
    () => quotesEnriched.find((q) => q.id === selectedQuoteId) || null,
    [quotesEnriched, selectedQuoteId]
  );

  const dashboard = useMemo(() => {
    const openTasks = tasks.filter((t) =>
      typeof t.completed === "boolean"
        ? !t.completed
        : !["done", "completed", "valmis"].includes(String(t.status || "").toLowerCase())
    ).length;

    const overdueTasks = tasks.filter((t) => {
      if (!t.due_date) return false;
      const done =
        typeof t.completed === "boolean"
          ? t.completed
          : ["done", "completed", "valmis"].includes(String(t.status || "").toLowerCase());
      return new Date(t.due_date) < new Date() && !done;
    }).length;

    const latestMonth = financeMonthly[0] || null;
    const latestRevenue = num(latestMonth?.revenue);
    const latestExpenses = num(latestMonth?.expenses);
    const latestProfit =
      latestMonth?.profit !== null && latestMonth?.profit !== undefined
        ? num(latestMonth.profit)
        : latestRevenue - latestExpenses;
    const latestTarget = num(latestMonth?.target || MONTHLY_TARGET_DEFAULT);

    const next30Cashflow = cashflowEvents
      .filter((e) => {
        if (!e.event_date) return false;
        const d = new Date(e.event_date);
        const now = new Date();
        const to = new Date();
        to.setDate(now.getDate() + 30);
        return d >= now && d <= to;
      })
      .reduce((s, e) => s + num(e.amount), 0);

    const quotePipeline = quotesEnriched
      .filter((q) => ["luonnos", "lähetetty"].includes(String(q.status || "").toLowerCase()))
      .reduce((s, q) => s + num(q.total), 0);

    const quoteWon = quotesEnriched
      .filter((q) => String(q.status || "").toLowerCase() === "hyväksytty")
      .reduce((s, q) => s + num(q.total), 0);

    const quoteLost = quotesEnriched
      .filter((q) => ["hylätty", "vanhentunut"].includes(String(q.status || "").toLowerCase()))
      .reduce((s, q) => s + num(q.total), 0);

    const monthNow = ymKey(new Date());
    const monthRevenue =
      financeMonthly.find((x) => String(x.month || "") === monthNow)?.revenue ?? 0;
    const monthTarget =
      financeMonthly.find((x) => String(x.month || "") === monthNow)?.target ??
      MONTHLY_TARGET_DEFAULT;
    const monthTraffic = traffic(num(monthRevenue), num(monthTarget));

    const forecastMap = {};
    cashflowEvents.forEach((e) => {
      const key = ymKey(e.event_date);
      if (!key) return;
      forecastMap[key] = (forecastMap[key] || 0) + num(e.amount);
    });

    const forecastRows = Object.entries(forecastMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, amount]) => ({ month, amount }));

    const calendarNext = calendarEvents
      .filter((x) => x.start_at && new Date(x.start_at) >= new Date())
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
      .slice(0, 6);

    return {
      totalClients: clients.length,
      wonClients: clients.filter((c) => String(c.status || "").toLowerCase() === "voitettu").length,
      openTasks,
      overdueTasks,
      latestRevenue,
      latestExpenses,
      latestProfit,
      latestTarget,
      next30Cashflow,
      openQuotes: quotes.filter((q) =>
        ["luonnos", "lähetetty"].includes(String(q.status || "").toLowerCase())
      ).length,
      quotePipeline,
      quoteWon,
      quoteLost,
      monthRevenue: num(monthRevenue),
      monthTarget: num(monthTarget),
      monthTraffic,
      forecastRows,
      calendarNext,
    };
  }, [clients, tasks, financeMonthly, cashflowEvents, quotes, quotesEnriched, calendarEvents]);

  const filteredClients = useMemo(() => {
    const q = crmSearch.trim().toLowerCase();
    return clients.filter((c) => {
      const okSearch =
        !q ||
        [c.name, c.company_name, c.email, c.phone, c.city, c.business_id, c.notes]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      const okStatus =
        crmStatusFilter === "Kaikki" || normClientStatus(c.status) === crmStatusFilter;
      return okSearch && okStatus;
    });
  }, [clients, crmSearch, crmStatusFilter]);

  const kanban = useMemo(() => {
    const m = Object.fromEntries(CLIENT_STATUSES.map((s) => [s, []]));
    clients.forEach((c) => (m[normClientStatus(c.status)] ||= []).push(c));
    return m;
  }, [clients]);
	    const filteredQuotes = useMemo(() => {
    const q = quoteSearch.trim().toLowerCase();
    return quotesEnriched.filter((x) => {
      const okSearch =
        !q ||
        [
          x.quote_number,
          x.title,
          x.notes,
          x.client?.name,
          x.client?.company_name,
          x.invoice_number,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      const okStatus =
        quoteStatusFilter === "Kaikki" || normQuoteStatus(x.status) === quoteStatusFilter;
      return okSearch && okStatus;
    });
  }, [quotesEnriched, quoteSearch, quoteStatusFilter]);

  const quoteTotals = useMemo(() => {
    const subtotal = quoteDraftLines.reduce(
      (s, l) => s + num(l.quantity) * num(l.unit_price),
      0
    );
    const vatAmount = subtotal * (num(quoteForm.vat_rate) / 100);
    return { subtotal, vatAmount, total: subtotal + vatAmount };
  }, [quoteDraftLines, quoteForm.vat_rate]);

  const filteredFinance = useMemo(
    () =>
      financeMonthly.filter(
        (r) => !financeFilter || String(r.month || "").includes(financeFilter)
      ),
    [financeMonthly, financeFilter]
  );

  const filteredCashflow = useMemo(
    () =>
      cashflowEvents.filter(
        (r) => cashflowFilter === "Kaikki" || String(r.type || "") === cashflowFilter
      ),
    [cashflowEvents, cashflowFilter]
  );

  const filteredTemplates = useMemo(() => {
    const q = templateFilter.trim().toLowerCase();
    return !q
      ? pricingTemplates
      : pricingTemplates.filter((t) =>
          [t.name, t.service_name, t.category, t.description, t.unit]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        );
  }, [pricingTemplates, templateFilter]);

  const filteredImports = useMemo(() => {
    const q = importFilter.trim().toLowerCase();
    return !q
      ? importLogs
      : importLogs.filter((x) =>
          [x.import_type, x.source_name, x.status, x.message]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        );
  }, [importLogs, importFilter]);

  const filteredCalendar = useMemo(() => {
    const q = calendarFilter.trim().toLowerCase();
    return calendarEvents.filter((e) => {
      if (!q) return true;
      return [e.title, e.event_type, e.status, e.location, e.notes]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [calendarEvents, calendarFilter]);

  const financeSummary = useMemo(
    () => ({
      revenue: filteredFinance.reduce((s, r) => s + num(r.revenue), 0),
      expenses: filteredFinance.reduce((s, r) => s + num(r.expenses), 0),
      profit: filteredFinance.reduce(
        (s, r) =>
          s +
          (r.profit !== null && r.profit !== undefined
            ? num(r.profit)
            : num(r.revenue) - num(r.expenses)),
        0
      ),
      target: filteredFinance.reduce((s, r) => s + num(r.target), 0),
      cashflow: filteredCashflow.reduce((s, r) => s + num(r.amount), 0),
    }),
    [filteredFinance, filteredCashflow]
  );

  const resetClient = () => setClientForm(emptyClient);
  const resetContact = () => setContactForm({ ...emptyContact, client_id: selectedClientId || "" });
  const resetTask = () =>
    setTaskForm({ ...emptyTask, client_id: selectedClientId || "", due_date: today() });
  const resetQuote = () => {
    const baseDate = today();
    setQuoteForm({
      ...emptyQuote,
      issue_date: baseDate,
      valid_until: addDays(baseDate, 14),
      client_id: selectedClientId || "",
    });
    setQuoteDraftLines([
      { id: `d-${Date.now()}`, description: "", quantity: 1, unit_price: 0, sort_order: 1 },
    ]);
  };
  const resetFinance = () => setFinanceForm({ ...emptyFinance, target: MONTHLY_TARGET_DEFAULT });
  const resetCashflow = () => setCashflowForm({ ...emptyCashflow, event_date: today() });
  const resetTemplate = () => setTemplateForm(emptyTemplate);
  const resetCalendar = () =>
    setCalendarForm({
      ...emptyCalendarEvent,
      client_id: selectedClientId || "",
      start_at: nowLocalInput(),
      end_at: nowLocalInput(),
    });

  function fillClient(c) {
    setClientForm({ ...emptyClient, ...c, status: normClientStatus(c.status) });
    setSelectedClientId(c.id);
    setView("crm");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fillQuote(q) {
    const qvd = q.quote_valid_days ? String(q.quote_valid_days) : "14";
    setQuoteForm({
      id: q.id,
      client_id: q.client_id || "",
      quote_number: q.quote_number || "",
      title: q.title || "",
      status: normQuoteStatus(q.status),
      issue_date: q.issue_date ? String(q.issue_date).slice(0, 10) : "",
      valid_until: q.valid_until ? String(q.valid_until).slice(0, 10) : "",
      quote_valid_days: q.quote_valid_days ?? 14,
      validityPreset: VALIDITY_PRESETS.includes(qvd) ? qvd : "oma",
      vat_rate: num(q.vat_rate ?? VAT_DEFAULT),
      is_b2b: q.is_b2b ?? true,
      vat_included: q.vat_included ?? false,
      payment_terms_days: q.payment_terms_days ?? 14,
      invoice_status: normInvoiceStatus(q.invoice_status),
      invoice_number: q.invoice_number || "",
      invoice_date: q.invoice_date ? String(q.invoice_date).slice(0, 10) : "",
      expected_payment_date: q.expected_payment_date
        ? String(q.expected_payment_date).slice(0, 10)
        : "",
      notes: q.notes || "",
    });

    setQuoteDraftLines(
      (q.lines || []).length
        ? q.lines.map((l, i) => ({
            id: l.id,
            description: l.description || "",
            quantity: num(l.quantity),
            unit_price: num(l.unit_price),
            sort_order: num(l.sort_order || i + 1),
          }))
        : [{ id: `d-${Date.now()}`, description: "", quantity: 1, unit_price: 0, sort_order: 1 }]
    );

    setSelectedQuoteId(q.id);
    setView("quotes");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fillContact(c) {
    setContactForm({ ...emptyContact, ...c });
  }

  function fillTask(t) {
    setTaskForm({
      ...emptyTask,
      ...t,
      due_date: t.due_date ? String(t.due_date).slice(0, 10) : "",
    });
  }

  function fillCalendar(e) {
    setCalendarForm({
      ...emptyCalendarEvent,
      ...e,
      start_at: e.start_at ? String(e.start_at).slice(0, 16) : nowLocalInput(),
      end_at: e.end_at ? String(e.end_at).slice(0, 16) : nowLocalInput(),
    });
    setView("calendar");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function generateQuoteNumber() {
    setBusy((b) => ({ ...b, generatingQuoteNumber: true }));
    setError("");
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
      setQuoteForm((prev) => ({ ...prev, validityPreset: preset }));
      return;
    }
    const days = Number(preset);
    setQuoteForm((prev) => ({
      ...prev,
      validityPreset: preset,
      quote_valid_days: days,
      valid_until: prev.issue_date ? addDays(prev.issue_date, days) : "",
    }));
  }

  function updateIssueDate(date) {
    setQuoteForm((prev) => {
      const next = { ...prev, issue_date: date };
      if (prev.validityPreset !== "oma") {
        next.valid_until = date ? addDays(date, prev.quote_valid_days || 14) : "";
      }
      return next;
    });
  }
	    async function saveClient(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, client: true }));
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: clientForm.name?.trim() || null,
        company_name: clientForm.company_name?.trim() || null,
        email: clientForm.email?.trim() || null,
        phone: clientForm.phone?.trim() || null,
        city: clientForm.city?.trim() || null,
        business_id: clientForm.business_id?.trim() || null,
        status: clientForm.status || "Liidi",
        notes: clientForm.notes?.trim() || null,
        finder_url: clientForm.finder_url?.trim() || null,
        asiakastieto_url: clientForm.asiakastieto_url?.trim() || null,
        linkedin_url: clientForm.linkedin_url?.trim() || null,
        updated_at: new Date().toISOString(),
      };
      if (!payload.name) throw new Error("Asiakkaan nimi on pakollinen.");

      const r = clientForm.id
        ? await supabase.from("clients").update(payload).eq("id", clientForm.id)
        : await supabase
            .from("clients")
            .insert({ ...payload, created_at: new Date().toISOString() })
            .select()
            .single();

      if (r.error) throw r.error;

      const newId = clientForm.id || r.data?.id;
      if (newId) setSelectedClientId(newId);

      setSuccess(clientForm.id ? "Asiakas päivitetty." : "Asiakas lisätty.");
      resetClient();
      await loadData();
    } catch (err) {
      setError(err.message || "Tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, client: false }));
    }
  }

  async function removeClient(id) {
    if (!window.confirm("Poistetaanko asiakas varmasti?")) return;
    setBusy((b) => ({ ...b, deletingClientId: id }));
    setError("");
    setSuccess("");
    try {
      const r = await supabase.from("clients").delete().eq("id", id);
      if (r.error) throw r.error;

      if (selectedClientId === id) setSelectedClientId(null);
      if (clientForm.id === id) resetClient();

      setSuccess("Asiakas poistettu.");
      await loadData();
    } catch (err) {
      setError(err.message || "Poisto epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, deletingClientId: null }));
    }
  }

  async function changeClientStatus(id, status) {
    setBusy((b) => ({ ...b, kanbanId: id }));
    setError("");
    setSuccess("");
    try {
      const r = await supabase
        .from("clients")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (r.error) throw r.error;

      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      setSuccess("Status päivitetty.");
    } catch (err) {
      setError(err.message || "Statuksen päivitys epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, kanbanId: null }));
    }
  }

  async function saveContact(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, contact: true }));
    setError("");
    setSuccess("");
    try {
      if (!contactForm.client_id) throw new Error("Valitse asiakas kontaktille.");
      if (!contactForm.name?.trim()) throw new Error("Kontaktin nimi on pakollinen.");

      const payload = {
        client_id: contactForm.client_id,
        name: contactForm.name?.trim(),
        email: contactForm.email?.trim() || null,
        phone: contactForm.phone?.trim() || null,
        role: contactForm.role?.trim() || null,
        notes: contactForm.notes?.trim() || null,
      };

      const r = contactForm.id
        ? await supabase.from("contacts").update(payload).eq("id", contactForm.id)
        : await supabase.from("contacts").insert({ ...payload, created_at: new Date().toISOString() });

      if (r.error) throw r.error;

      setSuccess(contactForm.id ? "Kontakti päivitetty." : "Kontakti lisätty.");
      resetContact();
      await loadData();
    } catch (err) {
      setError(err.message || "Kontaktin tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, contact: false }));
    }
  }

  async function removeContact(id) {
    if (!window.confirm("Poistetaanko kontakti varmasti?")) return;
    setBusy((b) => ({ ...b, deletingContactId: id }));
    try {
      const r = await supabase.from("contacts").delete().eq("id", id);
      if (r.error) throw r.error;

      if (contactForm.id === id) resetContact();

      setSuccess("Kontakti poistettu.");
      await loadData();
    } catch (err) {
      setError(err.message || "Kontaktin poisto epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, deletingContactId: null }));
    }
  }

  async function saveTask(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, task: true }));
    setError("");
    setSuccess("");
    try {
      if (!taskForm.client_id) throw new Error("Valitse asiakkaalle tehtävä.");
      if (!taskForm.title?.trim()) throw new Error("Tehtävän otsikko on pakollinen.");

      const payload = {
        client_id: taskForm.client_id,
        title: taskForm.title?.trim(),
        status: taskForm.status || "Avoin",
        due_date: taskForm.due_date || null,
        notes: taskForm.notes?.trim() || null,
      };

      const r = taskForm.id
        ? await supabase.from("tasks").update(payload).eq("id", taskForm.id)
        : await supabase.from("tasks").insert({ ...payload, created_at: new Date().toISOString() });

      if (r.error) throw r.error;

      setSuccess(taskForm.id ? "Tehtävä päivitetty." : "Tehtävä lisätty.");
      resetTask();
      await loadData();
    } catch (err) {
      setError(err.message || "Tehtävän tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, task: false }));
    }
  }

  async function removeTask(id) {
    if (!window.confirm("Poistetaanko tehtävä varmasti?")) return;
    setBusy((b) => ({ ...b, deletingTaskId: id }));
    try {
      const r = await supabase.from("tasks").delete().eq("id", id);
      if (r.error) throw r.error;

      if (taskForm.id === id) resetTask();

      setSuccess("Tehtävä poistettu.");
      await loadData();
    } catch (err) {
      setError(err.message || "Tehtävän poisto epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, deletingTaskId: null }));
    }
  }

  const addDraftLine = () =>
    setQuoteDraftLines((prev) => [
      ...prev,
      {
        id: `d-${Date.now()}-${prev.length + 1}`,
        description: "",
        quantity: 1,
        unit_price: 0,
        sort_order: prev.length + 1,
      },
    ]);

  const updateDraftLine = (id, key, value) =>
    setQuoteDraftLines((prev) => prev.map((l) => (l.id === id ? { ...l, [key]: value } : l)));

  const removeDraftLine = (id) =>
    setQuoteDraftLines((prev) => {
      const next = prev
        .filter((l) => l.id !== id)
        .map((l, i) => ({ ...l, sort_order: i + 1 }));
      return next.length
        ? next
        : [{ id: `d-${Date.now()}`, description: "", quantity: 1, unit_price: 0, sort_order: 1 }];
    });

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
	    async function saveQuote(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, quote: true }));
    setError("");
    setSuccess("");
    try {
      if (!quoteForm.client_id) throw new Error("Valitse asiakkaalle tarjous.");
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

      const subtotal = lines.reduce((s, l) => s + l.line_total, 0);
      const vat_rate = num(quoteForm.vat_rate);
      const vat_amount = subtotal * (vat_rate / 100);
      const total = subtotal + vat_amount;

      const payload = {
        client_id: quoteForm.client_id,
        quote_number: quoteForm.quote_number?.trim() || null,
        title: quoteForm.title?.trim(),
        status: quoteForm.status || "Luonnos",
        issue_date: quoteForm.issue_date || null,
        valid_until: quoteForm.valid_until || null,
        quote_valid_days: num(quoteForm.quote_valid_days || 14),
        vat_rate,
        is_b2b: !!quoteForm.is_b2b,
        vat_included: !!quoteForm.vat_included,
        payment_terms_days: num(quoteForm.payment_terms_days || 14),
        invoice_status: quoteForm.invoice_status || "Ei laskutettu",
        invoice_number: quoteForm.invoice_number?.trim() || null,
        invoice_date: quoteForm.invoice_date || null,
        expected_payment_date:
          quoteForm.expected_payment_date ||
          addDays(
            quoteForm.invoice_date || quoteForm.issue_date || today(),
            quoteForm.payment_terms_days || 14
          ),
        subtotal,
        vat_amount,
        total,
        notes: quoteForm.notes?.trim() || null,
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

      setSelectedQuoteId(quoteId);
      setSuccess(quoteForm.id ? "Tarjous päivitetty." : "Tarjous luotu.");
      resetQuote();
      await loadData();
    } catch (err) {
      setError(err.message || "Tarjouksen tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, quote: false }));
    }
  }

  async function removeQuote(id) {
    if (!window.confirm("Poistetaanko tarjous varmasti?")) return;
    setBusy((b) => ({ ...b, deletingQuoteId: id }));
    try {
      const a = await supabase.from("quote_lines").delete().eq("quote_id", id);
      if (a.error) throw a.error;

      const b = await supabase.from("quotes").delete().eq("id", id);
      if (b.error) throw b.error;

      if (selectedQuoteId === id) setSelectedQuoteId(null);
      if (quoteForm.id === id) resetQuote();

      setSuccess("Tarjous poistettu.");
      await loadData();
    } catch (err) {
      setError(err.message || "Poisto epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, deletingQuoteId: null }));
    }
  }

  async function changeQuoteStatus(id, status) {
    setError("");
    setSuccess("");
    try {
      const r = await supabase
        .from("quotes")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (r.error) throw r.error;

      setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
      setSuccess("Tarjouksen status päivitetty.");
      await loadData();
    } catch (err) {
      setError(err.message || "Statuksen päivitys epäonnistui.");
    }
  }

  async function invoiceQuote(id) {
    setBusy((b) => ({ ...b, invoicingQuoteId: id }));
    setError("");
    setSuccess("");
    try {
      const { data, error } = await supabase.rpc("invoice_quote", { p_quote_id: id });
      if (error) throw error;

      setSuccess(
        data?.invoice_number
          ? `Tarjous laskutettu: ${data.invoice_number}`
          : "Tarjous laskutettu."
      );
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
    setError("");
    setSuccess("");
    try {
      const revenue = num(financeForm.revenue);
      const expenses = num(financeForm.expenses);

      const payload = {
        month: financeForm.month || null,
        revenue,
        expenses,
        profit: financeForm.profit !== "" ? num(financeForm.profit) : revenue - expenses,
        target: num(financeForm.target || MONTHLY_TARGET_DEFAULT),
        notes: financeForm.notes?.trim() || null,
      };

      if (!payload.month) throw new Error("Kuukausi on pakollinen.");

      const r = financeForm.id
        ? await supabase.from("finance_monthly").update(payload).eq("id", financeForm.id)
        : await supabase
            .from("finance_monthly")
            .insert({ ...payload, created_at: new Date().toISOString() });

      if (r.error) throw r.error;

      setSuccess(financeForm.id ? "Kuukausirivi päivitetty." : "Kuukausirivi lisätty.");
      resetFinance();
      await loadData();
    } catch (err) {
      setError(err.message || "Tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, finance: false }));
    }
  }

  async function removeFinance(id) {
    if (!window.confirm("Poistetaanko kuukausirivi varmasti?")) return;
    setBusy((b) => ({ ...b, deletingFinanceId: id }));
    try {
      const r = await supabase.from("finance_monthly").delete().eq("id", id);
      if (r.error) throw r.error;

      if (financeForm.id === id) resetFinance();

      setSuccess("Kuukausirivi poistettu.");
      await loadData();
    } catch (err) {
      setError(err.message || "Poisto epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, deletingFinanceId: null }));
    }
  }

  async function saveCashflow(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, cashflow: true }));
    setError("");
    setSuccess("");
    try {
      const payload = {
        event_date: cashflowForm.event_date || null,
        amount: num(cashflowForm.amount),
        type: cashflowForm.type || "Tulo",
        description: cashflowForm.description?.trim() || null,
        notes: cashflowForm.notes?.trim() || null,
      };

      if (!payload.event_date) throw new Error("Tapahtumapäivä on pakollinen.");
      if (!payload.description) throw new Error("Kuvaus on pakollinen.");

      const r = cashflowForm.id
        ? await supabase.from("cashflow_events").update(payload).eq("id", cashflowForm.id)
        : await supabase
            .from("cashflow_events")
            .insert({ ...payload, created_at: new Date().toISOString() });

      if (r.error) throw r.error;

      setSuccess(cashflowForm.id ? "Kassavirtarivi päivitetty." : "Kassavirtarivi lisätty.");
      resetCashflow();
      await loadData();
    } catch (err) {
      setError(err.message || "Tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, cashflow: false }));
    }
  }

  async function removeCashflow(id) {
    if (!window.confirm("Poistetaanko kassavirtarivi varmasti?")) return;
    setBusy((b) => ({ ...b, deletingCashflowId: id }));
    try {
      const r = await supabase.from("cashflow_events").delete().eq("id", id);
      if (r.error) throw r.error;

      if (cashflowForm.id === id) resetCashflow();

      setSuccess("Kassavirtarivi poistettu.");
      await loadData();
    } catch (err) {
      setError(err.message || "Poisto epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, deletingCashflowId: null }));
    }
  }
	    async function saveTemplate(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, template: true }));
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: templateForm.name?.trim() || templateForm.service_name?.trim() || null,
        service_name: templateForm.service_name?.trim() || templateForm.name?.trim() || null,
        category: templateForm.category?.trim() || null,
        unit: templateForm.unit?.trim() || "kpl",
        unit_price: num(templateForm.unit_price),
        vat_rate: num(templateForm.vat_rate || VAT_DEFAULT),
        is_active: !!templateForm.is_active,
        description: templateForm.description?.trim() || null,
      };

      if (!payload.name && !payload.service_name)
        throw new Error("Hinnoittelupohjan nimi on pakollinen.");

      const r = templateForm.id
        ? await supabase.from("pricing_templates").update(payload).eq("id", templateForm.id)
        : await supabase
            .from("pricing_templates")
            .insert({ ...payload, created_at: new Date().toISOString() });

      if (r.error) throw r.error;

      setSuccess(templateForm.id ? "Hinnoittelupohja päivitetty." : "Hinnoittelupohja lisätty.");
      resetTemplate();
      await loadData();
    } catch (err) {
      setError(err.message || "Tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, template: false }));
    }
  }

  async function removeTemplate(id) {
    if (!window.confirm("Poistetaanko hinnoittelupohja varmasti?")) return;
    setBusy((b) => ({ ...b, deletingTemplateId: id }));
    try {
      const r = await supabase.from("pricing_templates").delete().eq("id", id);
      if (r.error) throw r.error;

      if (templateForm.id === id) resetTemplate();

      setSuccess("Hinnoittelupohja poistettu.");
      await loadData();
    } catch (err) {
      setError(err.message || "Poisto epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, deletingTemplateId: null }));
    }
  }

  async function saveCalendarEvent(e) {
    e.preventDefault();
    setBusy((b) => ({ ...b, calendar: true }));
    setError("");
    setSuccess("");
    try {
      if (!calendarForm.title?.trim()) throw new Error("Kalenteritapahtuman otsikko on pakollinen.");
      if (!calendarForm.start_at || !calendarForm.end_at)
        throw new Error("Alku- ja loppuaika ovat pakolliset.");

      const payload = {
        client_id: calendarForm.client_id || null,
        quote_id: calendarForm.quote_id || null,
        title: calendarForm.title?.trim(),
        event_type: calendarForm.event_type || "Kuvaus",
        status: calendarForm.status || "Suunniteltu",
        start_at: new Date(calendarForm.start_at).toISOString(),
        end_at: new Date(calendarForm.end_at).toISOString(),
        location: calendarForm.location?.trim() || null,
        notes: calendarForm.notes?.trim() || null,
      };

      const r = calendarForm.id
        ? await supabase.from("calendar_events").update(payload).eq("id", calendarForm.id)
        : await supabase
            .from("calendar_events")
            .insert({
              ...payload,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

      if (r.error) throw r.error;

      setSuccess(calendarForm.id ? "Kalenteritapahtuma päivitetty." : "Kalenteritapahtuma lisätty.");
      resetCalendar();
      await loadData();
    } catch (err) {
      setError(err.message || "Kalenteritapahtuman tallennus epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, calendar: false }));
    }
  }

  async function removeCalendarEvent(id) {
    if (!window.confirm("Poistetaanko kalenteritapahtuma varmasti?")) return;
    setBusy((b) => ({ ...b, deletingCalendarId: id }));
    try {
      const r = await supabase.from("calendar_events").delete().eq("id", id);
      if (r.error) throw r.error;

      if (calendarForm.id === id) resetCalendar();

      setSuccess("Kalenteritapahtuma poistettu.");
      await loadData();
    } catch (err) {
      setError(err.message || "Kalenteritapahtuman poisto epäonnistui.");
    } finally {
      setBusy((b) => ({ ...b, deletingCalendarId: null }));
    }
  }

  return (
    <div style={sx.page}>
      <div style={sx.wrap}>
        <header style={{ marginBottom: 22 }}>
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
              SALOPINO CRM / TALOUSOHJAUS V5
            </div>
            <h1 style={{ margin: "0 0 10px", fontSize: 42, lineHeight: 1.05, fontWeight: 900 }}>
              Korjattu runko
            </h1>
            <p style={{ margin: 0, color: "rgba(244,241,233,.74)", fontSize: 16, lineHeight: 1.7 }}>
              Tämä versio on tarkoituksella build-varma pohja. Se sisältää kaiken logiikan, mutta JSX on
              nyt tiiviisti korjattu, jotta Vercel-build menee läpi ilman tagivirheitä.
            </p>
          </div>
        </header>

        {(error || success) && (
          <div
            style={{
              marginBottom: 16,
              padding: "14px 16px",
              borderRadius: 14,
              border: error
                ? "1px solid rgba(255,120,120,.24)"
                : "1px solid rgba(144,220,167,.22)",
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
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14 }}>
              <Metric title="Asiakkaita" value={clients.length} sub="clients" accent />
              <Metric title="Tarjoukset" value={quotes.length} sub="quotes" />
              <Metric title="Kalenterit" value={calendarEvents.length} sub="calendar_events" />
              <Metric title="Kassavirta" value={eur(cashflowEvents.reduce((s, r) => s + num(r.amount), 0))} sub="cashflow_events" />
            </div>

            <div style={sx.card}>
              <Title eyebrow="Tila" title="Build-kelpoinen V5-pohja" />
              <div style={{ lineHeight: 1.8, color: "rgba(244,241,233,.78)" }}>
                <div>Asiakasvalinta: {selectedClient?.name || "-"}</div>
                <div>Tarjousvalinta: {selectedQuote?.title || "-"}</div>
                <div>Tarjouskanta: {eur(dashboard.quotePipeline)}</div>
                <div>Voitetut tarjoukset: {eur(dashboard.quoteWon)}</div>
                <div>Hävityt tarjoukset: {eur(dashboard.quoteLost)}</div>
                <div>Kuukauden liikennevalo: {dashboard.monthTraffic.label}</div>
              </div>
            </div>

            <div style={sx.card}>
              <Title eyebrow="Seuraava askel" title="Näkymät takaisin hallitusti" />
              <div style={{ lineHeight: 1.8, color: "rgba(244,241,233,.78)" }}>
                Tässä tiedostossa kaikki data-, lomake- ja Supabase-logiikka on mukana.
                Koska edellinen virhe tuli JSX-rakenteen rikkoutumisesta, seuraava turvallinen vaihe on
                palauttaa näkymät osio kerrallaan tähän buildaavaan pohjaan.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
