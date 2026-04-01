"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "crm", label: "CRM" },
  { id: "kanban", label: "Kanban" },
  { id: "quotes", label: "Tarjoukset" },
  { id: "finance", label: "Talous" },
  { id: "settings", label: "Asetukset" },
];

const STATUS_OPTIONS = ["liidi", "kartoitus", "tarjous", "seuranta", "voitettu", "hävitty"];
const QUOTE_STATUS_OPTIONS = ["luonnos", "lähetetty", "hyväksytty", "hylätty", "vanhentunut"];

const STATUS_COLORS = {
  liidi: "#94a3b8",
  kartoitus: "#3b82f6",
  tarjous: "#f59e0b",
  seuranta: "#8b5cf6",
  voitettu: "#22c55e",
  hävitty: "#ef4444",
};

const QUOTE_STATUS_COLORS = {
  luonnos: "#64748b",
  lähetetty: "#3b82f6",
  hyväksytty: "#22c55e",
  hylätty: "#ef4444",
  vanhentunut: "#f59e0b",
};

const TASK_PRIORITY_COLORS = {
  matala: "#64748b",
  normaali: "#3b82f6",
  korkea: "#f59e0b",
  kriittinen: "#ef4444",
};

const emptyClientForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  status: "liidi",
  value: 0,
  probability: 0,
  next_action: "",
  next_action_date: "",
  last_contact_date: "",
  company_linkedin: "",
  quote_link: "",
  notes: "",
};

const createEmptyQuoteLine = () => ({
  service_name: "",
  description: "",
  quantity: 1,
  unit: "kpl",
  unit_price: 0,
});

const emptyQuoteForm = {
  client_id: "",
  title: "",
  description: "",
  status: "luonnos",
  quote_date: "",
  valid_until: "",
  vat_percent: 25.5,
  payment_terms: "",
  delivery_terms: "",
  pdf_link: "",
  notes: "",
  lines: [createEmptyQuoteLine()],
};

export default function Home() {
  const [activeView, setActiveView] = useState("dashboard");

  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [finance, setFinance] = useState([]);
  const [cashflow, setCashflow] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [quoteLines, setQuoteLines] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setErrorText("");

    const [
      clientsRes,
      tasksRes,
      financeRes,
      cashflowRes,
      quotesRes,
      quoteLinesRes,
    ] = await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").order("due_date", { ascending: true }),
      supabase.from("finance_monthly").select("*").order("report_month", { ascending: false }).limit(12),
      supabase.from("cashflow_events").select("*").order("event_date", { ascending: false }).limit(500),
      supabase.from("quotes").select("*").order("created_at", { ascending: false }),
      supabase.from("quote_lines").select("*").order("sort_order", { ascending: true }),
    ]);

    const errors = [
      clientsRes.error,
      tasksRes.error,
      financeRes.error,
      cashflowRes.error,
      quotesRes.error,
      quoteLinesRes.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error("Supabase fetch errors:", errors);
      setErrorText("Datan latauksessa tuli virhe. Tarkista taulut ja kentät Supabasessa.");
    }

    setClients(clientsRes.data || []);
    setTasks(tasksRes.data || []);
    setFinance(financeRes.data || []);
    setCashflow(cashflowRes.data || []);
    setQuotes(quotesRes.data || []);
    setQuoteLines(quoteLinesRes.data || []);
    setLoading(false);
  }

  async function createClientRecord(form) {
    if (!form.name.trim()) {
      alert("Anna asiakkaan nimi");
      return { ok: false };
    }

    const payload = normalizeClientPayload(form);
    const { error } = await supabase.from("clients").insert([payload]);

    if (error) {
      console.error("Virhe asiakkaan lisäyksessä:", error);
      alert("Asiakkaan lisäys epäonnistui");
      return { ok: false };
    }

    await fetchAll();
    return { ok: true };
  }

  async function updateClientRecord(id, form) {
    if (!id) return { ok: false };
    if (!form.name.trim()) {
      alert("Anna asiakkaan nimi");
      return { ok: false };
    }

    const payload = normalizeClientPayload(form);
    const { error } = await supabase.from("clients").update(payload).eq("id", id);

    if (error) {
      console.error("Virhe asiakkaan päivityksessä:", error);
      alert("Asiakkaan päivitys epäonnistui");
      return { ok: false };
    }

    await fetchAll();
    return { ok: true };
  }

  async function deleteClientRecord(id, label) {
    if (!id) return;
    const ok = window.confirm(`Poistetaanko asiakas "${label || "asiakas"}"?`);
    if (!ok) return;

    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      console.error("Virhe asiakkaan poistossa:", error);
      alert("Asiakkaan poisto epäonnistui");
      return;
    }

    await fetchAll();
  }

  async function updateClientStatus(id, newStatus) {
    const { error } = await supabase.from("clients").update({ status: newStatus }).eq("id", id);

    if (error) {
      console.error("Virhe statuksen päivityksessä:", error);
      alert("Statuksen päivitys epäonnistui");
      return { ok: false };
    }

    await fetchAll();
    return { ok: true };
  }

  async function createQuoteRecord(form) {
    if (!form.client_id) {
      alert("Valitse asiakas");
      return { ok: false };
    }
    if (!form.title.trim()) {
      alert("Anna tarjouksen otsikko");
      return { ok: false };
    }

    const cleanedLines = form.lines.filter(
      (line) =>
        line.service_name.trim() ||
        line.description.trim() ||
        Number(line.quantity || 0) > 0 ||
        Number(line.unit_price || 0) > 0
    );

    const computed = computeQuoteTotals(cleanedLines, Number(form.vat_percent || 0));

    const quoteNumber = buildQuoteNumber();
    const quotePayload = {
      client_id: form.client_id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status || "luonnos",
      quote_number: quoteNumber,
      quote_date: form.quote_date || null,
      valid_until: form.valid_until || null,
      subtotal: computed.subtotal,
      vat_percent: Number(form.vat_percent || 0),
      vat_amount: computed.vatAmount,
      total_amount: computed.total,
      payment_terms: form.payment_terms.trim() || null,
      delivery_terms: form.delivery_terms.trim() || null,
      pdf_link: form.pdf_link.trim() || null,
      notes: form.notes.trim() || null,
    };

    const { data: insertedQuote, error: quoteError } = await supabase
      .from("quotes")
      .insert([quotePayload])
      .select()
      .single();

    if (quoteError) {
      console.error("Virhe tarjouksen lisäyksessä:", quoteError);
      alert("Tarjouksen tallennus epäonnistui");
      return { ok: false };
    }

    if (cleanedLines.length > 0) {
      const linesPayload = cleanedLines.map((line, index) => ({
        quote_id: insertedQuote.id,
        service_name: line.service_name.trim() || null,
        description: line.description.trim() || null,
        quantity: Number(line.quantity || 0),
        unit: line.unit.trim() || "kpl",
        unit_price: Number(line.unit_price || 0),
        line_total: Number(line.quantity || 0) * Number(line.unit_price || 0),
        sort_order: index,
      }));

      const { error: linesError } = await supabase.from("quote_lines").insert(linesPayload);

      if (linesError) {
        console.error("Virhe tarjousrivien tallennuksessa:", linesError);
        alert("Tarjous tallentui, mutta rivien tallennus epäonnistui");
        return { ok: false };
      }
    }

    const clientUpdatePayload = {
      quote_id: insertedQuote.id,
      quote_status: form.status || "luonnos",
      quote_link: form.pdf_link.trim() || null,
    };

    if ((form.status || "").toLowerCase() === "hyväksytty") {
      clientUpdatePayload.status = "voitettu";
      clientUpdatePayload.expected_cash_amount = computed.total;
    } else if ((form.status || "").toLowerCase() === "lähetetty") {
      clientUpdatePayload.status = "tarjous";
    }

    await supabase.from("clients").update(clientUpdatePayload).eq("id", form.client_id);

    await fetchAll();
    return { ok: true };
  }

  async function updateQuoteRecord(id, form) {
    if (!id) return { ok: false };
    if (!form.client_id) {
      alert("Valitse asiakas");
      return { ok: false };
    }
    if (!form.title.trim()) {
      alert("Anna tarjouksen otsikko");
      return { ok: false };
    }

    const cleanedLines = form.lines.filter(
      (line) =>
        line.service_name.trim() ||
        line.description.trim() ||
        Number(line.quantity || 0) > 0 ||
        Number(line.unit_price || 0) > 0
    );

    const computed = computeQuoteTotals(cleanedLines, Number(form.vat_percent || 0));

    const quotePayload = {
      client_id: form.client_id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status || "luonnos",
      quote_date: form.quote_date || null,
      valid_until: form.valid_until || null,
      subtotal: computed.subtotal,
      vat_percent: Number(form.vat_percent || 0),
      vat_amount: computed.vatAmount,
      total_amount: computed.total,
      payment_terms: form.payment_terms.trim() || null,
      delivery_terms: form.delivery_terms.trim() || null,
      pdf_link: form.pdf_link.trim() || null,
      notes: form.notes.trim() || null,
    };

    const { error: quoteError } = await supabase.from("quotes").update(quotePayload).eq("id", id);
    if (quoteError) {
      console.error("Virhe tarjouksen päivityksessä:", quoteError);
      alert("Tarjouksen päivitys epäonnistui");
      return { ok: false };
    }

    const { error: deleteLinesError } = await supabase.from("quote_lines").delete().eq("quote_id", id);
    if (deleteLinesError) {
      console.error("Virhe vanhojen rivien poistossa:", deleteLinesError);
      alert("Tarjouksen vanhojen rivien poisto epäonnistui");
      return { ok: false };
    }

    if (cleanedLines.length > 0) {
      const linesPayload = cleanedLines.map((line, index) => ({
        quote_id: id,
        service_name: line.service_name.trim() || null,
        description: line.description.trim() || null,
        quantity: Number(line.quantity || 0),
        unit: line.unit.trim() || "kpl",
        unit_price: Number(line.unit_price || 0),
        line_total: Number(line.quantity || 0) * Number(line.unit_price || 0),
        sort_order: index,
      }));

      const { error: linesError } = await supabase.from("quote_lines").insert(linesPayload);
      if (linesError) {
        console.error("Virhe tarjousrivien tallennuksessa:", linesError);
        alert("Tarjouksen rivien tallennus epäonnistui");
        return { ok: false };
      }
    }

    const clientUpdatePayload = {
      quote_id: id,
      quote_status: form.status || "luonnos",
      quote_link: form.pdf_link.trim() || null,
    };

    if ((form.status || "").toLowerCase() === "hyväksytty") {
      clientUpdatePayload.status = "voitettu";
      clientUpdatePayload.expected_cash_amount = computed.total;
    } else if ((form.status || "").toLowerCase() === "lähetetty") {
      clientUpdatePayload.status = "tarjous";
    }

    await supabase.from("clients").update(clientUpdatePayload).eq("id", form.client_id);

    await fetchAll();
    return { ok: true };
  }

  async function deleteQuoteRecord(id, label) {
    if (!id) return;
    const ok = window.confirm(`Poistetaanko tarjous "${label || "tarjous"}"?`);
    if (!ok) return;

    const { error: linesError } = await supabase.from("quote_lines").delete().eq("quote_id", id);
    if (linesError) {
      console.error("Virhe tarjousrivien poistossa:", linesError);
      alert("Tarjousrivien poisto epäonnistui");
      return;
    }

    const { error: quoteError } = await supabase.from("quotes").delete().eq("id", id);
    if (quoteError) {
      console.error("Virhe tarjouksen poistossa:", quoteError);
      alert("Tarjouksen poisto epäonnistui");
      return;
    }

    await fetchAll();
  }

  const dashboardData = useMemo(
    () => buildDashboardData(clients, tasks, finance, cashflow),
    [clients, tasks, finance, cashflow]
  );

  const pageTitle = useMemo(() => {
    return NAV_ITEMS.find((n) => n.id === activeView)?.label || "Dashboard";
  }, [activeView]);

  return (
    <main style={mainStyle}>
      <div style={containerStyle}>
        <aside style={sidebarStyle}>
          <div style={sidebarTopLabel}>Salopino Control</div>
          <div style={sidebarHeader}>Salopino CRM</div>
          <div style={sidebarText}>
            Myynti, tehtävät, kassavirta ja kirjanpidon seuranta samassa ohjauspaneelissa.
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                style={{
                  ...navButton,
                  background: activeView === item.id ? "#1b2540" : "transparent",
                  border:
                    activeView === item.id
                      ? "1px solid rgba(231,223,178,0.22)"
                      : "1px solid transparent",
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div style={sidebarBottom}>
            <button style={refreshButton} onClick={fetchAll}>
              Päivitä data
            </button>
          </div>
        </aside>

        <section style={contentStyle}>
          <header style={heroStyle}>
            <div style={heroLabel}>Premium Dashboard</div>
            <h1 style={titleStyle}>{pageTitle}</h1>
            <div style={subtitleStyle}>
              Tämä näkymä näyttää oikean pipeline-datan, kassatilanteen, myöhässä olevat tehtävät ja
              päivittäiset kontaktit samassa paikassa.
            </div>
          </header>

          {errorText ? <div style={errorBoxStyle}>{errorText}</div> : null}

          {activeView === "dashboard" && (
            <DashboardView loading={loading} data={dashboardData} />
          )}

          {activeView === "crm" && (
            <CRMView
              loading={loading}
              clients={clients}
              onCreate={createClientRecord}
              onUpdate={updateClientRecord}
              onDelete={deleteClientRecord}
            />
          )}

          {activeView === "kanban" && (
            <KanbanView
              loading={loading}
              clients={clients}
              onUpdateStatus={updateClientStatus}
            />
          )}

          {activeView === "quotes" && (
            <QuotesView
              loading={loading}
              clients={clients}
              quotes={quotes}
              quoteLines={quoteLines}
              onCreate={createQuoteRecord}
              onUpdate={updateQuoteRecord}
              onDelete={deleteQuoteRecord}
            />
          )}

          {activeView === "finance" && (
            <FinanceView loading={loading} data={dashboardData} />
          )}

          {activeView === "settings" && (
            <PlaceholderView
              title="Asetukset"
              text="Tähän seuraavaksi yritystiedot, tarjousnumerointi, hinnastopohjat ja oletusasetukset."
            />
          )}
        </section>
      </div>
    </main>
  );
}

function DashboardView({ loading, data }) {
  return (
    <div style={{ display: "grid", gap: 22 }}>
      <SectionTitle
        title="Johtamisen mittarit"
        description="Näistä näet yhdellä silmäyksellä myyntiputken, voitetut kaupat, kassatilanteen ja lähiajan kassavirran."
      />

      <div style={metricsGrid}>
        <MetricCard title="Avoin pipeline" value={loading ? "…" : formatCurrency(data.pipeline)} color="#f59e0b" subtext="Avoimet caset ilman voitettu/hävitty" />
        <MetricCard title="Weighted pipeline" value={loading ? "…" : formatCurrency(data.weightedPipeline)} color="#8b5cf6" subtext="Arvo × todennäköisyys" />
        <MetricCard title="Voitettu / kk" value={loading ? "…" : formatCurrency(data.wonThisMonth)} color="#22c55e" subtext="Kuluvan kuun voitetut" />
        <MetricCard title="Win rate" value={loading ? "…" : formatPercent(data.winRate)} color="#38bdf8" subtext="Voitettu / (voitettu + hävitty)" />
      </div>

      <div style={metricsGrid}>
        <MetricCard title="Kassasaldo" value={loading ? "…" : formatCurrency(data.cashBalance)} color="#14b8a6" subtext="Viimeisin finance_monthly" />
        <MetricCard title="Netto 30 pv" value={loading ? "…" : formatCurrency(data.net30d)} color="#3b82f6" subtext="Sisään – ulos seuraavat 30 pv" />
        <MetricCard title="Avoimet laskut" value={loading ? "…" : formatCurrency(data.openInvoices)} color="#eab308" subtext="Laskutettu, mutta ei täysin maksettu" />
        <MetricCard title="Myöhässä olevat saamiset" value={loading ? "…" : formatCurrency(data.overdueReceivables)} color="#ef4444" subtext="Erääntyneet sisään tulevat kassavirrat" />
      </div>

      <div style={twoColGrid}>
        <Panel title="Ota yhteyttä tänään">
          <PanelHint text="Asiakkaat, joiden seuraava toimenpide erääntyy tänään tai on jo myöhässä." />
          {loading ? <EmptyText text="Ladataan…" /> : data.contactsToday.length === 0 ? <EmptyText text="Ei erääntyneitä follow-uppeja." /> : (
            <div style={stackStyle}>
              {data.contactsToday.map((client) => (
                <ReminderCard
                  key={client.id}
                  color={STATUS_COLORS[client.status] || "#94a3b8"}
                  title={client.name || "Nimetön asiakas"}
                  subtitle={`${client.company || "Ei yritystä"} · ${client.status || "-"} · ${formatCurrency(client.value)}`}
                  line1={`Seuraava toimenpide: ${client.next_action || "-"}`}
                  line2={`Seuraava päivä: ${formatDate(client.next_action_date)} · Viim. kontakti: ${formatDate(client.last_contact_date)}`}
                  line3={`Sähköposti: ${client.email || "-"} · Puhelin: ${client.phone || "-"}`}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Kassavirta 30 pv">
          <PanelHint text="Seuraavan 30 päivän odotettu sisään- ja ulosvirta cashflow_events-taulusta." />
          <div style={miniMetricsGrid}>
            <MiniMetric title="Tulossa sisään" value={loading ? "…" : formatCurrency(data.incoming30d)} />
            <MiniMetric title="Lähdössä ulos" value={loading ? "…" : formatCurrency(data.outgoing30d)} />
            <MiniMetric title="Netto" value={loading ? "…" : formatCurrency(data.net30d)} />
            <MiniMetric title="Ennuste + kassa" value={loading ? "…" : formatCurrency(data.cashBalance + data.net30d)} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function CRMView({ loading, clients, onCreate, onUpdate, onDelete }) {
  const [form, setForm] = useState(emptyClientForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("kaikki");
  const [submitting, setSubmitting] = useState(false);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (client.name || "").toLowerCase().includes(q) ||
        (client.company || "").toLowerCase().includes(q) ||
        (client.email || "").toLowerCase().includes(q) ||
        (client.phone || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "kaikki" || (client.status || "").toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEdit(client) {
    setEditingId(client.id);
    setForm({
      name: client.name || "",
      company: client.company || "",
      email: client.email || "",
      phone: client.phone || "",
      status: client.status || "liidi",
      value: Number(client.value || 0),
      probability: Number(client.probability || 0),
      next_action: client.next_action || "",
      next_action_date: client.next_action_date || "",
      last_contact_date: client.last_contact_date || "",
      company_linkedin: client.company_linkedin || "",
      quote_link: client.quote_link || "",
      notes: client.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId("");
    setForm(emptyClientForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const result = editingId ? await onUpdate(editingId, form) : await onCreate(form);

    setSubmitting(false);

    if (result?.ok) {
      setEditingId("");
      setForm(emptyClientForm);
    }
  }

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <SectionTitle title="Toimiva CRM" description="Lisää, muokkaa, hae ja hallitse asiakkaita." />

      <Panel title={editingId ? "Muokkaa asiakasta" : "Lisää uusi asiakas"}>
        <form onSubmit={handleSubmit}>
          <div style={crmFormGrid}>
            <Field label="Asiakkaan nimi" help="Pakollinen">
              <input value={form.name} onChange={(e) => updateField("name", e.target.value)} style={inputStyle} placeholder="Esim. Kari Luttinen" />
            </Field>
            <Field label="Yritys" help="Organisaatio">
              <input value={form.company} onChange={(e) => updateField("company", e.target.value)} style={inputStyle} placeholder="Esim. C Interim Oy" />
            </Field>
            <Field label="Sähköposti" help="Yhteydenotto ja tarjoukset">
              <input value={form.email} onChange={(e) => updateField("email", e.target.value)} style={inputStyle} placeholder="nimi@yritys.fi" />
            </Field>
            <Field label="Puhelin" help="Nopea yhteys">
              <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} style={inputStyle} placeholder="040 123 4567" />
            </Field>
            <Field label="Status" help="Myyntivaihe">
              <select value={form.status} onChange={(e) => updateField("status", e.target.value)} style={inputStyle}>
                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </Field>
            <Field label="Arvo €" help="Kaupan arvo">
              <input type="number" value={form.value} onChange={(e) => updateField("value", e.target.value)} style={inputStyle} placeholder="0" />
            </Field>
            <Field label="Todennäköisyys %" help="Weighted pipelinea varten">
              <input type="number" value={form.probability} onChange={(e) => updateField("probability", e.target.value)} style={inputStyle} placeholder="0" />
            </Field>
            <Field label="Seuraava toimenpide" help="Mitä tehdään seuraavaksi">
              <input value={form.next_action} onChange={(e) => updateField("next_action", e.target.value)} style={inputStyle} placeholder="Soita tarjouksesta" />
            </Field>
            <Field label="Seuraava päivä" help="Milloin seuraava toimenpide tehdään">
              <input type="date" value={form.next_action_date} onChange={(e) => updateField("next_action_date", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Viimeisin kontakti" help="Milloin viimeksi olit yhteydessä">
              <input type="date" value={form.last_contact_date} onChange={(e) => updateField("last_contact_date", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="LinkedIn-linkki" help="Yritys tai henkilö">
              <input value={form.company_linkedin} onChange={(e) => updateField("company_linkedin", e.target.value)} style={inputStyle} placeholder="https://linkedin.com/..." />
            </Field>
            <Field label="Tarjouslinkki" help="PDF tai tarjousnäkymä">
              <input value={form.quote_link} onChange={(e) => updateField("quote_link", e.target.value)} style={inputStyle} placeholder="https://..." />
            </Field>
          </div>

          <div style={{ marginTop: 16 }}>
            <Field label="Muistiinpanot" help="Lisätiedot asiakkaasta tai tilanteesta">
              <textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} style={textareaStyle} placeholder="Kirjaa tähän tärkeät huomiot" />
            </Field>
          </div>

          <div style={buttonRowStyle}>
            <button type="submit" style={primaryButtonStyle} disabled={submitting}>
              {submitting ? "Tallennetaan..." : editingId ? "Tallenna muutokset" : "Lisää asiakas"}
            </button>
            {editingId ? <button type="button" style={secondaryButtonStyle} onClick={cancelEdit}>Peru muokkaus</button> : null}
          </div>
        </form>
      </Panel>

      <Panel title="Asiakasrekisteri">
        <div style={toolbarStyle}>
          <div style={toolbarLeftStyle}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} style={searchInputStyle} placeholder="Hae nimellä, yrityksellä, sähköpostilla tai puhelimella" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={filterSelectStyle}>
              <option value="kaikki">Kaikki statukset</option>
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>

          <div style={{ color: "#94a3b8", fontSize: 14 }}>
            {loading ? "Ladataan..." : `${filteredClients.length} asiakasta`}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {["Nimi", "Yritys", "Status", "Arvo", "Tod. %", "Seuraava toimenpide", "Päivä", "Viim. kontakti", "LinkedIn", "Tarjous", "Toiminnot"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={emptyRowStyle}>Ladataan asiakkaita...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan={11} style={emptyRowStyle}>Ei osumia valituilla hakuehdoilla.</td></tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td style={tdStyleStrong}>{client.name || "-"}</td>
                    <td style={tdStyle}>{client.company || "-"}</td>
                    <td style={tdStyle}>
                      <span style={{ ...statusBadgeStyle, background: STATUS_COLORS[client.status] || "#64748b" }}>
                        {client.status || "-"}
                      </span>
                    </td>
                    <td style={tdStyle}>{formatCurrency(client.value)}</td>
                    <td style={tdStyle}>{formatPercent(client.probability)}</td>
                    <td style={tdStyle}>{client.next_action || "-"}</td>
                    <td style={tdStyle}>{formatDate(client.next_action_date)}</td>
                    <td style={tdStyle}>{formatDate(client.last_contact_date)}</td>
                    <td style={tdStyle}>
                      {client.company_linkedin ? <a href={safeUrl(client.company_linkedin)} target="_blank" rel="noreferrer" style={linkButtonStyle}>Avaa</a> : "-"}
                    </td>
                    <td style={tdStyle}>
                      {client.quote_link ? <a href={safeUrl(client.quote_link)} target="_blank" rel="noreferrer" style={linkButtonStyle}>Tarjous</a> : "-"}
                    </td>
                    <td style={tdStyle}>
                      <div style={rowButtonsStyle}>
                        <button onClick={() => startEdit(client)} style={miniActionButtonStyle} type="button">Muokkaa</button>
                        <button onClick={() => onDelete(client.id, client.name || client.company)} style={miniDeleteButtonStyle} type="button">Poista</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function KanbanView({ loading, clients, onUpdateStatus }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("kaikki");
  const [busyId, setBusyId] = useState("");

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        (client.name || "").toLowerCase().includes(q) ||
        (client.company || "").toLowerCase().includes(q) ||
        (client.email || "").toLowerCase().includes(q) ||
        (client.phone || "").toLowerCase().includes(q) ||
        (client.next_action || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "kaikki" || (client.status || "").toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  const grouped = useMemo(() => {
    return STATUS_OPTIONS.reduce((acc, status) => {
      acc[status] = filteredClients.filter(
        (client) => (client.status || "liidi").toLowerCase() === status
      );
      return acc;
    }, {});
  }, [filteredClients]);

  async function handleStatusChange(clientId, newStatus) {
    setBusyId(clientId);
    await onUpdateStatus(clientId, newStatus);
    setBusyId("");
  }

  async function moveLeft(client) {
    const currentIndex = STATUS_OPTIONS.indexOf((client.status || "liidi").toLowerCase());
    if (currentIndex <= 0) return;
    await handleStatusChange(client.id, STATUS_OPTIONS[currentIndex - 1]);
  }

  async function moveRight(client) {
    const currentIndex = STATUS_OPTIONS.indexOf((client.status || "liidi").toLowerCase());
    if (currentIndex === -1 || currentIndex >= STATUS_OPTIONS.length - 1) return;
    await handleStatusChange(client.id, STATUS_OPTIONS[currentIndex + 1]);
  }

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <SectionTitle
        title="Toimiva Kanban"
        description="Siirrä asiakkaita myyntivaiheesta toiseen. Status päivittyy suoraan clients-tauluun."
      />

      <Panel title="Kanban-ohjaus">
        <div style={toolbarStyle}>
          <div style={toolbarLeftStyle}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} style={searchInputStyle} placeholder="Hae nimellä, yrityksellä, sähköpostilla, puhelimella tai seuraavalla toimenpiteellä" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={filterSelectStyle}>
              <option value="kaikki">Kaikki statukset</option>
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div style={{ color: "#94a3b8", fontSize: 14 }}>{loading ? "Ladataan..." : `${filteredClients.length} casea`}</div>
        </div>

        <div style={kanbanBoardStyle}>
          {STATUS_OPTIONS.map((status) => {
            const items = grouped[status] || [];
            const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);

            return (
              <div key={status} style={{ ...kanbanColumnStyle, borderTop: `3px solid ${STATUS_COLORS[status] || "#64748b"}` }}>
                <div style={kanbanColumnHeaderStyle}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, textTransform: "capitalize" }}>{status}</div>
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
                      {items.length} kpl · {formatCurrency(total)}
                    </div>
                  </div>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: STATUS_COLORS[status] || "#64748b", flexShrink: 0 }} />
                </div>

                <div style={kanbanCardsWrapStyle}>
                  {loading ? (
                    <EmptyText text="Ladataan..." />
                  ) : items.length === 0 ? (
                    <div style={emptyKanbanCardStyle}>Ei caseja tässä vaiheessa</div>
                  ) : (
                    items.map((client) => {
                      const currentIndex = STATUS_OPTIONS.indexOf((client.status || "liidi").toLowerCase());

                      return (
                        <div key={client.id} style={kanbanCardStyle}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div>
                              <div style={kanbanCardTitleStyle}>{client.name || "Nimetön asiakas"}</div>
                              <div style={kanbanCardCompanyStyle}>{client.company || "Ei yritystä"}</div>
                            </div>
                            <span style={{ ...statusBadgeStyle, background: STATUS_COLORS[client.status] || "#64748b", height: "fit-content" }}>
                              {client.status || "-"}
                            </span>
                          </div>

                          <div style={kanbanMetaGridStyle}>
                            <div>
                              <div style={kanbanMetaLabelStyle}>Arvo</div>
                              <div style={kanbanMetaValueStyle}>{formatCurrency(client.value)}</div>
                            </div>
                            <div>
                              <div style={kanbanMetaLabelStyle}>Tod. %</div>
                              <div style={kanbanMetaValueStyle}>{formatPercent(client.probability)}</div>
                            </div>
                          </div>

                          <div style={kanbanInfoLineStyle}><strong>Seuraava:</strong> {client.next_action || "-"}</div>
                          <div style={kanbanInfoLineStyle}><strong>Päivä:</strong> {formatDate(client.next_action_date)}</div>
                          <div style={kanbanInfoLineStyle}><strong>Puhelin:</strong> {client.phone || "-"}</div>
                          <div style={kanbanInfoLineStyle}><strong>Sähköposti:</strong> {client.email || "-"}</div>

                          <div style={kanbanLinksStyle}>
                            {client.company_linkedin ? <a href={safeUrl(client.company_linkedin)} target="_blank" rel="noreferrer" style={linkButtonStyle}>LinkedIn</a> : null}
                            {client.quote_link ? <a href={safeUrl(client.quote_link)} target="_blank" rel="noreferrer" style={linkButtonStyle}>Tarjous</a> : null}
                          </div>

                          <div style={{ marginTop: 12 }}>
                            <select
                              value={client.status || "liidi"}
                              onChange={(e) => handleStatusChange(client.id, e.target.value)}
                              style={kanbanSelectStyle}
                              disabled={busyId === client.id}
                            >
                              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>

                          <div style={kanbanButtonsRowStyle}>
                            <button
                              type="button"
                              style={{ ...kanbanMoveButtonStyle, opacity: currentIndex <= 0 || busyId === client.id ? 0.45 : 1 }}
                              onClick={() => moveLeft(client)}
                              disabled={currentIndex <= 0 || busyId === client.id}
                            >
                              ← Edellinen
                            </button>
                            <button
                              type="button"
                              style={{ ...kanbanMoveButtonStyle, opacity: currentIndex >= STATUS_OPTIONS.length - 1 || busyId === client.id ? 0.45 : 1 }}
                              onClick={() => moveRight(client)}
                              disabled={currentIndex >= STATUS_OPTIONS.length - 1 || busyId === client.id}
                            >
                              Seuraava →
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function QuotesView({ loading, clients, quotes, quoteLines, onCreate, onUpdate, onDelete }) {
  const [form, setForm] = useState(emptyQuoteForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("kaikki");
  const [submitting, setSubmitting] = useState(false);

  const clientById = useMemo(() => {
    const map = {};
    clients.forEach((client) => {
      map[client.id] = client;
    });
    return map;
  }, [clients]);

  const linesByQuoteId = useMemo(() => {
    const map = {};
    quoteLines.forEach((line) => {
      if (!map[line.quote_id]) map[line.quote_id] = [];
      map[line.quote_id].push(line);
    });
    return map;
  }, [quoteLines]);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const client = clientById[quote.client_id];
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        (quote.quote_number || "").toLowerCase().includes(q) ||
        (quote.title || "").toLowerCase().includes(q) ||
        (quote.description || "").toLowerCase().includes(q) ||
        (client?.name || "").toLowerCase().includes(q) ||
        (client?.company || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "kaikki" || (quote.status || "").toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotes, clientById, search, statusFilter]);

  const computedTotals = useMemo(() => {
    return computeQuoteTotals(form.lines, Number(form.vat_percent || 0));
  }, [form.lines, form.vat_percent]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateLine(index, field, value) {
    setForm((prev) => {
      const nextLines = [...prev.lines];
      nextLines[index] = { ...nextLines[index], [field]: value };
      return { ...prev, lines: nextLines };
    });
  }

  function addLine() {
    setForm((prev) => ({ ...prev, lines: [...prev.lines, createEmptyQuoteLine()] }));
  }

  function removeLine(index) {
    setForm((prev) => {
      if (prev.lines.length === 1) {
        return { ...prev, lines: [createEmptyQuoteLine()] };
      }
      return { ...prev, lines: prev.lines.filter((_, i) => i !== index) };
    });
  }

  function cancelEdit() {
    setEditingId("");
    setForm(emptyQuoteForm);
  }

  function startEdit(quote) {
    const lines = (linesByQuoteId[quote.id] || []).map((line) => ({
      service_name: line.service_name || "",
      description: line.description || "",
      quantity: Number(line.quantity || 1),
      unit: line.unit || "kpl",
      unit_price: Number(line.unit_price || 0),
    }));

    setEditingId(quote.id);
    setForm({
      client_id: quote.client_id || "",
      title: quote.title || "",
      description: quote.description || "",
      status: quote.status || "luonnos",
      quote_date: quote.quote_date || "",
      valid_until: quote.valid_until || "",
      vat_percent: Number(quote.vat_percent || 25.5),
      payment_terms: quote.payment_terms || "",
      delivery_terms: quote.delivery_terms || "",
      pdf_link: quote.pdf_link || "",
      notes: quote.notes || "",
      lines: lines.length > 0 ? lines : [createEmptyQuoteLine()],
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const result = editingId
      ? await onUpdate(editingId, form)
      : await onCreate(form);

    setSubmitting(false);

    if (result?.ok) {
      setEditingId("");
      setForm(emptyQuoteForm);
    }
  }

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <SectionTitle
        title="Toimiva Tarjoukset-näkymä"
        description="Luo, muokkaa ja hallitse tarjouksia. Tarjoukset kytkeytyvät suoraan asiakkaisiin ja tarjousriveihin."
      />

      <Panel title={editingId ? "Muokkaa tarjousta" : "Luo uusi tarjous"}>
        <form onSubmit={handleSubmit}>
          <div style={crmFormGrid}>
            <Field label="Asiakas" help="Valitse CRM:stä">
              <select
                value={form.client_id}
                onChange={(e) => updateField("client_id", e.target.value)}
                style={inputStyle}
              >
                <option value="">Valitse asiakas</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name || "-"} {client.company ? `· ${client.company}` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Tarjouksen otsikko" help="Pakollinen">
              <input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                style={inputStyle}
                placeholder="Esim. Dronella lämpökuvaus"
              />
            </Field>

            <Field label="Status" help="Tarjouksen tila">
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                style={inputStyle}
              >
                {QUOTE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="ALV %" help="Oletus 25,5">
              <input
                type="number"
                value={form.vat_percent}
                onChange={(e) => updateField("vat_percent", e.target.value)}
                style={inputStyle}
                placeholder="25.5"
              />
            </Field>

            <Field label="Tarjouspäivä" help="Tarjouksen päiväys">
              <input
                type="date"
                value={form.quote_date}
                onChange={(e) => updateField("quote_date", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Voimassa asti" help="Tarjouksen voimassaoloaika">
              <input
                type="date"
                value={form.valid_until}
                onChange={(e) => updateField("valid_until", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Maksuehto" help="Esim. 14 pv netto">
              <input
                value={form.payment_terms}
                onChange={(e) => updateField("payment_terms", e.target.value)}
                style={inputStyle}
                placeholder="14 pv netto"
              />
            </Field>

            <Field label="Toimitusehto" help="Tarvittaessa">
              <input
                value={form.delivery_terms}
                onChange={(e) => updateField("delivery_terms", e.target.value)}
                style={inputStyle}
                placeholder="Toimitus sopimuksen mukaan"
              />
            </Field>

            <Field label="PDF-linkki" help="Valinnainen">
              <input
                value={form.pdf_link}
                onChange={(e) => updateField("pdf_link", e.target.value)}
                style={inputStyle}
                placeholder="https://..."
              />
            </Field>

            <Field label="Lyhyt kuvaus" help="Mitä tarjous koskee">
              <input
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                style={inputStyle}
                placeholder="Kuvaus kohteesta"
              />
            </Field>
          </div>

          <div style={{ marginTop: 16 }}>
            <Field label="Lisähuomiot" help="Sisäiset tai tarjoukseen liittyvät huomiot">
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                style={textareaStyle}
                placeholder="Kirjaa tähän lisätiedot"
              />
            </Field>
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={subSectionTitleStyle}>Tarjousrivit</div>

            <div style={quoteLinesWrapStyle}>
              {form.lines.map((line, index) => {
                const lineTotal = Number(line.quantity || 0) * Number(line.unit_price || 0);

                return (
                  <div key={index} style={quoteLineCardStyle}>
                    <div style={quoteLineGridStyle}>
                      <Field label="Palvelu" help="Rivin nimi">
                        <input
                          value={line.service_name}
                          onChange={(e) => updateLine(index, "service_name", e.target.value)}
                          style={inputStyle}
                          placeholder="Esim. Virtuaalikuvaus"
                        />
                      </Field>

                      <Field label="Kuvaus" help="Tarkempi sisältö">
                        <input
                          value={line.description}
                          onChange={(e) => updateLine(index, "description", e.target.value)}
                          style={inputStyle}
                          placeholder="Kuvaus rivistä"
                        />
                      </Field>

                      <Field label="Määrä" help="Lukumäärä">
                        <input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => updateLine(index, "quantity", e.target.value)}
                          style={inputStyle}
                          placeholder="1"
                        />
                      </Field>

                      <Field label="Yksikkö" help="Esim. kpl, h, m²">
                        <input
                          value={line.unit}
                          onChange={(e) => updateLine(index, "unit", e.target.value)}
                          style={inputStyle}
                          placeholder="kpl"
                        />
                      </Field>

                      <Field label="Yksikköhinta €" help="ALV 0 %">
                        <input
                          type="number"
                          value={line.unit_price}
                          onChange={(e) => updateLine(index, "unit_price", e.target.value)}
                          style={inputStyle}
                          placeholder="0"
                        />
                      </Field>

                      <Field label="Rivisumma" help="Lasketaan automaattisesti">
                        <div style={readonlyBoxStyle}>{formatCurrency(lineTotal)}</div>
                      </Field>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <button type="button" style={miniDeleteButtonStyle} onClick={() => removeLine(index)}>
                        Poista rivi
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 12 }}>
              <button type="button" style={secondaryButtonStyle} onClick={addLine}>
                Lisää rivi
              </button>
            </div>
          </div>

          <div style={quoteTotalsBarStyle}>
            <div style={quoteTotalItemStyle}>
              <div style={quoteTotalLabelStyle}>Välisummaa</div>
              <div style={quoteTotalValueStyle}>{formatCurrency(computedTotals.subtotal)}</div>
            </div>
            <div style={quoteTotalItemStyle}>
              <div style={quoteTotalLabelStyle}>ALV</div>
              <div style={quoteTotalValueStyle}>{formatCurrency(computedTotals.vatAmount)}</div>
            </div>
            <div style={quoteTotalItemStyle}>
              <div style={quoteTotalLabelStyle}>Yhteensä</div>
              <div style={quoteTotalGrandStyle}>{formatCurrency(computedTotals.total)}</div>
            </div>
          </div>

          <div style={buttonRowStyle}>
            <button type="submit" style={primaryButtonStyle} disabled={submitting}>
              {submitting ? "Tallennetaan..." : editingId ? "Tallenna tarjous" : "Luo tarjous"}
            </button>

            {editingId ? (
              <button type="button" style={secondaryButtonStyle} onClick={cancelEdit}>
                Peru muokkaus
              </button>
            ) : null}
          </div>
        </form>
      </Panel>

      <Panel title="Tarjousarkisto">
        <div style={toolbarStyle}>
          <div style={toolbarLeftStyle}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchInputStyle}
              placeholder="Hae tarjousnumerolla, otsikolla tai asiakkaalla"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="kaikki">Kaikki statukset</option>
              {QUOTE_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div style={{ color: "#94a3b8", fontSize: 14 }}>
            {loading ? "Ladataan..." : `${filteredQuotes.length} tarjousta`}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {[
                  "Numero",
                  "Asiakas",
                  "Otsikko",
                  "Status",
                  "Päivä",
                  "Voimassa",
                  "Netto",
                  "ALV",
                  "Yhteensä",
                  "PDF",
                  "Toiminnot",
                ].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={emptyRowStyle}>
                    Ladataan tarjouksia...
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={11} style={emptyRowStyle}>
                    Ei tarjouksia valituilla hakuehdoilla.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => {
                  const client = clientById[quote.client_id];
                  return (
                    <tr key={quote.id}>
                      <td style={tdStyleStrong}>{quote.quote_number || "-"}</td>
                      <td style={tdStyle}>
                        {client ? `${client.name || "-"}${client.company ? ` · ${client.company}` : ""}` : "-"}
                      </td>
                      <td style={tdStyle}>{quote.title || "-"}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            ...statusBadgeStyle,
                            background: QUOTE_STATUS_COLORS[quote.status] || "#64748b",
                          }}
                        >
                          {quote.status || "-"}
                        </span>
                      </td>
                      <td style={tdStyle}>{formatDate(quote.quote_date)}</td>
                      <td style={tdStyle}>{formatDate(quote.valid_until)}</td>
                      <td style={tdStyle}>{formatCurrency(quote.subtotal)}</td>
                      <td style={tdStyle}>{formatCurrency(quote.vat_amount)}</td>
                      <td style={tdStyle}>{formatCurrency(quote.total_amount)}</td>
                      <td style={tdStyle}>
                        {quote.pdf_link ? (
                          <a href={safeUrl(quote.pdf_link)} target="_blank" rel="noreferrer" style={linkButtonStyle}>
                            Avaa
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={tdStyle}>
                        <div style={rowButtonsStyle}>
                          <button type="button" style={miniActionButtonStyle} onClick={() => startEdit(quote)}>
                            Muokkaa
                          </button>
                          <button type="button" style={miniDeleteButtonStyle} onClick={() => onDelete(quote.id, quote.quote_number || quote.title)}>
                            Poista
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function FinanceView({ loading, data }) {
  return (
    <div style={{ display: "grid", gap: 22 }}>
      <SectionTitle
        title="Talous"
        description="Tässä näkymässä painopiste on kassassa, saamisissa, 30 päivän kassavirrassa ja viimeisimmissä kirjanpitoluvuissa."
      />

      <div style={metricsGrid}>
        <MetricCard title="Kassasaldo" value={loading ? "…" : formatCurrency(data.cashBalance)} color="#14b8a6" subtext="Viimeisin raportti" />
        <MetricCard title="Saamiset" value={loading ? "…" : formatCurrency(data.latestFinance?.receivables)} color="#3b82f6" subtext="Viimeisin finance_monthly" />
        <MetricCard title="Velat" value={loading ? "…" : formatCurrency(data.latestFinance?.liabilities)} color="#ef4444" subtext="Viimeisin finance_monthly" />
        <MetricCard title="Oma pääoma" value={loading ? "…" : formatCurrency(data.latestFinance?.equity)} color="#eab308" subtext="Viimeisin finance_monthly" />
      </div>

      <div style={metricsGrid}>
        <MetricCard title="Tulossa sisään 30 pv" value={loading ? "…" : formatCurrency(data.incoming30d)} color="#22c55e" subtext="cashflow_events" />
        <MetricCard title="Lähdössä ulos 30 pv" value={loading ? "…" : formatCurrency(data.outgoing30d)} color="#f97316" subtext="cashflow_events" />
        <MetricCard title="Netto 30 pv" value={loading ? "…" : formatCurrency(data.net30d)} color="#38bdf8" subtext="Sisään – ulos" />
        <MetricCard title="Myöhässä saamiset" value={loading ? "…" : formatCurrency(data.overdueReceivables)} color="#ef4444" subtext="Erääntyneet forecast/invoiced" />
      </div>

      <Panel title="Finance-monthly yhteenveto">
        <div style={miniMetricsGrid}>
          <MiniMetric title="Liikevaihto" value={loading ? "…" : formatCurrency(data.latestFinance?.revenue)} />
          <MiniMetric title="Tulos" value={loading ? "…" : formatCurrency(data.latestFinance?.net_result)} />
          <MiniMetric title="Kassa" value={loading ? "…" : formatCurrency(data.latestFinance?.cash_balance)} />
          <MiniMetric title="Saamiset" value={loading ? "…" : formatCurrency(data.latestFinance?.receivables)} />
          <MiniMetric title="Velat" value={loading ? "…" : formatCurrency(data.latestFinance?.liabilities)} />
          <MiniMetric title="Oma pääoma" value={loading ? "…" : formatCurrency(data.latestFinance?.equity)} />
        </div>
      </Panel>
    </div>
  );
}

function PlaceholderView({ title, text }) {
  return (
    <Panel title={title}>
      <PanelHint text={text} />
      <EmptyText text="Tämä näkymä jätettiin tarkoituksella rungoksi, jotta ensin saatiin dashboard, CRM, Kanban ja tarjoukset oikeasti käyttöön." />
    </Panel>
  );
}

function buildDashboardData(clients, tasks, finance, cashflow) {
  const today = dateOnly(new Date());
  const in30d = new Date(today);
  in30d.setDate(in30d.getDate() + 30);

  const latestFinance = finance.length > 0 ? finance[0] : null;

  const pipelineClients = clients.filter(
    (c) => !["voitettu", "hävitty"].includes((c.status || "").toLowerCase())
  );

  const pipeline = pipelineClients.reduce((sum, c) => sum + Number(c.value || 0), 0);

  const weightedPipeline = pipelineClients.reduce(
    (sum, c) => sum + (Number(c.value || 0) * Number(c.probability || 0)) / 100,
    0
  );

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const wonThisMonth = clients
    .filter((c) => {
      const status = (c.status || "").toLowerCase();
      if (status !== "voitettu") return false;
      const d = c.created_at ? new Date(c.created_at) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((sum, c) => sum + Number(c.value || 0), 0);

  const wonCount = clients.filter((c) => (c.status || "").toLowerCase() === "voitettu").length;
  const lostCount = clients.filter((c) => (c.status || "").toLowerCase() === "hävitty").length;
  const winRate =
    wonCount + lostCount > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;

  const openInvoices = clients.reduce((sum, c) => {
    const invoiced = Number(c.invoiced_amount || 0);
    const paid = Number(c.paid_amount || 0);
    const open = Math.max(0, invoiced - paid);
    return sum + open;
  }, 0);

  const incoming30d = cashflow
    .filter((e) => {
      const direction = (e.direction || "").toLowerCase();
      const status = (e.status || "").toLowerCase();
      const baseDate = e.due_date || e.event_date;
      if (!baseDate) return false;
      const d = dateOnly(new Date(baseDate));
      if (Number.isNaN(d.getTime())) return false;
      return direction === "in" && ["forecast", "invoiced", "paid"].includes(status) && d >= today && d <= dateOnly(in30d);
    })
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const outgoing30d = cashflow
    .filter((e) => {
      const direction = (e.direction || "").toLowerCase();
      const status = (e.status || "").toLowerCase();
      const baseDate = e.due_date || e.event_date;
      if (!baseDate) return false;
      const d = dateOnly(new Date(baseDate));
      if (Number.isNaN(d.getTime())) return false;
      return direction === "out" && ["forecast", "invoiced", "paid"].includes(status) && d >= today && d <= dateOnly(in30d);
    })
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const net30d = incoming30d - outgoing30d;

  const overdueReceivables = cashflow
    .filter((e) => {
      const direction = (e.direction || "").toLowerCase();
      const status = (e.status || "").toLowerCase();
      const due = e.due_date ? dateOnly(new Date(e.due_date)) : null;
      if (!due || Number.isNaN(due.getTime())) return false;
      return direction === "in" && ["forecast", "invoiced"].includes(status) && due < today;
    })
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const contactsToday = clients
    .filter((c) => {
      const status = (c.status || "").toLowerCase();
      if (["voitettu", "hävitty"].includes(status)) return false;
      if (!c.next_action_date) return false;
      const d = dateOnly(new Date(c.next_action_date));
      if (Number.isNaN(d.getTime())) return false;
      return d <= today;
    })
    .sort((a, b) => {
      const da = a.next_action_date ? new Date(a.next_action_date).getTime() : 0;
      const db = b.next_action_date ? new Date(b.next_action_date).getTime() : 0;
      return da - db;
    });

  const tasksToday = tasks.filter((t) => {
    if ((t.status || "").toLowerCase() === "tehty") return false;
    if (!t.due_date) return false;
    const d = dateOnly(new Date(t.due_date));
    if (Number.isNaN(d.getTime())) return false;
    return d.getTime() === today.getTime();
  });

  const overdueTasks = tasks.filter((t) => {
    if ((t.status || "").toLowerCase() === "tehty") return false;
    if (!t.due_date) return false;
    const d = dateOnly(new Date(t.due_date));
    if (Number.isNaN(d.getTime())) return false;
    return d < today;
  });

  const hotLeads = clients.filter((c) => {
    const status = (c.status || "").toLowerCase();
    return !["voitettu", "hävitty"].includes(status) && Number(c.probability || 0) >= 60;
  });

  const clientNameById = {};
  clients.forEach((c) => {
    clientNameById[c.id] = c.name || c.company || "Nimetön asiakas";
  });

  return {
    latestFinance,
    pipeline,
    weightedPipeline,
    wonThisMonth,
    winRate,
    cashBalance: Number(latestFinance?.cash_balance || 0),
    incoming30d,
    outgoing30d,
    net30d,
    openInvoices,
    overdueReceivables,
    contactsToday,
    tasksToday,
    overdueTasks,
    hotLeads,
    clientNameById,
  };
}

function normalizeClientPayload(form) {
  return {
    name: form.name.trim(),
    company: form.company.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    status: form.status || "liidi",
    value: Number(form.value) || 0,
    probability: Number(form.probability) || 0,
    next_action: form.next_action.trim() || null,
    next_action_date: form.next_action_date || null,
    last_contact_date: form.last_contact_date || null,
    company_linkedin: form.company_linkedin.trim() || null,
    quote_link: form.quote_link.trim() || null,
    notes: form.notes.trim() || null,
  };
}

function computeQuoteTotals(lines, vatPercent) {
  const subtotal = lines.reduce((sum, line) => {
    return sum + Number(line.quantity || 0) * Number(line.unit_price || 0);
  }, 0);

  const vatAmount = subtotal * (Number(vatPercent || 0) / 100);
  const total = subtotal + vatAmount;

  return { subtotal, vatAmount, total };
}

function buildQuoteNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const randomPart = Math.floor(Math.random() * 9000 + 1000);
  return `TARJ-${y}${m}${d}-${randomPart}`;
}

function safeUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function SectionTitle({ title, description }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#94a3b8", fontSize: 15 }}>{description}</div>
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <div>
      <div style={fieldLabelStyle}>{label}</div>
      <div style={fieldHelpStyle}>{help}</div>
      {children}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section style={panelStyle}>
      <h2 style={{ marginTop: 0, marginBottom: 18, fontSize: 24 }}>{title}</h2>
      {children}
    </section>
  );
}

function PanelHint({ text }) {
  return <div style={panelHintStyle}>{text}</div>;
}

function MetricCard({ title, value, color, subtext }) {
  return (
    <div style={{ ...metricCardStyle, border: `2px solid ${color}` }}>
      <div style={{ fontSize: 15, color: "#94a3b8", marginBottom: 14 }}>{title}</div>
      <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.05 }}>{value}</div>
      <div style={{ marginTop: 10, color: "#64748b", fontSize: 13 }}>{subtext}</div>
    </div>
  );
}

function MiniMetric({ title, value }) {
  return (
    <div style={miniMetricStyle}>
      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function ReminderCard({ color, title, subtitle, line1, line2, line3 }) {
  return (
    <div style={{ background: "#0b0f19", border: "1px solid #2a3144", borderLeft: `5px solid ${color}`, borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
      <div style={{ color: "#d1d5db", marginTop: 4 }}>{subtitle}</div>
      <div style={{ color: "#9ca3af", marginTop: 6 }}>{line1}</div>
      <div style={{ color: "#9ca3af", marginTop: 4 }}>{line2}</div>
      <div style={{ color: "#9ca3af", marginTop: 4 }}>{line3}</div>
    </div>
  );
}

function TaskCard({ task, clientName }) {
  return (
    <div style={{ background: "#0b0f19", border: "1px solid #2a3144", borderLeft: `5px solid ${TASK_PRIORITY_COLORS[task.priority] || "#64748b"}`, borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 17, fontWeight: 700 }}>{task.title || "-"}</div>
      <div style={{ color: "#d1d5db", marginTop: 4 }}>Asiakas: {clientName || "-"}</div>
      <div style={{ color: "#9ca3af", marginTop: 4 }}>Tyyppi: {task.task_type || "-"} · Prioriteetti: {task.priority || "-"}</div>
      <div style={{ color: "#9ca3af", marginTop: 4 }}>Deadline: {formatDate(task.due_date)}</div>
      <div style={{ color: "#9ca3af", marginTop: 4 }}>Muistiinpano: {task.notes || "-"}</div>
    </div>
  );
}

function EmptyText({ text }) {
  return <div style={{ color: "#94a3b8", fontSize: 14 }}>{text}</div>;
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("fi-FI")} €`;
}

function formatPercent(value) {
  return `${Number(value || 0)} %`;
}

function formatDate(value) {
  if (!value) return "-";
  return value;
}

function dateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const mainStyle = {
  background:
    "radial-gradient(circle at top left, rgba(120,52,180,0.18), transparent 30%), radial-gradient(circle at top right, rgba(212,175,55,0.10), transparent 25%), #090b14",
  minHeight: "100vh",
  color: "white",
  fontFamily: "Inter, Arial, sans-serif",
};

const containerStyle = {
  display: "grid",
  gridTemplateColumns: "280px 1fr",
  minHeight: "100vh",
};

const sidebarStyle = {
  padding: 24,
  borderRight: "1px solid rgba(231,223,178,0.08)",
  background: "rgba(8,10,18,0.88)",
  position: "sticky",
  top: 0,
  height: "100vh",
  display: "flex",
  flexDirection: "column",
};

const sidebarTopLabel = {
  fontSize: 12,
  color: "#e7dfb2",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  marginBottom: 8,
};

const sidebarHeader = {
  fontSize: 32,
  fontWeight: 800,
  marginBottom: 10,
};

const sidebarText = {
  color: "#94a3b8",
  fontSize: 14,
  lineHeight: 1.55,
};

const sidebarBottom = {
  marginTop: "auto",
};

const navButton = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  color: "white",
  borderRadius: 14,
  textAlign: "left",
  cursor: "pointer",
  fontSize: 15,
};

const refreshButton = {
  width: "100%",
  padding: "12px 14px",
  background: "#0f766e",
  color: "white",
  border: "none",
  borderRadius: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const contentStyle = {
  padding: 28,
  maxWidth: 1680,
};

const heroStyle = {
  marginBottom: 24,
  padding: 28,
  borderRadius: 24,
  background: "linear-gradient(135deg, rgba(17,21,34,0.96), rgba(9,11,20,0.96))",
  border: "1px solid rgba(231,223,178,0.14)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
};

const heroLabel = {
  fontSize: 13,
  color: "#e7dfb2",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  marginBottom: 8,
};

const titleStyle = {
  fontSize: 50,
  lineHeight: 1.04,
  margin: 0,
};

const subtitleStyle = {
  marginTop: 10,
  color: "#94a3b8",
  fontSize: 16,
  maxWidth: 980,
};

const errorBoxStyle = {
  background: "rgba(127, 29, 29, 0.24)",
  border: "1px solid rgba(239,68,68,0.45)",
  color: "#fecaca",
  padding: 14,
  borderRadius: 14,
  marginBottom: 20,
};

const metricsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
  gap: 16,
};

const twoColGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 18,
  alignItems: "start",
};

const miniMetricsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
  gap: 12,
};

const stackStyle = {
  display: "grid",
  gap: 12,
};

const panelStyle = {
  background: "rgba(17, 21, 34, 0.96)",
  border: "1px solid rgba(231,223,178,0.10)",
  borderRadius: 22,
  padding: 22,
  boxShadow: "0 16px 50px rgba(0,0,0,
