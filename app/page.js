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
const VAT_DEFAULT = 25.5;
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
  vat_rate: VAT_DEFAULT,
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
  category: "",
  unit: "kpl",
  unit_price: "",
  vat_rate: VAT_DEFAULT,
  is_active: true,
  description: "",
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

const normClientStatus = (s) =>
  CLIENT_STATUSES.find((x) => x.toLowerCase() === String(s || "").toLowerCase()) || "Liidi";

const normQuoteStatus = (s) =>
  QUOTE_STATUSES.find((x) => x.toLowerCase() === String(s || "").toLowerCase()) || "Luonnos";

const ymKey = (dateLike) => {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return String(dateLike).slice(0, 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const pct = (value) => `${Math.round(value)}%`;

const traffic = (value, target) => {
  if (!target || target <= 0) {
    return { label: "Ei tavoitetta", color: "#c8c8c8", bg: "rgba(200,200,200,.10)" };
  }
  const ratio = value / target;
  if (ratio >= 1) return { label: "Vihreä", color: "#ccffe0", bg: "rgba(71,137,94,.18)" };
  if (ratio >= 0.7) return { label: "Keltainen", color: "#fff1c7", bg: "rgba(217,201,138,.16)" };
  return { label: "Punainen", color: "#ffd7df", bg: "rgba(120,31,49,.18)" };
};

const sx = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(90,49,132,.24), transparent 28%), radial-gradient(circle at top right, rgba(180,143,72,.08), transparent 22%), linear-gradient(180deg,#08070d 0%,#0c0a12 100%)",
    color: "#f4f1e9",
    fontFamily: 'Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif',
  },
  wrap: { maxWidth: 1600, margin: "0 auto", padding: "28px 20px 80px" },
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

  const [clientForm, setClientForm] = useState(emptyClient);
  const [contactForm, setContactForm] = useState(emptyContact);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [quoteForm, setQuoteForm] = useState({ ...emptyQuote, issue_date: today() });
  const [quoteDraftLines, setQuoteDraftLines] = useState([
    { id: "d1", description: "", quantity: 1, unit_price: 0, sort_order: 1 },
  ]);
  const [financeForm, setFinanceForm] = useState({ ...emptyFinance, target: MONTHLY_TARGET_DEFAULT });
  const [cashflowForm, setCashflowForm] = useState({ ...emptyCashflow, event_date: today() });
  const [templateForm, setTemplateForm] = useState(emptyTemplate);

  const [crmSearch, setCrmSearch] = useState("");
  const [crmStatusFilter, setCrmStatusFilter] = useState("Kaikki");
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quoteStatusFilter, setQuoteStatusFilter] = useState("Kaikki");
  const [financeFilter, setFinanceFilter] = useState("");
  const [cashflowFilter, setCashflowFilter] = useState("Kaikki");
  const [templateFilter, setTemplateFilter] = useState("");
  const [importFilter, setImportFilter] = useState("");
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
    deletingClientId: null,
    deletingContactId: null,
    deletingTaskId: null,
    deletingQuoteId: null,
    deletingFinanceId: null,
    deletingCashflowId: null,
    deletingTemplateId: null,
    kanbanId: null,
  });

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [a, b, c, d, e, f, g, h, i] = await Promise.all([
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
        supabase.from("contacts").select("*").order("created_at", { ascending: false }),
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("finance_monthly").select("*").order("month", { ascending: false }),
        supabase.from("cashflow_events").select("*").order("event_date", { ascending: false }),
        supabase.from("quotes").select("*").order("created_at", { ascending: false }),
        supabase.from("quote_lines").select("*").order("sort_order", { ascending: true }),
        supabase.from("pricing_templates").select("*").order("created_at", { ascending: false }),
        supabase.from("import_logs").select("*").order("imported_at", { ascending: false }),
      ]);

      for (const r of [a, b, c, d, e, f, g, h, i]) {
        if (r.error) throw r.error;
      }

      setClients((a.data || []).map((x) => ({ ...x, status: normClientStatus(x.status) })));
      setContacts(b.data || []);
      setTasks(c.data || []);
      setFinanceMonthly(d.data || []);
      setCashflowEvents(e.data || []);
      setQuotes((f.data || []).map((x) => ({ ...x, status: normQuoteStatus(x.status) })));
      setQuoteLines(g.data || []);
      setPricingTemplates(h.data || []);
      setImportLogs(i.data || []);

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

    return {
      totalClients: clients.length,
      wonClients: clients.filter((c) => String(c.status || "").toLowerCase() === "voitettu")
        .length,
      openTasks,
      overdueTasks,
      latestMonth,
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
    };
  }, [clients, tasks, financeMonthly, cashflowEvents, quotes, quotesEnriched]);

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
        [x.quote_number, x.title, x.notes, x.client?.name, x.client?.company_name]
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
    () => financeMonthly.filter((r) => !financeFilter || String(r.month || "").includes(financeFilter)),
    [financeMonthly, financeFilter]
  );

  const filteredCashflow = useMemo(
    () => cashflowEvents.filter((r) => cashflowFilter === "Kaikki" || String(r.type || "") === cashflowFilter),
    [cashflowEvents, cashflowFilter]
  );

  const filteredTemplates = useMemo(() => {
    const q = templateFilter.trim().toLowerCase();
    return !q
      ? pricingTemplates
      : pricingTemplates.filter((t) =>
          [t.name, t.category, t.description, t.unit]
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
    setQuoteForm({ ...emptyQuote, issue_date: today(), client_id: selectedClientId || "" });
    setQuoteDraftLines([
      { id: `d-${Date.now()}`, description: "", quantity: 1, unit_price: 0, sort_order: 1 },
    ]);
  };
  const resetFinance = () => setFinanceForm({ ...emptyFinance, target: MONTHLY_TARGET_DEFAULT });
  const resetCashflow = () => setCashflowForm({ ...emptyCashflow, event_date: today() });
  const resetTemplate = () => setTemplateForm(emptyTemplate);

  function fillClient(c) {
    setClientForm({ ...emptyClient, ...c, status: normClientStatus(c.status) });
    setSelectedClientId(c.id);
    setView("crm");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fillQuote(q) {
    setQuoteForm({
      id: q.id,
      client_id: q.client_id || "",
      quote_number: q.quote_number || "",
      title: q.title || "",
      status: normQuoteStatus(q.status),
      issue_date: q.issue_date ? String(q.issue_date).slice(0, 10) : "",
      valid_until: q.valid_until ? String(q.valid_until).slice(0, 10) : "",
      vat_rate: num(q.vat_rate || VAT_DEFAULT),
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
        : await supabase
            .from("contacts")
            .insert({ ...payload, created_at: new Date().toISOString() });

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
        : await supabase
            .from("tasks")
            .insert({ ...payload, created_at: new Date().toISOString() });

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
        description: tpl.name || "Palvelu",
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
        vat_rate,
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
    } catch (err) {
      setError(err.message || "Statuksen päivitys epäonnistui.");
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
        name: templateForm.name?.trim() || null,
        category: templateForm.category?.trim() || null,
        unit: templateForm.unit?.trim() || "kpl",
        unit_price: num(templateForm.unit_price),
        vat_rate: num(templateForm.vat_rate || VAT_DEFAULT),
        is_active: !!templateForm.is_active,
        description: templateForm.description?.trim() || null,
      };

      if (!payload.name) throw new Error("Hinnoittelupohjan nimi on pakollinen.");

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

  const nav = [
    ["dashboard", "Dashboard"],
    ["crm", "CRM"],
    ["kanban", "Kanban"],
    ["quotes", "Tarjoukset"],
    ["finance", "Talous"],
    ["settings", "Asetukset"],
  ];

  return (
    <div style={sx.page}>
      <div style={sx.wrap}>
        <header style={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 18, marginBottom: 22 }}>
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
              SALOPINO CRM / TALOUSOHJAUS V3
            </div>

            <h1 style={{ margin: "0 0 10px", fontSize: 42, lineHeight: 1.05, fontWeight: 900 }}>
              Täysi yhtenäinen operatiivinen näkymä
            </h1>

            <p style={{ margin: 0, color: "rgba(244,241,233,.74)", fontSize: 16, lineHeight: 1.7 }}>
              Dashboard, CRM, Kanban, Tarjoukset, Talous ja Asetukset samassa
              Next.js-sivussa. Mukana tarjouskanta euroina, voitetut ja hävityt tarjoukset
              euroina, asiakaskontaktit, asiakaskohtaiset tehtävät, kassavirran
              ennusteet ja tarjousrivien lisääminen suoraan pricing templateista.
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

            <div
              style={{
                marginTop: 15,
                padding: 13,
                borderRadius: 14,
                background: "rgba(9,9,14,.72)",
                border: "1px solid rgba(231,223,178,.08)",
                color: "rgba(244,241,233,.68)",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              Taulut: clients, contacts, tasks, finance_monthly, cashflow_events,
              quotes, quote_lines, pricing_templates, import_logs.
            </div>
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
          <>
            {view === "dashboard" && (
              <section>
                <Title
                  eyebrow="Operatiivinen tilannekuva"
                  title="Dashboard"
                  right={<Btn variant="ghost" onClick={loadData}>Päivitä</Btn>}
                />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(8,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
                  <Metric title="Asiakkaita" value={dashboard.totalClients} sub={`Voitettuja ${dashboard.wonClients} kpl`} accent />
                  <Metric title="Avoimet tehtävät" value={dashboard.openTasks} sub={`Myöhässä ${dashboard.overdueTasks} kpl`} />
                  <Metric title="Avoimet tarjoukset" value={dashboard.openQuotes} sub="Luonnos / Lähetetty" />
                  <Metric title="Tarjouskanta" value={eur(dashboard.quotePipeline)} sub="Avoimet tarjoukset €" />
                  <Metric title="Voitetut" value={eur(dashboard.quoteWon)} sub="Hyväksytyt tarjoukset €" />
                  <Metric title="Hävityt" value={eur(dashboard.quoteLost)} sub="Hylätyt / vanhentuneet €" />
                  <Metric title="Viimeisin tulos" value={eur(dashboard.latestProfit)} sub={`Liikevaihto ${eur(dashboard.latestRevenue)}`} />
                  <Metric title="30 pv kassavirta" value={eur(dashboard.next30Cashflow)} sub={`Tavoite ${eur(dashboard.latestTarget)}`} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 18 }}>
                  <div style={sx.card}>
                    <Title eyebrow="Tavoitevertailu" title="Kuukauden liikennevalo" />
                    <div style={{ display: "grid", gap: 12 }}>
                      <div style={{ fontSize: 34, fontWeight: 900 }}>{eur(dashboard.monthRevenue)}</div>
                      <div style={{ color: "rgba(244,241,233,.66)" }}>Toteuma {ymKey(new Date())}</div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <StatPill
                          label={dashboard.monthTraffic.label}
                          good={dashboard.monthTraffic.label === "Vihreä"}
                          warn={dashboard.monthTraffic.label === "Keltainen"}
                          danger={dashboard.monthTraffic.label === "Punainen"}
                        />
                        <span style={{ color: dashboard.monthTraffic.color }}>
                          Tavoite {eur(dashboard.monthTarget)} · toteuma{" "}
                          {pct(
                            dashboard.monthTarget
                              ? (dashboard.monthRevenue / dashboard.monthTarget) * 100
                              : 0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={sx.card}>
                    <Title eyebrow="Kassavirran ennuste" title="6 kk näkymä" />
                    <div style={{ display: "grid", gap: 10 }}>
                      {dashboard.forecastRows.length ? (
                        dashboard.forecastRows.map((r) => (
                          <div
                            key={r.month}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              padding: 12,
                              borderRadius: 14,
                              background: "rgba(10,10,16,.78)",
                              border: "1px solid rgba(231,223,178,.08)",
                            }}
                          >
                            <strong>{r.month}</strong>
                            <span
                              style={{
                                fontWeight: 800,
                                color: num(r.amount) >= 0 ? "#dfffe8" : "#ffd8de",
                              }}
                            >
                              {eur(r.amount)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: "rgba(244,241,233,.58)" }}>Ei ennustedataa.</div>
                      )}
                    </div>
                  </div>

                  <div style={sx.card}>
                    <Title eyebrow="Importit" title="Viimeisimmät ajot" />
                    <div style={{ display: "grid", gap: 10 }}>
                      {importLogs.slice(0, 5).map((r) => (
                        <div
                          key={r.id}
                          style={{
                            padding: 12,
                            borderRadius: 14,
                            background: "rgba(10,10,16,.78)",
                            border: "1px solid rgba(231,223,178,.08)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                            <strong>{r.import_type || "Import"}</strong>
                            <span style={{ color: "rgba(244,241,233,.62)", fontSize: 13 }}>
                              {fmtDateTime(r.imported_at)}
                            </span>
                          </div>
                          <div style={{ color: "rgba(244,241,233,.70)", fontSize: 14 }}>
                            {r.source_name || "-"}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 13, color: "rgba(244,241,233,.58)" }}>
                            {r.status || "-"} · rivit {r.row_count ?? "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
		                  <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 18 }}>
                  <div style={sx.card}>
                    <Title eyebrow="Viimeisimmät asiakkaat" title="CRM-sisääntulo" />
                    <table style={sx.table}>
                      <thead>
                        <tr>
                          {["Nimi", "Yritys", "Status", "Puhelin", "Luotu", ""].map((h) => (
                            <th key={h} style={sx.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {clients.slice(0, 8).map((c) => (
                          <tr key={c.id}>
                            <td style={{ ...sx.td, fontWeight: 700 }}>{c.name || "-"}</td>
                            <td style={sx.td}>{c.company_name || "-"}</td>
                            <td style={sx.td}>{normClientStatus(c.status)}</td>
                            <td style={sx.td}>{c.phone || "-"}</td>
                            <td style={sx.td}>{fmtDate(c.created_at)}</td>
                            <td style={sx.td}>
                              <Btn variant="ghost" onClick={() => fillClient(c)}>Avaa</Btn>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: "grid", gap: 18 }}>
                    <div style={sx.card}>
                      <Title eyebrow="Tehtävät" title="Avoimet tehtävät" />
                      <div style={{ display: "grid", gap: 10 }}>
                        {tasks.slice(0, 6).map((t) => {
                          const done =
                            typeof t.completed === "boolean"
                              ? t.completed
                              : ["done", "completed", "valmis"].includes(
                                  String(t.status || "").toLowerCase()
                                );
                          return (
                            <div
                              key={t.id}
                              style={{
                                padding: 13,
                                borderRadius: 14,
                                background: "rgba(10,10,16,.78)",
                                border: "1px solid rgba(231,223,178,.08)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                <strong>{t.title || "Nimetön tehtävä"}</strong>
                                <span style={{ fontSize: 12 }}>{done ? "Valmis" : t.status || "Avoin"}</span>
                              </div>
                              <div style={{ marginTop: 6, fontSize: 13, color: "rgba(244,241,233,.58)" }}>
                                {clientMap.get(t.client_id)?.name || "-"} · eräpäivä {fmtDate(t.due_date)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={sx.card}>
                      <Title eyebrow="Tarjoukset" title="Tuoreimmat liikkeet" />
                      <div style={{ display: "grid", gap: 10 }}>
                        {quotesEnriched.slice(0, 6).map((q) => (
                          <div
                            key={q.id}
                            style={{
                              padding: 13,
                              borderRadius: 14,
                              background: "rgba(10,10,16,.78)",
                              border: "1px solid rgba(231,223,178,.08)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                              <strong>{q.title || "Tarjous"}</strong>
                              <span style={{ fontSize: 12 }}>{normQuoteStatus(q.status)}</span>
                            </div>
                            <div style={{ marginTop: 6, fontSize: 13, color: "rgba(244,241,233,.58)" }}>
                              {q.client?.name || "-"} · {eur(q.total)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {view === "crm" && (
              <section>
                <Title
                  eyebrow="Asiakkuudet, kontaktit ja tehtävät"
                  title="CRM"
                  right={
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Btn variant="ghost" onClick={resetClient}>Uusi asiakas</Btn>
                      <Btn variant="ghost" onClick={loadData}>Päivitä</Btn>
                    </div>
                  }
                />

                <div style={{ display: "grid", gridTemplateColumns: "430px 1fr", gap: 18 }}>
                  <div style={sx.cardDark}>
                    <Title
                      eyebrow={clientForm.id ? "Muokkaus" : "Uusi asiakas"}
                      title={clientForm.id ? "Päivitä tiedot" : "Lisää asiakas"}
                    />

                    <form onSubmit={saveClient}>
                      <div style={{ display: "grid", gap: 12 }}>
                        <Field label="Nimi *"><Input value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} /></Field>
                        <Field label="Yritys"><Input value={clientForm.company_name} onChange={(e) => setClientForm({ ...clientForm, company_name: e.target.value })} /></Field>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <Field label="Sähköposti"><Input value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} /></Field>
                          <Field label="Puhelin"><Input value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} /></Field>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <Field label="Kaupunki"><Input value={clientForm.city} onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })} /></Field>
                          <Field label="Y-tunnus"><Input value={clientForm.business_id} onChange={(e) => setClientForm({ ...clientForm, business_id: e.target.value })} /></Field>
                        </div>

                        <Field label="Status">
                          <Select value={clientForm.status} onChange={(e) => setClientForm({ ...clientForm, status: e.target.value })}>
                            {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        </Field>

                        <Field label="Finder-linkki"><Input value={clientForm.finder_url} onChange={(e) => setClientForm({ ...clientForm, finder_url: e.target.value })} /></Field>
                        <Field label="Asiakastieto-linkki"><Input value={clientForm.asiakastieto_url} onChange={(e) => setClientForm({ ...clientForm, asiakastieto_url: e.target.value })} /></Field>
                        <Field label="LinkedIn-linkki"><Input value={clientForm.linkedin_url} onChange={(e) => setClientForm({ ...clientForm, linkedin_url: e.target.value })} /></Field>
                        <Field label="Muistiinpanot"><TextArea value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} /></Field>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Btn type="submit">{busy.client ? "Tallennetaan..." : clientForm.id ? "Päivitä asiakas" : "Lisää asiakas"}</Btn>
                          <Btn type="button" variant="ghost" onClick={resetClient}>Tyhjennä</Btn>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div style={{ display: "grid", gap: 18 }}>
                    <div style={sx.card}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, marginBottom: 14 }}>
                        <Field label="Hae asiakasta">
                          <Input value={crmSearch} onChange={(e) => setCrmSearch(e.target.value)} placeholder="Nimi, yritys, sähköposti..." />
                        </Field>
                        <Field label="Status-suodatus">
                          <Select value={crmStatusFilter} onChange={(e) => setCrmStatusFilter(e.target.value)}>
                            <option value="Kaikki">Kaikki</option>
                            {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        </Field>
                      </div>

                      <div style={{ display: "grid", gap: 12 }}>
                        {filteredClients.map((c) => (
                          <div
                            key={c.id}
                            style={{
                              padding: 16,
                              borderRadius: 16,
                              background: selectedClientId === c.id ? "rgba(32,28,18,.92)" : "rgba(10,10,16,.78)",
                              border: selectedClientId === c.id ? "1px solid rgba(231,223,178,.20)" : "1px solid rgba(231,223,178,.08)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", flexWrap: "wrap" }}>
                              <div style={{ flex: 1, minWidth: 250 }}>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                                  <div style={{ fontSize: 20, fontWeight: 800 }}>{c.name || "-"}</div>
                                  <span style={{ ...sx.pill, background: "rgba(231,223,178,.08)" }}>{normClientStatus(c.status)}</span>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, fontSize: 14, color: "rgba(244,241,233,.72)" }}>
                                  <div><strong>Yritys:</strong> {c.company_name || "-"}</div>
                                  <div><strong>Kaupunki:</strong> {c.city || "-"}</div>
                                  <div><strong>Sähköposti:</strong> {c.email || "-"}</div>
                                  <div><strong>Puhelin:</strong> {c.phone || "-"}</div>
                                </div>
                              </div>

                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <Btn variant="ghost" onClick={() => { setSelectedClientId(c.id); fillClient(c); }}>Muokkaa</Btn>
                                <Btn variant="ghost" onClick={() => setSelectedClientId(c.id)}>Valitse</Btn>
                                <Btn variant="danger" onClick={() => removeClient(c.id)}>
                                  {busy.deletingClientId === c.id ? "Poistetaan..." : "Poista"}
                                </Btn>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={sx.card}>
                      <Title eyebrow="Valittu asiakas" title={selectedClient?.name || "Asiakaskortti"} />

                      {selectedClient ? (
                        <div style={{ display: "grid", gap: 18 }}>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <LinkChip href={selectedClient.finder_url} label="Finder" />
                            <LinkChip href={selectedClient.asiakastieto_url} label="Asiakastieto" />
                            <LinkChip href={selectedClient.linkedin_url} label="LinkedIn" />
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                            <div style={{ padding: 16, borderRadius: 16, background: "rgba(10,10,16,.78)", border: "1px solid rgba(231,223,178,.08)" }}>
                              <Title eyebrow="Kontakti" title="Asiakkaan kontaktit" right={<Btn variant="ghost" onClick={resetContact}>Uusi</Btn>} />

                              <form onSubmit={saveContact} style={{ display: "grid", gap: 10, marginBottom: 14 }}>
                                <Field label="Nimi *"><Input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, client_id: selectedClientId || "", name: e.target.value })} /></Field>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                  <Field label="Sähköposti"><Input value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, client_id: selectedClientId || "", email: e.target.value })} /></Field>
                                  <Field label="Puhelin"><Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, client_id: selectedClientId || "", phone: e.target.value })} /></Field>
                                </div>
                                <Field label="Rooli"><Input value={contactForm.role} onChange={(e) => setContactForm({ ...contactForm, client_id: selectedClientId || "", role: e.target.value })} /></Field>
                                <Field label="Muistiinpanot"><TextArea value={contactForm.notes} onChange={(e) => setContactForm({ ...contactForm, client_id: selectedClientId || "", notes: e.target.value })} /></Field>

                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                  <Btn type="submit">{busy.contact ? "Tallennetaan..." : contactForm.id ? "Päivitä" : "Lisää"}</Btn>
                                  <Btn type="button" variant="ghost" onClick={resetContact}>Tyhjennä</Btn>
                                </div>
                              </form>

                              <div style={{ display: "grid", gap: 10 }}>
                                {selectedClientContacts.map((c) => (
                                  <div key={c.id} style={{ padding: 12, borderRadius: 14, background: "rgba(15,15,23,.84)", border: "1px solid rgba(231,223,178,.08)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                      <strong>{c.name}</strong>
                                      <div style={{ display: "flex", gap: 8 }}>
                                        <Btn variant="ghost" onClick={() => fillContact(c)} style={{ padding: "8px 10px", fontSize: 12 }}>Muokkaa</Btn>
                                        <Btn variant="danger" onClick={() => removeContact(c.id)} style={{ padding: "8px 10px", fontSize: 12 }}>
                                          {busy.deletingContactId === c.id ? "..." : "Poista"}
                                        </Btn>
                                      </div>
                                    </div>
                                    <div style={{ marginTop: 6, fontSize: 13, color: "rgba(244,241,233,.62)" }}>
                                      {c.role || "-"} · {c.email || "-"} · {c.phone || "-"}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div style={{ padding: 16, borderRadius: 16, background: "rgba(10,10,16,.78)", border: "1px solid rgba(231,223,178,.08)" }}>
                              <Title eyebrow="Tehtävä" title="Asiakaskohtaiset tehtävät" right={<Btn variant="ghost" onClick={resetTask}>Uusi</Btn>} />

                              <form onSubmit={saveTask} style={{ display: "grid", gap: 10, marginBottom: 14 }}>
                                <Field label="Otsikko *"><Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, client_id: selectedClientId || "", title: e.target.value })} /></Field>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                  <Field label="Status"><Input value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, client_id: selectedClientId || "", status: e.target.value })} /></Field>
                                  <Field label="Eräpäivä"><Input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, client_id: selectedClientId || "", due_date: e.target.value })} /></Field>
                                </div>
                                <Field label="Muistiinpanot"><TextArea value={taskForm.notes} onChange={(e) => setTaskForm({ ...taskForm, client_id: selectedClientId || "", notes: e.target.value })} /></Field>

                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                  <Btn type="submit">{busy.task ? "Tallennetaan..." : taskForm.id ? "Päivitä" : "Lisää"}</Btn>
                                  <Btn type="button" variant="ghost" onClick={resetTask}>Tyhjennä</Btn>
                                </div>
                              </form>

                              <div style={{ display: "grid", gap: 10 }}>
                                {selectedClientTasks.map((t) => (
                                  <div key={t.id} style={{ padding: 12, borderRadius: 14, background: "rgba(15,15,23,.84)", border: "1px solid rgba(231,223,178,.08)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                      <strong>{t.title}</strong>
                                      <div style={{ display: "flex", gap: 8 }}>
                                        <Btn variant="ghost" onClick={() => fillTask(t)} style={{ padding: "8px 10px", fontSize: 12 }}>Muokkaa</Btn>
                                        <Btn variant="danger" onClick={() => removeTask(t.id)} style={{ padding: "8px 10px", fontSize: 12 }}>
                                          {busy.deletingTaskId === t.id ? "..." : "Poista"}
                                        </Btn>
                                      </div>
                                    </div>
                                    <div style={{ marginTop: 6, fontSize: 13, color: "rgba(244,241,233,.62)" }}>
                                      {t.status || "Avoin"} · eräpäivä {fmtDate(t.due_date)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div style={{ padding: 16, borderRadius: 16, background: "rgba(10,10,16,.78)", border: "1px solid rgba(231,223,178,.08)" }}>
                            <Title eyebrow="Tarjoukset" title="Asiakkaan tarjoukset" />
                            <table style={sx.table}>
                              <thead>
                                <tr>
                                  {["Tarjous", "Status", "Päiväys", "Voimassa", "Yhteensä", ""].map((h) => (
                                    <th key={h} style={sx.th}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {selectedClientQuotes.map((q) => (
                                  <tr key={q.id}>
                                    <td style={{ ...sx.td, fontWeight: 700 }}>
                                      {q.title || "Tarjous"}
                                      <div style={{ fontSize: 12, color: "rgba(244,241,233,.56)" }}>{q.quote_number || "-"}</div>
                                    </td>
                                    <td style={sx.td}>{normQuoteStatus(q.status)}</td>
                                    <td style={sx.td}>{fmtDate(q.issue_date)}</td>
                                    <td style={sx.td}>{fmtDate(q.valid_until)}</td>
                                    <td style={{ ...sx.td, fontWeight: 800 }}>{eur(q.total)}</td>
                                    <td style={sx.td}><Btn variant="ghost" onClick={() => fillQuote(q)}>Avaa</Btn></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: "rgba(244,241,233,.58)" }}>Valitse asiakas listalta.</div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {view === "kanban" && (
              <section>
                <Title eyebrow="Myyntiputki" title="Kanban" right={<Btn variant="ghost" onClick={loadData}>Päivitä</Btn>} />
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${CLIENT_STATUSES.length}, minmax(260px,1fr))`, gap: 14, overflowX: "auto", alignItems: "start" }}>
                  {CLIENT_STATUSES.map((col) => (
                    <div key={col} style={{ ...sx.card, minWidth: 260, padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid rgba(231,223,178,.08)" }}>
                        <strong>{col}</strong>
                        <span style={{ minWidth: 32, height: 32, borderRadius: 999, display: "grid", placeItems: "center", background: "rgba(231,223,178,.08)", border: "1px solid rgba(231,223,178,.10)", color: "#d9c98a", fontWeight: 800 }}>
                          {kanban[col]?.length || 0}
                        </span>
                      </div>

                      <div style={{ display: "grid", gap: 12 }}>
                        {(kanban[col] || []).length ? (
                          kanban[col].map((c) => (
                            <div key={c.id} style={{ padding: 14, borderRadius: 16, background: "linear-gradient(180deg, rgba(14,14,20,.95), rgba(10,10,15,.98))", border: "1px solid rgba(231,223,178,.08)" }}>
                              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{c.name || "-"}</div>
                              <div style={{ fontSize: 13, color: "rgba(244,241,233,.66)", marginBottom: 6 }}>{c.company_name || "Ei yritysnimeä"}</div>
                              <div style={{ fontSize: 13, color: "rgba(244,241,233,.56)", marginBottom: 10 }}>
                                {c.email || "-"} {c.phone ? `• ${c.phone}` : ""}
                              </div>

                              <Field label="Vaihda status">
                                <Select value={normClientStatus(c.status)} onChange={(e) => changeClientStatus(c.id, e.target.value)}>
                                  {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </Select>
                              </Field>

                              <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                                <Btn variant="ghost" onClick={() => { setSelectedClientId(c.id); fillClient(c); }}>Avaa</Btn>
                                <Btn variant="danger" onClick={() => removeClient(c.id)}>
                                  {busy.deletingClientId === c.id ? "Poistetaan..." : "Poista"}
                                </Btn>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: 14, borderRadius: 14, border: "1px dashed rgba(231,223,178,.14)", color: "rgba(244,241,233,.48)", textAlign: "center" }}>
                            Ei asiakkaita
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {view === "quotes" && (
              <section>
                <Title
                  eyebrow="Tarjousten hallinta"
                  title="Tarjoukset"
                  right={
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Btn variant="ghost" onClick={resetQuote}>Uusi tarjous</Btn>
                      <Btn variant="ghost" onClick={loadData}>Päivitä</Btn>
                    </div>
                  }
                />

                <div style={{ display: "grid", gridTemplateColumns: "520px 1fr", gap: 18 }}>
                  <div style={sx.cardDark}>
                    <Title
                      eyebrow={quoteForm.id ? "Muokkaus" : "Uusi tarjous"}
                      title={quoteForm.id ? "Päivitä tarjous" : "Luo tarjous"}
                    />

                    <form onSubmit={saveQuote}>
                      <div style={{ display: "grid", gap: 12 }}>
                        <Field label="Asiakas *">
                          <Select value={quoteForm.client_id} onChange={(e) => setQuoteForm({ ...quoteForm, client_id: e.target.value })}>
                            <option value="">Valitse asiakas</option>
                            {clients.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                                {c.company_name ? ` – ${c.company_name}` : ""}
                              </option>
                            ))}
                          </Select>
                        </Field>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <Field label="Tarjousnumero"><Input value={quoteForm.quote_number} onChange={(e) => setQuoteForm({ ...quoteForm, quote_number: e.target.value })} /></Field>
                          <Field label="Status">
                            <Select value={quoteForm.status} onChange={(e) => setQuoteForm({ ...quoteForm, status: e.target.value })}>
                              {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </Select>
                          </Field>
                        </div>

                        <Field label="Otsikko *"><Input value={quoteForm.title} onChange={(e) => setQuoteForm({ ...quoteForm, title: e.target.value })} /></Field>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 130px", gap: 12 }}>
                          <Field label="Päiväys"><Input type="date" value={quoteForm.issue_date} onChange={(e) => setQuoteForm({ ...quoteForm, issue_date: e.target.value })} /></Field>
                          <Field label="Voimassa asti"><Input type="date" value={quoteForm.valid_until} onChange={(e) => setQuoteForm({ ...quoteForm, valid_until: e.target.value })} /></Field>
                          <Field label="ALV %"><Input type="number" step="0.1" value={quoteForm.vat_rate} onChange={(e) => setQuoteForm({ ...quoteForm, vat_rate: e.target.value })} /></Field>
                        </div>

                        <div style={{ padding: 14, borderRadius: 16, background: "rgba(10,10,16,.58)", border: "1px solid rgba(231,223,178,.12)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <strong>Tarjousrivit</strong>
                            <Btn type="button" variant="ghost" onClick={addDraftLine}>Lisää rivi</Btn>
                          </div>

                          <div style={{ display: "grid", gap: 10 }}>
                            {quoteDraftLines.map((l, i) => (
                              <div key={l.id} style={{ padding: 12, borderRadius: 14, background: "rgba(8,8,13,.68)", border: "1px solid rgba(231,223,178,.08)" }}>
                                <div style={{ marginBottom: 8, fontSize: 12, color: "#d9c98a", fontWeight: 700 }}>
                                  Rivi {i + 1}
                                </div>

                                <Field label="Kuvaus">
                                  <Input value={l.description} onChange={(e) => updateDraftLine(l.id, "description", e.target.value)} />
                                </Field>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginTop: 10 }}>
                                  <Field label="Määrä">
                                    <Input type="number" step="0.01" value={l.quantity} onChange={(e) => updateDraftLine(l.id, "quantity", e.target.value)} />
                                  </Field>
                                  <Field label="Yksikköhinta">
                                    <Input type="number" step="0.01" value={l.unit_price} onChange={(e) => updateDraftLine(l.id, "unit_price", e.target.value)} />
                                  </Field>
                                  <div style={{ display: "flex", alignItems: "end" }}>
                                    <Btn type="button" variant="danger" onClick={() => removeDraftLine(l.id)}>Poista</Btn>
                                  </div>
                                </div>

                                <div style={{ marginTop: 8, fontSize: 14 }}>
                                  Rivin summa: <strong>{eur(num(l.quantity) * num(l.unit_price))}</strong>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                            <Metric title="Veroton" value={eur(quoteTotals.subtotal)} sub="" />
                            <Metric title="ALV" value={eur(quoteTotals.vatAmount)} sub="" />
                            <Metric title="Yhteensä" value={eur(quoteTotals.total)} sub="" accent />
                          </div>
                        </div>

                        <Field label="Muistiinpanot">
                          <TextArea value={quoteForm.notes} onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })} />
                        </Field>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Btn type="submit">{busy.quote ? "Tallennetaan..." : quoteForm.id ? "Päivitä tarjous" : "Tallenna tarjous"}</Btn>
                          <Btn type="button" variant="ghost" onClick={resetQuote}>Tyhjennä</Btn>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div style={{ display: "grid", gap: 18 }}>
                    <div style={sx.card}>
                      <Title eyebrow="Hinnoittelupohjat" title="Lisää tarjousriviksi" />
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
                        {pricingTemplates.filter((t) => t.is_active).slice(0, 12).map((tpl) => (
                          <div key={tpl.id} style={{ padding: 12, borderRadius: 14, background: "rgba(10,10,16,.78)", border: "1px solid rgba(231,223,178,.08)" }}>
                            <strong>{tpl.name}</strong>
                            <div style={{ marginTop: 6, fontSize: 13, color: "rgba(244,241,233,.62)" }}>
                              {tpl.category || "-"} · {eur(tpl.unit_price)} / {tpl.unit || "kpl"}
                            </div>
                            <div style={{ marginTop: 10 }}>
                              <Btn variant="ghost" onClick={() => addTemplateToQuote(tpl)}>Lisää riviksi</Btn>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={sx.card}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, marginBottom: 14 }}>
                        <Field label="Hae tarjouksia">
                          <Input value={quoteSearch} onChange={(e) => setQuoteSearch(e.target.value)} placeholder="Tarjousnumero, otsikko, asiakas..." />
                        </Field>
                        <Field label="Status-suodatus">
                          <Select value={quoteStatusFilter} onChange={(e) => setQuoteStatusFilter(e.target.value)}>
                            <option value="Kaikki">Kaikki</option>
                            {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        </Field>
                      </div>

                      <div style={{ display: "grid", gap: 12 }}>
                        {filteredQuotes.map((q) => (
                          <div
                            key={q.id}
                            style={{
                              padding: 16,
                              borderRadius: 16,
                              background: selectedQuoteId === q.id ? "rgba(32,28,18,.92)" : "rgba(10,10,16,.78)",
                              border: selectedQuoteId === q.id ? "1px solid rgba(231,223,178,.20)" : "1px solid rgba(231,223,178,.08)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", flexWrap: "wrap" }}>
                              <div style={{ flex: 1, minWidth: 250 }}>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                                  <div style={{ fontSize: 19, fontWeight: 800 }}>{q.title || "Tarjous"}</div>
                                  <span style={{ ...sx.pill, background: "rgba(231,223,178,.08)" }}>{normQuoteStatus(q.status)}</span>
                                </div>

                                <div style={{ color: "rgba(244,241,233,.74)", lineHeight: 1.7, fontSize: 14 }}>
                                  <div><strong>Nro:</strong> {q.quote_number || "-"}</div>
                                  <div><strong>Asiakas:</strong> {q.client?.name || "-"}{q.client?.company_name ? ` / ${q.client.company_name}` : ""}</div>
                                  <div><strong>Voimassa:</strong> {fmtDate(q.valid_until)}</div>
                                  <div><strong>Yhteensä:</strong> {eur(q.total)}</div>
                                </div>
                              </div>

                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <Btn variant="ghost" onClick={() => setSelectedQuoteId(q.id)}>Avaa</Btn>
                                <Btn variant="ghost" onClick={() => fillQuote(q)}>Muokkaa</Btn>
                                <Btn variant="danger" onClick={() => removeQuote(q.id)}>
                                  {busy.deletingQuoteId === q.id ? "Poistetaan..." : "Poista"}
                                </Btn>
                              </div>
                            </div>

                            <div style={{ marginTop: 10 }}>
                              <Field label="Vaihda tarjousstatus">
                                <Select value={normQuoteStatus(q.status)} onChange={(e) => changeQuoteStatus(q.id, e.target.value)}>
                                  {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </Select>
                              </Field>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={sx.card}>
                      <Title eyebrow="Valittu tarjous" title="Tarjousnäkymä" />
                      {selectedQuote ? (
                        <div style={{ display: "grid", gap: 14 }}>
                          <div style={{ padding: 16, borderRadius: 16, background: "rgba(10,10,16,.78)", border: "1px solid rgba(231,223,178,.08)" }}>
                            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
                              {selectedQuote.title || "Tarjous"}
                            </div>

                            <div style={{ lineHeight: 1.7, fontSize: 14, color: "rgba(244,241,233,.72)" }}>
                              <div><strong>Tarjousnumero:</strong> {selectedQuote.quote_number || "-"}</div>
                              <div><strong>Asiakas:</strong> {selectedQuote.client?.name || "-"}{selectedQuote.client?.company_name ? ` / ${selectedQuote.client.company_name}` : ""}</div>
                              <div><strong>Status:</strong> {normQuoteStatus(selectedQuote.status)}</div>
                              <div><strong>Päiväys:</strong> {fmtDate(selectedQuote.issue_date)} · <strong>Voimassa asti:</strong> {fmtDate(selectedQuote.valid_until)}</div>
                            </div>
                          </div>

                          <table style={sx.table}>
                            <thead>
                              <tr>
                                {["#", "Kuvaus", "Määrä", "Yks.hinta", "Rivisumma"].map((h) => (
                                  <th key={h} style={sx.th}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {selectedQuote.lines.map((l, i) => (
                                <tr key={l.id}>
                                  <td style={sx.td}>{i + 1}</td>
                                  <td style={{ ...sx.td, fontWeight: 700 }}>{l.description || "-"}</td>
                                  <td style={sx.td}>{num(l.quantity)}</td>
                                  <td style={sx.td}>{eur(l.unit_price)}</td>
                                  <td style={{ ...sx.td, fontWeight: 800 }}>{eur(l.line_total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                            <Metric title="Veroton" value={eur(selectedQuote.subtotal)} sub="" />
                            <Metric title="ALV" value={eur(selectedQuote.vat_amount)} sub="" />
                            <Metric title="Yhteensä" value={eur(selectedQuote.total)} sub="" accent />
                          </div>

                          {selectedQuote.notes && (
                            <div style={{ padding: 16, borderRadius: 16, background: "rgba(10,10,16,.78)", border: "1px solid rgba(231,223,178,.08)", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                              {selectedQuote.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ color: "rgba(244,241,233,.58)" }}>Valitse tarjous listalta.</div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {view === "finance" && (
              <section>
                <Title eyebrow="Kassavirta ja kuukausitalous" title="Talous" right={<Btn variant="ghost" onClick={loadData}>Päivitä</Btn>} />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
                  <Metric title="Liikevaihto" value={eur(financeSummary.revenue)} sub="Suodatetut kuukaudet" accent />
                  <Metric title="Kulut" value={eur(financeSummary.expenses)} sub="Suodatetut kuukaudet" />
                  <Metric title="Tulos" value={eur(financeSummary.profit)} sub="Liikevaihto - kulut" />
                  <Metric title="Tavoite" value={eur(financeSummary.target)} sub="Yhteensä" />
                  <Metric title="Kassavirta" value={eur(financeSummary.cashflow)} sub="Suodatetut tapahtumat" />
                  <Metric
                    title="Ennusteet"
                    value={eur(
                      filteredCashflow
                        .filter((r) => String(r.type || "") === "Ennuste")
                        .reduce((s, r) => s + num(r.amount), 0)
                    )}
                    sub="Ennuste-rivit"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "430px 1fr", gap: 18 }}>
                  <div style={sx.cardDark}>
                    <Title eyebrow={financeForm.id ? "Muokkaus" : "Uusi kuukausirivi"} title="finance_monthly" />

                    <form onSubmit={saveFinance}>
                      <div style={{ display: "grid", gap: 12 }}>
                        <Field label="Kuukausi *"><Input value={financeForm.month} onChange={(e) => setFinanceForm({ ...financeForm, month: e.target.value })} placeholder="2026-03" /></Field>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <Field label="Liikevaihto"><Input type="number" step="0.01" value={financeForm.revenue} onChange={(e) => setFinanceForm({ ...financeForm, revenue: e.target.value })} /></Field>
                          <Field label="Kulut"><Input type="number" step="0.01" value={financeForm.expenses} onChange={(e) => setFinanceForm({ ...financeForm, expenses: e.target.value })} /></Field>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <Field label="Tulos (valinnainen)"><Input type="number" step="0.01" value={financeForm.profit} onChange={(e) => setFinanceForm({ ...financeForm, profit: e.target.value })} /></Field>
                          <Field label="Tavoite"><Input type="number" step="0.01" value={financeForm.target} onChange={(e) => setFinanceForm({ ...financeForm, target: e.target.value })} /></Field>
                        </div>

                        <Field label="Muistiinpanot"><TextArea value={financeForm.notes} onChange={(e) => setFinanceForm({ ...financeForm, notes: e.target.value })} /></Field>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Btn type="submit">{busy.finance ? "Tallennetaan..." : financeForm.id ? "Päivitä kuukausi" : "Lisää kuukausi"}</Btn>
                          <Btn type="button" variant="ghost" onClick={resetFinance}>Tyhjennä</Btn>
                        </div>
                      </div>
                    </form>

                    <div style={{ height: 1, background: "rgba(231,223,178,.08)", margin: "20px 0" }} />

                    <Title eyebrow={cashflowForm.id ? "Muokkaus" : "Uusi kassavirtarivi"} title="cashflow_events" />

                    <form onSubmit={saveCashflow}>
                      <div style={{ display: "grid", gap: 12 }}>
                        <Field label="Päivä *"><Input type="date" value={cashflowForm.event_date} onChange={(e) => setCashflowForm({ ...cashflowForm, event_date: e.target.value })} /></Field>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <Field label="Summa"><Input type="number" step="0.01" value={cashflowForm.amount} onChange={(e) => setCashflowForm({ ...cashflowForm, amount: e.target.value })} /></Field>
                          <Field label="Tyyppi">
                            <Select value={cashflowForm.type} onChange={(e) => setCashflowForm({ ...cashflowForm, type: e.target.value })}>
                              {CASHFLOW_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </Select>
                          </Field>
                        </div>

                        <Field label="Kuvaus *"><Input value={cashflowForm.description} onChange={(e) => setCashflowForm({ ...cashflowForm, description: e.target.value })} /></Field>
                        <Field label="Muistiinpanot"><TextArea value={cashflowForm.notes} onChange={(e) => setCashflowForm({ ...cashflowForm, notes: e.target.value })} /></Field>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Btn type="submit">{busy.cashflow ? "Tallennetaan..." : cashflowForm.id ? "Päivitä kassavirta" : "Lisää kassavirta"}</Btn>
                          <Btn type="button" variant="ghost" onClick={resetCashflow}>Tyhjennä</Btn>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div style={{ display: "grid", gap: 18 }}>
                    <div style={sx.card}>
                      <Title
                        eyebrow="Kuukausitalous"
                        title="finance_monthly-rivit"
                        right={
                          <Field label="Suodata kuukautta">
                            <Input value={financeFilter} onChange={(e) => setFinanceFilter(e.target.value)} placeholder="2026-03" style={{ width: 180 }} />
                          </Field>
                        }
                      />

                      <table style={sx.table}>
                        <thead>
                          <tr>
                            {["Kuukausi", "Liikevaihto", "Kulut", "Tulos", "Tavoite", "Liikennevalo", "", ""].map((h) => (
                              <th key={h} style={sx.th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFinance.map((r) => {
                            const p =
                              r.profit !== null && r.profit !== undefined
                                ? num(r.profit)
                                : num(r.revenue) - num(r.expenses);
                            const tl = traffic(num(r.revenue), num(r.target || MONTHLY_TARGET_DEFAULT));

                            return (
                              <tr key={r.id}>
                                <td style={{ ...sx.td, fontWeight: 700 }}>{r.month || "-"}</td>
                                <td style={sx.td}>{eur(r.revenue)}</td>
                                <td style={sx.td}>{eur(r.expenses)}</td>
                                <td style={{ ...sx.td, fontWeight: 800 }}>{eur(p)}</td>
                                <td style={sx.td}>{eur(r.target)}</td>
                                <td style={sx.td}>
                                  <StatPill label={tl.label} good={tl.label === "Vihreä"} warn={tl.label === "Keltainen"} danger={tl.label === "Punainen"} />
                                </td>
                                <td style={sx.td}>
                                  <Btn
                                    variant="ghost"
                                    onClick={() =>
                                      setFinanceForm({
                                        ...emptyFinance,
                                        ...r,
                                        revenue: String(r.revenue ?? ""),
                                        expenses: String(r.expenses ?? ""),
                                        profit: String(r.profit ?? ""),
                                        target: String(r.target ?? ""),
                                      })
                                    }
                                  >
                                    Muokkaa
                                  </Btn>
                                </td>
                                <td style={sx.td}>
                                  <Btn variant="danger" onClick={() => removeFinance(r.id)}>
                                    {busy.deletingFinanceId === r.id ? "Poistetaan..." : "Poista"}
                                  </Btn>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div style={sx.card}>
                      <Title
                        eyebrow="Kassavirrat"
                        title="cashflow_events-rivit"
                        right={
                          <Field label="Tyyppi">
                            <Select value={cashflowFilter} onChange={(e) => setCashflowFilter(e.target.value)} style={{ width: 180 }}>
                              <option value="Kaikki">Kaikki</option>
                              {CASHFLOW_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </Select>
                          </Field>
                        }
                      />

                      <table style={sx.table}>
                        <thead>
                          <tr>
                            {["Päivä", "Tyyppi", "Kuvaus", "Summa", "Kuukausi", "", ""].map((h) => (
                              <th key={h} style={sx.th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCashflow.map((r) => (
                            <tr key={r.id}>
                              <td style={{ ...sx.td, fontWeight: 700 }}>{fmtDate(r.event_date)}</td>
                              <td style={sx.td}>{r.type || "-"}</td>
                              <td style={sx.td}>{r.description || "-"}</td>
                              <td style={{ ...sx.td, fontWeight: 800, color: num(r.amount) >= 0 ? "#dfffe8" : "#ffd8de" }}>{eur(r.amount)}</td>
                              <td style={sx.td}>{ymKey(r.event_date)}</td>
                              <td style={sx.td}>
                                <Btn
                                  variant="ghost"
                                  onClick={() =>
                                    setCashflowForm({
                                      ...emptyCashflow,
                                      ...r,
                                      event_date: r.event_date ? String(r.event_date).slice(0, 10) : "",
                                      amount: String(r.amount ?? ""),
                                    })
                                  }
                                >
                                  Muokkaa
                                </Btn>
                              </td>
                              <td style={sx.td}>
                                <Btn variant="danger" onClick={() => removeCashflow(r.id)}>
                                  {busy.deletingCashflowId === r.id ? "Poistetaan..." : "Poista"}
                                </Btn>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {view === "settings" && (
              <section>
                <Title
                  eyebrow="Hinnoittelupohjat ja import-historia"
                  title="Asetukset"
                  right={<Btn variant="ghost" onClick={loadData}>Päivitä</Btn>}
                />

                <div style={{ display: "grid", gridTemplateColumns: "430px 1fr", gap: 18 }}>
                  <div style={sx.cardDark}>
                    <Title
                      eyebrow={templateForm.id ? "Muokkaus" : "Uusi hinnoittelupohja"}
                      title="pricing_templates"
                    />

                    <form onSubmit={saveTemplate}>
                      <div style={{ display: "grid", gap: 12 }}>
                        <Field label="Nimi *"><Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} /></Field>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <Field label="Kategoria"><Input value={templateForm.category} onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })} /></Field>
                          <Field label="Yksikkö"><Input value={templateForm.unit} onChange={(e) => setTemplateForm({ ...templateForm, unit: e.target.value })} /></Field>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <Field label="Yksikköhinta"><Input type="number" step="0.01" value={templateForm.unit_price} onChange={(e) => setTemplateForm({ ...templateForm, unit_price: e.target.value })} /></Field>
                          <Field label="ALV %"><Input type="number" step="0.1" value={templateForm.vat_rate} onChange={(e) => setTemplateForm({ ...templateForm, vat_rate: e.target.value })} /></Field>
                        </div>

                        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <input type="checkbox" checked={!!templateForm.is_active} onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })} />
                          <span style={{ fontSize: 14, fontWeight: 600 }}>Aktiivinen hinnoittelupohja</span>
                        </label>

                        <Field label="Kuvaus"><TextArea value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} /></Field>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Btn type="submit">{busy.template ? "Tallennetaan..." : templateForm.id ? "Päivitä pohja" : "Lisää pohja"}</Btn>
                          <Btn type="button" variant="ghost" onClick={resetTemplate}>Tyhjennä</Btn>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div style={{ display: "grid", gap: 18 }}>
                    <div style={sx.card}>
                      <Title
                        eyebrow="Hinnoittelupohjat"
                        title="pricing_templates-lista"
                        right={
                          <Field label="Hae">
                            <Input value={templateFilter} onChange={(e) => setTemplateFilter(e.target.value)} placeholder="Nimi, kategoria..." style={{ width: 220 }} />
                          </Field>
                        }
                      />

                      <div style={{ display: "grid", gap: 12 }}>
                        {filteredTemplates.map((r) => (
                          <div key={r.id} style={{ padding: 16, borderRadius: 16, background: "rgba(10,10,16,.78)", border: "1px solid rgba(231,223,178,.08)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", flexWrap: "wrap" }}>
                              <div style={{ flex: 1, minWidth: 250 }}>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                                  <div style={{ fontSize: 18, fontWeight: 800 }}>{r.name || "-"}</div>
                                  <span
                                    style={{
                                      ...sx.pill,
                                      background: r.is_active ? "rgba(71,137,94,.18)" : "rgba(120,31,49,.18)",
                                      border: r.is_active ? "1px solid rgba(125,212,156,.18)" : "1px solid rgba(255,93,129,.16)",
                                    }}
                                  >
                                    {r.is_active ? "Aktiivinen" : "Pois käytöstä"}
                                  </span>
                                </div>

                                <div style={{ lineHeight: 1.7, fontSize: 14, color: "rgba(244,241,233,.72)" }}>
                                  <div><strong>Kategoria:</strong> {r.category || "-"}</div>
                                  <div><strong>Yksikkö:</strong> {r.unit || "-"}</div>
                                  <div><strong>Hinta:</strong> {eur(r.unit_price)} / {r.unit || "kpl"}</div>
                                  <div><strong>ALV %:</strong> {num(r.vat_rate)}</div>
                                </div>

                                {r.description && (
                                  <div style={{ marginTop: 8, color: "rgba(244,241,233,.62)", lineHeight: 1.6 }}>
                                    {r.description}
                                  </div>
                                )}
                              </div>

                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <Btn
                                  variant="ghost"
                                  onClick={() =>
                                    setTemplateForm({
                                      ...emptyTemplate,
                                      ...r,
                                      unit_price: String(r.unit_price ?? ""),
                                      vat_rate: num(r.vat_rate ?? VAT_DEFAULT),
                                    })
                                  }
                                >
                                  Muokkaa
                                </Btn>
                                <Btn variant="ghost" onClick={() => { setView("quotes"); addTemplateToQuote(r); }}>
                                  Lisää tarjousriviksi
                                </Btn>
                                <Btn variant="danger" onClick={() => removeTemplate(r.id)}>
                                  {busy.deletingTemplateId === r.id ? "Poistetaan..." : "Poista"}
                                </Btn>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={sx.card}>
                      <Title
                        eyebrow="Importit"
                        title="Tarkempi import-historiaseuranta"
                        right={
                          <Field label="Hae">
                            <Input value={importFilter} onChange={(e) => setImportFilter(e.target.value)} placeholder="Tyyppi, lähde, status..." style={{ width: 240 }} />
                          </Field>
                        }
                      />

                      <table style={sx.table}>
                        <thead>
                          <tr>
                            {["Aika", "Tyyppi", "Lähde", "Status", "Rivejä", "Viesti"].map((h) => (
                              <th key={h} style={sx.th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredImports.map((r) => (
                            <tr key={r.id}>
                              <td style={{ ...sx.td, fontWeight: 700 }}>{fmtDateTime(r.imported_at)}</td>
                              <td style={sx.td}>{r.import_type || "-"}</td>
                              <td style={sx.td}>{r.source_name || "-"}</td>
                              <td style={sx.td}>{r.status || "-"}</td>
                              <td style={sx.td}>{r.row_count ?? "-"}</td>
                              <td style={{ ...sx.td, color: "rgba(244,241,233,.68)" }}>{r.message || "-"}</td>
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
