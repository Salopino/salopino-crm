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

const STATUS_COLORS = {
  liidi: "#94a3b8",
  kartoitus: "#3b82f6",
  tarjous: "#f59e0b",
  seuranta: "#8b5cf6",
  voitettu: "#22c55e",
  hävitty: "#ef4444",
};

const TASK_PRIORITY_COLORS = {
  matala: "#64748b",
  normaali: "#3b82f6",
  korkea: "#f59e0b",
  kriittinen: "#ef4444",
};

export default function Home() {
  const [activeView, setActiveView] = useState("dashboard");

  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [finance, setFinance] = useState([]);
  const [cashflow, setCashflow] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setErrorText("");

    const [clientsRes, tasksRes, financeRes, cashflowRes] = await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").order("due_date", { ascending: true }),
      supabase.from("finance_monthly").select("*").order("report_month", { ascending: false }).limit(12),
      supabase.from("cashflow_events").select("*").order("event_date", { ascending: false }).limit(500),
    ]);

    const errors = [
      clientsRes.error,
      tasksRes.error,
      financeRes.error,
      cashflowRes.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error("Supabase fetch errors:", errors);
      setErrorText("Datan latauksessa tuli virhe. Tarkista taulut ja kentät Supabasessa.");
    }

    setClients(clientsRes.data || []);
    setTasks(tasksRes.data || []);
    setFinance(financeRes.data || []);
    setCashflow(cashflowRes.data || []);
    setLoading(false);
  }

  const dashboardData = useMemo(() => buildDashboardData(clients, tasks, finance, cashflow), [
    clients,
    tasks,
    finance,
    cashflow,
  ]);

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
                  border: activeView === item.id ? "1px solid rgba(231,223,178,0.22)" : "1px solid transparent",
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

          {errorText ? (
            <div style={errorBoxStyle}>{errorText}</div>
          ) : null}

          {activeView === "dashboard" && (
            <DashboardView loading={loading} data={dashboardData} />
          )}

          {activeView === "crm" && (
            <PlaceholderView
              title="CRM"
              text="Tähän seuraavaksi kytketään asiakkaiden muokkaus, yhteyshenkilöt, tehtävät ja tarjouslinkit."
            />
          )}

          {activeView === "kanban" && (
            <PlaceholderView
              title="Kanban"
              text="Tähän seuraavaksi kytketään oikea kanban-putki clients-taulun statuksista."
            />
          )}

          {activeView === "quotes" && (
            <PlaceholderView
              title="Tarjoukset"
              text="Tähän seuraavaksi kytketään quotes- ja quote_lines-taulut tarjouskoneeksi."
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
        <MetricCard
          title="Avoin pipeline"
          value={loading ? "…" : formatCurrency(data.pipeline)}
          color="#f59e0b"
          subtext="Avoimet caset ilman voitettu/hävitty"
        />
        <MetricCard
          title="Weighted pipeline"
          value={loading ? "…" : formatCurrency(data.weightedPipeline)}
          color="#8b5cf6"
          subtext="Arvo × todennäköisyys"
        />
        <MetricCard
          title="Voitettu / kk"
          value={loading ? "…" : formatCurrency(data.wonThisMonth)}
          color="#22c55e"
          subtext="Kuluvan kuun voitetut"
        />
        <MetricCard
          title="Win rate"
          value={loading ? "…" : formatPercent(data.winRate)}
          color="#38bdf8"
          subtext="Voitettu / (voitettu + hävitty)"
        />
      </div>

      <div style={metricsGrid}>
        <MetricCard
          title="Kassasaldo"
          value={loading ? "…" : formatCurrency(data.cashBalance)}
          color="#14b8a6"
          subtext="Viimeisin finance_monthly"
        />
        <MetricCard
          title="Netto 30 pv"
          value={loading ? "…" : formatCurrency(data.net30d)}
          color="#3b82f6"
          subtext="Sisään – ulos seuraavat 30 pv"
        />
        <MetricCard
          title="Avoimet laskut"
          value={loading ? "…" : formatCurrency(data.openInvoices)}
          color="#eab308"
          subtext="Laskutettu, mutta ei täysin maksettu"
        />
        <MetricCard
          title="Myöhässä olevat saamiset"
          value={loading ? "…" : formatCurrency(data.overdueReceivables)}
          color="#ef4444"
          subtext="Erääntyneet sisään tulevat kassavirrat"
        />
      </div>

      <div style={metricsGrid}>
        <MetricCard
          title="Kontaktoitavat nyt"
          value={loading ? "…" : String(data.contactsToday.length)}
          color="#a855f7"
          subtext="Seuraava toimenpide tänään tai myöhässä"
        />
        <MetricCard
          title="Tehtävät tänään"
          value={loading ? "…" : String(data.tasksToday.length)}
          color="#2563eb"
          subtext="Deadline tänään"
        />
        <MetricCard
          title="Myöhässä tehtävät"
          value={loading ? "…" : String(data.overdueTasks.length)}
          color="#ef4444"
          subtext="Deadline mennyt yli"
        />
        <MetricCard
          title="Kuumat liidit"
          value={loading ? "…" : String(data.hotLeads.length)}
          color="#facc15"
          subtext="Todennäköisyys vähintään 60 %"
        />
      </div>

      <div style={twoColGrid}>
        <Panel title="Ota yhteyttä tänään">
          <PanelHint text="Asiakkaat, joiden seuraava toimenpide erääntyy tänään tai on jo myöhässä." />
          {loading ? (
            <EmptyText text="Ladataan…" />
          ) : data.contactsToday.length === 0 ? (
            <EmptyText text="Ei erääntyneitä follow-uppeja." />
          ) : (
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

      <div style={twoColGrid}>
        <Panel title="Tehtävät tänään">
          <PanelHint text="Avoimet tehtävät, joiden deadline on tänään." />
          {loading ? (
            <EmptyText text="Ladataan…" />
          ) : data.tasksToday.length === 0 ? (
            <EmptyText text="Ei tämän päivän tehtäviä." />
          ) : (
            <div style={stackStyle}>
              {data.tasksToday.map((task) => (
                <TaskCard key={task.id} task={task} clientName={data.clientNameById[task.client_id] || "-"} />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Myöhässä olevat tehtävät">
          <PanelHint text="Nämä ovat deadline-päivän yli ja vaativat reagointia." />
          {loading ? (
            <EmptyText text="Ladataan…" />
          ) : data.overdueTasks.length === 0 ? (
            <EmptyText text="Ei myöhässä olevia tehtäviä." />
          ) : (
            <div style={stackStyle}>
              {data.overdueTasks.map((task) => (
                <TaskCard key={task.id} task={task} clientName={data.clientNameById[task.client_id] || "-"} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div style={twoColGrid}>
        <Panel title="Kuumat liidit">
          <PanelHint text="Avoimet caset, joiden todennäköisyys on vähintään 60 %." />
          {loading ? (
            <EmptyText text="Ladataan…" />
          ) : data.hotLeads.length === 0 ? (
            <EmptyText text="Ei kuumia liidejä juuri nyt." />
          ) : (
            <div style={stackStyle}>
              {data.hotLeads.map((client) => (
                <ReminderCard
                  key={client.id}
                  color="#f59e0b"
                  title={client.name || "Nimetön asiakas"}
                  subtitle={`${client.company || "Ei yritystä"} · ${formatCurrency(client.value)}`}
                  line1={`Todennäköisyys: ${formatPercent(client.probability)}`}
                  line2={`Status: ${client.status || "-"} · Seuraava: ${client.next_action || "-"}`}
                  line3={`Päivä: ${formatDate(client.next_action_date)}`}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Viimeisimmät talousluvut">
          <PanelHint text="Viimeisimmän finance_monthly-rivin luvut." />
          <div style={miniMetricsGrid}>
            <MiniMetric title="Liikevaihto" value={loading ? "…" : formatCurrency(data.latestFinance?.revenue)} />
            <MiniMetric title="Tulos" value={loading ? "…" : formatCurrency(data.latestFinance?.net_result)} />
            <MiniMetric title="Saamiset" value={loading ? "…" : formatCurrency(data.latestFinance?.receivables)} />
            <MiniMetric title="Velat" value={loading ? "…" : formatCurrency(data.latestFinance?.liabilities)} />
            <MiniMetric title="Oma pääoma" value={loading ? "…" : formatCurrency(data.latestFinance?.equity)} />
            <MiniMetric title="Raporttikuukausi" value={loading ? "…" : formatDate(data.latestFinance?.report_month)} />
          </div>
        </Panel>
      </div>
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
      <EmptyText text="Tämä näkymä jätettiin tarkoituksella rungoksi, jotta ensin saatiin dashboard ja talous oikeaan dataan kiinni." />
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
  const winRate = wonCount + lostCount > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;

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
      return (
        direction === "in" &&
        ["forecast", "invoiced", "paid"].includes(status) &&
        d >= today &&
        d <= dateOnly(in30d)
      );
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
      return (
        direction === "out" &&
        ["forecast", "invoiced", "paid"].includes(status) &&
        d >= today &&
        d <= dateOnly(in30d)
      );
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

function SectionTitle({ title, description }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#94a3b8", fontSize: 15 }}>{description}</div>
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
    <div
      style={{
        ...metricCardStyle,
        border: `2px solid ${color}`,
      }}
    >
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
    <div
      style={{
        background: "#0b0f19",
        border: "1px solid #2a3144",
        borderLeft: `5px solid ${color}`,
        borderRadius: 14,
        padding: 16,
      }}
    >
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
    <div
      style={{
        background: "#0b0f19",
        border: "1px solid #2a3144",
        borderLeft: `5px solid ${TASK_PRIORITY_COLORS[task.priority] || "#64748b"}`,
        borderRadius: 14,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 700 }}>{task.title || "-"}</div>
      <div style={{ color: "#d1d5db", marginTop: 4 }}>Asiakas: {clientName || "-"}</div>
      <div style={{ color: "#9ca3af", marginTop: 4 }}>
        Tyyppi: {task.task_type || "-"} · Prioriteetti: {task.priority || "-"}
      </div>
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
  boxShadow: "0 16px 50px rgba(0,0,0,0.24)",
};

const panelHintStyle = {
  color: "#94a3b8",
  fontSize: 13,
  marginBottom: 16,
  padding: "10px 12px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid #243047",
  borderRadius: 12,
};

const metricCardStyle = {
  background: "linear-gradient(180deg, rgba(17,21,34,0.98), rgba(11,15,25,0.98))",
  borderRadius: 18,
  padding: 22,
  minHeight: 128,
  boxShadow: "0 14px 30px rgba(0,0,0,0.25)",
};

const miniMetricStyle = {
  background: "#0b0f19",
  border: "1px solid #22304a",
  borderRadius: 14,
  padding: 14,
};
