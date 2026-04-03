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
const VALIDITY_PRESETS = [10, 14, 21, 30];
const CALENDAR_EVENT_TYPES = ["Kuvaus", "Palaveri", "Toimitus", "Seurantakäynti", "Muu"];
const CALENDAR_EVENT_STATUSES = ["Suunniteltu", "Vahvistettu", "Valmis", "Peruttu"];
const MONTHLY_TARGET_DEFAULT = 5000;
const VAT_DEFAULT = 0;

const eur = (v) =>
  new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(v || 0));

const num = (v) => Number(v || 0);
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("fi-FI") : "-");
const fmtDateTime = (v) => (v ? new Date(v).toLocaleString("fi-FI") : "-");
const ymKey = (dateLike) => {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return String(dateLike).slice(0, 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const addDays = (dateLike, days) => {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
};
const nowLocalInput = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const v = variant === "ghost" ? sx.btnGhost : variant === "danger" ? sx.btnDanger : sx.btnPrimary;
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
  return <textarea {...props} style={{ ...sx.input, minHeight: 96, resize: "vertical", ...(props.style || {}) }} />;
}

function Title({ eyebrow, title, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, color: "#d9c98a", marginBottom: 6 }}>{eyebrow}</div>
        <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.1 }}>{title}</h2>
      </div>
      {right || null}
    </div>
  );
}

function Metric({ title, value, sub, accent = false }) {
  return (
    <div style={{ ...sx.card, background: accent ? "linear-gradient(135deg, rgba(82,49,122,.95), rgba(28,18,49,.98))" : sx.card.background }}>
      <div style={{ fontSize: 12, textTransform: "uppercase", color: "rgba(244,241,233,.72)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 13, color: "rgba(244,241,233,.64)" }}>{sub}</div>
    </div>
  );
}

function LinkChip({ href, label }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ ...sx.pill, background: "rgba(231,223,178,.08)", color: "#f4f1e9", textDecoration: "none" }}>
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

  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [crmSearch, setCrmSearch] = useState("");
  const [crmStatusFilter, setCrmStatusFilter] = useState("Kaikki");
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quoteStatusFilter, setQuoteStatusFilter] = useState("Kaikki");
  const [financeFilter, setFinanceFilter] = useState("");
  const [cashflowFilter, setCashflowFilter] = useState("Kaikki");
  const [calendarFilter, setCalendarFilter] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");
  const [importFilter, setImportFilter] = useState("");

  const [clientForm, setClientForm] = useState({
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
  });

  const [contactForm, setContactForm] = useState({
    client_id: "",
    name: "",
    email: "",
    phone: "",
    role: "",
    notes: "",
  });

  const [taskForm, setTaskForm] = useState({
    client_id: "",
    title: "",
    status: "Avoin",
    due_date: today(),
    notes: "",
  });

  const [quoteForm, setQuoteForm] = useState({
    client_id: "",
    quote_number: "",
    title: "",
    status: "Luonnos",
    issue_date: today(),
    valid_until: addDays(today(), 14),
    quote_valid_days: 14,
    validityPreset: "14",
    vat_rate: 0,
    payment_terms_days: 14,
    invoice_status: "Ei laskutettu",
    invoice_number: "",
    invoice_date: "",
    expected_payment_date: "",
    is_b2b: true,
    notes: "",
  });

  const [quoteDraftLines, setQuoteDraftLines] = useState([{ id: "d1", description: "", quantity: 1, unit_price: 0, sort_order: 1 }]);

  const [financeForm, setFinanceForm] = useState({ month: "", revenue: "", expenses: "", profit: "", target: MONTHLY_TARGET_DEFAULT, notes: "" });
  const [cashflowForm, setCashflowForm] = useState({ event_date: today(), amount: "", type: "Tulo", description: "", notes: "" });
  const [templateForm, setTemplateForm] = useState({ name: "", service_name: "", category: "", unit: "kpl", unit_price: "", vat_rate: 0, is_active: true, description: "" });
  const [calendarForm, setCalendarForm] = useState({ client_id: "", quote_id: "", title: "", event_type: "Kuvaus", status: "Suunniteltu", start_at: nowLocalInput(), end_at: nowLocalInput(), location: "", notes: "" });

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

      for (const r of [a, b, c, d, e, f, g, h, i, j]) if (r.error) throw r.error;

      setClients(a.data || []);
      setContacts(b.data || []);
      setTasks(c.data || []);
      setFinanceMonthly(d.data || []);
      setCashflowEvents(e.data || []);
      setQuotes(f.data || []);
      setQuoteLines(g.data || []);
      setPricingTemplates(h.data || []);
      setImportLogs(i.data || []);
      setCalendarEvents(j.data || []);
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
    const t = setTimeout(() => setSuccess(""), 2200);
    return () => clearTimeout(t);
  }, [success]);

  const selectedClient = useMemo(() => clients.find((c) => String(c.id) === String(selectedClientId)) || null, [clients, selectedClientId]);
  const selectedQuote = useMemo(() => quotes.find((q) => String(q.id) === String(selectedQuoteId)) || null, [quotes, selectedQuoteId]);

  const financeSummary = useMemo(() => ({
    revenue: financeMonthly.reduce((s, r) => s + num(r.revenue), 0),
    expenses: financeMonthly.reduce((s, r) => s + num(r.expenses), 0),
    profit: financeMonthly.reduce((s, r) => s + num(r.profit !== undefined && r.profit !== null ? r.profit : num(r.revenue) - num(r.expenses)), 0),
    target: financeMonthly.reduce((s, r) => s + num(r.target), 0),
    cashflow: cashflowEvents.reduce((s, r) => s + num(r.amount), 0),
  }), [financeMonthly, cashflowEvents]);

  const dashboard = useMemo(() => {
    const quotePipeline = quotes
      .filter((q) => ["Luonnos", "Lähetetty"].includes(q.status))
      .reduce((s, q) => s + num(q.total), 0);
    const quoteWon = quotes.filter((q) => q.status === "Hyväksytty").reduce((s, q) => s + num(q.total), 0);
    const quoteLost = quotes.filter((q) => ["Hylätty", "Vanhentunut"].includes(q.status)).reduce((s, q) => s + num(q.total), 0);
    const latestMonth = financeMonthly[0] || null;
    const monthRevenue = num(latestMonth?.revenue);
    const monthTarget = num(latestMonth?.target || MONTHLY_TARGET_DEFAULT);
    const next30Cashflow = cashflowEvents.reduce((s, r) => s + num(r.amount), 0);
    return { quotePipeline, quoteWon, quoteLost, monthRevenue, monthTarget, next30Cashflow };
  }, [quotes, financeMonthly, cashflowEvents]);

  const quoteTotals = useMemo(() => {
    const subtotal = quoteDraftLines.reduce((s, l) => s + num(l.quantity) * num(l.unit_price), 0);
    const vatAmount = subtotal * (num(quoteForm.vat_rate) / 100);
    return { subtotal, vatAmount, total: subtotal + vatAmount };
  }, [quoteDraftLines, quoteForm.vat_rate]);

  async function generateQuoteNumber() {
    try {
      const { data, error } = await supabase.rpc("get_next_quote_number");
      if (error) throw error;
      setQuoteForm((prev) => ({ ...prev, quote_number: data || "" }));
    } catch (err) {
      setError(err.message || "Tarjousnumeron haku epäonnistui.");
    }
  }

  async function invoiceQuote(id) {
    try {
      const { error } = await supabase.rpc("invoice_quote", { p_quote_id: id });
      if (error) throw error;
      setSuccess("Tarjous laskutettu.");
      await loadData();
    } catch (err) {
      setError(err.message || "Laskutus epäonnistui.");
    }
  }

  async function saveClient(e) {
    e.preventDefault();
    try {
      const payload = { ...clientForm, updated_at: new Date().toISOString() };
      if (!payload.name?.trim()) throw new Error("Asiakkaan nimi on pakollinen.");
      const { error } = await supabase.from("clients").insert({ ...payload, created_at: new Date().toISOString() });
      if (error) throw error;
      setSuccess("Asiakas lisätty.");
      setClientForm({ ...emptyClient });
      await loadData();
    } catch (err) {
      setError(err.message || "Asiakkaan tallennus epäonnistui.");
    }
  }

  async function saveContact(e) {
    e.preventDefault();
    try {
      const { error } = await supabase.from("contacts").insert({ ...contactForm, created_at: new Date().toISOString() });
      if (error) throw error;
      setSuccess("Kontakti lisätty.");
      setContactForm({ ...emptyContact, client_id: selectedClientId || "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Kontaktin tallennus epäonnistui.");
    }
  }

  async function saveTask(e) {
    e.preventDefault();
    try {
      const { error } = await supabase.from("tasks").insert({ ...taskForm, created_at: new Date().toISOString() });
      if (error) throw error;
      setSuccess("Tehtävä lisätty.");
      setTaskForm({ ...emptyTask, client_id: selectedClientId || "", due_date: today() });
      await loadData();
    } catch (err) {
      setError(err.message || "Tehtävän tallennus epäonnistui.");
    }
  }

  async function saveQuote(e) {
    e.preventDefault();
    try {
      const payload = {
        client_id: quoteForm.client_id,
        quote_number: quoteForm.quote_number,
        title: quoteForm.title,
        status: quoteForm.status,
        issue_date: quoteForm.issue_date,
        valid_until: quoteForm.valid_until,
        quote_valid_days: num(quoteForm.quote_valid_days),
        vat_rate: num(quoteForm.vat_rate),
        is_b2b: !!quoteForm.is_b2b,
        payment_terms_days: num(quoteForm.payment_terms_days),
        invoice_status: quoteForm.invoice_status,
        invoice_number: quoteForm.invoice_number || null,
        invoice_date: quoteForm.invoice_date || null,
        expected_payment_date: quoteForm.expected_payment_date || null,
        subtotal: quoteTotals.subtotal,
        vat_amount: quoteTotals.vatAmount,
        total: quoteTotals.total,
        notes: quoteForm.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("quotes").insert(payload).select().single();
      if (error) throw error;
      const { error: linesError } = await supabase.from("quote_lines").insert(
        quoteDraftLines.map((l, i) => ({
          quote_id: data.id,
          description: l.description,
          quantity: num(l.quantity),
          unit_price: num(l.unit_price),
          sort_order: i + 1,
          line_total: num(l.quantity) * num(l.unit_price),
          created_at: new Date().toISOString(),
        }))
      );
      if (linesError) throw linesError;
      setSuccess("Tarjous lisätty.");
      setQuoteForm({ ...emptyQuote, issue_date: today(), valid_until: addDays(today(), 14) });
      setQuoteDraftLines([{ id: `d-${Date.now()}`, description: "", quantity: 1, unit_price: 0, sort_order: 1 }]);
      await loadData();
    } catch (err) {
      setError(err.message || "Tarjouksen tallennus epäonnistui.");
    }
  }

  async function saveFinance(e) {
    e.preventDefault();
    try {
      const { error } = await supabase.from("finance_monthly").insert({ ...financeForm, created_at: new Date().toISOString() });
      if (error) throw error;
      setSuccess("Kuukausirivi lisätty.");
      setFinanceForm({ ...emptyFinance, target: MONTHLY_TARGET_DEFAULT });
      await loadData();
    } catch (err) {
      setError(err.message || "Kuukausirivin tallennus epäonnistui.");
    }
  }

  async function saveCashflow(e) {
    e.preventDefault();
    try {
      const { error } = await supabase.from("cashflow_events").insert({ ...cashflowForm, amount: num(cashflowForm.amount), created_at: new Date().toISOString() });
      if (error) throw error;
      setSuccess("Kassavirtarivi lisätty.");
      setCashflowForm({ ...emptyCashflow, event_date: today() });
      await loadData();
    } catch (err) {
      setError(err.message || "Kassavirran tallennus epäonnistui.");
    }
  }

  async function saveTemplate(e) {
    e.preventDefault();
    try {
      const payload = { ...templateForm, name: templateForm.name || templateForm.service_name, service_name: templateForm.service_name || templateForm.name, unit_price: num(templateForm.unit_price), created_at: new Date().toISOString() };
      const { error } = await supabase.from("pricing_templates").insert(payload);
      if (error) throw error;
      setSuccess("Hinnoittelupohja lisätty.");
      setTemplateForm({ ...emptyTemplate });
      await loadData();
    } catch (err) {
      setError(err.message || "Hinnoittelupohjan tallennus epäonnistui.");
    }
  }

  async function saveCalendarEvent(e) {
    e.preventDefault();
    try {
      const payload = {
        ...calendarForm,
        start_at: new Date(calendarForm.start_at).toISOString(),
        end_at: new Date(calendarForm.end_at).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("calendar_events").insert(payload);
      if (error) throw error;
      setSuccess("Kalenteritapahtuma lisätty.");
      setCalendarForm({ ...emptyCalendarEvent, start_at: nowLocalInput(), end_at: nowLocalInput() });
      await loadData();
    } catch (err) {
      setError(err.message || "Kalenterin tallennus epäonnistui.");
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
        <header style={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 18, marginBottom: 22 }}>
          <div style={sx.hero}>
            <div style={{ display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "rgba(231,223,178,.10)", border: "1px solid rgba(231,223,178,.12)", fontSize: 12, color: "#d9c98a", fontWeight: 700, marginBottom: 14 }}>
              SALOPINO CRM / TALOUSOHJAUS V5
            </div>
            <h1 style={{ margin: "0 0 10px", fontSize: 42, lineHeight: 1.05, fontWeight: 900 }}>Yhtenäinen buildaava versio</h1>
            <p style={{ margin: 0, color: "rgba(244,241,233,.74)", fontSize: 16, lineHeight: 1.7 }}>
              Tämä versio sisältää kaikki ydintoiminnot yhdessä tiedostossa ilman rikkinäistä JSX-rakennetta.
            </p>
          </div>
          <div style={sx.card}>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, color: "#d9c98a", marginBottom: 12, fontWeight: 700 }}>Navigaatio</div>
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
                    border: view === k ? "1px solid rgba(231,223,178,.34)" : "1px solid rgba(231,223,178,.10)",
                    background: view === k ? "linear-gradient(135deg, rgba(217,201,138,.22), rgba(120,92,35,.18))" : "rgba(10,10,16,.84)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {(error || success) && (
          <div style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 14, border: error ? "1px solid rgba(255,120,120,.24)" : "1px solid rgba(144,220,167,.22)", background: error ? "rgba(120,31,49,.16)" : "rgba(37,92,54,.18)", color: error ? "#ffd7df" : "#d5ffe0", fontWeight: 600 }}>
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 14 }}>
                  <Metric title="Asiakkaita" value={clients.length} sub="clients" accent />
                  <Metric title="Tarjouskanta" value={eur(dashboard.quotePipeline)} sub="Luonnos + Lähetetty" />
                  <Metric title="Voitetut" value={eur(dashboard.quoteWon)} sub="Hyväksytyt" />
                  <Metric title="Hävityt" value={eur(dashboard.quoteLost)} sub="Hylätyt + vanhentuneet" />
                  <Metric title="Kassavirta" value={eur(dashboard.next30Cashflow)} sub="cashflow_events" />
                  <Metric title="Kuukausi" value={eur(dashboard.monthRevenue)} sub={`Tavoite ${eur(dashboard.monthTarget)}`} />
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
                        <Field label="Status"><Select value={clientForm.status} onChange={(e) => setClientForm({ ...clientForm, status: e.target.value })}>{CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
                        <Field label="Finder-linkki"><Input value={clientForm.finder_url} onChange={(e) => setClientForm({ ...clientForm, finder_url: e.target.value })} /></Field>
                        <Field label="Asiakastieto-linkki"><Input value={clientForm.asiakastieto_url} onChange={(e) => setClientForm({ ...clientForm, asiakastieto_url: e.target.value })} /></Field>
                        <Field label="LinkedIn-linkki"><Input value={clientForm.linkedin_url} onChange={(e) => setClientForm({ ...clientForm, linkedin_url: e.target.value })} /></Field>
                        <Field label="Muistiinpanot"><TextArea value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} /></Field>
                        <Btn type="submit">Tallenna</Btn>
                      </div>
                    </form>
                  </div>

                  <div style={sx.card}>
                    <Title eyebrow="Asiakaslista" title="Asiakkaat" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, marginBottom: 14 }}>
                      <Field label="Hae"><Input value={crmSearch} onChange={(e) => setCrmSearch(e.target.value)} /></Field>
                      <Field label="Status"><Select value={crmStatusFilter} onChange={(e) => setCrmStatusFilter(e.target.value)}><option value="Kaikki">Kaikki</option>{CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
                    </div>
                    <table style={sx.table}>
                      <thead><tr>{["Nimi", "Yritys", "Status", "Yhteystiedot", "Linkit"].map((h) => <th key={h} style={sx.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {clients
                          .filter((c) => {
                            const q = crmSearch.trim().toLowerCase();
                            const okQ = !q || [c.name, c.company_name, c.email, c.phone].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
                            const okS = crmStatusFilter === "Kaikki" || c.status === crmStatusFilter;
                            return okQ && okS;
                          })
                          .map((c) => (
                            <tr key={c.id}>
                              <td style={sx.td}>{c.name}</td>
                              <td style={sx.td}>{c.company_name || "-"}</td>
                              <td style={sx.td}>{c.status || "-"}</td>
                              <td style={sx.td}>{c.email || "-"}<br />{c.phone || "-"}</td>
                              <td style={sx.td}><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><LinkChip href={c.finder_url} label="Finder" /><LinkChip href={c.asiakastieto_url} label="Asiakastieto" /><LinkChip href={c.linkedin_url} label="LinkedIn" /></div></td>
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
                <Title eyebrow="Tarjoukset" title="Tarjousten hallinta" right={<div style={{ display: "flex", gap: 10 }}><Btn variant="ghost" onClick={generateQuoteNumber}>Generoi nro</Btn><Btn variant="ghost" onClick={loadData}>Päivitä</Btn></div>} />
                <div style={{ display: "grid", gridTemplateColumns: "520px 1fr", gap: 18 }}>
                  <div style={sx.cardDark}>
                    <form onSubmit={saveQuote}>
                      <div style={{ display: "grid", gap: 12 }}>
                        <Field label="Asiakas"><Select value={quoteForm.client_id} onChange={(e) => setQuoteForm({ ...quoteForm, client_id: e.target.value })}><option value="">Valitse asiakas</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
                        <Field label="Tarjousnumero"><Input value={quoteForm.quote_number} onChange={(e) => setQuoteForm({ ...quoteForm, quote_number: e.target.value })} /></Field>
                        <Field label="Otsikko"><Input value={quoteForm.title} onChange={(e) => setQuoteForm({ ...quoteForm, title: e.target.value })} /></Field>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <Field label="Päiväys"><Input type="date" value={quoteForm.issue_date} onChange={(e) => setQuoteForm({ ...quoteForm, issue_date: e.target.value })} /></Field>
                          <Field label="Voimassa asti"><Input type="date" value={quoteForm.valid_until} onChange={(e) => setQuoteForm({ ...quoteForm, valid_until: e.target.value, validityPreset: "oma" })} /></Field>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                          <Field label="Voimassaolo"><Select value={quoteForm.validityPreset} onChange={(e) => { const v = e.target.value; if (v === "oma") setQuoteForm({ ...quoteForm, validityPreset: v }); else setQuoteForm({ ...quoteForm, validityPreset: v, quote_valid_days: Number(v), valid_until: addDays(quoteForm.issue_date, v) }); }}>{VALIDITY_PRESETS.map((v) => <option key={v} value={String(v)}>{v} pv</option>)}<option value="oma">oma</option></Select></Field>
                          <Field label="Maksuehto"><Input type="number" value={quoteForm.payment_terms_days} onChange={(e) => setQuoteForm({ ...quoteForm, payment_terms_days: e.target.value })} /></Field>
                          <Field label="ALV %"><Input type="number" value={quoteForm.vat_rate} onChange={(e) => setQuoteForm({ ...quoteForm, vat_rate: e.target.value })} /></Field>
                        </div>
                        <Field label="Status"><Select value={quoteForm.status} onChange={(e) => setQuoteForm({ ...quoteForm, status: e.target.value })}>{QUOTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
                        <div style={{ padding: 14, borderRadius: 16, background: "rgba(10,10,16,.58)", border: "1px solid rgba(231,223,178,.12)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><strong>Tarjousrivit</strong><Btn type="button" variant="ghost" onClick={() => setQuoteDraftLines((p) => [...p, { id: `d-${Date.now()}`, description: "", quantity: 1, unit_price: 0, sort_order: p.length + 1 }])}>Lisää</Btn></div>
                          <div style={{ display: "grid", gap: 10 }}>
                            {quoteDraftLines.map((l) => (
                              <div key={l.id} style={{ padding: 12, borderRadius: 14, background: "rgba(8,8,13,.68)", border: "1px solid rgba(231,223,178,.08)" }}>
                                <Field label="Kuvaus"><Input value={l.description} onChange={(e) => setQuoteDraftLines((prev) => prev.map((x) => x.id === l.id ? { ...x, description: e.target.value } : x))} /></Field>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginTop: 10 }}>
                                  <Field label="Määrä"><Input type="number" value={l.quantity} onChange={(e) => setQuoteDraftLines((prev) => prev.map((x) => x.id === l.id ? { ...x, quantity: e.target.value } : x))} /></Field>
                                  <Field label="Yksikköhinta"><Input type="number" value={l.unit_price} onChange={(e) => setQuoteDraftLines((prev) => prev.map((x) => x.id === l.id ? { ...x, unit_price: e.target.value } : x))} /></Field>
                                  <div style={{ display: "flex", alignItems: "end" }}><Btn type="button" variant="danger" onClick={() => setQuoteDraftLines((prev) => prev.filter((x) => x.id !== l.id))}>Poista</Btn></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                          <Metric title="Veroton" value={eur(quoteTotals.subtotal)} sub="ALV 0 oletus" />
                          <Metric title="ALV" value={eur(quoteTotals.vatAmount)} sub={`${quoteForm.vat_rate}%`} />
                          <Metric title="Yhteensä" value={eur(quoteTotals.total)} sub="Tarjoussumma" accent />
                        </div>
                        <Field label="Muistiinpanot"><TextArea value={quoteForm.notes} onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })} /></Field>
                        <Btn type="submit">Tallenna tarjous</Btn>
                      </div>
                    </form>
                  </div>

                  <div style={sx.card}>
                    <Title eyebrow="Tarjouslista" title="Tallennetut tarjoukset" />
                    <table style={sx.table}>
                      <thead><tr>{["Nro", "Otsikko", "Status", "Laskutus", "Summa", "Toiminnot"].map((h) => <th key={h} style={sx.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {quotes.map((q) => (
                          <tr key={q.id}>
                            <td style={sx.td}>{q.quote_number || "-"}</td>
                            <td style={sx.td}>{q.title || "-"}</td>
                            <td style={sx.td}>{q.status || "-"}</td>
                            <td style={sx.td}>{q.invoice_status || "-"}</td>
                            <td style={sx.td}>{eur(q.total)}</td>
                            <td style={sx.td}><Btn variant="ghost" onClick={() => invoiceQuote(q.id)}>Laskuta</Btn></td>
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
                <Title eyebrow="Talous" title="Kuukausitalous ja kassavirta" />
                <div style={{ display: "grid", gridTemplateColumns: "430px 1fr", gap: 18 }}>
                  <div style={sx.cardDark}>
                    <form onSubmit={saveFinance} style={{ marginBottom: 18 }}>
                      <Title eyebrow="finance_monthly" title="Lisää kuukausi" />
                      <div style={{ display: "grid", gap: 12 }}>
                        <Field label="Kuukausi"><Input value={financeForm.month} onChange={(e) => setFinanceForm({ ...financeForm, month: e.target.value })} placeholder="2026-04" /></Field>
                        <Field label="Liikevaihto"><Input type="number" value={financeForm.revenue} onChange={(e) => setFinanceForm({ ...financeForm, revenue: e.target.value })} /></Field>
                        <Field label="Kulut"><Input type="number" value={financeForm.expenses} onChange={(e) => setFinanceForm({ ...financeForm, expenses: e.target.value })} /></Field>
                        <Field label="Tulos"><Input type="number" value={financeForm.profit} onChange={(e) => setFinanceForm({ ...financeForm, profit: e.target.value })} /></Field>
                        <Field label="Tavoite"><Input type="number" value={financeForm.target} onChange={(e) => setFinanceForm({ ...financeForm, target: e.target.value })} /></Field>
                        <Btn type="submit">Tallenna kuukausi</Btn>
                      </div>
                    </form>
                    <form onSubmit={saveCashflow}>
                      <Title eyebrow="cashflow_events" title="Lisää kassavirta" />
                      <div style={{ display: "grid", gap: 12 }}>
                        <Field label="Päivä"><Input type="date" value={cashflowForm.event_date} onChange={(e) => setCashflowForm({ ...cashflowForm, event_date: e.target.value })} /></Field>
                        <Field label="Summa"><Input type="number" value={cashflowForm.amount} onChange={(e) => setCashflowForm({ ...cashflowForm, amount: e.target.value })} /></Field>
                        <Field label="Tyyppi"><Select value={cashflowForm.type} onChange={(e) => setCashflowForm({ ...cashflowForm, type: e.target.value })}>{CASHFLOW_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
                        <Field label="Kuvaus"><Input value={cashflowForm.description} onChange={(e) => setCashflowForm({ ...cashflowForm, description: e.target.value })} /></Field>
                        <Btn type="submit">Tallenna kassavirta</Btn>
                      </div>
                    </form>
                  </div>
                  <div style={sx.card}>
                    <Title eyebrow="Yhteenveto" title="Talousnäkymä" />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
                      <Metric title="Liikevaihto" value={eur(financeSummary.revenue)} sub="Suodatettu" accent />
                      <Metric title="Kulut" value={eur(financeSummary.expenses)} sub="Suodatettu" />
                      <Metric title="Tulos" value={eur(financeSummary.profit)} sub="Suodatettu" />
                      <Metric title="Kassavirta" value={eur(financeSummary.cashflow)} sub="cashflow_events" />
                    </div>
                    <table style={sx.table}>
                      <thead><tr>{["Kuukausi", "Liikevaihto", "Kulut", "Tulos", "Tavoite"].map((h) => <th key={h} style={sx.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {financeMonthly.map((r) => (
                          <tr key={r.id}>
                            <td style={sx.td}>{r.month}</td>
                            <td style={sx.td}>{eur(r.revenue)}</td>
                            <td style={sx.td}>{eur(r.expenses)}</td>
                            <td style={sx.td}>{eur(r.profit)}</td>
                            <td style={sx.td}>{eur(r.target)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                        <Field label="Asiakas"><Select value={calendarForm.client_id} onChange={(e) => setCalendarForm({ ...calendarForm, client_id: e.target.value })}><option value="">Ei asiakasta</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
                        <Field label="Tarjous"><Select value={calendarForm.quote_id} onChange={(e) => setCalendarForm({ ...calendarForm, quote_id: e.target.value })}><option value="">Ei tarjousta</option>{quotes.map((q) => <option key={q.id} value={q.id}>{q.quote_number || q.title}</option>)}</Select></Field>
                        <Field label="Tyyppi"><Select value={calendarForm.event_type} onChange={(e) => setCalendarForm({ ...calendarForm, event_type: e.target.value })}>{CALENDAR_EVENT_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
                        <Field label="Status"><Select value={calendarForm.status} onChange={(e) => setCalendarForm({ ...calendarForm, status: e.target.value })}>{CALENDAR_EVENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
                        <Field label="Alkaa"><Input type="datetime-local" value={calendarForm.start_at} onChange={(e) => setCalendarForm({ ...calendarForm, start_at: e.target.value })} /></Field>
                        <Field label="Päättyy"><Input type="datetime-local" value={calendarForm.end_at} onChange={(e) => setCalendarForm({ ...calendarForm, end_at: e.target.value })} /></Field>
                        <Field label="Sijainti"><Input value={calendarForm.location} onChange={(e) => setCalendarForm({ ...calendarForm, location: e.target.value })} /></Field>
                        <Field label="Muistiinpanot"><TextArea value={calendarForm.notes} onChange={(e) => setCalendarForm({ ...calendarForm, notes: e.target.value })} /></Field>
                        <Btn type="submit">Tallenna tapahtuma</Btn>
                      </div>
                    </form>
                  </div>
                  <div style={sx.card}>
                    <Title eyebrow="Lista" title="Kalenteritapahtumat" />
                    <table style={sx.table}>
                      <thead><tr>{["Aika", "Otsikko", "Tyyppi", "Status", "Asiakas"].map((h) => <th key={h} style={sx.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {calendarEvents.map((e) => (
                          <tr key={e.id}>
                            <td style={sx.td}>{fmtDateTime(e.start_at)}</td>
                            <td style={sx.td}>{e.title || "-"}</td>
                            <td style={sx.td}>{e.event_type || "-"}</td>
                            <td style={sx.td}>{e.status || "-"}</td>
                            <td style={sx.td}>{clients.find((c) => String(c.id) === String(e.client_id))?.name || "-"}</td>
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
                        <Field label="Nimi"><Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value, service_name: e.target.value })} /></Field>
                        <Field label="Kategoria"><Input value={templateForm.category} onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })} /></Field>
                        <Field label="Yksikkö"><Input value={templateForm.unit} onChange={(e) => setTemplateForm({ ...templateForm, unit: e.target.value })} /></Field>
                        <Field label="Yksikköhinta"><Input type="number" value={templateForm.unit_price} onChange={(e) => setTemplateForm({ ...templateForm, unit_price: e.target.value })} /></Field>
                        <Field label="ALV %"><Input type="number" value={templateForm.vat_rate} onChange={(e) => setTemplateForm({ ...templateForm, vat_rate: e.target.value })} /></Field>
                        <Btn type="submit">Tallenna pohja</Btn>
                      </div>
                    </form>
                  </div>
                  <div style={sx.card}>
                    <Title eyebrow="Hinnoittelupohjat" title="pricing_templates" />
                    <table style={sx.table}>
                      <thead><tr>{["Nimi", "Kategoria", "Yksikkö", "Hinta"].map((h) => <th key={h} style={sx.th}>{h}</th>)}</tr></thead>
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
                    <div style={{ marginTop: 18 }}>
                      <Title eyebrow="Importit" title="import_logs" />
                      <table style={sx.table}>
                        <thead><tr>{["Aika", "Tyyppi", "Lähde", "Status", "Rivejä"].map((h) => <th key={h} style={sx.th}>{h}</th>)}</tr></thead>
                        <tbody>
                          {importLogs.map((r) => (
                            <tr key={r.id}>
                              <td style={sx.td}>{fmtDateTime(r.imported_at)}</td>
                              <td style={sx.td}>{r.import_type || "-"}</td>
                              <td style={sx.td}>{r.source_name || "-"}</td>
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
