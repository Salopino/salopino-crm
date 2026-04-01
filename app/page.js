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

const emptyQuoteLine = {
  service_name: "",
  description: "",
  quantity: 1,
  unit: "kpl",
  unit_price: 0,
};

const emptyQuoteForm = {
  client_id: "",
  title: "",
  description: "",
  status: "luonnos",
  quote_date: todayIso(),
  valid_until: "",
  vat_percent: 25.5,
  payment_terms: "14 pv netto",
  delivery_terms: "",
  pdf_link: "",
  notes: "",
  lines: [{ ...emptyQuoteLine }],
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

    const normalized = normalizeQuotePayload(form);
    const quoteNumber = buildQuoteNumber(quotes);

    const quotePayload = {
      client_id: normalized.client_id,
      title: normalized.title,
      description: normalized.description,
      status: normalized.status,
      quote_number: quoteNumber,
      quote_date: normalized.quote_date,
      valid_until: normalized.valid_until,
      subtotal: normalized.subtotal,
      vat_percent: normalized.vat_percent,
      vat_amount: normalized.vat_amount,
      total_amount: normalized.total_amount,
      payment_terms: normalized.payment_terms,
      delivery_terms: normalized.delivery_terms,
      pdf_link: normalized.pdf_link,
      notes: normalized.notes,
    };

    const { data: insertedQuote, error: quoteError } = await supabase
      .from("quotes")
      .insert([quotePayload])
      .select()
      .single();

    if (quoteError || !insertedQuote) {
      console.error("Virhe tarjouksen lisäyksessä:", quoteError);
      alert("Tarjouksen lisäys epäonnistui");
      return { ok: false };
    }

    const linesPayload = normalized.lines.map((line, index) => ({
      quote_id: insertedQuote.id,
      service_name: line.service_name,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unit_price: line.unit_price,
      line_total: line.line_total,
      sort_order: index + 1,
    }));

    if (linesPayload.length > 0) {
      const { error: linesError } = await supabase.from("quote_lines").insert(linesPayload);
      if (linesError) {
        console.error("Virhe tarjousrivien lisäyksessä:", linesError);
        alert("Tarjous luotiin, mutta rivejä ei saatu tallennettua oikein");
      }
    }

    const clientUpdate = {
      quote_id: insertedQuote.id,
      quote_status: normalized.status,
      quote_link: normalized.pdf_link || null,
    };

    const { error: clientError } = await supabase
      .from("clients")
      .update(clientUpdate)
      .eq("id", normalized.client_id);

    if (clientError) {
      console.error("Virhe asiakkaan tarjouslinkin päivityksessä:", clientError);
    }

    await fetchAll();
    return { ok: true };
  }

  async function updateQuoteRecord(id, form) {
    if (!id) return { ok: false };
    if (!form.client_id) {
      alert("Valitse asiakas");
      return { ok: false };
    }

    const normalized = normalizeQuotePayload(form);

    const quotePayload = {
      client_id: normalized.client_id,
      title: normalized.title,
      description: normalized.description,
      status: normalized.status,
      quote_date: normalized.quote_date,
      valid_until: normalized.valid_until,
      subtotal: normalized.subtotal,
      vat_percent: normalized.vat_percent,
      vat_amount: normalized.vat_amount,
      total_amount: normalized.total_amount,
      payment_terms: normalized.payment_terms,
      delivery_terms: normalized.delivery_terms,
      pdf_link: normalized.pdf_link,
      notes: normalized.notes,
    };

    const { error: quoteError } = await supabase
      .from("quotes")
      .update(quotePayload)
      .eq("id", id);

    if (quoteError) {
      console.error("Virhe tarjouksen päivityksessä:", quoteError);
      alert("Tarjouksen päivitys epäonnistui");
      return { ok: false };
    }

    const { error: deleteLinesError } = await supabase.from("quote_lines").delete().eq("quote_id", id);
    if (deleteLinesError) {
      console.error("Virhe vanhojen tarjousrivien poistossa:", deleteLinesError);
    }

    const linesPayload = normalized.lines.map((line, index) => ({
      quote_id: id,
      service_name: line.service_name,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unit_price: line.unit_price,
      line_total: line.line_total,
      sort_order: index + 1,
    }));

    if (linesPayload.length > 0) {
      const { error: linesError } = await supabase.from("quote_lines").insert(linesPayload);
      if (linesError) {
        console.error("Virhe tarjousrivien päivityksessä:", linesError);
        alert("Tarjouksen rivien päivitys epäonnistui");
      }
    }

    const clientUpdate = {
      quote_id: id,
      quote_status: normalized.status,
      quote_link: normalized.pdf_link || null,
    };

    const { error: clientError } = await supabase
      .from("clients")
      .update(clientUpdate)
      .eq("id", normalized.client_id);

    if (clientError) {
      console.error("Virhe asiakkaan tarjouslinkin päivityksessä:", clientError);
    }

    await fetchAll();
    return { ok: true };
  }

  async function deleteQuoteRecord(id, clientId, quoteNumber) {
    if (!id) return;

    const ok = window.confirm(`Poistetaanko tarjous "${quoteNumber || "tarjous"}"?`);
    if (!ok) return;

    const { error: linesError } = await supabase.from("quote_lines").delete().eq("quote_id", id);
    if (linesError) {
      console.error("Virhe tarjousrivien poistossa:", linesError);
    }

    const { error: quoteError } = await supabase.from("quotes").delete().eq("id", id);
    if (quoteError) {
      console.error("Virhe tarjouksen poistossa:", quoteError);
      alert("Tarjouksen poisto epäonnistui");
      return;
    }

    if (clientId) {
      const currentClient = clients.find((c) => c.id === clientId);
      if (currentClient?.quote_id === id) {
        const { error: clientError } = await supabase
          .from("clients")
          .update({
            quote_id: null,
            quote_status: "ei tarjousta",
            quote_link: null,
          })
          .eq("id", clientId);

        if (clientError) {
          console.error("Virhe asiakkaan tarjousviitteen nollauksessa:", clientError);
        }
      }
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

      <div style={metricsGrid}>
        <MetricCard title="Kontaktoitavat nyt" value={loading ? "…" : String(data.contactsToday.length)} color="#a855f7" subtext="Seuraava toimenpide tänään tai myöhässä" />
        <MetricCard title="Tehtävät tänään" value={loading ? "…" : String(data.tasksToday.length)} color="#2563eb" subtext="Deadline tänään" />
        <MetricCard title="Myöhässä tehtävät" value={loading ? "…" : String(data.overdueTasks.length)} color="#ef4444" subtext="Deadline mennyt yli" />
        <MetricCard title="Kuumat liidit" value={loading ? "…" : String(data.hotLeads.length)} color="#facc15" subtext="Todennäköisyys vähintään 60 %" />
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
      <SectionTitle title="Toimiva CRM" description="Lisää, muokkaa, hae ja hallitse asiakkaita. Tämä näkymä on nyt oikeasti käytettävä työpiste." />

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
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
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

            {editingId ? (
              <button type="button" style={secondaryButtonStyle} onClick={cancelEdit}>
                Peru muokkaus
              </button>
            ) : null}
          </div>
        </form>
      </Panel>

      <Panel title="Asiakasrekisteri">
        <div style={toolbarStyle}>
          <div style={toolbarLeftStyle}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchInputStyle}
              placeholder="Hae nimellä, yrityksellä, sähköpostilla tai puhelimella"
            />

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={filterSelectStyle}>
              <option value="kaikki">Kaikki statukset</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
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
                      {client.company_linkedin ? (
                        <a href={safeUrl(client.company_linkedin)} target="_blank" rel="noreferrer" style={linkButtonStyle}>Avaa</a>
                      ) : "-"}
                    </td>
                    <td style={tdStyle}>
                      {client.quote_link ? (
                        <a href={safeUrl(client.quote_link)} target="_blank" rel="noreferrer" style={linkButtonStyle}>Tarjous</a>
                      ) : "-"}
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
      acc[status] = filteredClients.filter((client) => (client.status || "liidi").toLowerCase() === status);
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
    const newStatus = STATUS_OPTIONS[currentIndex - 1];
    await handleStatusChange(client.id, newStatus);
  }

  async function moveRight(client) {
    const currentIndex = STATUS_OPTIONS.indexOf((client.status || "liidi").toLowerCase());
    if (currentIndex === -1 || currentIndex >= STATUS_OPTIONS.length - 1) return;
    const newStatus = STATUS_OPTIONS[currentIndex + 1];
    await handleStatusChange(client.id, newStatus);
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
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchInputStyle}
              placeholder="Hae nimellä, yrityksellä, sähköpostilla, puhelimella tai seuraavalla toimenpiteellä"
            />

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={filterSelectStyle}>
              <option value="kaikki">Kaikki statukset</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div style={{ color: "#94a3b8", fontSize: 14 }}>
            {loading ? "Ladataan..." : `${filteredClients.length} casea`}
          </div>
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

                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: STATUS_COLORS[status] || "#64748b",
                      flexShrink: 0,
                    }}
                  />
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
                            {client.company_linkedin ? (
                              <a href={safeUrl(client.company_linkedin)} target="_blank" rel="noreferrer" style={linkButtonStyle}>
                                LinkedIn
                              </a>
                            ) : null}

                            {client.quote_link ? (
                              <a href={safeUrl(client.quote_link)} target="_blank" rel="noreferrer" style={linkButtonStyle}>
                                Tarjous
                              </a>
                            ) : null}
                          </div>

                          <div style={{ marginTop: 12 }}>
                            <select
                              value={client.status || "liidi"}
                              onChange={(e) => handleStatusChange(client.id, e.target.value)}
                              style={kanbanSelectStyle}
                              disabled={busyId === client.id}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          <div style={kanbanButtonsRowStyle}>
                            <button
                              type="button"
                              style={{
                                ...kanbanMoveButtonStyle,
                                opacity: currentIndex <= 0 || busyId === client.id ? 0.45 : 1,
                                cursor: currentIndex <= 0 || busyId === client.id ? "not-allowed" : "pointer",
                              }}
                              onClick={() => moveLeft(client)}
                              disabled={currentIndex <= 0 || busyId === client.id}
                            >
                              ← Edellinen
                            </button>

                            <button
                              type="button"
                              style={{
                                ...kanbanMoveButtonStyle,
                                opacity: currentIndex >= STATUS_OPTIONS.length - 1 || busyId === client.id ? 0.45 : 1,
                                cursor: currentIndex >= STATUS_OPTIONS.length - 1 || busyId === client.id ? "not-allowed" : "pointer",
                              }}
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
    clients.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [clients]);

  const quotesWithLines = useMemo(() => {
    return quotes.map((quote) => ({
      ...quote,
      lines: quoteLines.filter((line) => line.quote_id === quote.id),
    }));
  }, [quotes, quoteLines]);

  const filteredQuotes = useMemo(() => {
    return quotesWithLines.filter((quote) => {
      const q = search.trim().toLowerCase();
      const client = clientById[quote.client_id];

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
  }, [quotesWithLines, clientById, search, statusFilter]);

  const quoteTotals = useMemo(() => calculateQuoteTotals(form.lines, form.vat_percent), [form.lines, form.vat_percent]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateLine(index, field, value) {
    setForm((prev) => {
      const nextLines = [...prev.lines];
      nextLines[index] = {
        ...nextLines[index],
        [field]:
          field === "quantity" || field === "unit_price"
            ? Number(value || 0)
            : value,
      };
      return { ...prev, lines: nextLines };
    });
  }

  function addLine() {
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { ...emptyQuoteLine }],
    }));
  }

  function removeLine(index) {
    setForm((prev) => {
      const nextLines = prev.lines.filter((_, i) => i !== index);
      return {
        ...prev,
        lines: nextLines.length > 0 ? nextLines : [{ ...emptyQuoteLine }],
      };
    });
  }

  function startEdit(quote) {
    setEditingId(quote.id);
    setForm({
      client_id: quote.client_id || "",
      title: quote.title || "",
      description: quote.description || "",
      status: quote.status || "luonnos",
      quote_date: quote.quote_date || todayIso(),
      valid_until: quote.valid_until || "",
      vat_percent: Number(quote.vat_percent || 25.5),
      payment_terms: quote.payment_terms || "14 pv netto",
      delivery_terms: quote.delivery_terms || "",
      pdf_link: quote.pdf_link || "",
      notes: quote.notes || "",
      lines:
        quote.lines && quote.lines.length > 0
          ? quote.lines.map((line) => ({
              service_name: line.service_name || "",
              description: line.description || "",
              quantity: Number(line.quantity || 1),
              unit: line.unit || "kpl",
              unit_price: Number(line.unit_price || 0),
            }))
          : [{ ...emptyQuoteLine }],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId("");
    setForm(emptyQuoteForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...form,
      subtotal: quoteTotals.subtotal,
      vat_amount: quoteTotals.vatAmount,
      total_amount: quoteTotals.total,
    };

    const result = editingId ? await onUpdate(editingId, payload) : await onCreate(payload);

    setSubmitting(false);

    if (result?.ok) {
      setEditingId("");
      setForm(emptyQuoteForm);
    }
  }

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <SectionTitle
        title="Toimivat tarjoukset"
        description="Luo, muokkaa, laske ja hallitse tarjouksia suoraan CRM:n asiakkaisiin kytkettynä."
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

            <Field label="Tarjouksen otsikko" help="Näkyy listassa ja tarjouksella">
              <input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                style={inputStyle}
                placeholder="Esim. Kiinteistön 3D-kuvaus"
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

            <Field label="ALV %" help="Oletus 25,5 %">
              <input
                type="number"
                value={form.vat_percent}
                onChange={(e) => updateField("vat_percent", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Tarjouspäivä" help="Tarjouksen päivämäärä">
              <input
                type="date"
                value={form.quote_date}
                onChange={(e) => updateField("quote_date", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Voimassa asti" help="Tarjouksen voimassaolo">
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

            <Field label="Toimitusehto" help="Esim. sähköinen toimitus">
